import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, User, Bot, AlertCircle, Trash2, Upload, Clock, TrendingUp } from 'lucide-react';
import SourceCitations from './SourceCitations';
import MetricsPanel from './MetricsPanel';
import SearchSettings from './SearchSettings';
import DocumentUpload from './DocumentUpload';
import QueryHistory from './QueryHistory';
import { useChat } from '../hooks/useChat';

const SAMPLE_QUERIES = [
  'What was the total revenue for the fiscal year?',
  'Describe the main risk factors mentioned in the 10-K.',
  "What is the company's long-term debt position?",
  'Summarize the Management Discussion and Analysis section.',
];

function Message({ msg }) {
  const isUser      = msg.role === 'user';
  const isError     = msg.role === 'error';
  const isAssistant = msg.role === 'assistant';
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flexDirection: isUser ? 'row-reverse' : 'row', maxWidth: '92%' }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isUser
            ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
            : isError
              ? 'rgba(239,68,68,0.2)'
              : 'linear-gradient(135deg, #0099cc, #00d4ff)',
        }}>
          {isUser ? <User size={14} color="#fff" /> : isError ? <AlertCircle size={14} color="#ef4444" /> : <Bot size={14} color="#fff" />}
        </div>

        {/* Bubble */}
        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.15))'
            : isError
              ? 'rgba(239,68,68,0.08)'
              : 'rgba(16,24,48,0.85)',
          border: `1px solid ${isUser ? 'rgba(124,58,237,0.3)' : isError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: isUser ? '18px 6px 18px 18px' : '6px 18px 18px 18px',
          padding: '0.85rem 1.1rem',
          backdropFilter: 'blur(10px)',
          maxWidth: '100%',
        }}>
          {isUser ? (
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0 }}>{msg.content}</p>
          ) : isError ? (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>⚠ {msg.content}</p>
          ) : (
            <div className="answer-markdown">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Citation toggle for assistant messages */}
      {isAssistant && msg.citations?.length > 0 && (
        <div style={{ marginTop: '0.6rem', marginLeft: '2.65rem', maxWidth: 'calc(92% + 2.65rem)' }}>
          <button
            onClick={() => setShowCitations(!showCitations)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 999,
              border: `1px solid ${showCitations ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: showCitations ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: showCitations ? '#00d4ff' : '#475569',
              fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <TrendingUp size={11} />
            {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
            {showCitations ? ' ▲' : ' ▼'}
          </button>

          {showCitations && (
            <div
              className="fade-in-up"
              style={{
                marginTop: '0.6rem',
                background: 'rgba(8,13,26,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <SourceCitations citations={msg.citations} />
              <MetricsPanel scores={msg.scores} durationMs={msg.durationMs} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatInterface() {
  const { messages, isLoading, sendQuery, clearMessages } = useChat();
  const [input, setInput]             = useState('');
  const [showUpload, setShowUpload]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settings, setSettings]       = useState({ searchMode: 'hybrid', useReranking: true, topK: 5 });
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendQuery(input, settings);
      setInput('');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const updateSetting = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left sidebar: Settings ─────────────────────────────────────── */}
      <div
        className="hide-mobile"
        style={{
          width: 240, flexShrink: 0,
          background: 'rgba(8,13,26,0.97)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #0099cc, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#e2e8f0' }}>FinRAG</span>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4, margin: 0 }}>
            Financial Intelligence Platform
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SearchSettings settings={settings} onChange={updateSetting} />
        </div>

        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            id="upload-btn"
            onClick={() => setShowUpload(true)}
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}
          >
            <Upload size={13} /> Upload 10-K
          </button>
        </div>
      </div>

      {/* ── Main chat area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(8,13,26,0.85)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              10-K Analysis
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0 }}>
              Hybrid RAG · Gemini 2.5 Flash · Cross-Encoder Reranking
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', alignItems: 'center' }}>
            <button
              id="history-btn"
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Clock size={13} /> History
            </button>
            <button
              id="clear-btn"
              onClick={clearMessages}
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Trash2 size={13} /> Clear
            </button>
            <QueryHistory
              isOpen={showHistory}
              onSelectQuery={(q) => { setInput(q); setShowHistory(false); inputRef.current?.focus(); }}
            />
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.12))',
                border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
                animation: 'glow-pulse 3s ease-in-out infinite',
              }}>
                <Sparkles size={28} color="#00d4ff" />
              </div>
              <h1 style={{ fontSize: '1.6rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Financial Document Intelligence
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#475569', maxWidth: 420, margin: '0 auto 2rem' }}>
                Upload a 10-K PDF and ask questions. The hybrid RAG pipeline combines dense vector search,
                BM25 keyword matching, and cross-encoder reranking to surface the most relevant passages —
                with exact source citations.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', maxWidth: 520, margin: '0 auto' }}>
                {SAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#00d4ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => <Message key={msg.id} msg={msg} />)}

          {isLoading && (
            <div className="fade-in-up" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
              }}>
                <Bot size={14} color="#fff" />
              </div>
              <div style={{
                background: 'rgba(16,24,48,0.85)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px 18px 18px 18px',
                padding: '0.85rem 1.25rem',
              }}>
                <div className="loading-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(8,13,26,0.92)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}>
          <div
            style={{
              display: 'flex', gap: '0.65rem', alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.6rem',
              transition: 'border-color 0.2s',
            }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
            onBlurCapture={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <textarea
              ref={inputRef}
              id="query-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question about your 10-K filings…"
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', resize: 'none', color: '#e2e8f0',
                fontSize: '0.9rem', lineHeight: 1.6,
                maxHeight: 120, overflowY: 'auto',
                padding: '0.25rem 0.35rem',
                fontFamily: 'inherit',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              id="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn btn-primary"
              style={{ padding: '0.55rem 0.9rem', flexShrink: 0, borderRadius: 'var(--radius-md)' }}
            >
              <Send size={15} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#1e2d4a', marginTop: '0.5rem', marginBottom: 0 }}>
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>

      {/* Modals */}
      {showUpload && <DocumentUpload onClose={() => setShowUpload(false)} />}
    </div>
  );
}
