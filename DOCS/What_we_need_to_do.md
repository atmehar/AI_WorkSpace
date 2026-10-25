# AI Document Intelligence Workspace — Work Plan (What To Do To Complete This Assignment)

**Stack (from the updated documentation):** React + Vite · Django + Django REST Framework · PostgreSQL + pgvector · JWT · PyMuPDF + python-docx · LLM/embedding API · (optional) Celery + Redis.

Tick each box when done. Follow the order: requirements and design (architecture, ERD, API flows) must exist before heavy coding. Each phase maps to the documentation roadmap (§18) and to the assignment deliverables (01–10).

---

## Phase 0 — Setup (≈1–2 hours) · Doc Roadmap Phase 1
- [ ] Create folder `Weekend2_YourName/01_AI_SaaS/`
- [ ] Create GitHub repo, `.gitignore` (include `.env`, `venv/`, `node_modules/`, uploads folder)
- [ ] Backend: Python venv, install Django, djangorestframework, `djangorestframework-simplejwt`, `django-cors-headers`, `psycopg`, `pgvector`, PyMuPDF, python-docx
- [ ] Frontend: `npm create vite@latest` (React), install `react-router-dom`, `axios`
- [ ] PostgreSQL running locally + enable extension: `CREATE EXTENSION vector;` (use a Django migration with `VectorExtension()`)
- [ ] `.env.example` with names only (see §17.2 of documentation): `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `AI_API_KEY`, `AI_MODEL`, `EMBEDDING_MODEL`, `FRONTEND_URL`, `MAX_UPLOAD_SIZE_MB`, `DAILY_QUESTION_LIMIT`
- [ ] Verify frontend ↔ backend connectivity (CORS working)
- [ ] Make small, meaningful commits from the start (reviewers check commits)

## Phase 1 — Requirements (≈1–2 hours) → part of `01_README.md`
- [ ] Users and goals (students, researchers, employees, businesses, developers)
- [ ] Scope: MVP list (doc §2.1) and **out-of-scope** list (doc §2.2: payments, teams, OCR, agents, multi-provider failover, SSO)
- [ ] Assumptions and constraints (doc §2.3–2.4)
- [ ] Functional requirements FR-01 to FR-12 summarized
- [ ] Acceptance criteria (doc §16.6, 10 items)
- [ ] One complete end-to-end journey: register → login → upload PDF → status READY → ask question → answer + sources → history → usage updates
- [ ] Exception journeys: unsupported question, invalid file, AI failure, quota exceeded, cross-user document access

## Phase 2 — Design (≈3–4 hours)
- [ ] **Lucidchart architecture** → `02_architecture.pdf` + editable URL. Show: React/Vite frontend → REST API (Django/DRF) → PostgreSQL+pgvector, file storage, document processing module, RAG module, LLM + embedding API, (optional) Celery + Redis worker, JWT auth boundary, deployment location
- [ ] **Lucidchart ERD** → `03_database-design.pdf` + editable URL. Entities: User, Workspace, Document, DocumentChunk, Conversation, Message, UsageRecord (doc §8)
- [ ] Executable schema: Django **migrations** (and/or exported `schema.sql`); verify it runs on a clean database
- [ ] Constraints and indexes: unique email; FKs; unique `(document_id, chunk_index)`; indexes on workspace/owner, document status, conversation created_at, message ordering; **vector index (HNSW)** with the matching distance operator; vector dimension equals the chosen embedding model
- [ ] **Lucidchart sequence diagrams** → `04_api-workflows.pdf`: (a) success: upload → process → ask → answer with sources; (b) failure: LLM timeout / quota exceeded / unsupported question
- [ ] API documentation: `api-spec.md` or `openapi.yaml` for all `/api/v1/` routes (doc §9): auth, workspaces, documents, conversations, ask, requests/{id}, usage; include request/response examples, auth, validation, errors (400/401/403/404/413/415/422/429/500/502/503/504)
- [ ] Decide **quota policy** on paper first: what counts, whether failed requests consume quota, reset time (document in `06_engineering-decisions.md`)
- [ ] Decide **chunking** (start 500–1,000 tokens, overlap 50–150), top-k, and similarity threshold approach

## Phase 3 — Backend implementation (≈8–10 hours) · Doc Roadmap Phases 2–5
Django apps: `accounts`, `workspaces`, `documents`, `conversations`, `rag`, `usage`.

**3a. Authentication and workspace**
- [ ] Custom user model (email login) — **configure before first migration**
- [ ] Register, login, token refresh, logout, `/auth/me/` (JWT via SimpleJWT)
- [ ] Workspace model + ownership permission class (owner-only for MVP)
- [ ] Ownership checks on every resource (document ID tampering must fail)

**3b. Documents**
- [ ] Upload endpoint (`multipart/form-data`): validate extension **and real file type**, size limit (5 MB default), per-user document limit (10)
- [ ] Random storage key (never trust the user's filename); private storage (not publicly served)
- [ ] Status flow: `UPLOADED → PROCESSING → READY / FAILED` with safe `error_code`
- [ ] List, detail, status, delete (delete also removes chunks/embeddings/references)
- [ ] Pagination on lists

**3c. Processing and RAG**
- [ ] Extractors: PyMuPDF (PDF, keep page numbers), python-docx (DOCX), plain read (TXT)
- [ ] Handle empty/corrupt/scanned PDFs → `FAILED` with clear message
- [ ] Text cleaning + chunking (paragraph-aware, with overlap, keep `page_number`)
- [ ] Embedding service module (provider behind an interface; **mock provider** for tests)
- [ ] Store chunks + vectors in pgvector
- [ ] Processing runs in background: start with simple background thread/sync for small files, upgrade to **Celery + Redis** if time allows; make job idempotent (re-run replaces chunks, no duplicates)
- [ ] Retrieval: embed question → similarity search **filtered by workspace/user and selected document IDs** → top-k
- [ ] Relevance threshold → if evidence insufficient return "I couldn't find this information in the uploaded documents" **without calling the LLM**
- [ ] Prompt with grounding rules; document text treated as untrusted data (prompt-injection defense)
- [ ] Structured answer with chunk references; **validate cited chunk IDs exist** in retrieved set; never invent pages
- [ ] LLM service module with timeout, bounded retries + backoff only for transient errors

**3d. Conversations, history and usage**
- [ ] Conversation + Message models (role, content, status, sources JSON, model name)
- [ ] `POST /conversations/{id}/ask/`, `GET /requests/{id}/`, history endpoints
- [ ] Save failed requests with status (never show them as successful answers)
- [ ] UsageRecord + **atomic quota enforcement** (transaction + row lock or `select_for_update`) so concurrent requests cannot exceed 20/day
- [ ] `GET /usage/` returns limit, used, remaining, reset time
- [ ] Retry safety: prevent duplicate messages / duplicate quota charge (idempotency key or request-id check)
- [ ] User-friendly errors; no stack traces, paths, keys in responses; consistent `{"error": {"code", "message"}}` format

## Phase 4 — Frontend implementation (≈5–6 hours)
- [ ] `AuthContext` + protected routes + axios client with token handling (decide token storage; note trade-offs in decisions file)
- [ ] Pages: Login, Register, Dashboard, Documents, DocumentChat, History, Settings (doc §10.1)
- [ ] Components: Navbar/Sidebar, UploadForm, DocumentCard (status badge), ChatMessage, SourceReference, LoadingIndicator
- [ ] Poll document status until READY/FAILED
- [ ] Show quota (used/remaining/reset) and clear error/empty/loading states
- [ ] Safe Markdown rendering of AI answers (no raw HTML)
- [ ] Clearly label anything mocked in the UI/README

## Phase 5 — Security and reliability checks (≈2–3 hours) · Doc Roadmap Phase 6
- [ ] User A cannot read/list/query/delete User B's documents or conversations
- [ ] Unauthenticated access rejected
- [ ] Invalid/renamed/oversized uploads rejected
- [ ] Prompt-injection test document ("ignore previous instructions…")
- [ ] Quota race test (parallel requests do not exceed limit)
- [ ] AI failure test (mock LLM raising timeout/429) → safe error, quota policy followed
- [ ] Rate limiting/throttling (DRF throttles) on login and ask
- [ ] Secrets only from env vars; no `.env` committed; logs contain no document text or keys
- [ ] Backup note: try one real `pg_dump` + restore
- [ ] Production settings checklist (DEBUG off, ALLOWED_HOSTS, CORS/CSRF, HTTPS)

## Phase 6 — QA (≈3–4 hours) → `05_test-cases.xlsx` · Doc Roadmap Phase 7
Columns: Test ID, Feature, Preconditions, Steps, Input, Expected, Actual, Status, Defect ID, Evidence Link
- [ ] Unit tests: file validation, extraction, chunking, quota calculation, source-reference validation, retrieval filtering
- [ ] API tests (DRF `APIClient` + Postman collection): auth, upload, delete, conversations, ask, history, usage
- [ ] Integration tests with **mocked** AI services: upload → chunks saved → ask → cited answer
- [ ] Positive, negative, boundary (5 MB limit, 10-document limit, question length, quota edge 20th/21st request), authorization, duplicate/retry, regression
- [ ] **RAG evaluation set:** answerable questions, multi-passage questions, absent-answer questions, similar-terminology questions, malicious-document test; record correctness, citation accuracy, unsupported behaviour, latency, cost
- [ ] Defect log with fixes and evidence (screenshots/logs); regression rerun
- [ ] Execution-proof sheet/screenshots

## Phase 7 — Costs and scaling (≈2–3 hours) → `08_cost-and-scaling.xlsx`
- [ ] Compare ≥2 hosting options (VPS/Hostinger vs AWS): compute, PostgreSQL+pgvector support, file storage, backups, bandwidth, monitoring, Redis/queue, domain
- [ ] Frontend hosting note (e.g. Vercel) and backend/DB hosting requirements (pgvector support)
- [ ] LLM + embedding **token cost sheet** (input/output tokens × vendor price)
- [ ] Hosted API vs open-source/GPU comparison
- [ ] Scenarios for 100 / 1,000 / 10,000 / 1,000,000 users with assumptions (active %, questions/user/day, tokens/question, documents/user) and bottlenecks (embedding throughput, vector search, LLM cost)
- [ ] **Every price needs vendor URL + date accessed + region + currency. No invented numbers.**

## Phase 8 — Written deliverables (≈2–3 hours)
- [ ] `01_README.md` — purpose, stack, scope, assumptions, flows, setup/run/test commands, env var names, **implemented vs mocked**, known gaps
- [ ] `06_engineering-decisions.md` — Django vs FastAPI, pgvector vs separate vector DB, Celery vs simple background job, JWT storage choice, chunking choice, quota policy, hosted vs open-source model; risks, security, reliability, implemented vs proposed
- [ ] `09_sources-and-disclosure.md` — libraries + licenses, pricing sources (URL/date), reused code, AI-use disclosure or "None"
- [ ] `07_source + demo` — repo link, relevant commits, runnable MVP, **3–5 min demo** (journey + one failure case + unsupported question)
- [ ] Deployment notes (doc §17) and known limitations / future enhancements (doc §19)

## Phase 9 — Submission
- [ ] Put files 01–09 in `01_AI_SaaS/`
- [ ] Update parent-level `10_submission-index.md` (both projects, editable Lucidchart URLs, PDFs, test evidence, repo, demo, missing items)
- [ ] Verify reviewer access (Drive, Lucidchart, video)
- [ ] Share with HR + assigned Junior 1/2 reviewer **before Monday's interview**

## Monday interview prep — be ready to explain
- [ ] Why Django + DRF, why pgvector, why Celery/Redis (or why not yet)
- [ ] The full RAG pipeline: ingestion → chunking → embeddings → retrieval → prompt → answer → citation validation
- [ ] How unsupported questions are detected (threshold, no-LLM path) and how thresholds were calibrated
- [ ] Prompt injection and tenant-isolation defenses
- [ ] How quota is enforced atomically and how failed requests are treated
- [ ] Cost per question and cost at 10,000 users
- [ ] What is mocked vs real
- [ ] Diagnose a bug live / make a small change live

## Final checklist
- [ ] App runs from a clean clone using README only
- [ ] No secrets committed
- [ ] Nothing claimed as implemented that is not
- [ ] Every diagram has an editable URL + PDF export
- [ ] Tests pass; evidence saved