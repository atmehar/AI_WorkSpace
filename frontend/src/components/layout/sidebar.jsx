import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, Settings } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/chat', label: 'AI Workspace', icon: MessageSquare },
    { to: '/settings', label: 'Usage & Quota', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      borderRight: '1px solid var(--border-subtle)',
      background: 'rgba(15, 21, 35, 0.6)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.4rem',
      height: 'calc(100vh - 68px)',
      position: 'sticky',
      top: '68px',
    }}>
      <div style={{
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        fontWeight: 700,
        marginBottom: '0.6rem',
        paddingLeft: '0.75rem',
      }}>
        Navigation
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.92rem',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              transition: 'var(--transition)',
            })}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
