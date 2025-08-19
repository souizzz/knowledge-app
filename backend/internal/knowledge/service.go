package knowledge

import (
	"context"
	"fmt"
	"slack-bot/backend/internal/ai"
)

type Service interface {
	GetAll() ([]Knowledge, error)
	GetByID(id int) (*Knowledge, error)
	Create(ctx context.Context, k Knowledge) (int, error)
	Update(ctx context.Context, k Knowledge) error
	Delete(id int) error
	SearchSimilar(ctx context.Context, query string, limit int) ([]Knowledge, error)
	RegenerateEmbedding(ctx context.Context, id int, content string) error
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service {
	return &service{repo: r}
}

func (s *service) GetAll() ([]Knowledge, error) {
	return s.repo.GetAll()
}

func (s *service) GetByID(id int) (*Knowledge, error) {
	return s.repo.GetByID(id)
}

// Create saves knowledge and generates embedding
func (s *service) Create(ctx context.Context, k Knowledge) (int, error) {
	// Step 1: Save the knowledge (title, content)
	id, err := s.repo.Create(k)
	if err != nil {
		return 0, fmt.Errorf("failed to create knowledge: %w", err)
	}

	// Step 2: Generate embedding for the content
	embedding, err := ai.GenerateEmbedding(ctx, k.Content)
	if err != nil {
		return id, fmt.Errorf("failed to generate embedding: %w", err)
	}

	// Step 3: Save the embedding
	if err := s.repo.SaveEmbedding(ctx, int64(id), embedding); err != nil {
		return id, fmt.Errorf("failed to save embedding: %w", err)
	}

	return id, nil
}

func (s *service) Update(ctx context.Context, k Knowledge) error {
	// Update the knowledge entry
	if err := s.repo.Update(k); err != nil {
		return fmt.Errorf("failed to update knowledge: %w", err)
	}

	// Regenerate embedding for updated content
	embedding, err := ai.GenerateEmbedding(ctx, k.Content)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	// Update the embedding
	if err := s.repo.SaveEmbedding(ctx, int64(k.ID), embedding); err != nil {
		return fmt.Errorf("failed to save embedding: %w", err)
	}

	return nil
}

func (s *service) Delete(id int) error {
	return s.repo.Delete(id)
}

func (s *service) SearchSimilar(ctx context.Context, query string, limit int) ([]Knowledge, error) {
	// 1. まずEmbedding検索を試す
	embedding, err := ai.GenerateEmbedding(ctx, query)
	if err == nil {
		embeddingResults, _ := s.repo.SearchSimilar(embedding, limit)
		if len(embeddingResults) > 0 {
			return embeddingResults, nil
		}
	}

	// 2. Embedding検索で結果がない場合、テキスト検索にフォールバック
	textResults, err := s.repo.SearchByText(query, limit)
	if err != nil {
		return nil, fmt.Errorf("both embedding and text search failed: %w", err)
	}

	return textResults, nil
}

func (s *service) RegenerateEmbedding(ctx context.Context, id int, content string) error {
	// Generate new embedding
	embedding, err := ai.GenerateEmbedding(ctx, content)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	// Delete existing embedding (if any)
	if err := s.repo.DeleteEmbedding(id); err != nil {
		// Ignore error if embedding doesn't exist
	}

	// Save new embedding
	if err := s.repo.SaveEmbedding(ctx, int64(id), embedding); err != nil {
		return fmt.Errorf("failed to save embedding: %w", err)
	}

	return nil
}
