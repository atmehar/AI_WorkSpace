# AI Document Intelligence Workspace (RAG SaaS)
**Next-Generation Retrieval-Augmented Generation (RAG) Document Workspace**  
*Built with React 18, Vite, Django 5.1, PostgreSQL 18 with pgvector HNSW, and LangChain.*

---

## 1. Project Purpose & Vision
The **AI Document Intelligence Workspace** is a production-grade, multi-tenant SaaS application that enables users to upload private knowledge documents (PDFs, DOCX files, and plain text notes) and engage in accurate, citation-backed AI conversations. 

The system is engineered with a strict **Zero-Hallucination Policy**: it verifies semantic relevance in a PostgreSQL vector space using HNSW cosine distance indexing and **safely refuses to answer** (*"I couldn't find this information in the uploaded documents."*) if sufficient grounded evidence does not exist in the retrieved passages.

---

## 2. Core Architectural Pillars
- **Strict Tenant & Workspace Isolation:** Every document and vector chunk belongs to a specific workspace and owner. Cross-tenant document tampering is mathematically prevented at the database query level.
- **pgvector HNSW Vector Store:** Native vector indexing using PostgreSQL 18 with `pgvector 0.8.6` HNSW graph indexes (`m=16`, `ef_construction=64`, `vector_cosine_ops`), eliminating external vector SaaS costs and distributed consistency bugs.
- **LangChain Recursive Character Splitting:** Documents are parsed with PyMuPDF, python-docx, or text readers, then chunked into 800-character passages with 100-character overlap while tracking 1-indexed page provenance.
- **Atomic Concurrency-Safe Quota Guard:** Users are limited to 20 AI queries per day, enforced via PostgreSQL `select_for_update` row-level locks, with automated compensation refunds on downstream failures.
- **Strict 600 LOC Compliance:** Every single backend Python module and React frontend component strictly adheres to an architectural ceiling of **< 600 Lines of Code per file**.

---

## 3. Technology Stack

### Backend
- **Framework:** Python 3.12, Django 5.1, Django REST Framework
- **Authentication:** `djangorestframework-simplejwt` (JWT access & refresh tokens)
- **Database & Vectors:** PostgreSQL 18 + `pgvector 0.8.6` (`psycopg` 3.3.6)
- **Document Parsers:** PyMuPDF (`fitz` 2.0), `python-docx` 1.2.0
- **RAG & Embeddings:** `langchain` 1.4.x, `langchain-openai`, and internal MockProvider

### Frontend
- **Framework:** React 18.3 + Vite 8.3
- **Design System:** Custom Dark Glassmorphism, Inter & Outfit typography, HSL color tokens
- **Routing & Networking:** `react-router-dom` 6.28, `axios` 1.7 (JWT interceptors & auto-refresh)
- **Security & UX:** `react-markdown` with `rehype-sanitize` (XSS immune), `lucide-react` icons

---

## 4. Repository Structure

```text
01_AI_WorkSpace/
├── DOCS/
│   ├── 01_README.md                 # Master project documentation
│   ├── 05_test-cases.md             # Complete QA matrix and defect log
│   ├── 06_engineering-decisions.md  # Architectural Decision Records (ADR)
│   ├── 08_cost-and-scaling.md       # Multi-tier cost modeling (100 to 1M users)
│   ├── 09_sources-and-disclosure.md # Dependency licenses and AI-use disclosure
│   ├── api-spec.md                  # REST API schemas & payload contracts
│   ├── PRD.md                       # Product Requirements Document
│   ├── SRS.md                       # Software Requirements Specification (IEEE 830)
│   └── MODULES.md                   # Sub-package modular architecture guide
├── backend/
│   ├── config/                      # Django project configuration (settings, urls, exceptions)
│   ├── apps/                        # Domain apps
│   │   ├── accounts/                # CustomUser, UserProfile, JWT auth, auto-workspace
│   │   ├── workspaces/              # Workspace ownership & tenancy
│   │   ├── documents/               # Storage, PyMuPDF parsers, chunking, pgvector chunks
│   │   ├── rag/                     # LangChain splitting, HNSW retrieval, PromptBuilder, providers
│   │   ├── conversations/           # Q&A orchestration, messages, citation tracking
│   │   └── usage/                   # Atomic select_for_update quota service
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/                     # Axios instance & JWT refresh interceptors
    │   ├── context/                 # AuthContext (login, register, session)
    │   ├── components/layout/       # Navbar, Sidebar, AppLayout
    │   └── modules/                 # Modular domain slices
    │       ├── auth/pages/          # LoginPage, RegisterPage
    │       ├── documents/           # UploadDropzone, DocumentCard, DocumentsPage
    │       ├── chat/                # SafeMarkdown, CitationDrawer, MessageBubble, ChatPage
    │       └── usage/               # QuotaMeter, DashboardPage, SettingsPage
    ├── package.json
    └── vite.config.js
```

---

## 5. Quickstart & Installation Guide

### Prerequisites
1. **Python 3.12** installed
2. **Node.js 18+** installed
3. **PostgreSQL 18** running on `localhost:5432` with `vector` extension enabled

### Backend Setup
```powershell
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Create .env file from template
# (Configure DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_workspace)

# 4. Run database migrations
python manage.py migrate

# 5. Run test suite to verify system integrity
python manage.py test --keepdb

# 6. Start development server
python manage.py runserver 127.0.0.1:8000
```

### Frontend Setup
```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Run production build check
npm run build

# 4. Start Vite development server
npm run dev
# Application will be accessible at http://localhost:5173
```

---

## 6. Environment Variables (`.env.example`)

```dotenv
DEBUG=True
SECRET_KEY=django-insecure-ai-workspace-development-key-change-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_workspace
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
AI_API_KEY=
AI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
MAX_UPLOAD_SIZE_MB=5
DAILY_QUESTION_LIMIT=20
```

*Note: If `AI_API_KEY` is left blank, the application automatically activates the built-in deterministic `MockEmbeddingProvider` and `MockLLMProvider`, allowing complete offline evaluation without token costs.*

---

## 7. Verification & End-to-End Walkthrough

Run the automated end-to-end integration test:
```powershell
backend\venv\Scripts\python.exe scratch\test_e2e.py
```

### Test Validation Sequence:
1. **Registration:** Generates a new user, checks JWT tokens, initializes 20 queries daily quota.
2. **Document Ingestion:** Ingests `company_remote_policy.txt`, parses text, creates 4 chunks, and persists normalized embeddings into PostgreSQL pgvector with HNSW index.
3. **Grounded Query:** Asks *"What is the equipment allowance for home office setup?"* — retrieves relevant chunks, matches cosine threshold, generates answer citing $1,500 stipend with `[1]` citation badge.
4. **Zero-Hallucination Refusal:** Asks *"What is the policy on company stock options?"* — recognizes distance > threshold, refuses safely without hallucinating: *"I couldn't find this information in the uploaded documents."*
5. **Quota Audit:** Atomically decrements remaining queries from 20 to 18.
