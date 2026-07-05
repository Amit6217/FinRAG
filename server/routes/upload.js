const express  = require('express');
const multer   = require('multer');
const axios    = require('axios');
const FormData = require('form-data');
const path     = require('path');
const router   = express.Router();

const PYTHON_API = (process.env.PYTHON_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

// Store uploads in memory (max 50 MB) and validate file type
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      path.extname(file.originalname).toLowerCase() === '.pdf';
    isPdf ? cb(null, true) : cb(new Error('Only PDF files are allowed.'), false);
  },
});

/**
 * POST /api/upload
 * Accept a PDF from the React frontend, stream it to the Python /ingest endpoint.
 */
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file provided.' });
  }

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename:    req.file.originalname,
      contentType: 'application/pdf',
    });

    const pyRes = await axios.post(`${PYTHON_API}/ingest`, form, {
      headers: form.getHeaders(),
      timeout: 300_000,   // 5 minutes for large PDFs
    });

    return res.json(pyRes.data);
  } catch (err) {
    const message = err?.response?.data?.detail || err.message || 'Ingestion failed';
    console.error('[upload] Error:', message);
    return res.status(500).json({ error: message });
  }
});

module.exports = router;
