const express      = require('express');
const axios        = require('axios');
const router       = express.Router();
const QueryHistory = require('../models/QueryHistory');

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

/**
 * POST /api/query
 * Forward the RAG query to the Python backend and persist the result.
 */
router.post('/', async (req, res) => {
  const t0 = Date.now();
  try {
    const { query, top_k = 5, search_mode = 'hybrid', use_reranking = true } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query field is required and must be a non-empty string.' });
    }

    const pyResponse = await axios.post(`${PYTHON_API}/query`, {
      query: query.trim(),
      top_k,
      search_mode,
      use_reranking,
    }, { timeout: 180_000 });

    const result      = pyResponse.data;
    const duration_ms = Date.now() - t0;

    // Persist to MongoDB asynchronously (non-blocking)
    QueryHistory.create({
      query:            result.query,
      answer:           result.answer,
      citations:        result.citations,
      search_mode:      result.search_mode,
      retrieval_scores: result.retrieval_scores,
      duration_ms,
    }).catch((err) => console.error('[MongoDB] Failed to save query history:', err.message));

    return res.json({ ...result, duration_ms });
  } catch (err) {
    const message = err?.response?.data?.detail || err.message || 'Unknown error';
    console.error('[query] Error:', message);
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /api/query/history
 * Return the last 50 queries from MongoDB.
 */
router.get('/history', async (_req, res) => {
  try {
    const history = await QueryHistory
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/query/history
 * Clear all query history.
 */
router.delete('/history', async (_req, res) => {
  try {
    await QueryHistory.deleteMany({});
    return res.json({ success: true, message: 'Query history cleared.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
