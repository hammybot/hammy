package llm

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"sync"
	"text/template"

	"github.com/austinvalle/hammy/internal/config"
	"github.com/ollama/ollama/api"
)

//go:embed models/hammy.modelfile
var hammyModelFile string

//go:embed chat.tpl
var chatTmpl string

// max = llama 3.1 - system prompt from modelfile - num_ctx from modelfile
const maxTokens = 128000 - 515 - 4096
const modelDir = "/hammy/models" // nolint:unused

type Options func(opts map[string]any)

func WithTemperature(t float32) Options {
	return func(opts map[string]any) {
		opts["temperature"] = t
	}
}

// syncClientImpl is a synchronous wrapper for an ollama model
type syncClientImpl struct {
	modelName string
	client    *api.Client
	logger    *slog.Logger
	keepAlive *api.Duration
}

// todo: use metrics from response to debug log, summary writes to stderr for some reason.
func newSyncClientImpl(modelName string, cfg config.Config, logger *slog.Logger) (*syncClientImpl, error) {
	base, err := url.Parse(cfg.LlmUrl)
	if err != nil {
		return nil, err
	}

	//todo: should we use retry client?
	c := api.NewClient(base, http.DefaultClient)

	if hErr := c.Heartbeat(context.Background()); hErr != nil {
		return nil, hErr
	}

	return &syncClientImpl{
		modelName: modelName,
		client:    c,
		logger:    logger,
		keepAlive: &api.Duration{Duration: cfg.KeepAlive},
	}, nil
}

// Chat chats with the model given some list of messages, messages must be in desc order by time
func (s *syncClientImpl) chat(ctx context.Context, msgs []string, opts ...Options) (string, error) {
	stream := false
	options := map[string]any{}

	for _, opt := range opts {
		opt(options)
	}

	latest := msgs[len(msgs)-1]
	//todo: this token count really isnt accurate because of the template
	history := filterMessages(maxTokens-getTokenCount(latest)-15, msgs[:len(msgs)-1])

	data := struct {
		History       string
		LatestMessage string
	}{
		History:       strings.Join(history, "\n"),
		LatestMessage: latest,
	}

	prompt, err := useTemplate(chatTmpl, data)
	if err != nil {
		return "", err
	}

	req := &api.GenerateRequest{
		Model:     s.modelName,
		Prompt:    prompt,
		Options:   options,
		Stream:    &stream,
		KeepAlive: s.keepAlive,
	}

	var response string

	cErr := s.client.Generate(ctx, req, func(r api.GenerateResponse) error {
		response = r.Response
		return nil
	})

	if cErr != nil {
		return "", fmt.Errorf("error generating response: %w", cErr)
	}

	return response, nil
}

// Generate calls generate with the model without streaming. systemMessage overrides the modelfile system message.
func (s *syncClientImpl) generate(ctx context.Context, systemMessage string, prompt string, opts ...Options) (string, error) {
	var response string
	options := map[string]any{}

	for _, opt := range opts {
		opt(options)
	}

	truncatedPrompt := prompt

	systemCount := getTokenCount(systemMessage)
	promptCount := getTokenCount(truncatedPrompt)

	//if we are too long, lets cut off the end of the prompt instead (right now this is used for article analysis, not ideal but better than the top
	if promptCount+systemCount > maxTokens {
		truncatedPrompt = truncatePrompt(prompt, maxTokens-systemCount)
	}

	stream := false
	req := &api.GenerateRequest{
		Model:     s.modelName,
		System:    systemMessage,
		Prompt:    truncatedPrompt,
		Stream:    &stream,
		Options:   options,
		KeepAlive: s.keepAlive,
	}

	gErr := s.client.Generate(ctx, req, func(r api.GenerateResponse) error {
		response = r.Response
		//todo: temporary
		r.Summary()
		return nil
	})

	if gErr != nil {
		return "", gErr
	}

	return response, nil
}

func (s *syncClientImpl) getTemperature(ctx context.Context) (float32, error) {
	r := regexp.MustCompile(`temperature\s*(?P<temp>\d\.?\d)`)
	resp, err := s.client.Show(ctx, &api.ShowRequest{
		Model: hammy,
	})
	if err != nil {
		return 0, fmt.Errorf("show: %w", err)
	}
	for _, param := range strings.Split(resp.Parameters, "\n") {
		if strings.HasPrefix(param, "temperature") {
			matches := r.FindStringSubmatch(param)
			idx := r.SubexpIndex("temp")
			if len(matches) < idx+1 {
				return 0, fmt.Errorf("could not load temperature")
			}

			temp, cErr := strconv.ParseFloat(matches[idx], 32)
			if cErr != nil {
				return 0, fmt.Errorf("could not load temperature: %w", cErr)
			}
			return float32(temp), nil
		}
	}
	return 0, fmt.Errorf("could not find temperature")
}

func filterMessages(max int, messages []string) []string {
	var tokenCount int
	var filteredMessages []string

	// Iterate through messages to count tokens and maintain the history
	for _, m := range messages {
		count := getTokenCount(m)

		if tokenCount+count > max {
			// Remove messages from the top of the history until we are under the limit
			for len(filteredMessages) > 0 && tokenCount+count > max {
				oldCount := getTokenCount(filteredMessages[0])
				tokenCount -= oldCount
				filteredMessages = filteredMessages[1:]
			}
		}

		// Add the current message to the history
		filteredMessages = append(filteredMessages, m)
		tokenCount += count
	}

	return filteredMessages
}

// very poor-mans truncation, it's not a productionathon
func truncatePrompt(prompt string, maxTokens int) string {
	low := 0
	high := len(prompt)

	for low <= high {
		mid := low + (high-low)/2
		subPrompt := prompt[:mid]

		// Check the token count of the truncated prompt
		tokenCount := getTokenCount(subPrompt)

		if tokenCount > maxTokens {
			high = mid - 1
		} else {
			low = mid + 1
		}
	}

	// `high` should be the length of the prompt that fits within maxTokens
	return prompt[:high]
}

// configure creates hammy in ollama on start and returns when complete.
// This is a workaround to make sure that the model file is up to date whenever we deploy to main
func (s *syncClientImpl) configure(ctx context.Context) error {
	stream := false
	models, err := s.client.List(ctx)
	if err != nil {
		return fmt.Errorf("error listing models: %w", err)
	}
	if slices.ContainsFunc(models.Models, func(m api.ListModelResponse) bool {
		return m.Name == hammy
	}) {
		s.logger.Info("cleaning up old hammy model")
		dErr := s.client.Delete(ctx, &api.DeleteRequest{
			Model: hammy,
		})
		if dErr != nil {
			return dErr
		}
	}

	req := &api.CreateRequest{
		Model:     hammy,
		Modelfile: hammyModelFile,
		Stream:    &stream,
	}

	wg := sync.WaitGroup{}
	wg.Add(1)
	pErr := s.client.Create(ctx, req, func(r api.ProgressResponse) error {
		args := []slog.Attr{
			slog.String("status", r.Status),
		}

		if r.Total != 0 {
			percent := int(float64(r.Completed) / float64(r.Total) * 100)
			args = append(args, slog.Int("percent", percent))
		}

		s.logger.LogAttrs(ctx, slog.LevelDebug, "creating hammy model", args...)

		if r.Status == "success" {
			wg.Done()
		}
		return nil
	})

	if pErr != nil {
		return fmt.Errorf("pull: %w", pErr)
	}
	wg.Wait()
	return nil
}

func useTemplate[T any](t string, data T) (string, error) {
	tpl, err := template.New("chat").Parse(t)
	if err != nil {
		return "", fmt.Errorf("error loading template: %w", err)
	}
	var promptBuffer bytes.Buffer

	if err = tpl.Execute(&promptBuffer, data); err != nil {
		return "", fmt.Errorf("error executing template: %w", err)
	}

	return promptBuffer.String(), nil
}
