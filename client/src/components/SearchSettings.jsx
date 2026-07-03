import React from 'react';
import { Sliders, Zap, Search, BookOpen, RefreshCw } from 'lucide-react';

const MODES = [
  { value: 'hybrid', label: 'Hybrid', icon: Zap,      desc: 'Vector + BM25 (RRF fusion)' },
  { value: 'vector', label: 'Vector', icon: Search,   desc: 'Dense embeddings only' },
  { value: 'bm25',   label: 'BM25',   icon: BookOpen, desc: 'Keyword matching only' },
];

export default function SearchSettings({ settings, onChange }) {
  const { searchMode, useReranking, topK } = settings;

  return (
    <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
        <Sliders size={13} color="#94a3b8" />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Search Settings
        </span>
      </div>

      {/* Search Mode Toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '0.45rem', fontWeight: 500 }}>Search Mode</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {MODES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              id={`mode-${value}`}
              onClick={() => onChange({ searchMode: value })}
              data-tooltip={desc}
              style={{
                flex: 1, padding: '0.5rem 0.2rem',
                borderRadius: 8,
                border: `1px solid ${searchMode === value ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)'}`,
                background: searchMode === value ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)',
                color: searchMode === value ? '#00d4ff' : '#475569',
                cursor: 'pointer', transition: 'all 0.2s',
                fontSize: '0.7rem', fontWeight: 600,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                fontFamily: 'inherit',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reranking Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 500 }}>
            <RefreshCw size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Cross-Encoder Rerank
          </div>
          <div style={{ fontSize: '0.67rem', color: '#475569', marginTop: 1 }}>ms-marco-MiniLM-L-6-v2</div>
        </div>
        <button
          id="reranking-toggle"
          onClick={() => onChange({ useReranking: !useReranking })}
          title={useReranking ? 'Disable reranking' : 'Enable reranking'}
          style={{
            width: 40, height: 22, borderRadius: 11,
            border: 'none', cursor: 'pointer', position: 'relative',
            background: useReranking ? '#00d4ff' : 'rgba(255,255,255,0.1)',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: useReranking ? 21 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }} />
        </button>
      </div>

      {/* Top-K Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 500 }}>Result Count</span>
          <span style={{ fontSize: '0.74rem', color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            top-{topK}
          </span>
        </div>
        <input
          id="topk-slider"
          type="range"
          min={1} max={10} step={1}
          value={topK}
          onChange={(e) => onChange({ topK: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: '#00d4ff', cursor: 'pointer', padding: 0, height: 'auto' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: '0.65rem', color: '#475569' }}>1</span>
          <span style={{ fontSize: '0.65rem', color: '#475569' }}>10</span>
        </div>
      </div>
    </div>
  );
}
