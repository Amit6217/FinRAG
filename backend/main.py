"""
Financial RAG API — FastAPI entry point.

Endpoints:
  GET    /health                   — liveness probe
  POST   /ingest                   — ingest a 10-K PDF
  POST   /query                    — run the RAG pipeline
  GET    /documents                — list ingested documents
  DELETE /documents/{doc_name}     — remove a document from BM25 store
"""
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    DocumentInfo,
    DocumentListResponse,
    IngestResponse,
    QueryRequest,
    QueryResponse,
)
from rag.indexer import _bm25_nodes, delete_document, ingest_document
from rag.pipeline import run_rag_pipeline

app = FastAPI(
    title="Financial RAG API",
    description="Hybrid search RAG pipeline for SEC 10-K financial documents",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "Financial RAG API", "version": "1.0.0"}


# ── Document ingestion ────────────────────────────────────────────────────────
@app.post("/ingest", response_model=IngestResponse, tags=["Documents"])
async def ingest_pdf(file: UploadFile = File(...)):
    """Upload and index a 10-K PDF document."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are accepted."
        )

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        doc_name = Path(file.filename).stem
        result = await ingest_document(tmp_path, doc_name)

        return IngestResponse(
            success=True,
            doc_name=result["doc_name"],
            num_chunks=result["num_chunks"],
            message=(
                f"Ingested {result['num_chunks']} chunks "
                f"from {result['num_pages']} pages of '{doc_name}'."
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── Query ─────────────────────────────────────────────────────────────────────
@app.post("/query", response_model=QueryResponse, tags=["Query"])
async def query_pipeline(request: QueryRequest):
    """Run the hybrid RAG pipeline and return an answer with citations."""
    try:
        result = await run_rag_pipeline(
            query=request.query,
            top_k=request.top_k,
            search_mode=request.search_mode,
            use_reranking=request.use_reranking,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Document listing ──────────────────────────────────────────────────────────
@app.get("/documents", response_model=DocumentListResponse, tags=["Documents"])
async def list_documents():
    """Return a list of all documents currently in the in-memory BM25 store."""
    docs = [
        DocumentInfo(doc_name=name, num_chunks=len(nodes))
        for name, nodes in _bm25_nodes.items()
    ]
    return DocumentListResponse(documents=docs)


@app.delete("/documents/{doc_name}", tags=["Documents"])
async def remove_document(doc_name: str):
    """Remove a document from the in-memory BM25 node store."""
    removed = delete_document(doc_name)
    if not removed:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{doc_name}' not found in BM25 store.",
        )
    return {"success": True, "message": f"'{doc_name}' removed from BM25 store."}
