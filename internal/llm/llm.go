package llm

import (
	"context"
	"fmt"
	"github.com/bwmarrin/discordgo"
	"github.com/chromedp/chromedp"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/vectorstores/chroma"
	"log/slog"
	"time"
)

const (
	model = "mannix/llama3.1-8b-abliterated"
)

type LLM struct {
	logger *slog.Logger
	client *ollama.LLM
}

func NewLLM(logger *slog.Logger) (*LLM, error) {
	client, err := newClient()
	if err != nil {
		return nil, err
	}
	return &LLM{
		logger: logger,
		client: client,
	}, nil
}
func Chat(ctx context.Context, msg string) string {
	fmt.Println("creating")
	llm, err := newClient()
	if err != nil {
		panic(err)
	}
	fmt.Println("created, asking")
	response, err := llms.GenerateFromSinglePrompt(ctx,
		llm,
		msg,
	)

	if err != nil {
		panic(err)
	}
	fmt.Println("got response")
	chroma.New()
	return response
}

func newClient() (*ollama.LLM, error) {
	return ollama.New(ollama.WithModel(model), ollama.WithServerURL("http://localhost:11434"))
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

	userMsg := fmt.Sprintf("User said: %s", message.Content)

	prompt := fmt.Sprintf("%s\n%s", systemMsg, userMsg)
	t := time.Now()

	defer func(start time.Time) {
		elapsed := time.Since(start)
		l.logger.Info("llm call completed", "elapsed", elapsed)
	}(t)
	return l.client.Call(ctx, prompt)
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
