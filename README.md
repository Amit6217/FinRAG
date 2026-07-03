# FinRAG — Financial 10-K RAG Pipeline

A production-grade Retrieval-Augmented Generation (RAG) system for SEC 10-K financial documents, featuring:

- **Hybrid Search**: Dense vector (Qdrant) + BM25 keyword search fused with Reciprocal Rank Fusion (RRF)
- **Cross-Encoder Reranking**: `ms-marco-MiniLM-L-6-v2` reranks candidates for precision
- **Source Citations**: Every answer includes page-level citations with relevance scores
- **MERN UI**: React (Vite) frontend → Express middleware → MongoDB history + Python FastAPI backend

---

## Architecture

```
React (Vite :3000)
    │ /api proxy
Express (Node :5000)  ──► MongoDB (query history)
    │ http
Python FastAPI (:8000)
    ├── Qdrant (vector DB :6333)
    ├── BAAI/bge-small-en-v1.5 (embeddings)
    ├── BM25Retriever (in-memory)
    ├── RRF Fusion
    ├── CrossEncoder reranker
    └── OpenAI GPT-4o (answer generation)
```

---

## Prerequisites

- Docker Desktop (running)
- Python 3.10+
- Node.js 18+
- OpenAI API key

---

## Quick Start

### 1. Start Qdrant + MongoDB
```bash
docker-compose up -d
```

### 2. Python Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Copy and edit .env
copy .env.example .env
# Set OPENAI_API_KEY in .env

uvicorn main:app --reload --port 8000
```

### 3. Express Server
```bash
cd server
copy .env.example .env
npm install
npm run dev
```

### 4. React Client
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Usage

1. Click **Upload 10-K** → drag-and-drop a PDF (e.g., Apple 10-K)
2. Wait for ingestion to complete (chunks indexed to Qdrant + BM25)
3. Type a financial question in the chat input
4. Adjust **Search Mode** (Hybrid / Vector / BM25) and toggle **Cross-Encoder Reranking** in the left panel
5. The answer appears with expandable **source citation cards** showing:
   - Document name + page number
   - Relevance score bar (0–100%)
   - Raw chunk text excerpt

---

## API Reference

### Python Backend (port 8000)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| POST | `/ingest` | Upload & index a PDF |
| POST | `/query` | Run the RAG pipeline |
| GET | `/documents` | List indexed documents |
| DELETE | `/documents/{name}` | Remove from BM25 store |

### Express Server (port 5000)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/query` | Proxy → Python + save to MongoDB |
| GET | `/api/query/history` | Fetch past queries |
| DELETE | `/api/query/history` | Clear history |
| GET | `/api/documents` | Proxy → Python |
| POST | `/api/upload` | Upload PDF → Python /ingest |

---

## Key Design Decisions

| Component | Choice | Reason |
|-----------|--------|--------|
| Embeddings | `BAAI/bge-small-en-v1.5` | Fast, 384-dim, high MTEB scores |
| Reranker | `ms-marco-MiniLM-L-6-v2` | Lightweight cross-encoder, great precision |
| Fusion | Reciprocal Rank Fusion | Proven, parameter-free, robust |
| Chunking | 512 tokens, 50 overlap | Balances context and retrieval precision |
| LLM | GPT-4o | Best reasoning for financial analysis |
