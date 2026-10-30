import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectSelectedDocIds,
  selectActiveConversationId,
  selectActiveCitation,
  setSelectedDocIds,
  setActiveConversationId,
  setActiveCitation,
  clearActiveCitation,
} from '../slices/chatUiSlice';
import {
  useGetConversationQuery,
  useAskQuestionMutation,
} from '../api/chatApi';
import { useGetUsageStatusQuery } from '../../usage/api/usageApi';
import { ChatSidebar } from '../components/ChatSidebar';
import { MessageBubble } from '../components/MessageBubble';
import { CitationDrawer } from '../components/CitationDrawer';
import {
  Send,
  FileCheck,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ChatPage = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Redux Client UI State
  const selectedDocIds = useAppSelector(selectSelectedDocIds);
  const activeConversationId = useAppSelector(selectActiveConversationId);
  const activeCitation = useAppSelector(selectActiveCitation);

  // Redux Server Cache Queries & Mutations
  const { data: activeConv } = useGetConversationQuery(activeConversationId, {
    skip: !activeConversationId,
  });
  const { data: quota } = useGetUsageStatusQuery();
  const [askQuestion, { isLoading: sending }] = useAskQuestionMutation();

  const [question, setQuestion] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Synchronize cross-page route state into Redux store
  useEffect(() => {
    if (location.state?.selectedDocId) {
      dispatch(setSelectedDocIds([location.state.selectedDocId]));
    }
    if (location.state?.conversationId) {
      dispatch(setActiveConversationId(location.state.conversationId));
    }
  }, [location.state, dispatch]);

  const messages = activeConv?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || sending || !activeConversationId) return;

    if (quota && quota.remaining <= 0) {
      setError('You have reached your daily quota limit of 20 questions.');
      return;
    }

    const currentQuestion = question.trim();
    setQuestion('');
    setError(null);

    try {
      await askQuestion({
        conversationId: activeConversationId,
        question: currentQuestion,
        documentIds: selectedDocIds,
      }).unwrap();
    } catch (err) {
      const msg = err?.data?.error?.message || err?.data?.detail || 'Failed to get answer.';
      setError(msg);
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
      {/* Left Column: Modularized Chat Sidebar */}
      <ChatSidebar />

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
                onSelectCitation={(cit) => dispatch(setActiveCitation(cit))}
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

      {/* Citation Modal Drawer managed by Redux */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => dispatch(clearActiveCitation())}
      />
    </div>
  );
};

export default ChatPage;
