from pydantic import BaseModel, Field
from typing import List, Dict, Any


class Citation(BaseModel):
    doc_name: str
    page: int
    chunk_text: str
    score: float
    chunk_id: str


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    search_mode: str = Field(default="hybrid", pattern="^(hybrid|vector|bm25)$")
    use_reranking: bool = True


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    query: str
    search_mode: str
    retrieval_scores: Dict[str, Any]


class IngestResponse(BaseModel):
    success: bool
    doc_name: str
    num_chunks: int
    message: str


class DocumentInfo(BaseModel):
    doc_name: str
    num_chunks: int


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
