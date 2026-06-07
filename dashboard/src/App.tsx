import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layout & Pages
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ServerSelector from './pages/ServerSelector';
import PlayerPage from './pages/PlayerPage';
import QueuePage from './pages/QueuePage';
import SpotifyPage from './pages/SpotifyPage';
import StatsPage from './pages/StatsPage';
import LogsPage from './pages/LogsPage';
import AdminPage from './pages/AdminPage';

// ─── PROTECTED ROUTE FILTER ──────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const sessionTokenCookie = document.cookie.includes('token=');

  // If there is no token in localStorage or cookie, redirect to /login
  if (!token && !sessionTokenCookie) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141517',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#1DB954',
              secondary: '#141517',
            },
          },
          error: {
            iconTheme: {
              primary: '#ED4245',
              secondary: '#141517',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Private Server Selector */}
        <Route
          path="/servers"
          element={
            <ProtectedRoute>
              <ServerSelector />
            </ProtectedRoute>
          }
        />

        {/* Guild Dashboard Context Sub-Routes */}
        <Route
          path="/dashboard/:guildId"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="player" replace />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/:guildId/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="player" element={<PlayerPage />} />
                  <Route path="queue" element={<QueuePage />} />
                  <Route path="spotify" element={<SpotifyPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="logs" element={<LogsPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="player" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirections */}
        <Route path="*" element={<Navigate to="/servers" replace />} />
      </Routes>
    </Router>
  );
}
