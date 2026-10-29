# Database Architecture & Entity Relationship Design (ERD)
**Deliverable ID:** `03_database-design`  
**Project:** AI Document Intelligence Workspace (RAG SaaS)  
**Database Engine:** PostgreSQL 18 with `pgvector 0.8.6`  
**Date:** October 2026  

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    CUSTOM_USER ||--o{ WORKSPACE : "owns"
    CUSTOM_USER ||--|| USER_PROFILE : "has"
    CUSTOM_USER ||--o{ USAGE_RECORD : "incurs"
    CUSTOM_USER ||--o{ DOCUMENT : "uploads"

    WORKSPACE ||--o{ DOCUMENT : "contains"
    WORKSPACE ||--o{ CONVERSATION : "scopes"

    DOCUMENT ||--o{ DOCUMENT_CHUNK : "segmented into"

    CONVERSATION ||--o{ MESSAGE : "contains"

    MESSAGE ||--o{ USAGE_RECORD : "billed under"

    CUSTOM_USER {
        uuid id PK
        string email UK "Indexed"
        string password
        boolean is_active
        boolean is_staff
        timestamp date_joined
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK,UK
        int daily_questions_used "select_for_update"
        date quota_reset_date
        int daily_question_limit "Default: 20"
        timestamp updated_at
    }

    WORKSPACE {
        uuid id PK
        uuid owner_id FK "Indexed"
        string name
        text description
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENT {
        uuid id PK
        uuid workspace_id FK "Indexed"
        uuid uploaded_by_id FK
        string original_name
        string storage_key UK "Non-public path"
        string file_type "PDF, DOCX, TXT"
        int file_size "Bytes"
        string checksum "SHA-256"
        string status "UPLOADED, PROCESSING, READY, FAILED"
        string error_code
        text error_message
        timestamp created_at "Indexed"
        timestamp processed_at
    }

    DOCUMENT_CHUNK {
        uuid id PK
        uuid document_id FK "Indexed"
        int chunk_index "Unique(document, chunk_index)"
        text content "Passage text"
        int page_number "1-indexed provenance"
        string section_title
        vector_1536 embedding "HNSW Index (vector_cosine_ops)"
        timestamp created_at
    }

    CONVERSATION {
        uuid id PK
        uuid workspace_id FK "Indexed"
        uuid created_by_id FK
        string title
        timestamp created_at "Indexed"
        timestamp updated_at
    }

    MESSAGE {
        uuid id PK
        uuid conversation_id FK "Indexed"
        string role "USER, ASSISTANT, SYSTEM"
        text content
        string status "COMPLETED, FAILED"
        jsonb sources "Citation list [chunk_id, doc, page]"
        string model_name
        timestamp created_at "Indexed (Ordering)"
    }

    USAGE_RECORD {
        uuid id PK
        uuid user_id FK "Indexed"
        uuid message_id FK "Nullable"
        string query_type "QUESTION"
        string status "SUCCESS, FAILED, REFUNDED"
        int tokens_used
        timestamp created_at "Indexed"
    }
```

---

## 2. Table-by-Table Data Dictionary

### 2.1 `accounts_customuser`
- Primary user table utilizing email as the unique login credential.
- Password hashed via PBKDF2 with SHA-256 (`pbkdf2_sha256`).

### 2.2 `accounts_userprofile`
- Maintains quota metering state.
- Queried during question answering with `select_for_update()` to prevent concurrent race conditions.

### 2.3 `workspaces_workspace`
- Primary tenant boundary. Every document, chunk, and conversation belongs to a workspace owned by a specific user.

### 2.4 `documents_document`
- Tracks file metadata, ingestion state machine (`UPLOADED` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY` / `FAILED`), error reasons, and physical disk references.

### 2.5 `documents_documentchunk`
- Stores individual text passages (800 characters) extracted from documents.
- Includes `embedding`: 1536-dimensional float vector.
- **Index:** `idx_chunk_embedding_hnsw` using `HnswIndex` with `m=16`, `ef_construction=64`, and `opclasses=['vector_cosine_ops']`.
- **Constraint:** `UniqueConstraint(fields=['document', 'chunk_index'])` ensures zero duplicate chunks on ingestion reruns.

### 2.6 `conversations_conversation`
- Groups back-and-forth messages within a workspace context.

### 2.7 `conversations_message`
- Stores paired user questions and assistant answers.
- `sources` column contains JSON array with `chunk_id`, `document_id`, `document_name`, `page_number`, and `excerpt`.

### 2.8 `usage_usagerecord`
- Audit log of every processed AI request and its outcome (`SUCCESS`, `FAILED`, `REFUNDED`).

---

## 3. PostgreSQL Vector Indexing Mechanics

The vector column uses `pgvector` with HNSW (Hierarchical Navigable Small World) indexing:
```sql
CREATE INDEX idx_chunk_embedding_hnsw 
ON documents_documentchunk 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

- **Operator:** `<=>` computes Cosine Distance ($1 - \text{Cosine Similarity}$).
- **Performance:** Sub-10ms query times over 100,000+ chunks without full table scans.
- **Tenant Filtering:** Vector searches join directly with the `documents_document` table to filter by `workspace_id` prior to distance calculation:
  ```sql
  SELECT chunk.id, chunk.content, chunk.page_number, (chunk.embedding <=> %s) AS distance
  FROM documents_documentchunk chunk
  JOIN documents_document doc ON chunk.document_id = doc.id
  WHERE doc.workspace_id = %s AND doc.status = 'READY'
  ORDER BY distance ASC
  LIMIT 5;
  ```
