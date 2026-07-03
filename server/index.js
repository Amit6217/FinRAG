'use strict';

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const queryRoutes    = require('./routes/query');
const documentRoutes = require('./routes/documents');
const uploadRoutes   = require('./routes/upload');

const app      = express();
const PORT     = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/financial_rag';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/query',     queryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload',    uploadRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'Financial RAG Server' })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Express Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected to', MONGO_URI);
  } catch (err) {
    console.warn('[MongoDB] Connection failed — query history will not persist:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[Express] Financial RAG Server listening on http://localhost:${PORT}`);
  });
}

bootstrap();
