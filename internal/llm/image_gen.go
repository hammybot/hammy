package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// take text, send to stable-diffusion prompt generator. Take that response and send to dezgo
const (
	promptGeneratorModel = "impactframes/llama3_ifai_sd_prompt_mkr_q4km" //"brxce/stable-diffusion-prompt-generator:latest"
	dezgoUrl             = "https://api.dezgo.com/"
	dezgoModel           = "stablediffusion_2_1_512px"
)

type ImageRequestPayload struct {
	Steps  int    `json:"steps"`
	Prompt string `json:"prompt"`
	Model  string `json:"model"`
	Format string `json:"format"`
}

func (l *LLM) GenerateImage(ctx context.Context, prompt string) ([]byte, error) {
	// Attempt to generate enriched prompt
	ePrompt, err := l.ollama.generate(ctx, promptGeneratorModel, prompt)
	if err != nil {
		l.logger.Warn("error generating enriched prompt, falling back to original", "original prompt", prompt, "error", err)
		ePrompt = prompt
	} else {
		l.logger.Info("generated enriched prompt", "original prompt", prompt, "enriched prompt", ePrompt)
	}

	payload := ImageRequestPayload{
		Steps:  30,
		Prompt: ePrompt,
		Model:  dezgoModel,
		Format: "jpg",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, dezgoUrl+"/text2image", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	req.Header.Add("X-Dezgo-Key", l.dezgoToken)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("received non-2xx response status: %d", resp.StatusCode)
	}

	l.logger.Info("image generated",
		"cost", resp.Header.Get("x-dezgo-job-amount-usd"),
		"balance", resp.Header.Get("x-dezgo-balance-total-usd"))

	return io.ReadAll(resp.Body)
}
