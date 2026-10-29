# Source Repository, Demo Walkthrough, and Interview Guide
**Deliverable ID:** `07_source-and-demo`  
**Project:** AI Document Intelligence Workspace (RAG SaaS)  
**Date:** October 2026  

---

## 1. Repository & Source Details

- **GitHub Repository:** `https://github.com/atmehar/AI_WorkSpace.git`
- **Default Branch:** `main`
- **Primary Tech Stack:** React 18 (Vite) + Django 5.1 (DRF) + PostgreSQL 18 (pgvector 0.8.6 HNSW) + LangChain
- **Architectural Limit:** Strict `< 600 LOC` compliance per file (0 violations)

---

## 2. 3–5 Minute Video / Live Demo Script

Use this step-by-step walkthrough for your live interview demonstration:

### Scene 1: Platform Overview & User Registration (0:00 – 1:00)
1. **Open Browser:** Navigate to `http://localhost:5173`.
2. **Show Aesthetics:** Highlight the dark glassmorphic design, subtle gradient borders, and Outfit/Inter typography.
3. **Register New Tenant:** Click "Sign Up", enter `dr.watson@research.org`, password `SuperSecret123!`.
4. **Point Out Architecture:** Explain that registration atomically creates the user record, hashes passwords via PBKDF2, provisions an isolated default workspace, and initializes a 20-query daily quota.
5. **Dashboard Landing:** Land on `/`. Point to the 4 metric cards:
   - *Documents Ready: 0*
   - *Active Sessions: 0*
   - *Query Quota: 20 queries remaining*
   - *Guardrail Status: Zero-Hallucination active*

### Scene 2: Document Ingestion & Vectorization (1:00 – 2:00)
1. **Navigate to Documents:** Click "Documents" in the sidebar.
2. **Upload Policy Document:** Drag & drop `company_remote_policy.txt` (or a PDF file) into the dropzone.
3. **Observe State Machine:** 
   - Status badge shows blue `UPLOADED`, then amber `PROCESSING`.
   - Real-time polling queries `GET /api/v1/documents/{id}/status/`.
   - Within 1–2 seconds, badge flips to green `READY` with chunk count `4 chunks`.
4. **Explain Backend Mechanics:** Mention that PyMuPDF / text extractors parsed the document, LangChain `RecursiveCharacterTextSplitter` created 800-character chunks with 100-character overlap, and normalized 1536-dimensional embeddings were indexed directly into PostgreSQL via pgvector's HNSW graph index.

### Scene 3: Grounded RAG Question Answering & Citations (2:00 – 3:15)
1. **Launch Workspace:** Click "Ask AI" on the document card to navigate into `/chat`.
2. **Select Document:** Check that the document is checked in the left sidebar.
3. **Ask Grounded Question:** 
   *Question:* `"What is the equipment allowance and internet stipend for remote employees?"`
   *Click Send.*
4. **Observe Response:** 
   - Instant response synthesizes the grounded answer mentioning the **$1,500 USD Home Office Stipend** and **$80 monthly connectivity stipend**.
   - Note the citation badge `[1]`.
5. **Inspect Provenance:** Click the `[1]` citation badge. The right-side `CitationDrawer` slides open showing the exact source document name, 1-indexed page number (Page 1), and chunk text excerpt.
6. **Verify Quota:** Notice the top navbar quota badge immediately updates from `20 / 20` to `19 / 20`.

### Scene 4: Zero-Hallucination Safe Abstention & Quota Audit (3:15 – 4:30)
1. **Ask Unsupported Question:**
   *Question:* `"What is the corporate policy regarding stock options and equity grants?"`
   *Click Send.*
2. **Observe Guardrail Behavior:**
   - The system executes similarity search. Distance of the nearest chunk is `0.95`, which exceeds the `0.65` relevance threshold.
   - **Zero tokens are sent to external LLMs.**
   - The system safely returns:
     *"I couldn't find this information in the uploaded documents."*
   - Sources array is empty.
3. **Inspect Settings:** Click "Usage & Quota" in sidebar (`/settings`).
   - Show the live daily quota meter showing **18 remaining queries** out of 20.
   - Explain the concurrency guarantee: PostgreSQL `select_for_update` row locks prevent race-condition overspending.

---

## 3. Deployment Notes (Production Topology)

1. **Frontend Hosting:**
   - Static SPA hosted on Vercel, Netlify, or AWS CloudFront + S3.
   - Configured with SPA rewrite rule (`/* -> /index.html`).
2. **Backend Application Server:**
   - Containerized with Docker running Gunicorn + Uvicorn workers (`gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:8000`).
   - Nginx reverse proxy terminating TLS (Let's Encrypt SSL) and serving static files.
3. **Database Server:**
   - Managed PostgreSQL 16+ (e.g. AWS Aurora Serverless v2 or Hostinger VPS PostgreSQL).
   - Pre-installed with `pgvector` extension.
4. **Security Checklist:**
   - Set `DEBUG=False` in production.
   - Strict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
   - Automated nightly `pg_dump` snapshots stored in offsite encrypted S3 buckets.

---

## 4. Known Limitations & Roadmap (§19 Alignment)

- **Scanned Image Documents:** Currently rejected as empty documents; future version will integrate Tesseract OCR.
- **Async Workers:** Currently uses daemon threads for zero-dependency local evaluation; production roadmap migrates to Celery 5.4 + Redis Cluster.
- **Hybrid Search:** Future version will combine pgvector dense semantic search with PostgreSQL `tsvector` full-text BM25 keyword search using Reciprocal Rank Fusion (RRF).
- **Multi-Tenant Organizations:** Future release will add team membership and role-based access control (Admin, Member, Viewer).

---

## 5. Monday Interview Preparation Checklist

Be prepared to answer these technical deep-dive questions:

1. **Why Django + DRF instead of FastAPI?**
   - *Answer:* Django provides battle-tested ORM transactional integrity (`select_for_update`) essential for concurrency-safe quota metering, native PostgreSQL extension support (`pgvector`), built-in password security (PBKDF2), and an out-of-the-box audit admin panel.
2. **Why pgvector instead of Pinecone or Qdrant?**
   - *Answer:* Single source of truth. Relational data (users, workspaces, documents) and vector embeddings live in the exact same database. Document deletion cascades atomically. Furthermore, vector search can join directly with workspace ownership queries, guaranteeing zero cross-tenant vector leakage.
3. **How does the system prevent hallucinations on unsupported questions?**
   - *Answer:* The `RetrievalService` applies a calibrated cosine distance cutoff (`0.65`). If the closest chunk exceeds this distance, the pipeline short-circuits and returns the standard refusal message without invoking the LLM, saving token costs and eliminating hallucination risk.
4. **How is the 20-query quota protected against parallel race conditions?**
   - *Answer:* `QuotaService` executes inside a `transaction.atomic()` block using PostgreSQL `select_for_update()` row-level locks on `UserProfile`. Concurrent requests are serialized at the database level.
5. **What is mocked vs. real?**
   - *Answer:* Ingestion, parsing, chunking, pgvector HNSW indexing, similarity queries, quota locking, and UI are 100% live. When `AI_API_KEY` is omitted, the built-in deterministic `MockEmbeddingProvider` (word-hashing into 1536 dims) and `MockLLMProvider` run locally so the entire application is completely testable offline. Providing an OpenAI key enables live OpenAI cloud models instantly.
