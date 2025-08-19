package slack

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func HandleAskCommand(w http.ResponseWriter, r *http.Request) {
	// 署名検証
	_, isValid := ReadAndVerify(r)
	if !isValid {
		log.Printf("Invalid Slack signature")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// フォーム解析
	if err := r.ParseForm(); err != nil {
		log.Printf("Failed to parse form: %v", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	command := r.PostFormValue("command")
	text := r.PostFormValue("text")
	responseURL := r.PostFormValue("response_url")

	if responseURL == "" {
		log.Printf("Missing response_url")
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	apiBase := os.Getenv("BACKEND_API_URL")
	if apiBase == "" {
		apiBase = "http://localhost:8080"
	}

	// 即座にACK応答を返す（3秒制限対応）
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"response_type":"ephemeral","text":"処理中です…少々お待ちください。"}`)

	// ログ出力
	log.Printf("Received command: %s, text: %s", command, text)

	// 重い処理は別ゴルーチンで実行し、response_url に遅延レスポンスを投げる
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Panic in slack command handler: %v", r)
				sendErrorResponse(responseURL, "内部エラーが発生しました。")
			}
		}()

		switch command {
		case "/ask":
			handleAskCommand(apiBase, text, responseURL)
		case "/register-knowledge":
			handleRegisterKnowledge(apiBase, text, responseURL)
		default:
			log.Printf("Unknown command: %s", command)
			sendErrorResponse(responseURL, "不明なコマンドです。")
		}
	}()
}

func handleAskCommand(apiBase, text, responseURL string) {
	if strings.TrimSpace(text) == "" {
		sendErrorResponse(responseURL, "質問内容を入力してください。")
		return
	}

	// Backendの /ask を呼んで回答生成
	reqBody, err := json.Marshal(map[string]string{"question": text})
	if err != nil {
		log.Printf("Failed to marshal request: %v", err)
		sendErrorResponse(responseURL, "リクエスト作成に失敗しました。")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", apiBase+"/ask", bytes.NewBuffer(reqBody))
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		sendErrorResponse(responseURL, "リクエスト作成に失敗しました。")
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to call backend API: %v", err)
		sendErrorResponse(responseURL, "回答生成に失敗しました。サーバーに接続できません。")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Backend API returned status: %d", resp.StatusCode)
		sendErrorResponse(responseURL, "回答生成に失敗しました。")
		return
	}

	var result map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Failed to decode response: %v", err)
		sendErrorResponse(responseURL, "レスポンス解析に失敗しました。")
		return
	}

	answer, ok := result["answer"].(string)
	if !ok || strings.TrimSpace(answer) == "" {
		sendErrorResponse(responseURL, "関連ナレッジが見つかりませんでした。")
		return
	}

	// 成功レスポンス送信（in_channel でチャンネルに共有）
	payload := map[string]any{
		"response_type": "in_channel",
		"text":          answer,
	}
	sendResponse(responseURL, payload)
}

func handleRegisterKnowledge(apiBase, text, responseURL string) {
	title, content := parseTitleContent(text)
	if title == "" || content == "" {
		sendErrorResponse(responseURL, "登録形式: `/register-knowledge タイトル|本文`")
		return
	}

	// Backendに登録
	reqBody, err := json.Marshal(map[string]string{"title": title, "content": content})
	if err != nil {
		log.Printf("Failed to marshal knowledge request: %v", err)
		sendErrorResponse(responseURL, "リクエスト作成に失敗しました。")
		return
	}

	resp, err := http.Post(apiBase+"/knowledge", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		log.Printf("Failed to register knowledge: %v", err)
		sendErrorResponse(responseURL, "ナレッジ登録に失敗しました。サーバーに接続できません。")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		log.Printf("Knowledge registration failed with status: %d", resp.StatusCode)
		sendErrorResponse(responseURL, "ナレッジ登録に失敗しました。")
		return
	}

	// 成功レスポンス
	msg := fmt.Sprintf("ナレッジを登録しました：%s", title)
	payload := map[string]any{
		"response_type": "ephemeral",
		"text":          msg,
	}
	sendResponse(responseURL, payload)
}

func sendResponse(responseURL string, payload map[string]any) {
	b, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to marshal response payload: %v", err)
		return
	}

	resp, err := http.Post(responseURL, "application/json", bytes.NewBuffer(b))
	if err != nil {
		log.Printf("Failed to send response to Slack: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Slack response returned status: %d", resp.StatusCode)
	}
}

func sendErrorResponse(responseURL, message string) {
	payload := map[string]any{
		"response_type": "ephemeral",
		"text":          message,
	}
	sendResponse(responseURL, payload)
}

func parseTitleContent(text string) (string, string) {
	for i := range text {
		if text[i] == '|' {
			return strings.TrimSpace(text[:i]), strings.TrimSpace(text[i+1:])
		}
	}
	return "", ""
}
