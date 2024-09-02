package llm

import (
	"context"
	"fmt"
	"github.com/ollama/ollama/api"
	"log/slog"
	"net/http"
	"net/url"
)

// max = llama 3.1 - system prompt from modelfile - num_ctx from modelfile
const maxTokens = 128000 - 493 - 4096

// syncClientImpl is a synchronous wrapper for an ollama model
type syncClientImpl struct {
	modelName string
	client    *api.Client
	logger    *slog.Logger
}

// todo: use metrics from response to debug log, summary writes to stderr for some reason.
func newSyncClientImpl(modelName string, baseUrl string, logger *slog.Logger) (*syncClientImpl, error) {
	base, err := url.Parse(baseUrl)
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
	}, nil
}

// Chat chats with the model given some list of messages, messages must be in desc order by time
func (s *syncClientImpl) Chat(ctx context.Context, messages []api.Message) (string, error) {
	stream := false

	filtered := filterMessages(maxTokens, messages)

	req := &api.ChatRequest{
		Model:    s.modelName,
		Messages: filtered,
		Stream:   &stream,
	}

	var response string

	cErr := s.client.Chat(ctx, req, func(r api.ChatResponse) error {
		response = r.Message.Content
		//todo: temporary
		r.Summary()
		return nil
	})

	if cErr != nil {
		return "", fmt.Errorf("error chatting: %w", cErr)
	}

	return response, nil
}

// Generate calls generate with the model without streaming. systemMessage overrides the modelfile system message.
func (s *syncClientImpl) Generate(ctx context.Context, systemMessage string, prompt string) (string, error) {
	var response string

	truncatedPrompt := prompt

	systemCount := getTokenCount(systemMessage)
	promptCount := getTokenCount(truncatedPrompt)

	//if we are too long, lets cut off the end of the prompt instead (right now this is used for article analysis, not ideal but better than the top
	if promptCount+systemCount > maxTokens {
		truncatedPrompt = truncatePrompt(prompt, maxTokens-systemCount)
	}

	stream := false
	req := &api.GenerateRequest{
		Model:  s.modelName,
		System: systemMessage,
		Prompt: truncatedPrompt,
		Stream: &stream,
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

func filterMessages(max int, messages []api.Message) []api.Message {
	var tokenCount int
	var filteredMessages []api.Message

	// Iterate through messages to count tokens and maintain the history
	for _, m := range messages {
		count := getMessageTokenCount(m)

		if tokenCount+count > max {
			// Remove messages from the top of the history until we are under the limit
			for len(filteredMessages) > 0 && tokenCount+count > max {
				oldCount := getMessageTokenCount(filteredMessages[0])
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
