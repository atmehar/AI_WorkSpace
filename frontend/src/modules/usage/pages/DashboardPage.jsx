import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/auth_context';
import { useAppDispatch } from '../../../store/hooks';
import { setSelectedDocIds } from '../../chat/slices/chatUiSlice';
import { useGetDocumentsQuery } from '../../documents/api/documentsApi';
import { useGetConversationsQuery, useCreateConversationMutation } from '../../chat/api/chatApi';
import { useGetUsageStatusQuery } from '../api/usageApi';
import { QuotaMeter } from '../components/QuotaMeter';
import {
  FileText,
  MessageSquare,
  Upload,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: documents = [], isLoading: docsLoading } = useGetDocumentsQuery();
  const { data: conversations = [], isLoading: convsLoading } = useGetConversationsQuery();
  const { data: quota, isLoading: quotaLoading } = useGetUsageStatusQuery();
  const [createConversation] = useCreateConversationMutation();

  const loading = docsLoading || convsLoading || quotaLoading;

  const readyDocs = documents.filter((d) => d.status === 'READY');
  const processingDocs = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED');

  const handleStartChat = async () => {
    try {
      const newConv = await createConversation({ title: 'New Analysis' }).unwrap();
      navigate('/chat', { state: { conversationId: newConv.id } });
    } catch {
      navigate('/chat');
    }
  };

  const handleAskDoc = (docId) => {
    dispatch(setSelectedDocIds([docId]));
    navigate('/chat');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#c4b5fd',
            marginBottom: '1rem',
          }}>
            <Sparkles size={14} />
            <span>RAG Document Intelligence v1.0</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' }}>
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0] || 'Researcher'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            Your private, tenant-isolated AI workspace. Ingest PDFs, DOCX, and text notes,
            retrieve semantically with pgvector HNSW, and get verified answers with chunk citations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/documents" className="btn-primary" style={{ padding: '0.75rem 1.4rem' }}>
              <Upload size={18} />
              <span>Upload Documents</span>
            </Link>
            <button onClick={handleStartChat} className="btn-secondary" style={{ padding: '0.75rem 1.4rem' }}>
              <MessageSquare size={18} />
              <span>Launch AI Workspace</span>
            </button>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Top Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Metric 1 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DOCUMENTS READY</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={18} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {readyDocs.length}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
              / {documents.length} total
            </span>
          </div>
          {processingDocs.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Loader2 size={12} className="spin" />
              <span>{processingDocs.length} processing now</span>
            </div>
          )}
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE SESSIONS</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageSquare size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {conversations.length}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
              conversations
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Persistent history with citation trail
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUERY QUOTA</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Cpu size={18} color="var(--accent-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {quota ? quota.remaining : '20'}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
              queries remaining
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Atomic select_for_update row locks
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>GUARDRAIL STATUS</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
            Zero-Hallucination
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Refuses when similarity &lt; 0.65 threshold
          </div>
        </div>
      </div>

      {/* Main Grid: Quota Meter & Recent Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Recent Documents */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Document Repository</h2>
            </div>
            <Link to="/documents" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={28} className="spin" color="var(--accent-primary)" />
            </div>
          ) : documents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ margin: '0 0 1rem' }}>No documents uploaded yet.</p>
              <Link to="/documents" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Upload Your First Document
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileText size={16} color="var(--accent-primary)" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '280px',
                      }}>
                        {doc.original_filename}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.chunk_count} chunks • {doc.file_type}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${doc.status === 'READY' ? 'badge-ready' : doc.status === 'PROCESSING' ? 'badge-processing' : 'badge-failed'}`}>
                      {doc.status}
                    </span>
                    {doc.status === 'READY' && (
                      <button
                        onClick={() => handleAskDoc(doc.id)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Ask AI
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quota & Engine Spec */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <QuotaMeter quota={quota} showDetails={true} />

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-primary)" />
              Grounding & Security
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.2rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              lineHeight: 1.8,
            }}>
              <li><strong>pgvector HNSW:</strong> Fast cosine distance indexing.</li>
              <li><strong>Zero Cross-Tenant Leakage:</strong> Workspaces enforce tenant boundary on every query.</li>
              <li><strong>Anti-Injection Guard:</strong> Document text is sandboxed as untrusted user content.</li>
              <li><strong>Refusal Policy:</strong> Refuses politely if no matching chunk surpasses threshold.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
