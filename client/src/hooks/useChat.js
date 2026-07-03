import { useState, useCallback } from 'react';
import { queryRAG } from '../api/client';

export function useChat() {
  const [messages, setMessages]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const sendQuery = useCallback(async (query, settings) => {
    if (!query.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);

    const userMessage = {
      id:        Date.now(),
      role:      'user',
      content:   query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const { data } = await queryRAG({
        query:         query.trim(),
        top_k:         settings?.topK ?? 5,
        search_mode:   settings?.searchMode ?? 'hybrid',
        use_reranking: settings?.useReranking ?? true,
      });

      setLastResult(data);

      const assistantMessage = {
        id:          Date.now() + 1,
        role:        'assistant',
        content:     data.answer,
        citations:   data.citations,
        searchMode:  data.search_mode,
        scores:      data.retrieval_scores,
        durationMs:  data.duration_ms,
        timestamp:   new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err?.response?.data?.error || err.message || 'An error occurred';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'error', content: errMsg, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResult(null);
    setError(null);
  }, []);

  return { messages, isLoading, error, lastResult, sendQuery, clearMessages };
}
