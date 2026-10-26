import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';

export const AppLayout = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <Navbar />
      <main style={{
        flex: 1,
        padding: '1.5rem 2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Outlet />
      </main>
    </div>
  );
};
