"""
Cross-encoder reranking module.
Uses a HuggingFace cross-encoder to score query-document pairs
and return the top-k highest-relevance nodes.
"""
from typing import List, Optional

from sentence_transformers import CrossEncoder
from llama_index.core.schema import NodeWithScore

from utils.config import settings

# Singleton cross-encoder (loaded lazily on first use)
_cross_encoder: Optional[CrossEncoder] = None


def get_cross_encoder() -> CrossEncoder:
    global _cross_encoder
    if _cross_encoder is None:
        _cross_encoder = CrossEncoder(settings.RERANKER_MODEL)
    return _cross_encoder


def rerank(
    query: str, nodes: List[NodeWithScore], top_k: int = 5
) -> List[NodeWithScore]:
    """
    Score each (query, chunk) pair with the cross-encoder, normalize
    scores to [0, 1], and return the top_k nodes sorted by relevance.

    Parameters
    ----------
    query  : the user query string
    nodes  : candidate NodeWithScore objects (from hybrid retrieval)
    top_k  : number of nodes to return after reranking

    Returns
    -------
    List of top_k NodeWithScore objects with updated .score attributes.
    """
    if not nodes:
        return []

    encoder = get_cross_encoder()

    # Build sentence pairs for the cross-encoder
    pairs = [[query, nws.node.get_content()] for nws in nodes]
    raw_scores: List[float] = encoder.predict(pairs).tolist()

    # Normalize to [0, 1]
    min_s = min(raw_scores)
    max_s = max(raw_scores)
    score_range = max_s - min_s

    for i, nws in enumerate(nodes):
        if score_range > 1e-6:
            nws.score = float((raw_scores[i] - min_s) / score_range)
        else:
            # All scores identical — use sigmoid normalization
            nws.score = float(1.0 / (1.0 + 2.718 ** (-raw_scores[i])))

    # Sort descending and return top_k
    return sorted(nodes, key=lambda x: x.score, reverse=True)[:top_k]
