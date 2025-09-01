package main

import (
	"fmt"
	"log"
	"net/http"

	"slack-bot/backend/internal/config"
	"slack-bot/backend/internal/db"
	"slack-bot/backend/internal/handlers"
	"slack-bot/backend/internal/knowledge"
	"slack-bot/backend/internal/middleware"
	"slack-bot/backend/internal/security"
	"slack-bot/backend/internal/slack"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// セキュリティヘッダーの設定
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Content Security Policy
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com;")

		// CORS設定（環境に応じて調整）
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"http://localhost:3000",
			"https://sales-develop.com",
			"https://your-domain.vercel.app", // 実際のドメインに置き換え
		}

		// 本番環境では特定ドメインのみ許可
		if isAllowedOrigin(origin, allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24時間

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// 許可されたオリジンのチェック
func isAllowedOrigin(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range allowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}

func main() {
	log.Println("Starting Slack Knowledge Bot backend...")

	// セキュリティ設定の検証
	securityConfig, err := security.ValidateSecurityConfig()
	if err != nil {
		log.Fatalf("Security validation failed: %v", err)
	}
	log.Println("Security configuration validated successfully")

	// 設定読み込み
	cfg := config.Load()
	log.Printf("Configuration loaded for port %s", cfg.Port)

	// DB接続
	database := db.Connect(cfg)
	defer database.Close()

	// リポジトリ & サービス & ハンドラ
	repo := knowledge.NewRepository(database)
	service := knowledge.NewService(repo)
	handler := knowledge.NewHandler(service)

	// ヘルスチェック（レート制限なし）
	http.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok","service":"slack-knowledge-bot","security":"enabled"}`)
	}))

	// Knowledge API endpoints（一般的なレート制限）
	http.HandleFunc("/knowledge", corsMiddleware(middleware.RateLimitMiddleware(middleware.GeneralRateLimiter)(handler.HandleKnowledge)))
	http.HandleFunc("/knowledge/", corsMiddleware(middleware.RateLimitMiddleware(middleware.GeneralRateLimiter)(handler.HandleKnowledgeByID)))
	http.HandleFunc("/knowledge/regenerate-embeddings", corsMiddleware(middleware.RateLimitMiddleware(middleware.GeneralRateLimiter)(handler.HandleRegenerateEmbeddings)))
	http.HandleFunc("/ask", corsMiddleware(middleware.RateLimitMiddleware(middleware.SearchRateLimiter)(handler.HandleAsk)))

	// Frontend API endpoints with /api prefix
	http.HandleFunc("/api/knowledge", corsMiddleware(middleware.RateLimitMiddleware(middleware.GeneralRateLimiter)(handler.HandleKnowledge)))
	http.HandleFunc("/api/knowledge/", corsMiddleware(middleware.RateLimitMiddleware(middleware.GeneralRateLimiter)(handler.HandleKnowledgeByID)))
	http.HandleFunc("/api/ask", corsMiddleware(middleware.RateLimitMiddleware(middleware.SearchRateLimiter)(handler.HandleAsk)))

	// Admin API endpoints (内部完結)
	app := &handlers.App{DB: database}
	http.HandleFunc("/api/admin/users", corsMiddleware(handlers.GetAdminUsers(app)))
	http.HandleFunc("/api/admin/invitations", corsMiddleware(handlers.CreateInvitation(app)))
	http.HandleFunc("/api/auth/invitations", corsMiddleware(handlers.GetInvitation(app)))
	http.HandleFunc("/api/auth/accept-invite", corsMiddleware(handlers.AcceptInvitation(app)))

	// Slack連携
	slack.RegisterSlackHandlers(corsMiddleware)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Printf("Available endpoints:")
	log.Printf("  - Health: /health")
	log.Printf("  - Knowledge: /knowledge, /api/knowledge")
	log.Printf("  - Ask: /ask, /api/ask")
	log.Printf("  - Slack: /slack/commands")

	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
