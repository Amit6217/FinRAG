const mongoose = require('mongoose');

const CitationSchema = new mongoose.Schema(
  {
    doc_name:   { type: String, required: true },
    page:       { type: Number, required: true },
    chunk_text: { type: String, required: true },
    score:      { type: Number, required: true },
    chunk_id:   { type: String, required: true },
  },
  { _id: false }
);

const QueryHistorySchema = new mongoose.Schema(
  {
    query:            { type: String,  required: true },
    answer:           { type: String,  required: true },
    citations:        { type: [CitationSchema], default: [] },
    search_mode:      { type: String,  default: 'hybrid' },
    retrieval_scores: { type: Object,  default: {} },
    duration_ms:      { type: Number,  default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QueryHistory', QueryHistorySchema);
