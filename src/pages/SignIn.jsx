import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from '../router';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminFlow = searchParams.get('from') === 'admin';
  const redirectPath = searchParams.get('redirect');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }
    try {
      const userCredential = await signIn(formData.email, formData.password);
      const user = userCredential.user;
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        const isAdminEmail = formData.email.toLowerCase().startsWith('admin@');
        navigate(isAdminEmail ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else {
        setError('Failed to sign in: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (role) => {
    if (role === 'admin') {
      setFormData({ email: 'admin@stoshi.com', password: 'adminpassword' });
    } else {
      setFormData({ email: 'user@stoshi.com', password: 'userpassword' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#2D3748] flex flex-col justify-center items-center px-4 relative overflow-hidden font-inter">
      {/* Subtle background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D8F3DC] rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B7E4C7] rounded-full blur-[100px] pointer-events-none opacity-40" />

      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-[#40916C] hover:text-[#1B4332] transition-colors text-sm font-semibold z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 relative z-10 border border-[#B7E4C7]"
        style={{ boxShadow: '0 8px 40px rgba(27,67,50,0.10)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <img src="/stoshi_logo.webp" alt="Stoshi Logo" className="h-12 w-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-[#1B4332] tracking-tight">
            Welcome Back
          </h2>
          <p className="text-[#40916C] text-xs md:text-sm mt-1.5 font-medium">
            Sign in to access your Green Energy Dashboard
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vijay.kumar@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#40916C] hover:text-[#1B4332] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#40916C] text-white font-sora font-bold uppercase tracking-wider hover:bg-[#1B4332] transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 text-xs md:text-sm disabled:opacity-60"
            style={{ boxShadow: '0 4px 16px rgba(27,67,50,0.18)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-[#2D3748] text-xs md:text-sm font-medium">
          Don't have an account yet?{' '}
          <Link to={`/signup${redirectPath ? '?redirect=' + encodeURIComponent(redirectPath) : ''}`} className="text-[#40916C] hover:text-[#1B4332] hover:underline font-bold">
            Sign Up
          </Link>
        </div>

        {/* Quick Test Accounts Banner */}
        <div className="mt-8 pt-6 border-t border-[#B7E4C7] text-center">
          <p className="text-[10px] font-bold text-[#40916C] uppercase tracking-widest mb-3">
            Testing Shortcuts
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => fillTestCredentials('user')}
              className="px-3 py-1.5 rounded-xl border border-[#B7E4C7] hover:border-[#40916C] hover:bg-[#D8F3DC] text-[11px] font-bold transition-all bg-[#F7FBF9] cursor-pointer text-[#1B4332]"
            >
              Test User
            </button>
            {isAdminFlow && (
              <button
                onClick={() => fillTestCredentials('admin')}
                className="px-3 py-1.5 rounded-xl border border-[#40916C] bg-[#D8F3DC] hover:bg-[#B7E4C7] text-[11px] font-bold transition-all cursor-pointer text-[#1B4332]"
              >
                Test Admin
              </button>
            )}
          </div>
          {isAdminFlow && (
            <p className="text-[9px] text-[#40916C] mt-2">
              Tip: Registering an email like <span className="font-semibold text-[#1B4332]">admin@stoshi.com</span> automatically grants admin status.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

