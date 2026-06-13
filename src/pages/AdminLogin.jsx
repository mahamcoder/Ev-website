import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from '../router';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { currentUser, userData, signIn, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as the authorized admin, go straight to dashboard
  useEffect(() => {
    if (!loading && userData && userData.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [loading, userData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    if (!email || !password) {
      setError('Please enter both email and password.');
      setSubmitting(false);
      return;
    }
    try {
      await signIn(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Incorrect email or password.');
      } else {
        setError('Sign in failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FBF9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#B7E4C7] border-t-[#40916C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#2D3748] flex flex-col items-center justify-center px-4 relative overflow-hidden font-inter">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D8F3DC] rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B7E4C7] rounded-full blur-[100px] pointer-events-none opacity-40" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(64,145,108,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,145,108,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D8F3DC] border border-[#B7E4C7] mb-5">
            <Shield className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h1 className="text-2xl font-extrabold font-sora text-[#1B4332] tracking-tight">
            Admin Portal
          </h1>
          <p className="text-[#40916C] text-xs font-semibold mt-2 tracking-wide">
            STOSHI GREEN ENERGY â€” RESTRICTED ACCESS
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#B7E4C7] rounded-[28px] p-8" style={{ boxShadow: '0 8px 40px rgba(27,67,50,0.10)' }}>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start space-x-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#1B4332]">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stoshi.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#1B4332]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#40916C] hover:text-[#1B4332] transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-4 rounded-2xl bg-[#40916C] text-white font-sora font-extrabold uppercase tracking-wider hover:bg-[#1B4332] transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 16px rgba(27,67,50,0.18)' }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[10px] text-[#40916C] font-semibold">
            This portal is restricted to authorized administrators only.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </div>

        {/* Back link */}
        <p className="text-center mt-6 text-xs text-[#2D3748] font-semibold">
          Not an admin?{' '}
          <a
            href="/"
            className="text-[#40916C] hover:text-[#1B4332] hover:underline font-bold"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            Return to Homepage
          </a>
        </p>
      </motion.div>
    </div>
  );
}

