package internal

import (
	"context"
	"github.com/tmc/langchaingo/llms/ollama"
)

func Chat(ctx context.Context) {
	llm, err := ollama.New(ollama.WithModel("llama3.1"))
	if err != nil {
		panic(err)
	}

}
