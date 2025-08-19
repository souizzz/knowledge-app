CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_by TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if they don't exist
ALTER TABLE knowledge ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'user';
ALTER TABLE knowledge ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    knowledge_id BIGINT PRIMARY KEY REFERENCES knowledge(id) ON DELETE CASCADE,
    embedding vector(1536) -- text-embedding-3-small is 1536 dimensions
);

-- Create IVFFlat index for similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
ON knowledge_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);