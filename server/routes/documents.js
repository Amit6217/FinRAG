const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

/**
 * GET /api/documents
 * List all ingested documents from the Python backend BM25 store.
 */
router.get('/', async (_req, res) => {
  try {
    const pyRes = await axios.get(`${PYTHON_API}/documents`, { timeout: 10_000 });
    return res.json(pyRes.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/documents/:docName
 * Remove a document from the Python BM25 store.
 */
router.delete('/:docName', async (req, res) => {
  try {
    const { docName } = req.params;
    const pyRes = await axios.delete(
      `${PYTHON_API}/documents/${encodeURIComponent(docName)}`,
      { timeout: 10_000 }
    );
    return res.json(pyRes.data);
  } catch (err) {
    const status  = err?.response?.status || 500;
    const message = err?.response?.data?.detail || err.message;
    return res.status(status).json({ error: message });
  }
});

module.exports = router;
