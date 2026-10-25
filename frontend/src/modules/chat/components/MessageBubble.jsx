import React from 'react';
import { User, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { SafeMarkdown } from './SafeMarkdown';

export const MessageBubble = ({ message, onSelectCitation }) => {
  const isUser = message.role === 'USER';
  const isFailed = message.status === 'FAILED';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1.75rem',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        maxWidth: isUser ? '80%' : '88%',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isUser ? 'rgba(255, 255, 255, 0.08)' : 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isUser ? 'none' : 'var(--accent-glow)',
          color: '#fff',
        }}>
          {isUser ? <User size={18} /> : <Sparkles size={18} />}
        </div>

        {/* Message Content Bubble */}
        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)'
            : 'var(--bg-card)',
          border: isUser
            ? '1px solid rgba(139, 92, 246, 0.4)'
            : '1px solid var(--border-subtle)',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '1.2rem 1.4rem',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(12px)',
        }}>
          {isFailed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertCircle size={18} />
              <span>{message.content}</span>
            </div>
          ) : isUser ? (
            <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {message.content}
            </p>
          ) : (
            <SafeMarkdown content={message.content} />
          )}

          {/* Source Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                <BookOpen size={13} />
                <span>Verified Source Citations ({message.sources.length})</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {message.sources.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectCitation(src)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                    title="Click to view full passage citation"
                  >
                    <span>{src.document_name}</span>
                    {src.page_number && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        p. {src.page_number}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
