package llm

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"github.com/austinvalle/hammy/internal/config"
	"github.com/bwmarrin/discordgo"
	"github.com/chromedp/chromedp"
	"log/slog"
	"slices"
	"strings"
	"text/template"
	"time"
)

//go:embed analyze.tpl
var analyzeTemplate string

const (
	hammy = "hammy"
)

// Settings are returned in GetSettings call for checking various settings
type Settings struct {
	Temperature float32
}

type LLM struct {
	logger      *slog.Logger
	ollama      ollamaClient
	temperature float32
	dezgoToken  string
}

type ollamaClient interface {
	chat(ctx context.Context, modelName string, messages []string, opts ...Options) (string, error)
	generate(ctx context.Context, modelName string, prompt string, opts ...Options) (string, error)
}

func NewLLM(logger *slog.Logger, cfg config.Config) (*LLM, error) {
	client, err := newSyncClientImpl(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("new c error: %w", err)
	}

	logger.Info("configuring models")
	if cErr := client.configure(context.Background()); cErr != nil {
		return nil, fmt.Errorf("configure error: %w", cErr)
	}

	logger.Info("getting temperature")
	temp, err := client.getTemperature(context.Background(), hammy)
	if err != nil {
		return nil, fmt.Errorf("get temperature error: %w", err)
	}

	return &LLM{
		logger:      logger,
		ollama:      client,
		temperature: temp,
		dezgoToken:  cfg.DezgoToken,
	}, nil
}

func (l *LLM) Analyze(ctx context.Context, url string, message *discordgo.MessageCreate) (string, error) {
	content, err := extractContent(ctx, url)
	if err != nil {
		return "", fmt.Errorf("error parsing html %w", err)
	}
	l.logger.Debug("retrieved website content", "content", content)

	data := struct {
		mention string
		content string
		prompt  string
	}{
		mention: message.Author.Mention(),
		content: content,
		prompt:  message.Content,
	}

	prompt, err := useTemplate(analyzeTemplate, data)

	t := time.Now()

	defer func(start time.Time) {
		elapsed := time.Since(start)
		l.logger.Info("llm call completed", "elapsed", elapsed)
	}(t)

	return l.ollama.generate(ctx, hammy, prompt, WithTemperature(l.temperature))
}

func (l *LLM) Chat(ctx context.Context, messages []*discordgo.Message) (string, error) {
	slices.Reverse(messages)
	msgs := make([]string, 0)
	for _, message := range messages {
		author := message.Author.Username
		if message.Author.Bot {
			author = "you"
		}
		content := strings.ReplaceAll(message.Content, "\n", "")
		msgs = append(msgs, fmt.Sprintf("%s:\"%s\"", author, content))
	}
	return l.ollama.chat(ctx, hammy, msgs, WithTemperature(l.temperature))
}

func (l *LLM) SetTemperature(temp float32) {
	l.temperature = temp
}

func (l *LLM) GetSettings() Settings {
	return Settings{
		Temperature: l.temperature,
	}
}

func extractContent(ctx context.Context, url string) (string, error) {
	dpCtx, cancel := chromedp.NewContext(ctx)
	defer cancel()

	var fallbackResult string
	err := chromedp.Run(dpCtx,
		chromedp.Navigate(url),
		chromedp.Text("body", &fallbackResult),
	)
	if err != nil {
		return "", err
	}

	return fallbackResult, nil
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
