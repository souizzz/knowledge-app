package main

import (
	"fmt"
	"log"
	"net/http"

	"slack-bot/backend/internal/config"
	"slack-bot/backend/internal/db"
	"slack-bot/backend/internal/knowledge"
	"slack-bot/backend/internal/slack"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	log.Println("Starting Slack Knowledge Bot backend...")

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

	// ヘルスチェック
	http.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok","service":"slack-knowledge-bot"}`)
	}))

	// Knowledge API endpoints
	http.HandleFunc("/knowledge", corsMiddleware(handler.HandleKnowledge))
	http.HandleFunc("/knowledge/", corsMiddleware(handler.HandleKnowledgeByID))
	http.HandleFunc("/knowledge/regenerate-embeddings", corsMiddleware(handler.HandleRegenerateEmbeddings))
	http.HandleFunc("/ask", corsMiddleware(handler.HandleAsk))

	// Frontend API endpoints with /api prefix
	http.HandleFunc("/api/knowledge", corsMiddleware(handler.HandleKnowledge))
	http.HandleFunc("/api/knowledge/", corsMiddleware(handler.HandleKnowledgeByID))
	http.HandleFunc("/api/ask", corsMiddleware(handler.HandleAsk))

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
