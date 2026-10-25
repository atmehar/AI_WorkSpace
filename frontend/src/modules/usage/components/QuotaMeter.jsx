import React from 'react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';

export const QuotaMeter = ({ quota, showDetails = true }) => {
  if (!quota) return null;

  const percentage = Math.min(100, Math.round((quota.used / quota.limit) * 100));
  const isExhausted = quota.remaining <= 0;
  const isWarning = quota.remaining <= 5 && !isExhausted;

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isExhausted ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={20} color={isExhausted ? '#ef4444' : isWarning ? '#f59e0b' : '#8b5cf6'} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Daily AI Query Quota</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Atomic quota resets every midnight UTC
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isExhausted ? 'var(--danger)' : 'var(--text-primary)' }}>
            {quota.remaining} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {quota.limit} left</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        overflow: 'hidden',
        marginBottom: '0.85rem',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          borderRadius: '9999px',
          background: isExhausted ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--accent-gradient)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {showDetails && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>USED TODAY</span>
            <strong>{quota.used} queries</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>DAILY LIMIT</span>
            <strong>{quota.limit} queries</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>RESET TIME</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} color="var(--text-muted)" />
              <strong>{quota.reset_time || 'Midnight UTC'}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
