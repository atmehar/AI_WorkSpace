import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth_context';
import { AppLayout } from './components/layout/app_layout';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { DashboardPage } from './modules/usage/pages/DashboardPage';
import { DocumentsPage } from './modules/documents/pages/DocumentsPage';
import { ChatPage } from './modules/chat/pages/ChatPage';
import { SettingsPage } from './modules/usage/pages/SettingsPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: '1rem',
      }}>
        <Loader2 size={36} className="spin" color="var(--accent-primary)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <Loader2 size={36} className="spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
