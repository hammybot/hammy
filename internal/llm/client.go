package llm

import (
	"context"
	"fmt"
	"github.com/ollama/ollama/api"
	"log/slog"
	"net/http"
	"net/url"
)

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

	//todo: we should add in token counting here so we dont overwrite any important context

	req := &api.ChatRequest{
		Model:    s.modelName,
		Messages: messages,
		Stream:   &stream,
	}

	var response string

	cErr := s.client.Chat(ctx, req, func(r api.ChatResponse) error {
		response = r.Message.Content
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

	stream := false
	req := &api.GenerateRequest{
		Model:  s.modelName,
		System: systemMessage,
		Prompt: prompt,
		Stream: &stream,
	}

	err := s.client.Generate(ctx, req, func(r api.GenerateResponse) error {
		response = r.Response
		return nil
	})

	if err != nil {
		return "", err
	}

	return response, nil
}
