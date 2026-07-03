import React from 'react';
import { Activity, Zap, Target, Clock } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="glass-card" style={{ padding: '0.8rem 1rem', flex: 1, minWidth: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: '0.67rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.67rem', color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function MetricsPanel({ scores, durationMs }) {
  if (!scores) return null;

  const modeColors = { hybrid: '#00d4ff', vector: '#7c3aed', bm25: '#f59e0b' };
  const modeColor  = modeColors[scores.mode] || '#94a3b8';
  const topScore   = scores.top_retrieval_score
    ? `${Math.round(scores.top_retrieval_score * 100)}%`
    : 'N/A';

  return (
    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '0.67rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.6rem' }}>
        Retrieval Metrics
      </div>
      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
        <MetricCard icon={Activity} label="Mode"      value={scores.mode?.toUpperCase()} color={modeColor} />
        <MetricCard icon={Target}   label="Retrieved" value={scores.num_retrieved}       color="#94a3b8"    sub="candidates" />
        <MetricCard icon={Zap}      label="Top Score" value={topScore}                   color="#10b981"    sub="post-rerank" />
        {durationMs && (
          <MetricCard icon={Clock} label="Latency" value={`${(durationMs / 1000).toFixed(1)}s`} color="#f59e0b" sub="end-to-end" />
        )}
      </div>
    </div>
  );
}
