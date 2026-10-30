import React, { useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectSelectedDocIds,
  selectActiveConversationId,
  setSelectedDocIds,
  toggleDocSelection,
  setActiveConversationId,
} from '../slices/chatUiSlice';
import {
  useGetConversationsQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
} from '../api/chatApi';
import { useGetDocumentsQuery } from '../../documents/api/documentsApi';

export const ChatSidebar = () => {
  const dispatch = useAppDispatch();
  const selectedDocIds = useAppSelector(selectSelectedDocIds);
  const activeConversationId = useAppSelector(selectActiveConversationId);

  const { data: documents = [] } = useGetDocumentsQuery();
  const { data: conversations = [] } = useGetConversationsQuery();
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();
  const [deleteConversation] = useDeleteConversationMutation();

  const readyDocs = documents.filter((d) => d.status === 'READY');

  // Auto-select all ready documents if none are explicitly selected yet
  useEffect(() => {
    if (selectedDocIds.length === 0 && readyDocs.length > 0) {
      dispatch(setSelectedDocIds(readyDocs.map((d) => d.id)));
    }
  }, [readyDocs.length, selectedDocIds.length, dispatch]);

  // Auto-select latest conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      dispatch(setActiveConversationId(conversations[0].id));
    }
  }, [activeConversationId, conversations, dispatch]);

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation({ title: 'New Conversation' }).unwrap();
      dispatch(setActiveConversationId(newConv.id));
    } catch {}
  };

  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await deleteConversation(convId).unwrap();
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          dispatch(setActiveConversationId(remaining[0].id));
        } else {
          handleNewChat();
        }
      }
    } catch {}
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '1.25rem',
      height: '100%',
    }}>
      <button
        onClick={handleNewChat}
        disabled={isCreating}
        className="btn-primary"
        style={{ width: '100%', marginBottom: '1.25rem', padding: '0.65rem' }}
      >
        <Plus size={16} />
        <span>{isCreating ? 'Creating...' : 'New Chat'}</span>
      </button>

      <div style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        marginBottom: '0.6rem',
      }}>
        Target Documents ({selectedDocIds.length}/{readyDocs.length})
      </div>

      {/* Target Document Selection Checklist */}
      <div style={{
        maxHeight: '140px',
        overflowY: 'auto',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem',
        marginBottom: '1.25rem',
        border: '1px solid var(--border-subtle)',
      }}>
        {readyDocs.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            No ready documents. Upload documents in the Documents tab.
          </p>
        ) : (
          readyDocs.map((doc) => {
            const name = doc.original_name || doc.original_filename;
            return (
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
                  onChange={() => dispatch(toggleDocSelection(doc.id))}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }} title={name}>
                  {name}
                </span>
              </label>
            );
          })
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
          const isActive = activeConversationId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => dispatch(setActiveConversationId(c.id))}
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
                onClick={(e) => handleDelete(e, c.id)}
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
  );
};

