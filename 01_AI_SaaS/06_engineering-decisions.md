# Engineering Decisions Record (ADR)
**Project:** AI Document Intelligence Workspace (RAG-based SaaS)  
**Date:** October 2026  
**Status:** Approved & Implemented  

---

## 1. Web Framework: Django + Django REST Framework vs. FastAPI

### Context
The application requires a robust multi-tenant backend handling relational entities (users, workspaces, documents, chunks, conversations, messages, usage records), strict authentication, transactions, and background task dispatch.

### Options Considered
- **FastAPI:** Lightweight, native async, automatic OpenAPI docs. However, lacks built-in ORM, admin panel, enterprise user auth, and requires assembling multiple disparate libraries (SQLAlchemy, Alembic, Pydantic, auth libraries).
- **Django + DRF (Chosen):** Comprehensive batteries-included framework with battle-tested ORM, integrated security (CSRF, timing attack protection, password hashing), first-class PostgreSQL extension support via `django.contrib.postgres` and `pgvector`, and an out-of-the-box administrative panel.

### Decision
Adopt **Django 5.1 + Django REST Framework**.
- *Rationale:* The ORM's transactional isolation (`transaction.atomic()`, `select_for_update()`) is vital for zero-race-condition quota metering. Django's migration engine provides clean versioned database rollouts, and the built-in admin panel allows seamless operational auditing.
- *Trade-off:* Django's WSGI default is synchronous; however, Python threading and Celery integration easily offload long-running ingestion tasks.

---

## 2. Vector Storage: PostgreSQL + pgvector vs. Standalone Vector DBs (Pinecone, Qdrant, Weaviate)

### Context
Document passages must be indexed into 1536-dimensional semantic vector spaces and queried using cosine similarity while enforcing strict workspace tenant boundaries.

### Options Considered
- **Dedicated Vector DB (Pinecone, Qdrant, Milvus):** High throughput at extreme scale (10M+ vectors), but introduces a second distributed stateful database, network latency hops, separate backup/restore lifecycles, and risk of data desynchronization between relational metadata (document ID, owner, workspace) and vector indexes.
- **PostgreSQL with `pgvector` (Chosen):** Stores embeddings as a native `VectorField(1536)` in the relational `DocumentChunk` table.

### Decision
Adopt **PostgreSQL 18 + `pgvector 0.8.6` with HNSW Index**.
- *Rationale:*
  1. **Single Source of Truth:** Relational data and vector embeddings live in the exact same table. Deleting a document or user cascades atomically to all vectors in one transaction.
  2. **Filtered Vector Search:** Allows direct SQL join with workspace and document ownership (`document__workspace_id=...`), completely eliminating cross-tenant vector leakage.
  3. **Operational Simplicity:** Unified backups (`pg_dump`), single connection pool, and zero SaaS subscription costs for external vector databases.
- *Index Chosen:* `HnswIndex` with `m=16`, `ef_construction=64`, and `vector_cosine_ops`. HNSW provides sub-10ms approximate nearest neighbor retrieval without needing periodic cluster re-indexing like IVFFlat.

---

## 3. Asynchronous Task Processing: Background Threading vs. Celery + Redis

### Context
Document extraction (PyMuPDF, docx) and embedding generation take between 300ms to 3 seconds per file. HTTP uploads must not block while files are being ingested.

### Options Considered
- **Simple Background Daemon Threads (Chosen for MVP):** Lightweight, zero additional infrastructure dependencies, immediate execution inside the Django process.
- **Celery + Redis Broker (Proposed for Production Scale):** Robust distributed queue with persistent task brokers, retry queues, worker scaling, and dead-letter queues.

### Decision
Implement **idempotent thread execution for MVP**, architected to swap seamlessly to **Celery task workers**.
- *Rationale:* Eliminates operational friction for local evaluation and interview demo while preserving exact asynchronous lifecycle (`UPLOADED` -> `PROCESSING` -> `READY`/`FAILED`).
- *Idempotency Guarantee:* The ingestion pipeline cleans existing chunks (`DocumentChunk.objects.filter(document=doc).delete()`) inside a single `transaction.atomic()` block before bulk-inserting new chunks.

---

## 4. Frontend Token Storage: localStorage vs. httpOnly Cookie

### Context
Single Page Application (React + Vite) requires secure persistence of JWT access and refresh tokens.

### Options Considered
- **httpOnly Cookies:** Immune to JavaScript XSS access. However, susceptible to CSRF attacks if SameSite cookies are misconfigured or cross-origin API subdomains are utilized, and requires cookie forwarding across separate client/server ports.
- **localStorage with In-Memory Axios Interceptor (Chosen for MVP):** Clear separation of concerns, straightforward client-side authorization header injection (`Bearer <token>`), and automatic token rotation via Axios response interceptors.

### Decision
Adopt **localStorage + Axios 401 Interceptor** for MVP, with strict XSS sanitization (`rehype-sanitize` for Markdown).
- *Mitigation:* Zero raw HTML is rendered in the UI; all AI output is processed through DOM-sanitized Markdown to neutralize script injection risks. Production roadmap migrates to secure httpOnly cookies with CSRF double-submit tokens.

---

## 5. Chunking Strategy: Recursive Character Splitting vs. Fixed-Size Token Windows

### Context
Raw document text from PDF/DOCX/TXT must be segmented into chunks preserving semantic context, sentence coherence, and page provenance.

### Options Considered
- **Naive Fixed Token Windows (e.g. every 500 tokens):** Arbitrarily cuts sentences and paragraphs in half, degrading semantic coherence and embedding quality.
- **LangChain RecursiveCharacterTextSplitter (Chosen):** Splits recursively on semantic boundaries: `\n\n` (paragraphs), `\n` (sentences), ` ` (words), falling back to characters only when necessary.

### Decision
Adopt **LangChain `RecursiveCharacterTextSplitter`** with:
- `chunk_size = 800` characters (≈160–200 tokens)
- `chunk_overlap = 100` characters (ensures boundary continuity across adjacent passages)
- Retains 1-indexed `page_number` metadata for citation verification.

---

## 6. Daily Quota Policy & Concurrency Protection

### Context
Users are allocated a strict limit of **20 questions per day**. Concurrency race conditions must not allow users to fire parallel requests and bypass the limit.

### Decision
- **Atomic Locking:** `QuotaService.reserve_question_quota()` executes inside a `transaction.atomic()` block utilizing `select_for_update()` row-level locking on `UserProfile`.
- **Compensation / Refund on Failure:** If downstream RAG processing or LLM generation fails, the system executes an automated compensation refund (`restore_question_quota()`), ensuring users are never penalized for system faults.
- **Reset Schedule:** Fixed daily reset at **00:00:00 UTC** (`timezone.localdate()`).

---

## 7. Model Providers: Hosted OpenAI vs. Mock Provider

### Decision
Implement provider pattern behind abstract interfaces (`IEmbeddingProvider`, `ILLMProvider`):
1. **OpenAI Provider:** `text-embedding-3-small` (1536 dim) + `gpt-4o-mini`.
2. **Mock Provider (Default for Offline / Evaluator Mode):** Deterministic bag-of-words vector hashing into 1536 dimensions and grounded fact extraction. Allows 100% of the platform, tests, and Q&A workflows to run offline without requiring external API keys.

---

## 8. Summary Matrix: Implemented vs. Proposed

| Component | Implemented (MVP) | Production / Proposed |
|---|---|---|
| **Framework** | Django 5.1 + DRF | Django 5.1 + DRF + Gunicorn |
| **Vector DB** | PostgreSQL 18 + pgvector HNSW | AWS Aurora Serverless + pgvector |
| **Background Tasks** | In-Process Daemon Threads | Celery 5.4 + Redis 7.2 Cluster |
| **Auth** | SimpleJWT + localStorage | SimpleJWT + httpOnly SameSite Strict |
| **Storage** | Protected Local Disk Storage | AWS S3 with Pre-signed URLs |
| **LLM / Embeddings** | Dual: Mock Provider / OpenAI | Multi-region OpenAI / Azure OpenAI |
