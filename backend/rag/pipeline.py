"""
Full RAG pipeline orchestration.
Uses Google GenAI SDK for answer generation.
"""
from typing import Any, Dict

from google import genai

from rag.retriever import hybrid_retrieve
from utils.config import settings

# ── Financial Q&A system prompt ───────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are an expert financial analyst specializing in SEC 10-K filings. "
    "You provide precise, well-reasoned answers grounded strictly in the retrieved "
    "document excerpts provided. "
    "Rules: cite specific figures, dates, and metrics. "
    "If the answer cannot be found in the provided context, say so clearly. "
    "Do not fabricate information. "
    "Structure longer answers with bullet points or numbered lists."
)

USER_TEMPLATE = """\
Retrieved context:
---------------------
{context_str}
---------------------

User question: {query_str}"""


async def run_rag_pipeline(
    query: str,
    top_k: int = 5,
    search_mode: str = "hybrid",
    use_reranking: bool = True,
) -> Dict[str, Any]:
    """
    Execute the end-to-end Financial RAG pipeline:

    1. Hybrid retrieval  (dense vector via Qdrant + BM25 via RRF)
    2. Cross-encoder reranking  (optional)
    3. Context construction
    4. GPT-4o answer generation  (via openai SDK)
    5. Structured citation extraction
    """
    # ── Step 1: Hybrid retrieval ──────────────────────────────────────────────
    retrieved_nodes = await hybrid_retrieve(
        query=query,
        top_k=settings.TOP_K_RETRIEVE,
        mode=search_mode,
    )

    retrieval_scores: Dict[str, Any] = {
        "num_retrieved":       len(retrieved_nodes),
        "mode":                search_mode,
        "reranking_applied":   use_reranking,
        "top_retrieval_score": (
            round(float(retrieved_nodes[0].score or 0.0), 4)
            if retrieved_nodes else 0.0
        ),
    }

    # ── Step 2: Reranking disabled in lite branch ────────────────────────────
    final_nodes = retrieved_nodes[:top_k]

    # ── Step 3: Build context string ──────────────────────────────────────────
    context_parts = []
    for idx, nws in enumerate(final_nodes, start=1):
        meta     = nws.node.metadata
        doc_name = meta.get("doc_name", "Unknown")
        page     = meta.get("page", 0)
        context_parts.append(
            f"[Source {idx}: {doc_name} | Page {page}]\n{nws.node.get_content()}"
        )
    context_str = "\n\n".join(context_parts)

    # ── Step 4: Generate answer with Gemini (google-genai SDK) ─────────────────────
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    prompt = USER_TEMPLATE.format(context_str=context_str, query_str=query)
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=1024,
            system_instruction=SYSTEM_PROMPT
        )
    )
    answer = response.text.strip()

    # ── Step 5: Build structured citations ────────────────────────────────────
    citations = []
    for nws in final_nodes:
        meta = nws.node.metadata
        citations.append(
            {
                "doc_name":  meta.get("doc_name", "Unknown"),
                "page":      meta.get("page", 0),
                "chunk_text": nws.node.get_content()[:600],
                "score":     round(float(nws.score or 0.0), 4),
                "chunk_id":  nws.node.node_id,
            }
        )

    return {
        "answer":           answer,
        "citations":        citations,
        "query":            query,
        "search_mode":      search_mode,
        "retrieval_scores": retrieval_scores,
    }
