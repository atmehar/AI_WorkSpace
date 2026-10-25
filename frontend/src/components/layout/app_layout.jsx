import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

export const AppLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{
          flex: 1,
          padding: '2rem 2.5rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
