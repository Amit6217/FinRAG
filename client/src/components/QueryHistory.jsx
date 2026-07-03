import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { fetchHistory, clearHistory } from '../api/client';

export default function QueryHistory({ onSelectQuery, isOpen }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await fetchHistory();
      setHistory(data);
    } catch { /* ignore network errors */ }
    finally { setLoading(false); }
  };

  const clear = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '100%', right: 0,
      width: 320,
      background: 'rgba(10,15,30,0.98)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      zIndex: 200,
      overflow: 'hidden',
      marginTop: '0.5rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Query History
        </span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={load}  className="btn btn-ghost" style={{ padding: '0.3rem' }} data-tooltip="Refresh">
            <RefreshCw size={12} color="#475569" />
          </button>
          <button onClick={clear} className="btn btn-ghost" style={{ padding: '0.3rem' }} data-tooltip="Clear all">
            <Trash2 size={12} color="#ef4444" />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="loading-dots"><span /><span /><span /></div>
          </div>
        )}
        {!loading && history.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
            No queries yet
          </div>
        )}
        {!loading && history.map((item) => (
          <button
            key={item._id}
            onClick={() => onSelectQuery(item.query)}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Clock size={12} color="#475569" style={{ marginTop: 3, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.query}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {new Date(item.createdAt).toLocaleString()}
                {item.search_mode && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                    {item.search_mode}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={12} color="#475569" style={{ marginTop: 3, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
