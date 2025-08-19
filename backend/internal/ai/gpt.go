package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

const openAIChatURL = "https://api.openai.com/v1/chat/completions"

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
}

func GenerateAnswer(question string, context string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		// デモ用のシンプルな回答生成（200文字制限）
		if context != "" {
			answer := fmt.Sprintf("質問「%s」について、登録されたナレッジから回答します：%s", question, context)
			// 200文字制限を適用
			if len([]rune(answer)) > 200 {
				runes := []rune(answer)
				answer = string(runes[:197]) + "..."
			}
			return answer, nil
		}
		return "申し訳ございません。関連するナレッジが見つかりませんでした。", nil
	}

	systemPrompt := `あなたは社内ナレッジベース専用のアシスタントです。以下の制約を厳守してください：

1. 回答は必ず200文字以内にしてください
2. 提供されたナレッジベースの情報のみを使用してください
3. ナレッジベースに情報がない場合は「関連するナレッジが見つかりませんでした」と回答してください
4. 一般的な知識や推測は使用しないでください
5. 簡潔で分かりやすい日本語で回答してください`

	userPrompt := fmt.Sprintf(`質問: %s

ナレッジベース:
%s

上記のナレッジベースのみを使用して、200文字以内で回答してください。`, question, context)

	reqBody, _ := json.Marshal(chatRequest{
		Model: "gpt-4o-mini", // 高速・安価
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	})

	req, err := http.NewRequest("POST", openAIChatURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var res chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}

	if len(res.Choices) == 0 {
		return "", fmt.Errorf("no response from GPT")
	}

	answer := res.Choices[0].Message.Content

	// サーバー側でも200文字制限を適用（安全策）
	if len([]rune(answer)) > 200 {
		runes := []rune(answer)
		answer = string(runes[:197]) + "..."
	}

	return answer, nil
}
