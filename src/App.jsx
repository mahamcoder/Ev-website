import React, { Suspense, lazy } from 'react';
import { Router, Routes, Route } from './router';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import AdminLogin from './pages/AdminLogin';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const Payment = lazy(() => import('./pages/Payment'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function Lazy({ children }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#021811]" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Admin login portal — standalone, no auth guard */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Public: payment */}
          <Route
            path="/payment"
            element={
              <Lazy><Payment /></Lazy>
            }
          />

          {/* Protected: user dashboard (must be logged in + paid) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireActive={true}>
                <Lazy><UserDashboard /></Lazy>
              </ProtectedRoute>
            }
          />

          {/* Protected: admin dashboard (must be admin role) */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Lazy><AdminDashboard /></Lazy>
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
