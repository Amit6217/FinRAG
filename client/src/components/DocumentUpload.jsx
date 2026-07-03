import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, X, FileText, Trash2 } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';

function ProgressBar({ progress }) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6 }}>
        <span>Processing document…</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{progress}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: 'linear-gradient(90deg, #7c3aed, #00d4ff)',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

export default function DocumentUpload({ onClose }) {
  const { documents, upload, uploading, uploadProgress, remove } = useDocuments();
  const [status, setStatus]     = useState(null);
  const [fileName, setFileName] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
    try {
      const result = await upload(file);
      setStatus({ type: 'success', message: result.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }, [upload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 520, padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ color: '#e2e8f0', marginBottom: 2 }}>Upload 10-K Document</h3>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>PDF only · max 50 MB</p>
          </div>
          <button id="upload-modal-close" onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? '#00d4ff' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: isDragActive ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} id="file-dropzone-input" />
          <Upload size={32} color={isDragActive ? '#00d4ff' : '#475569'}
            style={{ margin: '0 auto 0.75rem', display: 'block', transition: 'color 0.2s' }} />
          {isDragActive
            ? <p style={{ color: '#00d4ff', fontWeight: 600, margin: 0 }}>Drop the PDF here…</p>
            : <p style={{ color: '#94a3b8', margin: 0 }}>Drag & drop a 10-K PDF, or <span style={{ color: '#00d4ff' }}>browse</span></p>
          }
          {fileName && !uploading && (
            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem', margin: '0.5rem 0 0' }}>📄 {fileName}</p>
          )}
        </div>

        {uploading && <ProgressBar progress={uploadProgress} />}

        {/* Status */}
        {status && (
          <div style={{
            marginTop: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {status.type === 'success'
              ? <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              : <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />}
            <span style={{ fontSize: '0.8rem', color: status.type === 'success' ? '#10b981' : '#ef4444' }}>
              {status.message}
            </span>
          </div>
        )}

        {/* Indexed Documents */}
        {documents.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
              Indexed Documents ({documents.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 180, overflowY: 'auto' }}>
              {documents.map((doc) => (
                <div key={doc.doc_name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <FileText size={13} color="#00d4ff" />
                    <span style={{ fontSize: '0.8rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.doc_name}
                    </span>
                    <span className="badge badge-cyan" style={{ flexShrink: 0, fontSize: '0.62rem' }}>{doc.num_chunks} chunks</span>
                  </div>
                  <button
                    onClick={() => remove(doc.doc_name)}
                    className="btn btn-ghost"
                    style={{ padding: '0.25rem', marginLeft: '0.5rem', flexShrink: 0 }}
                    data-tooltip="Remove from index"
                  >
                    <Trash2 size={12} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
