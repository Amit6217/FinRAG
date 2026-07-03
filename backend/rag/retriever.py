"""
Hybrid retrieval module.

Dense vector search  : qdrant-client (direct, Python 3.14 compatible)
BM25 keyword search  : rank_bm25 (pure Python, no C++ required)
Fusion               : Reciprocal Rank Fusion (RRF)
"""
import re
from typing import List

from rank_bm25 import BM25Okapi
from llama_index.core.schema import NodeWithScore, TextNode

from rag.indexer import get_all_bm25_nodes, get_genai_client, get_qdrant_client
from utils.config import settings


# ── BM25 helpers ──────────────────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    """Simple whitespace + lowercase tokenizer for BM25."""
    return re.findall(r"\b\w+\b", text.lower())


def _bm25_search(query: str, top_k: int) -> List[NodeWithScore]:
    """
    Run BM25Okapi over all in-memory nodes using rank_bm25 (pure Python).
    Returns NodeWithScore objects with normalized BM25 scores.
    """
    all_nodes = get_all_bm25_nodes()
    if not all_nodes:
        return []

    corpus = [_tokenize(node.get_content()) for node in all_nodes]
    bm25   = BM25Okapi(corpus)

    query_tokens = _tokenize(query)
    raw_scores   = bm25.get_scores(query_tokens)

    # Normalize scores to [0, 1]
    max_score = max(raw_scores) if max(raw_scores) > 0 else 1.0
    scored = sorted(
        enumerate(raw_scores),
        key=lambda x: x[1],
        reverse=True,
    )[:top_k]

    results: List[NodeWithScore] = []
    for idx, score in scored:
        if score == 0.0:
            continue
        results.append(
            NodeWithScore(
                node=all_nodes[idx],
                score=float(score / max_score),
            )
        )
    return results


# ── RRF fusion ────────────────────────────────────────────────────────────────

def reciprocal_rank_fusion(
    results_lists: List[List[NodeWithScore]], k: int = 60
) -> List[NodeWithScore]:
    """
    Merge multiple ranked node lists using Reciprocal Rank Fusion.

    score(d) = Σ  1 / (k + rank(d, list_i))
    """
    rrf_scores: dict = {}
    node_map:   dict = {}

    for ranked_list in results_lists:
        for rank, nws in enumerate(ranked_list):
            nid = nws.node.node_id
            if nid not in rrf_scores:
                rrf_scores[nid] = 0.0
                node_map[nid]   = nws
            rrf_scores[nid] += 1.0 / (k + rank + 1)

    fused: List[NodeWithScore] = []
    for nid in sorted(rrf_scores, key=lambda x: rrf_scores[x], reverse=True):
        nws       = node_map[nid]
        nws.score = rrf_scores[nid]
        fused.append(nws)
    return fused


# ── Vector search ─────────────────────────────────────────────────────────────

def _qdrant_vector_search(query: str, top_k: int) -> List[NodeWithScore]:
    """
    Dense vector search via qdrant-client (ANN cosine similarity).
    Reconstructs NodeWithScore from Qdrant payload fields.
    """
    genai_client = get_genai_client()
    embed_response = genai_client.models.embed_content(
        model=settings.EMBED_MODEL,
        contents=query,
    )
    query_vector = embed_response.embeddings[0].values

    client  = get_qdrant_client()
    results = client.query_points(
        collection_name=settings.QDRANT_COLLECTION,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    ).points

    nodes: List[NodeWithScore] = []
    for hit in results:
        payload   = hit.payload or {}
        text_node = TextNode(
            text=payload.get("text", ""),
            id_=payload.get("node_id", str(hit.id)),
            metadata={
                "doc_name":    payload.get("doc_name", "Unknown"),
                "page":        payload.get("page", 0),
                "total_pages": payload.get("total_pages", 0),
            },
        )
        nodes.append(NodeWithScore(node=text_node, score=hit.score))
    return nodes


# ── Public interface ──────────────────────────────────────────────────────────

async def hybrid_retrieve(
    query: str,
    top_k: int = 20,
    mode: str = "hybrid",
) -> List[NodeWithScore]:
    """
    Retrieve candidate nodes using the selected strategy.

    mode options:
    - "hybrid" : dense vector + BM25, fused with RRF
    - "vector" : dense Qdrant search only
    - "bm25"   : BM25 keyword search only (in-memory, pure Python)
    """
    results_to_fuse: List[List[NodeWithScore]] = []

    # ── Dense vector search ───────────────────────────────────────────────────
    if mode in ("hybrid", "vector"):
        vector_results = _qdrant_vector_search(query, top_k)
        if vector_results:
            results_to_fuse.append(vector_results)

    # ── BM25 keyword search ───────────────────────────────────────────────────
    if mode in ("hybrid", "bm25"):
        bm25_results = _bm25_search(query, top_k)
        if bm25_results:
            results_to_fuse.append(bm25_results)

    # ── Fusion ────────────────────────────────────────────────────────────────
    if len(results_to_fuse) == 0:
        return []
    if len(results_to_fuse) == 1:
        return results_to_fuse[0]
    return reciprocal_rank_fusion(results_to_fuse)
