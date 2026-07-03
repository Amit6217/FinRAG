"""
Document ingestion and indexing module.
Uses qdrant-client directly (bypasses llama-index-vector-stores-qdrant
for Python 3.14 compatibility) and stores BM25 nodes in memory.
"""
import hashlib
import uuid
from typing import Dict, List, Optional

from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import TextNode
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from utils.config import settings
from utils.pdf_loader import extract_text_with_pages

# ── Global in-memory BM25 node store ─────────────────────────────────────────
_bm25_nodes: Dict[str, List[TextNode]] = {}

# ── Singletons ────────────────────────────────────────────────────────────────
_qdrant_client: Optional[QdrantClient] = None
_embed_model: Optional[HuggingFaceEmbedding] = None


def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.QDRANT_URL)
    return _qdrant_client


def get_embed_model() -> HuggingFaceEmbedding:
    global _embed_model
    if _embed_model is None:
        _embed_model = HuggingFaceEmbedding(model_name=settings.EMBED_MODEL)
    return _embed_model


def ensure_collection_exists(client: QdrantClient) -> None:
    """Create the Qdrant collection if it does not already exist."""
    existing = {c.name for c in client.get_collections().collections}
    if settings.QDRANT_COLLECTION not in existing:
        # BAAI/bge-small-en-v1.5 produces 384-dimensional vectors
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


async def ingest_document(pdf_path: str, doc_name: str) -> Dict:
    """
    Full ingestion pipeline:
    1. Extract page text with pdfplumber
    2. Build LlamaIndex TextNodes with metadata
    3. Chunk with SentenceSplitter
    4. Embed with BAAI/bge-small-en-v1.5
    5. Upsert vectors directly to Qdrant via qdrant-client
    6. Update the in-memory BM25 node store
    """
    # ── 1. Extract text ───────────────────────────────────────────────────────
    pages = extract_text_with_pages(pdf_path)
    if not pages:
        raise ValueError(f"No extractable text found in {pdf_path}")

    # ── 2. Build LlamaIndex Documents ─────────────────────────────────────────
    documents = [
        Document(
            text=p["text"],
            metadata={
                "doc_name": doc_name,
                "page": p["page"],
                "total_pages": p["total_pages"],
            },
        )
        for p in pages
    ]

    # ── 3. Chunk ──────────────────────────────────────────────────────────────
    splitter = SentenceSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    nodes = splitter.get_nodes_from_documents(documents)

    # Assign stable IDs
    for idx, node in enumerate(nodes):
        digest = hashlib.md5(node.text.encode()).hexdigest()[:8]
        node.id_ = f"{doc_name}_{idx}_{digest}"

    # ── 4. Embed ──────────────────────────────────────────────────────────────
    embed_model = get_embed_model()
    texts = [n.get_content() for n in nodes]
    embeddings = embed_model.get_text_embedding_batch(texts, show_progress=True)

    # ── 5. Upsert to Qdrant ───────────────────────────────────────────────────
    client = get_qdrant_client()
    ensure_collection_exists(client)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "node_id":    node.id_,
                "doc_name":   node.metadata.get("doc_name", ""),
                "page":       node.metadata.get("page", 0),
                "total_pages":node.metadata.get("total_pages", 0),
                "text":       node.get_content(),
            },
        )
        for node, embedding in zip(nodes, embeddings)
    ]

    # Upload in batches of 100
    batch_size = 100
    for i in range(0, len(points), batch_size):
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=points[i : i + batch_size],
        )

    # ── 6. Update BM25 store ──────────────────────────────────────────────────
    _bm25_nodes[doc_name] = nodes

    return {
        "doc_name":  doc_name,
        "num_chunks": len(nodes),
        "num_pages":  len(pages),
    }


def get_all_bm25_nodes() -> List[TextNode]:
    """Return all nodes across every ingested document for BM25 retrieval."""
    all_nodes: List[TextNode] = []
    for nodes in _bm25_nodes.values():
        all_nodes.extend(nodes)
    return all_nodes


def delete_document(doc_name: str) -> bool:
    """Remove a document from the in-memory BM25 store."""
    if doc_name in _bm25_nodes:
        del _bm25_nodes[doc_name]
        return True
    return False
