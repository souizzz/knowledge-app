package knowledge

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

type Repository interface {
	GetAll() ([]Knowledge, error)
	GetByID(id int) (*Knowledge, error)
	Create(k Knowledge) (int, error)
	Update(k Knowledge) error
	Delete(id int) error
	SaveEmbedding(ctx context.Context, knowledgeID int64, embedding []float32) error
	DeleteEmbedding(id int) error
	SearchSimilar(embedding []float32, limit int) ([]Knowledge, error)
	SearchByText(query string, limit int) ([]Knowledge, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetAll() ([]Knowledge, error) {
	rows, err := r.db.Query("SELECT id, title, content, COALESCE(created_by, 'user') as created_by, COALESCE(created_at, NOW()) as created_at FROM knowledge ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Knowledge
	for rows.Next() {
		var k Knowledge
		if err := rows.Scan(&k.ID, &k.Title, &k.Content, &k.CreatedBy, &k.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, k)
	}
	return result, nil
}

func (r *repository) GetByID(id int) (*Knowledge, error) {
	row := r.db.QueryRow("SELECT id, title, content, created_by, created_at FROM knowledge WHERE id=$1", id)
	var k Knowledge
	if err := row.Scan(&k.ID, &k.Title, &k.Content, &k.CreatedBy, &k.CreatedAt); err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *repository) Create(k Knowledge) (int, error) {
	var id int
	err := r.db.QueryRow("INSERT INTO knowledge (title, content, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id",
		k.Title, k.Content, k.CreatedBy).Scan(&id)
	return id, err
}

func (r *repository) Update(k Knowledge) error {
	_, err := r.db.Exec("UPDATE knowledge SET title=$1, content=$2 WHERE id=$3",
		k.Title, k.Content, k.ID)
	return err
}

func (r *repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM knowledge WHERE id=$1", id)
	return err
}

// SaveEmbedding saves the embedding for a knowledge entry
func (r *repository) SaveEmbedding(ctx context.Context, knowledgeID int64, embedding []float32) error {
	// Convert []float32 to pgvector format
	vector := fmt.Sprintf("[%s]", float32SliceToString(embedding))

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO knowledge_embeddings (knowledge_id, embedding) VALUES ($1, $2) 
		 ON CONFLICT (knowledge_id) DO UPDATE SET embedding = $2`,
		knowledgeID, vector)
	return err
}

func (r *repository) DeleteEmbedding(id int) error {
	_, err := r.db.Exec("DELETE FROM knowledge_embeddings WHERE knowledge_id = $1", id)
	return err
}

func (r *repository) SearchSimilar(embedding []float32, limit int) ([]Knowledge, error) {
	// Convert embedding to pgvector format
	vector := fmt.Sprintf("[%s]", float32SliceToString(embedding))

	// より緩い検索のため、類似度閾値を大幅に緩和
	// cosine距離で2.0以下（非常に緩い設定）のものを検索
	// または閾値なしで上位N件を取得
	query := `
	SELECT k.id, k.title, k.content, k.created_by, k.created_at, e.embedding <=> $1 as distance
	FROM knowledge k
	JOIN knowledge_embeddings e ON k.id = e.knowledge_id
	ORDER BY e.embedding <=> $1
	LIMIT $2;
	`

	rows, err := r.db.Query(query, vector, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Knowledge
	for rows.Next() {
		var k Knowledge
		var distance float64
		if err := rows.Scan(&k.ID, &k.Title, &k.Content, &k.CreatedBy, &k.CreatedAt, &distance); err != nil {
			return nil, err
		}
		result = append(result, k)
	}

	return result, nil
}

// SearchByText performs text-based search as fallback when embedding search fails
func (r *repository) SearchByText(query string, limit int) ([]Knowledge, error) {
	// PostgreSQLのILIKE（大文字小文字を区別しない）とLIKEを使用
	textQuery := `
	SELECT id, title, content, created_by, created_at
	FROM knowledge
	WHERE title ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%'
	ORDER BY 
		CASE 
			WHEN title ILIKE '%' || $1 || '%' THEN 1
			ELSE 2
		END,
		id DESC
	LIMIT $2;
	`

	rows, err := r.db.Query(textQuery, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []Knowledge
	for rows.Next() {
		var k Knowledge
		if err := rows.Scan(&k.ID, &k.Title, &k.Content, &k.CreatedBy, &k.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, k)
	}

	return result, nil
}

// Helper function to convert []float32 to comma-separated string
func float32SliceToString(floats []float32) string {
	out := make([]string, len(floats))
	for i, f := range floats {
		out[i] = fmt.Sprintf("%f", f)
	}
	return strings.Join(out, ",")
}
