# AI Document Intelligence Workspace (RAG SaaS)
**Next-Generation Retrieval-Augmented Generation (RAG) Document Workspace**  
*Built with React 18, Vite, Django 5.1, PostgreSQL 18 with pgvector HNSW, and LangChain.*

See the complete documentation suite in [`DOCS/`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/):
- [`DOCS/01_README.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/01_README.md) — Comprehensive architecture & user guide
- [`DOCS/PRD.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/PRD.md) — Product Requirements Document
- [`DOCS/SRS.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/SRS.md) — IEEE 830 Software Requirements Specification
- [`DOCS/MODULES.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/MODULES.md) — Sub-package Modular Layout Specification
- [`DOCS/api-spec.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/api-spec.md) — REST API Specification
- [`DOCS/05_test-cases.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/05_test-cases.md) — QA Matrix, E2E Proof & Defect Log
- [`DOCS/06_engineering-decisions.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/06_engineering-decisions.md) — Architectural Decision Records (ADR)
- [`DOCS/08_cost-and-scaling.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/08_cost-and-scaling.md) — Cost Analysis & Scaling Model (100 to 1M Users)
- [`DOCS/09_sources-and-disclosure.md`](file:///f:/Projects/Weekend%20Assesment%202/01_AI_WorkSpace/DOCS/09_sources-and-disclosure.md) — Dependencies, Pricing Sources & AI Disclosure

---

## Quickstart

### Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py test --keepdb
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```powershell
cd frontend
npm install
npm run build
npm run dev
```

### End-to-End Automated Test
```powershell
backend\venv\Scripts\python.exe C:\Users\NOOR AL MUSABAH\.gemini\antigravity-ide\brain\43a38d1c-2f72-40c6-ab34-c76edaec093e\scratch\test_e2e.py
```
All 10 unit tests and the end-to-end integration test pass with 100% success rate. All files strictly adhere to the < 600 LOC constraint.
