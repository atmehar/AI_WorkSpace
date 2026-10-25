# Sources, Libraries, and AI Disclosure

**Project:** AI Document Intelligence Workspace  
**Date:** October 2026  
**License:** MIT License  

---

## 1. Third-Party Libraries & Licenses

### Backend Dependencies (Python 3.12)

| Library | Version | License | Primary Purpose | Source URL |
|---|---|---|---|---|
| **Django** | 5.1.x | BSD 3-Clause | Core Web Framework, ORM & Auth | https://github.com/django/django |
| **djangorestframework** | 3.15.x | BSD 2-Clause | REST API Serialization & Views | https://github.com/encode/django-rest-framework |
| **djangorestframework-simplejwt** | 5.3.x | MIT | JWT Authentication & Token Rotation | https://github.com/jazzband/djangorestframework-simplejwt |
| **django-cors-headers** | 4.6.x | MIT | Cross-Origin Resource Sharing (CORS) | https://github.com/adamchainz/django-cors-headers |
| **psycopg** | 3.3.6 | LGPL 3.0+ / BSD | PostgreSQL database adapter | https://github.com/psycopg/psycopg |
| **pgvector-python** | 0.5.1 | PostgreSQL License | VectorField & HNSW Indexing | https://github.com/pgvector/pgvector-python |
| **PyMuPDF (fitz)** | 2.0.x | AGPL-3.0 / Commercial | High-performance PDF parsing & extraction | https://github.com/pymupdf/PyMuPDF |
| **python-docx** | 1.2.0 | MIT | Microsoft Word DOCX parsing | https://github.com/python-openxml/python-docx |
| **langchain** | 1.4.x | MIT | Recursive character text chunking | https://github.com/langchain-ai/langchain |
| **langchain-openai** | 0.3.x | MIT | OpenAI embedding and chat connectors | https://github.com/langchain-ai/langchain |
| **python-dotenv** | 1.0.x | BSD 3-Clause | Environment variable management | https://github.com/theskumar/python-dotenv |
| **requests** | 2.32.x | Apache 2.0 | HTTP client for integration test suite | https://github.com/psf/requests |

### Frontend Dependencies (Node.js / React 18)

| Library | Version | License | Primary Purpose | Source URL |
|---|---|---|---|---|
| **React** | 18.3.x | MIT | Declarative UI component library | https://github.com/facebook/react |
| **React DOM** | 18.3.x | MIT | Browser DOM renderer for React | https://github.com/facebook/react |
| **Vite** | 8.3.x | MIT | Ultra-fast frontend bundler and dev server | https://github.com/vitejs/vite |
| **react-router-dom** | 6.28.x | MIT | Client-side routing and protected paths | https://github.com/remix-run/react-router |
| **axios** | 1.7.x | MIT | HTTP client with JWT interceptors | https://github.com/axios/axios |
| **lucide-react** | 0.468.x | ISC | Modern, accessible SVG icon set | https://github.com/lucide-icons/lucide |
| **react-markdown** | 9.0.x | MIT | Safe, extensible Markdown parser | https://github.com/remarkjs/react-markdown |
| **rehype-sanitize** | 6.0.x | MIT | HTML sanitation to prevent XSS | https://github.com/rehypejs/rehype-sanitize |

---

## 2. Infrastructure & Model Pricing Reference Sources

All pricing references are verified directly from vendor documentation (accessed October 2026):

| Service | Vendor | Region | Rate / Currency | Source URL |
|---|---|---|---|---|
| **text-embedding-3-small** | OpenAI | Global | $0.020 / 1M input tokens (USD) | https://openai.com/api/pricing/ |
| **gpt-4o-mini** | OpenAI | Global | $0.150 / 1M input tokens<br>$0.600 / 1M output tokens (USD) | https://openai.com/api/pricing/ |
| **AWS Aurora PostgreSQL** | Amazon Web Services | us-east-1 | $0.12 / ACU-hour + $0.10/GB-month storage | https://aws.amazon.com/rds/aurora/pricing/ |
| **VPS Hosting (Cloud 2)** | Hostinger | US / EU | $5.99 / month (4 vCPU, 8GB RAM, 100GB NVMe) | https://www.hostinger.com/vps-hosting |
| **Vercel Pro (Frontend)** | Vercel | Global CDN | $20.00 / seat / month | https://vercel.com/pricing |

---

## 3. Code Reuse & Attribution

- **No proprietary or plagiarized code was copied.**
- All domain logic, RAG pipeline orchestration, prompt engineering, pgvector cosine queries, and React UI components were implemented from first principles following official documentation for Django, pgvector, and React.
- Standard framework patterns (e.g. Django CustomUser pattern, SimpleJWT serializer override, React AuthContext) follow official framework documentation.

---

## 4. AI-Use Disclosure

- **AI Assistance:** Code structure, architectural documentation, and boilerplate tests were co-authored using Antigravity AI Assistant (Google DeepMind).
- **Human Verification:** All logic, tests, security boundaries, database migrations, and 600 LOC compliance were rigorously inspected, reviewed, and validated via end-to-end automated testing against live PostgreSQL 18 and Vite environments.
