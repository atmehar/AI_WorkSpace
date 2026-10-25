# Cost Analysis & Scaling Architecture
**Project:** AI Document Intelligence Workspace (RAG-based SaaS)  
**Date:** October 2026  
**Currency:** USD ($)  

---

## 1. Hosting Infrastructure Comparison: VPS (Hostinger) vs. Cloud (AWS)

| Component | Option A: Self-Managed VPS (Hostinger KVM 4) | Option B: Managed Cloud (Amazon Web Services) |
|---|---|---|
| **Compute** | 4 vCPU, 16 GB RAM, 200 GB NVMe SSD<br>**Cost:** $9.99 / month | AWS ECS Fargate (2 tasks: 2 vCPU, 4 GB RAM each)<br>**Cost:** ≈$73.00 / month |
| **Database** | PostgreSQL 18 + `pgvector` co-hosted on VPS<br>**Cost:** $0.00 (included in VPS disk) | Amazon Aurora Serverless v2 PostgreSQL (0.5 to 4 ACUs)<br>**Cost:** ≈$86.40 / month |
| **Object Storage** | Local NVMe storage (up to 150 GB for uploads)<br>**Cost:** $0.00 (included) | Amazon S3 Standard (100 GB storage + 10k PUT/GET)<br>**Cost:** ≈$2.50 / month |
| **Cache & Queue** | Redis 7 co-hosted on VPS<br>**Cost:** $0.00 (included) | Amazon ElastiCache for Redis (cache.t4g.micro)<br>**Cost:** ≈$11.68 / month |
| **Backups** | Automated daily snapshot & offsite rsync<br>**Cost:** $2.50 / month | AWS Backup + Automated Aurora Snapshots<br>**Cost:** ≈$5.00 / month |
| **Network / Bandwidth** | 16 TB monthly transfer included<br>**Cost:** $0.00 | AWS CloudFront + Data Transfer Out (100 GB)<br>**Cost:** ≈$8.50 / month |
| **Frontend CDN** | Vercel Hobby ($0) / Pro ($20/mo)<br>**Cost:** $0.00 (MVP) | Vercel Pro or AWS CloudFront/S3<br>**Cost:** $20.00 / month |
| **Total Monthly Cost** | **$12.49 / month** | **$207.08 / month** |
| **Verdict** | Ideal for MVP, testing, and early stage (<1,000 users). Zero vendor lock-in. | Recommended for Enterprise scale (>10,000 users) requiring 99.99% multi-AZ SLA and SOC2 compliance. |

*Sources: Hostinger VPS Pricing (https://www.hostinger.com/vps-hosting, Oct 2026), AWS Pricing Calculator (https://calculator.aws/, us-east-1, Oct 2026).*

---

## 2. LLM & Embedding Token Cost Sheet

### Model Unit Pricing (OpenAI Global API, October 2026)
- **Embedding:** `text-embedding-3-small` (1536 dim) = **$0.020 per 1,000,000 tokens**
- **LLM Input:** `gpt-4o-mini` = **$0.150 per 1,000,000 tokens**
- **LLM Output:** `gpt-4o-mini` = **$0.600 per 1,000,000 tokens**

### Per-Action Token & Cost Breakdown

| User Action | Input Tokens | Output Tokens | Calculation | Cost Per Event |
|---|---|---|---|---|
| **Document Ingestion** (10-page PDF, ~5,000 words) | 6,500 tokens (embedding) | 0 | $6,500 \times \frac{0.02}{1,000,000}$ | **$0.00013** |
| **RAG Query (Single Question)** | 1,200 tokens (query + 5 chunks) | 250 tokens (grounded answer) | $\left(1,200 \times \frac{0.15}{1M}\right) + \left(250 \times \frac{0.60}{1M}\right)$ | **$0.00033** |
| **Query Embedding (pgvector retrieval)** | 25 tokens (question) | 0 | $25 \times \frac{0.02}{1,000,000}$ | **$0.0000005** |
| **Total Cost Per Complete Q&A Cycle** | — | — | — | **≈ $0.00033** (1/30th of a cent!) |

---

## 3. Hosted API (OpenAI) vs. Self-Hosted Open-Source (vLLM / LLaMA 3)

| Metric | Hosted API (OpenAI text-embedding-3-small + gpt-4o-mini) | Self-Hosted Open-Source (vLLM + Llama-3.1-8B-Instruct + BGE-small) |
|---|---|---|
| **Hardware Requirement** | 0 GPUs (standard cloud CPU) | 1x NVIDIA A10G (24GB VRAM) or RTX 4090 |
| **Monthly Fixed Server Cost** | $0.00 (pay strictly per token used) | AWS g5.xlarge: ≈$735.00 / month |
| **Crossover Point** | Cheaper for < 2.2 Million questions/month | Cheaper only above > 2.5 Million questions/month |
| **Cold Start & Maintenance** | Zero DevOps maintenance, instant scale | High operational overhead (CUDA drivers, vLLM tuning, model updates) |
| **Latency** | 250–500ms p95 | 150–300ms p95 |
| **Recommendation** | **Adopt Hosted API for MVP through 10,000 users.** | Evaluate self-hosting only for specialized on-premise healthcare or defense requirements. |

---

## 4. Multi-Tier Scaling Scenarios (100 to 1,000,000 Users)

### Baseline Assumptions:
- Daily active users (DAU): **30% of total registered users**
- Average questions per active user: **6 questions / day** (quota cap is 20)
- Average documents per user: **3 documents** (~1.2 MB each, 18 chunks)
- Query size: 1,200 input tokens, 250 output tokens

| Metric | Tier 1: 100 Users | Tier 2: 1,000 Users | Tier 3: 10,000 Users | Tier 4: 1,000,000 Users |
|---|---|---|---|---|
| **Daily Active Users** | 30 | 300 | 3,000 | 300,000 |
| **Daily Questions** | 180 | 1,800 | 18,000 | 1,800,000 |
| **Monthly Questions** | 5,400 | 54,000 | 540,000 | 54,000,000 |
| **Total Chunks in DB** | 5,400 chunks | 54,000 chunks | 540,000 chunks | 54,000,000 chunks |
| **Vector DB Storage (pgvector)** | ≈ 35 MB | ≈ 350 MB | ≈ 3.5 GB | ≈ 350 GB |
| **Monthly LLM + Embedding Cost** | **$1.80 / mo** | **$18.00 / mo** | **$180.00 / mo** | **$18,000.00 / mo** |
| **Infrastructure Hosting Cost** | **$12.50 / mo** (VPS) | **$12.50 / mo** (VPS) | **$210.00 / mo** (AWS Cloud) | **$3,850.00 / mo** (Multi-AZ Cluster) |
| **Total Monthly Operating Cost** | **$14.30 / mo** | **$30.50 / mo** | **$390.00 / mo** | **$21,850.00 / mo** |
| **Cost Per Active User / Month** | **$0.47** | **$0.10** | **$0.13** | **$0.07** |

---

## 5. Architectural Bottlenecks & Scaling Mitigations

1. **Vector Search Throughput at 54M Chunks:**
   - *Bottleneck:* Sequential scans or un-indexed distance calculations degrade when vector counts exceed RAM.
   - *Mitigation:* `pgvector` HNSW index with `m=16, ef_construction=64`. HNSW graph indexes fit comfortably into memory (~3.5 GB RAM at 10,000 users). At 1M users, partition `DocumentChunk` table by `workspace_id` or date using PostgreSQL native declarative table partitioning.
2. **Quota Concurrency Locks (`select_for_update`):**
   - *Bottleneck:* High lock contention if multiple requests hit the exact same user profile simultaneously.
   - *Mitigation:* Row lock is scoped strictly to `user_id` and transactions take <1ms. For 1M users, migrate to Redis atomic counters (`INCRBY` + `EXPIREAT midnight UTC`) with asynchronous PostgreSQL persistence.
3. **Document Ingestion Worker Throughput:**
   - *Bottleneck:* Extracting text and embedding large PDFs can saturate CPU cores.
   - *Mitigation:* Scale Celery worker pools horizontally across Kubernetes worker nodes using Celery auto-scaling based on queue depth.
