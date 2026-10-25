import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth_context';
import { usageApi } from '../../modules/usage/services/usage_api';
import { Sparkles, LogOut, Zap, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    if (user) {
      usageApi.getUsageStatus()
        .then(setQuota)
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      height: '68px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--accent-glow)'
        }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Outfit' }}>
          Document<span className="gradient-text">AI</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {quota && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Zap size={14} color="#f59e0b" />
            <span>Quota: <strong style={{ color: quota.remaining === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{quota.remaining}</strong> / {quota.limit} left</span>
          </div>
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} color="var(--accent-primary)" />
              </div>
              <span>{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
