package llm

import (
	"context"
	_ "embed"
	"fmt"
	"github.com/austinvalle/hammy/internal/config"
	"github.com/bwmarrin/discordgo"
	"github.com/chromedp/chromedp"
	"log/slog"
	"slices"
	"time"
)

const (
	hammy = "hammy"
)

// Settings are returned in GetSettings call for checking various settings
type Settings struct {
	Temperature float32
}

type LLM struct {
	logger      *slog.Logger
	hammy       syncClient
	temperature float32
}

type syncClient interface {
	chat(ctx context.Context, messages []*discordgo.Message, opts ...Options) (string, error)
	generate(ctx context.Context, systemMessage string, prompt string, opts ...Options) (string, error)
}

func NewLLM(logger *slog.Logger, cfg config.Config) (*LLM, error) {
	client, err := newSyncClientImpl(hammy, cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("new client error: %w", err)
	}

	logger.Info("configuring llm")
	if cErr := client.configure(context.Background()); cErr != nil {
		return nil, fmt.Errorf("configure error: %w", cErr)
	}

	logger.Info("getting temperature")
	temp, err := client.getTemperature(context.Background())
	if err != nil {
		return nil, fmt.Errorf("get temperature error: %w", err)
	}

	return &LLM{
		logger:      logger,
		hammy:       client,
		temperature: temp,
	}, nil
}

func (l *LLM) Analyze(ctx context.Context, url string, message *discordgo.MessageCreate) (string, error) {
	content, err := extractContent(ctx, url)
	if err != nil {
		return "", fmt.Errorf("error parsing html %w", err)
	}
	l.logger.Debug("retrieved website content", "content", content)

	systemMsg := fmt.Sprintf(
		`You are a friendly Discord bot named hammy and you are being asked a question about the following content pulled from a website. You are responding directly to the user who asked the question, use "%s" to mention them in discord.
		Read the content and answer the following user question. If they say "analyze", or are only giving you a url just provide a simple summary of it. You can disregard any images and extra stuff that is not related to the content of the article itself.
		%s`, message.Author.Mention(), content)

	t := time.Now()

	defer func(start time.Time) {
		elapsed := time.Since(start)
		l.logger.Info("llm call completed", "elapsed", elapsed)
	}(t)

	return l.hammy.generate(ctx, systemMsg, message.Content, WithTemperature(l.temperature))
}

func (l *LLM) Chat(ctx context.Context, messages []*discordgo.Message) (string, error) {
	slices.Reverse(messages)
	return l.hammy.chat(ctx, messages, WithTemperature(l.temperature))
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
