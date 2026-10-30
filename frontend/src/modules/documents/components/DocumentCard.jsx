import React from 'react';
import { FileText, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/hooks';
import { setSelectedDocIds } from '../../chat/slices/chatUiSlice';
import {
  useGetDocumentStatusQuery,
  useDeleteDocumentMutation,
} from '../api/documentsApi';

export const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // RTK Query managed polling while PROCESSING or UPLOADED (auto-stops when READY or FAILED)
  const isPending = document.status === 'UPLOADED' || document.status === 'PROCESSING';
  const { data: statusRes } = useGetDocumentStatusQuery(document.id, {
    pollingInterval: isPending ? 2000 : 0,
    skip: !isPending,
  });

  const [deleteDocMutation, { isLoading: deleting }] = useDeleteDocumentMutation();

  const currentStatus = statusRes?.status || document.status;
  const currentChunkCount = statusRes?.chunk_count ?? statusRes?.chunks_count ?? document.chunks_count ?? document.chunk_count;
  const currentError = statusRes?.error_message || document.error_message;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${document.original_name}"?`)) return;
    try {
      await deleteDocMutation(document.id).unwrap();
      if (onDelete) onDelete(document.id);
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleQuery = () => {
    // Redux-managed document selection for seamless cross-page chat
    dispatch(setSelectedDocIds([document.id]));
    navigate('/chat');
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
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

          <span className={`badge ${getBadgeClass(currentStatus)}`}>
            {currentStatus === 'PROCESSING' && <Loader2 size={12} className="spin" />}
            {currentStatus}
          </span>
        </div>

        <h4 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.35rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }} title={document.original_name}>
          {document.original_name}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>{document.file_type}</span>
          <span>•</span>
          <span>{formatSize(document.file_size)}</span>
          {currentChunkCount !== undefined && (
            <>
              <span>•</span>
              <span>{currentChunkCount} passages</span>
            </>
          )}
        </div>

        {currentError && (
          <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
            {currentError}
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
          disabled={currentStatus !== 'READY'}
          className="btn-primary"
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          title={currentStatus === 'READY' ? 'Chat with this document' : 'Document not ready yet'}
        >
          <MessageSquare size={14} />
          <span>Query</span>
        </button>
      </div>
    </div>
  );
};
