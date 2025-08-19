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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	// 設定読み込み
	cfg := config.Load()

	// DB接続
	database := db.Connect(cfg)

	// リポジトリ & サービス & ハンドラ
	repo := knowledge.NewRepository(database)
	service := knowledge.NewService(repo)
	handler := knowledge.NewHandler(service)

	// API（CORSヘッダー付き）
	http.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Backend OK")
	}))

	// Original endpoints
	http.HandleFunc("/knowledge", corsMiddleware(handler.HandleKnowledge))
	http.HandleFunc("/knowledge/", corsMiddleware(handler.HandleKnowledgeByID))
	http.HandleFunc("/knowledge/regenerate-embeddings", corsMiddleware(handler.HandleRegenerateEmbeddings))
	http.HandleFunc("/ask", corsMiddleware(handler.HandleAsk))

	// New API endpoints with /api prefix for frontend
	http.HandleFunc("/api/knowledge", corsMiddleware(handler.HandleKnowledge))
	http.HandleFunc("/api/knowledge/", corsMiddleware(handler.HandleKnowledgeByID))

	// Slack連携
	slack.RegisterSlackHandlers(corsMiddleware)

	log.Printf("Server running on port %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, nil))
}
