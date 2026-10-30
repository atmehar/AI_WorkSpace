import React from 'react';
import { useAuth } from '../../../context/auth_context';
import { useGetUsageStatusQuery } from '../api/usageApi';
import { QuotaMeter } from '../components/QuotaMeter';
import {
  User,
  Shield,
  Zap,
  Clock,
  Database,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Server
} from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { data: quota, isLoading: loading, refetch } = useGetUsageStatusQuery();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
          Workspace & <span className="gradient-text">Usage Settings</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Manage your account profile, monitor query quotas, and view RAG pipeline configurations.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--accent-primary)" />
          User Profile
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              EMAIL ADDRESS
            </label>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}>
              {user?.email || 'user@example.com'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              PRIMARY WORKSPACE
            </label>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}>
              {user?.workspace?.name || 'Personal Workspace'}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quota Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="#f59e0b" />
            Query Quota & Limits
          </h2>
          <button onClick={refetch} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} />
            <span>Refresh Status</span>
          </button>
        </div>

        <QuotaMeter quota={quota} showDetails={true} />
      </div>

      {/* Quota Policy Details */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="var(--success)" />
          Quota & Safety Policy
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Atomic Enforcement
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Queries are metered using PostgreSQL <code>select_for_update</code> row-level locks, guaranteeing immunity against concurrent double-spend race conditions.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Failure Refund Guarantee
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              If an AI call or vector similarity search encounters a system failure, your daily quota is automatically compensated and restored immediately.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Midnight UTC Reset
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Quotas reset strictly at 00:00:00 UTC daily. Unused queries do not rollover, providing fair shared capacity across all workspace tenants.
            </p>
          </div>
        </div>
      </div>

      {/* RAG Engine Specification */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={18} color="var(--accent-primary)" />
          Engine & Storage Architecture
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>VECTOR INDEX</span>
            <strong>PostgreSQL pgvector (HNSW Cosine Distance)</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>VECTOR DIMENSION</span>
            <strong>1536 dimensions (text-embedding-3-small)</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>CHUNKING STRATEGY</span>
            <strong>RecursiveCharacterTextSplitter (800 / 100 overlap)</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>RELEVANCE THRESHOLD</span>
            <strong>0.65 Cosine Similarity (Hallucination Guard)</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>UPLOAD RESTRICTIONS</span>
            <strong>5 MB max per file, 10 documents per workspace</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>PARSERS SUPPORTED</span>
            <strong>PyMuPDF (PDF), python-docx (DOCX), UTF-8 TXT</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
