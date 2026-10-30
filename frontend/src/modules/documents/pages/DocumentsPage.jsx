import React, { useState } from 'react';
import { useGetDocumentsQuery } from '../api/documentsApi';
import { UploadDropzone } from '../components/UploadDropzone';
import { DocumentCard } from '../components/DocumentCard';
import { FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';

export const DocumentsPage = () => {
  const { data: documents = [], isLoading: loading, error: fetchError, refetch } = useGetDocumentsQuery();
  const [search, setSearch] = useState('');

  const error = fetchError ? (fetchError?.data?.error?.message || 'Failed to load documents.') : null;

  const filteredDocs = documents.filter((d) =>
    (d.original_name || d.original_filename || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Document Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Upload, inspect, and manage your private documents for AI semantic retrieval
          </p>
        </div>

        <button onClick={refetch} className="btn-secondary" style={{ padding: '0.6rem 1rem' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <UploadDropzone />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.6rem', paddingRight: '1rem' }}
          />
        </div>

        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Showing {filteredDocs.length} of {documents.length} documents (Max: 10)
        </span>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && documents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your document workspace...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
          }}>
            <FileText size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>No Documents Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            {search ? 'No documents match your search criteria.' : 'Upload your first PDF, Word, or text file above to start querying with AI.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
};
