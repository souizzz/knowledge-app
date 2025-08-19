package knowledge

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"slack-bot/backend/internal/ai"
	"strconv"
	"strings"
)

func (h *Handler) HandleAsk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Question string `json:"question"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.Question == "" {
		http.Error(w, "Question is required", http.StatusBadRequest)
		return
	}

	log.Printf("Processing question: %s", req.Question)

	// 1. 類似ナレッジ検索（Embedding生成 → DB検索）
	results, err := h.service.SearchSimilar(r.Context(), req.Question, 10)
	if err != nil {
		log.Printf("Search failed: %v", err)
		// エラーの場合でも基本的な回答を返す
		resp := map[string]interface{}{
			"answer":  "申し訳ございませんが、現在ナレッジベースにアクセスできません。しばらく後で再試行してください。",
			"related": []Knowledge{},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
		return
	}

	log.Printf("Found %d similar knowledge items", len(results))

	// 2. 検索結果をコンテキストとして整理（ナレッジベース情報のみ）
	var context strings.Builder
	if len(results) == 0 {
		context.WriteString("該当するナレッジがありません。")
	} else {
		context.WriteString("登録されたナレッジベース情報:\n\n")
		for _, k := range results {
			// 200文字制限を考慮してコンテンツを簡潔に
			content := k.Content
			if len([]rune(content)) > 150 {
				runes := []rune(content)
				content = string(runes[:147]) + "..."
			}
			context.WriteString(fmt.Sprintf("【%s】\n%s\n\n", k.Title, content))
		}
	}

	// 3. OpenAI GPTで回答生成
	answer, err := ai.GenerateAnswer(req.Question, context.String())
	if err != nil {
		log.Printf("GPT error: %v", err)
		// GPTエラーの場合はシンプルな回答を返す（200文字制限適用）
		if len(results) > 0 {
			answer = fmt.Sprintf("質問「%s」について、登録されたナレッジから以下の情報が見つかりました。詳細については個別にお聞きください。", req.Question)
		} else {
			answer = "申し訳ございません。関連するナレッジが見つかりませんでした。別のキーワードで検索するか、新しいナレッジを登録してください。"
		}
		// 200文字制限を適用
		if len([]rune(answer)) > 200 {
			runes := []rune(answer)
			answer = string(runes[:197]) + "..."
		}
	}

	log.Printf("Generated answer: %s", answer)

	// 4. レスポンス返す
	resp := map[string]interface{}{
		"answer":      answer,
		"related":     results,
		"found_count": len(results),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type Handler struct {
	service Service
}

func NewHandler(s Service) *Handler {
	return &Handler{service: s}
}

func (h *Handler) HandleKnowledge(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := h.service.GetAll()
		if err != nil {
			http.Error(w, "Failed to fetch", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items)
	case http.MethodPost:
		var k Knowledge
		if err := json.NewDecoder(r.Body).Decode(&k); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}

		// Set default created_by if not provided
		if k.CreatedBy == "" {
			k.CreatedBy = "user"
		}

		id, err := h.service.Create(r.Context(), k)
		if err != nil {
			log.Printf("Failed to create knowledge: %v", err)
			http.Error(w, "Failed to create knowledge", http.StatusInternalServerError)
			return
		}

		// Get the created knowledge with all fields
		created, err := h.service.GetByID(id)
		if err != nil {
			log.Printf("Failed to get created knowledge: %v", err)
			http.Error(w, "Failed to get created knowledge", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(created)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleRegenerateEmbeddings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Printf("Starting embedding regeneration for existing knowledge...")

	// 全てのナレッジを取得
	allKnowledge, err := h.service.GetAll()
	if err != nil {
		log.Printf("Failed to get all knowledge: %v", err)
		http.Error(w, "Failed to get knowledge", http.StatusInternalServerError)
		return
	}

	regenerated := 0
	errors := 0

	for _, k := range allKnowledge {
		// Embeddingを再生成して保存
		err := h.service.RegenerateEmbedding(r.Context(), k.ID, k.Content)
		if err != nil {
			log.Printf("Failed to regenerate embedding for ID %d: %v", k.ID, err)
			errors++
		} else {
			log.Printf("Successfully regenerated embedding for ID %d: %s", k.ID, k.Title)
			regenerated++
		}
	}

	result := map[string]interface{}{
		"message":     fmt.Sprintf("Embedding regeneration completed. Success: %d, Errors: %d", regenerated, errors),
		"regenerated": regenerated,
		"errors":      errors,
		"total":       len(allKnowledge),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) HandleKnowledgeByID(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL path like /api/knowledge/123
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	idStr := pathParts[len(pathParts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		knowledge, err := h.service.GetByID(id)
		if err != nil {
			http.Error(w, "Knowledge not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(knowledge)

	case http.MethodPut:
		var k Knowledge
		if err := json.NewDecoder(r.Body).Decode(&k); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}

		k.ID = id // Ensure the ID matches the URL

		if err := h.service.Update(r.Context(), k); err != nil {
			log.Printf("Failed to update knowledge: %v", err)
			http.Error(w, "Failed to update knowledge", http.StatusInternalServerError)
			return
		}

		// Get the updated knowledge
		updated, err := h.service.GetByID(id)
		if err != nil {
			log.Printf("Failed to get updated knowledge: %v", err)
			http.Error(w, "Failed to get updated knowledge", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updated)

	case http.MethodDelete:
		if err := h.service.Delete(id); err != nil {
			log.Printf("Failed to delete knowledge: %v", err)
			http.Error(w, "Failed to delete knowledge", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
