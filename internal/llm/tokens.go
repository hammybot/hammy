package llm

import (
	"fmt"
	"github.com/ollama/ollama/api"
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

// Counts the tokens in a given ollama api message using chatgpt tokenizer, DOES NOT INCLUDE IMAGES OR TOOL CALLS
func getMessageTokenCount(m api.Message) int {
	var numTokens int

	tiktoken.SetBpeLoader(tiktoken_loader.NewOfflineLoader())
	tke, err := tiktoken.GetEncoding(encoding)
	if err != nil {
		panic(fmt.Errorf("getEncoding: %v", err))
	}
	numTokens += len(tke.Encode(m.Content, nil, nil))
	numTokens += len(tke.Encode(m.Role, nil, nil))

	return numTokens
}
