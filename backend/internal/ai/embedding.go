package ai

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

const openAIEmbeddingURL = "https://api.openai.com/v1/embeddings"

type EmbeddingRequest struct {
	Input string `json:"input"`
	Model string `json:"model"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

// GenerateEmbedding generates an embedding for the given text using OpenAI API
func GenerateEmbedding(ctx context.Context, input string) ([]float32, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		// Return dummy embedding for testing when API key is not set
		return generateDummyEmbedding(input), nil
	}

	reqBody, err := json.Marshal(EmbeddingRequest{
		Input: input,
		Model: "text-embedding-3-small", // OpenAI recommended lightweight model
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", openAIEmbeddingURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI API returned status: %d", resp.StatusCode)
	}

	var result EmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned from OpenAI")
	}

	return result.Data[0].Embedding, nil
}

// generateDummyEmbedding creates a deterministic dummy embedding based on text hash
// This is used for testing when OpenAI API key is not available
func generateDummyEmbedding(text string) []float32 {
	words := strings.Fields(strings.ToLower(text))
	embedding := make([]float32, 1536)
	baseValue := float32(0.05)

	// 簡易シノニム辞書
	synonyms := map[string][]string{
		"car":   {"automobile", "vehicle", "ride"},
		"happy": {"glad", "joyful", "content"},
		"ai":    {"artificial", "intelligence", "ml"},
	}

	for i, word := range words {
		if i >= 80 { // 余裕を持って80単語くらいに制限
			break
		}

		expanded := append([]string{word}, synonyms[word]...)
		for _, w := range expanded {
			wordHash := md5.Sum([]byte(w))
			dimStart := (i * 18) % 1500 // 18次元割り当て、オーバーフロー防止

			for j := 0; j < 18 && (dimStart+j) < 1536; j++ {
				byteIndex := j % 16
				hashByte := float32(wordHash[byteIndex])

				// 値を -0.5〜0.5 に
				value := (hashByte - 127.5) / 255.0

				// メイン次元
				embedding[dimStart+j] += value

				// 近傍次元にスムージング（0.3倍）
				if dimStart+j+1 < 1536 {
					embedding[dimStart+j+1] += value * 0.3
				}
				if dimStart+j-1 >= 0 {
					embedding[dimStart+j-1] += value * 0.3
				}
			}
		}
	}

	// 余白埋め
	for i := range embedding {
		if embedding[i] == 0 {
			embedding[i] = baseValue
		}
	}

	return embedding
}
