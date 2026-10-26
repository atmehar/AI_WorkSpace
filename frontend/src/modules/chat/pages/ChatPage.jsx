import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi } from '../services/chat_api';
import { documentApi } from '../../documents/services/document_api';
import { usageApi } from '../../usage/services/usage_api';
import { MessageBubble } from '../components/MessageBubble';
import { CitationDrawer } from '../components/CitationDrawer';
import {
  Send,
  Plus,
  MessageSquare,
  FileCheck,
  Zap,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const ChatPage = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [quota, setQuota] = useState(null);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load initial data
  useEffect(() => {
    loadConversations();
    loadDocuments();
    refreshQuota();
  }, []);

  const refreshQuota = () => {
    usageApi.getUsageStatus().then(setQuota).catch(() => {});
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentApi.getDocuments();
      const readyDocs = docs.filter((d) => d.status === 'READY');
      setDocuments(readyDocs);

      // If document was passed via route state, select it
      if (location.state?.selectedDocId) {
        setSelectedDocIds([location.state.selectedDocId]);
      } else if (readyDocs.length > 0) {
        setSelectedDocIds(readyDocs.map((d) => d.id));
      }
    } catch (e) {}
  };

  const loadConversations = async () => {
    try {
      const convs = await chatApi.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        selectConversation(convs[0].id);
      } else {
        handleNewChat();
      }
    } catch (e) {}
  };

  const selectConversation = async (id) => {
    try {
      const conv = await chatApi.getConversation(id);
      setActiveConv(conv);
      setMessages(conv.messages || []);
      setError(null);
    } catch (e) {}
  };

  const handleNewChat = async () => {
    try {
      const newConv = await chatApi.createConversation('New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConv(newConv);
      setMessages([]);
      setError(null);
    } catch (e) {}
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConv?.id === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (e) {}
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || sending) return;
    if (!activeConv) return;

    if (quota && quota.remaining <= 0) {
      setError('You have reached your daily quota limit of 20 questions.');
      return;
    }

    const currentQuestion = question.trim();
    setQuestion('');
    setError(null);

    // Optimistically show user message
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      role: 'USER',
      content: currentQuestion,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await chatApi.askQuestion(activeConv.id, currentQuestion, selectedDocIds);

      // Append assistant message
      const assistantMsg = {
        id: res.request_id,
        role: 'ASSISTANT',
        content: res.answer,
        sources: res.sources,
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.usage) setQuota(res.usage);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to get answer.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'ASSISTANT',
          content: msg,
          status: 'FAILED',
          created_at: new Date().toISOString(),
        },
      ]);
      refreshQuota();
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '1.5rem',
      height: 'calc(100vh - 116px)',
      position: 'relative',
    }}>
      {/* Left Column: Conversations & Document Filter */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '1.25rem',
      }}>
        <button
          onClick={handleNewChat}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '1.25rem', padding: '0.65rem' }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: '0.6rem',
        }}>
          Target Documents ({selectedDocIds.length}/{documents.length})
        </div>

        {/* Document Checklist */}
        <div style={{
          maxHeight: '140px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)',
        }}>
          {documents.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No ready documents. Upload documents in the Documents tab.
            </p>
          ) : (
            documents.map((doc) => (
              <label
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem 0.35rem',
                  borderRadius: '4px',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDocIds.includes(doc.id)}
                  onChange={() => toggleDocSelection(doc.id)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }} title={doc.original_name}>
                  {doc.original_name}
                </span>
              </label>
            ))
          )}
        </div>

        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: '0.6rem',
        }}>
          Chat History
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {conversations.map((c) => {
            const isActive = activeConv?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <MessageSquare size={15} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteConversation(e, c.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Chat Stream & Message Input */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 21, 35, 0.4)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.15rem' }}>
              {activeConv ? activeConv.title : 'AI Document Workspace'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Retrieving context from {selectedDocIds.length} selected document(s)
            </span>
          </div>

          {quota && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: quota.remaining === 0 ? 'var(--danger)' : 'var(--text-secondary)',
            }}>
              <Zap size={14} color={quota.remaining === 0 ? '#ef4444' : '#f59e0b'} />
              <span>{quota.remaining} questions remaining today</span>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.length === 0 ? (
            <div style={{
              margin: 'auto',
              textAlign: 'center',
              maxWidth: '440px',
              padding: '2rem',
              color: 'var(--text-muted)',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: '1rem',
              }}>
                <FileCheck size={28} />
              </div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Ask Questions Grounded in Your Documents
              </h4>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                Submit any question in natural language. The system retrieves exact passages from your documents and returns verified answers with citations.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSelectCitation={(cit) => setActiveCitation(cit)}
              />
            ))
          )}

          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', padding: '0.5rem 0' }}>
              <Loader2 size={18} className="spin" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Retrieving semantic evidence & generating answer...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Footer */}
        <form onSubmit={handleSend} style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 21, 35, 0.5)',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'center',
        }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents... (e.g., What is the refund policy?)"
            className="form-input"
            disabled={sending || (quota && quota.remaining <= 0)}
            style={{ flex: 1, padding: '0.85rem 1.2rem' }}
          />
          <button
            type="submit"
            disabled={!question.trim() || sending || (quota && quota.remaining <= 0)}
            className="btn-primary"
            style={{ padding: '0.85rem 1.4rem' }}
          >
            <Send size={16} />
            <span>Ask</span>
          </button>
        </form>
      </div>

      {/* Citation Modal Drawer */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};
