import React from 'react';
import { X, FileText, Bookmark, ExternalLink } from 'lucide-react';

export const CitationDrawer = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}>
              <Bookmark size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Verified Source Citation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Retrieved directly from your uploaded document
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.88rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Document:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{citation.document_name}</strong>
          </div>
          {citation.page_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Page Number:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>Page {citation.page_number}</strong>
            </div>
          )}
          {citation.chunk_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chunk ID:</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {citation.chunk_id.slice(0, 18)}...
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Extracted Passage Excerpt
          </h4>
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Inter',
          }}>
            "{citation.excerpt}"
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
