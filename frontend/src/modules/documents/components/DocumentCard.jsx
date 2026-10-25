import React, { useEffect, useState } from 'react';
import { FileText, Trash2, MessageSquare, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/document_api';

export const DocumentCard = ({ document, onDelete }) => {
  const [doc, setDoc] = useState(document);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Poll status while PROCESSING or UPLOADED
  useEffect(() => {
    let interval = null;
    if (doc.status === 'UPLOADED' || doc.status === 'PROCESSING') {
      interval = setInterval(async () => {
        try {
          const statusRes = await documentApi.getDocumentStatus(doc.id);
          setDoc((prev) => ({ ...prev, ...statusRes }));
          if (statusRes.status === 'READY' || statusRes.status === 'FAILED') {
            clearInterval(interval);
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [doc.status, doc.id]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${doc.original_name}"?`)) return;
    setDeleting(true);
    try {
      await documentApi.deleteDocument(doc.id);
      if (onDelete) onDelete(doc.id);
    } catch (e) {
      alert('Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuery = () => {
    navigate('/chat', { state: { selectedDocId: doc.id } });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'READY': return 'badge-ready';
      case 'PROCESSING': return 'badge-processing';
      case 'FAILED': return 'badge-failed';
      default: return 'badge-uploaded';
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}>
            <FileText size={20} />
          </div>

          <span className={`badge ${getBadgeClass(doc.status)}`}>
            {doc.status === 'PROCESSING' && <Loader2 size={12} className="spin" />}
            {doc.status}
          </span>
        </div>

        <h4 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.35rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }} title={doc.original_name}>
          {doc.original_name}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>{doc.file_type}</span>
          <span>•</span>
          <span>{formatSize(doc.file_size)}</span>
          {doc.chunks_count !== undefined && (
            <>
              <span>•</span>
              <span>{doc.chunks_count} passages</span>
            </>
          )}
        </div>

        {doc.error_message && (
          <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
            {doc.error_message}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.85rem',
      }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', color: 'var(--danger)' }}
          title="Delete Document"
        >
          <Trash2 size={14} />
          <span>{deleting ? 'Deleting...' : 'Delete'}</span>
        </button>

        <button
          onClick={handleQuery}
          disabled={doc.status !== 'READY'}
          className="btn-primary"
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          title={doc.status === 'READY' ? 'Chat with this document' : 'Document not ready yet'}
        >
          <MessageSquare size={14} />
          <span>Query</span>
        </button>
      </div>
    </div>
  );
};
