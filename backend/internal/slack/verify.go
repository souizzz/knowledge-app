package slack

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

func verifySlackRequest(r *http.Request, body []byte) bool {
	signingSecret := os.Getenv("SLACK_SIGNING_SECRET")
	if signingSecret == "" {
		log.Printf("SLACK_SIGNING_SECRET not set, skipping verification")
		return true // 開発環境では検証をスキップ
	}

	timestamp := r.Header.Get("X-Slack-Request-Timestamp")
	if timestamp == "" {
		log.Printf("Missing X-Slack-Request-Timestamp header")
		return false
	}

	sig := r.Header.Get("X-Slack-Signature")
	if sig == "" {
		log.Printf("Missing X-Slack-Signature header")
		return false
	}

	// タイムスタンプの検証（リプレイ攻撃対策）
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		log.Printf("Invalid timestamp format: %s", timestamp)
		return false
	}

	if time.Now().Unix()-ts > 300 { // 5分以内
		log.Printf("Request timestamp too old: %d", ts)
		return false
	}

	// 署名検証
	basestring := fmt.Sprintf("v0:%s:%s", timestamp, string(body))
	mac := hmac.New(sha256.New, []byte(signingSecret))
	mac.Write([]byte(basestring))
	expected := "v0=" + hex.EncodeToString(mac.Sum(nil))

	isValid := hmac.Equal([]byte(expected), []byte(sig))
	if !isValid {
		log.Printf("Signature verification failed. Expected: %s, Got: %s", expected, sig)
	}

	return isValid
}

// ヘルパー: リクエストボディを読み込んで検証
func ReadAndVerify(r *http.Request) ([]byte, bool) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		return nil, false
	}

	// 読み込んだので戻しておく（他で使うため）
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	return body, verifySlackRequest(r, body)
}
