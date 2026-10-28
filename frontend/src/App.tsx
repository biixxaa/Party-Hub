import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Feed } from './pages/Feed';
import { VerificationPage } from './pages/VerificationPage';
import { AgentDashboard } from './pages/AgentDashboard';
import { AgentsList } from './pages/AgentsList';
import { AgentProfile } from './pages/AgentProfile';
import { CreatorDashboard } from './pages/CreatorDashboard';
import { ManagePosts } from './pages/ManagePosts';
import { MessagingPage } from './pages/MessagingPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { ContactAdminPage } from './pages/ContactAdminPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0c10] text-gray-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verification"
                element={
                  <ProtectedRoute>
                    <VerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contact-admin"
                element={
                  <ProtectedRoute>
                    <ContactAdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Agent Specific Routes */}
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['AGENT']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                    <AgentsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/:id"
                element={
                  <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                    <AgentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute allowedRoles={['AGENT']}>
                    <MessagingPage />
                  </ProtectedRoute>
                }
              />

              {/* Platform Creator Specific Routes */}
              <Route
                path="/creator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_CREATOR']}>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator/posts"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_CREATOR', 'ADMIN']}>
                    <ManagePosts />
                  </ProtectedRoute>
                }
              />

              {/* Admin Specific Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
