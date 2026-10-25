import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { documentApi } from '../services/document_api';

export const UploadDropzone = ({ onUploadSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setSuccess(null);

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds the 5 MB maximum size limit.');
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setError('Only PDF, DOCX, and TXT files are supported.');
      return;
    }

    setUploading(true);
    try {
      const doc = await documentApi.uploadDocument(file);
      setSuccess(`Successfully uploaded "${file.name}"! Processing started.`);
      if (onUploadSuccess) onUploadSuccess(doc);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.file?.[0] || 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          background: dragging ? 'rgba(139, 92, 246, 0.08)' : 'rgba(15, 21, 35, 0.4)',
          backdropFilter: 'blur(12px)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'var(--transition)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(139, 92, 246, 0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--accent-primary)',
        }}>
          {uploading ? <Loader2 size={28} className="spin" /> : <UploadCloud size={28} />}
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
          {uploading ? 'Uploading & Analyzing Document...' : 'Drag & Drop your document here'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.8rem' }}>
          Supports PDF, Word (DOCX), or plain text (TXT) up to 5 MB
        </p>

        <button
          type="button"
          disabled={uploading}
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', pointerEvents: 'none' }}
        >
          <File size={15} />
          <span>Browse Files</span>
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem',
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};
