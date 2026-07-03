import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Award, BookOpen } from 'lucide-react';

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? '#10b981' :
    pct >= 50 ? '#00d4ff' :
    pct >= 25 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>
        <span>Relevance</span>
        <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #7c3aed, ${color})` }} />
      </div>
    </div>
  );
}

function CitationCard({ citation, index, isExpanded, onToggle }) {
  const { doc_name, page, chunk_text, score } = citation;
  const preview = chunk_text.length > 180 ? chunk_text.slice(0, 180) + '…' : chunk_text;
  const accentColor = index === 0 ? '#00d4ff' : index === 1 ? '#7c3aed' : '#334155';

  return (
    <div
      className="glass-card"
      style={{
        padding: '1rem',
        cursor: 'pointer',
        borderLeft: `3px solid ${accentColor}`,
        marginBottom: '0.75rem',
        transition: 'all 0.25s ease',
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {index === 0 && <Award size={14} color="#f59e0b" style={{ flexShrink: 0 }} />}
          <FileText size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {doc_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                <BookOpen size={9} /> Pg {page}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>#{index + 1}</span>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, color: '#475569' }}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      <ScoreBar score={score} />

      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.78rem',
        color: '#94a3b8',
        lineHeight: '1.6',
        fontFamily: 'JetBrains Mono, monospace',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '8px',
        padding: '0.65rem',
        maxHeight: isExpanded ? '260px' : '72px',
        overflow: isExpanded ? 'auto' : 'hidden',
        transition: 'max-height 0.35s ease',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {isExpanded ? chunk_text : preview}
      </div>
    </div>
  );
}

export default function SourceCitations({ citations = [] }) {
  const [expanded, setExpanded] = useState(new Set([0]));

  const toggle = (i) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  if (!citations.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569' }}>
        <FileText size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
        <p style={{ fontSize: '0.85rem' }}>Citations will appear here after a query</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {citations.length} Source{citations.length !== 1 ? 's' : ''}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>
      {citations.map((c, i) => (
        <CitationCard
          key={c.chunk_id || i}
          citation={c}
          index={i}
          isExpanded={expanded.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}
