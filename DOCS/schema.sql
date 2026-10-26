-- PostgreSQL 18 + pgvector 0.8.6 DDL Schema
-- Project: AI Document Intelligence Workspace (RAG SaaS)
-- Generated: October 2026

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Custom User Table
CREATE TABLE IF NOT EXISTS accounts_customuser (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    date_joined TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- 3. User Profile & Quota Table
CREATE TABLE IF NOT EXISTS accounts_userprofile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES accounts_customuser(id) ON DELETE CASCADE,
    daily_questions_used INTEGER NOT NULL DEFAULT 0,
    quota_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    daily_question_limit INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces_workspace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES accounts_customuser(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workspace_owner ON workspaces_workspace(owner_id);

-- 5. Documents Table
CREATE TABLE IF NOT EXISTS documents_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces_workspace(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES accounts_customuser(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('PDF', 'DOCX', 'TXT')),
    file_size INTEGER NOT NULL,
    checksum VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'READY', 'FAILED')),
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_document_workspace ON documents_document(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_status ON documents_document(status);
CREATE INDEX IF NOT EXISTS idx_document_created ON documents_document(created_at DESC);

-- 6. Document Chunks & Vector Store Table
CREATE TABLE IF NOT EXISTS documents_documentchunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents_document(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    section_title VARCHAR(255),
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_document_chunk_index UNIQUE (document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunk_document ON documents_documentchunk(document_id);

-- HNSW Vector Index for Cosine Distance
CREATE INDEX IF NOT EXISTS idx_chunk_embedding_hnsw 
ON documents_documentchunk 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 7. Conversations Table
CREATE TABLE IF NOT EXISTS conversations_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces_workspace(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES accounts_customuser(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_conversation_workspace ON conversations_conversation(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversation_created ON conversations_conversation(created_at DESC);

-- 8. Messages Table
CREATE TABLE IF NOT EXISTS conversations_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations_conversation(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'FAILED')),
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON conversations_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_created ON conversations_message(created_at ASC);

-- 9. Usage Records Table
CREATE TABLE IF NOT EXISTS usage_usagerecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES accounts_customuser(id) ON DELETE CASCADE,
    message_id UUID REFERENCES conversations_message(id) ON DELETE SET NULL,
    query_type VARCHAR(50) NOT NULL DEFAULT 'QUESTION',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_usagerecord(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_usagerecord(created_at DESC);
