import React from 'react';
import { Navigate } from '../router';
import { useAuth } from '../context/AuthContext';

function Loader({ text }) {
  return (
    <div className="min-h-screen bg-[#042A1d] flex flex-col items-center justify-center text-[#74E61F] font-sora">
      <div className="w-10 h-10 border-3 border-[#74E61F]/20 border-t-[#74E61F] rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold tracking-wider">{text}</p>
    </div>
  );
}

function LightLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#021811]/60 z-50">
      <div className="w-8 h-8 border-3 border-[#74E61F]/30 border-t-[#74E61F] rounded-full animate-spin" />
    </div>
  );
}

/** Requires user to be logged in. If requireActive, also requires Paid status. */
export function ProtectedRoute({ children, requireActive = false }) {
  const { currentUser, userData, loading, userLoading } = useAuth();

  if (loading) return <Loader text="Verifying session…" />;
  if (!currentUser) return <Navigate to="/signin" replace />;

  if (requireActive && userData?.role !== 'admin' && userData?.paymentStatus !== 'Paid') {
    if (userLoading) return <LightLoader />;
    if (!userData?.membershipType) return <Navigate to="/" replace />;
    return <Navigate to="/payment" replace />;
  }

  return children;
}

/** Requires user to be logged in AND have admin role in Firestore. */
export function AdminRoute({ children }) {
  const { currentUser, userData, loading, userLoading } = useAuth();

  if (loading || userLoading) return <Loader text="Verifying admin privileges…" />;
  if (!currentUser) return <Navigate to="/admin" replace />;
  if (!userData || userData.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
