package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// RateLimiter はレート制限を管理する構造体
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter は新しいレート制限器を作成
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}

	// 定期的に古いリクエストをクリーンアップ
	go rl.cleanup()

	return rl
}

// Allow はリクエストが許可されるかチェック
func (rl *RateLimiter) Allow(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// 古いリクエストを削除
	if requests, exists := rl.requests[key]; exists {
		var validRequests []time.Time
		for _, reqTime := range requests {
			if reqTime.After(cutoff) {
				validRequests = append(validRequests, reqTime)
			}
		}
		rl.requests[key] = validRequests
	}

	// 現在のリクエスト数をチェック
	if len(rl.requests[key]) >= rl.limit {
		return false
	}

	// 新しいリクエストを追加
	rl.requests[key] = append(rl.requests[key], now)
	return true
}

// cleanup は定期的に古いエントリを削除
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mutex.Lock()
		now := time.Now()
		cutoff := now.Add(-rl.window * 2) // 2倍のウィンドウを保持

		for key, requests := range rl.requests {
			var validRequests []time.Time
			for _, reqTime := range requests {
				if reqTime.After(cutoff) {
					validRequests = append(validRequests, reqTime)
				}
			}

			if len(validRequests) == 0 {
				delete(rl.requests, key)
			} else {
				rl.requests[key] = validRequests
			}
		}
		rl.mutex.Unlock()
	}
}

// RateLimitMiddleware はレート制限ミドルウェア
func RateLimitMiddleware(rl *RateLimiter) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// IPアドレスをキーとして使用
			key := getClientIP(r)

			if !rl.Allow(key) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", rl.window.Seconds()))
				w.WriteHeader(http.StatusTooManyRequests)
				fmt.Fprintf(w, `{"error":"Rate limit exceeded","retry_after":%.0f}`, rl.window.Seconds())
				return
			}

			next(w, r)
		}
	}
}

// getClientIP はクライアントのIPアドレスを取得
func getClientIP(r *http.Request) string {
	// X-Forwarded-For ヘッダーをチェック（プロキシ経由の場合）
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// 最初のIPアドレスを取得（カンマ区切りの場合）
		if idx := len(xff); idx > 0 {
			for i, c := range xff {
				if c == ',' {
					idx = i
					break
				}
			}
			return xff[:idx]
		}
	}

	// X-Real-IP ヘッダーをチェック
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// RemoteAddr を使用
	return r.RemoteAddr
}

// 異なるエンドポイント用のレート制限器
var (
	// 一般的なAPI用（1分間に60リクエスト）
	GeneralRateLimiter = NewRateLimiter(60, time.Minute)

	// 認証用（1分間に5リクエスト）
	AuthRateLimiter = NewRateLimiter(5, time.Minute)

	// メール送信用（1時間に10リクエスト）
	EmailRateLimiter = NewRateLimiter(10, time.Hour)

	// 知識検索用（1分間に30リクエスト）
	SearchRateLimiter = NewRateLimiter(30, time.Minute)
)
