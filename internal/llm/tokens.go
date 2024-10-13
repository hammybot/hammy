package llm

import (
	"fmt"
	"github.com/pkoukk/tiktoken-go"
	tiktoken_loader "github.com/pkoukk/tiktoken-go-loader"
)

const encoding = "cl100k_base"

// todo: this is just an estimate and will be wrong, use ollama token endpoints when this is merged https://github.com/ollama/ollama/issues/3582

// counts the tokens in a given string of text using chatgpt tokenizers
func getTokenCount(text string) int {
	tiktoken.SetBpeLoader(tiktoken_loader.NewOfflineLoader())
	tke, err := tiktoken.GetEncoding(encoding)
	if err != nil {
		panic(fmt.Errorf("getEncoding: %v", err))
	}

	token := tke.Encode(text, nil, nil)

	return len(token)
}
