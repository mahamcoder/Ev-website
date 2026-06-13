import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from '../router';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'Gold';
  const redirectPath = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', plan: initialPlan,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields.'); setLoading(false); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.'); setLoading(false); return;
    }
    try {
      await signUp(formData.email, formData.password, formData.name, formData.phone, formData.plan);
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate(`/payment?plan=${formData.plan}`);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('This email is already registered.');
      else setError('Failed to create account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-[#1B4332]";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]";

  return (
    <div className="min-h-screen bg-[#F7FBF9] text-[#2D3748] flex flex-col justify-center items-center px-4 relative overflow-hidden font-inter">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D8F3DC] rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B7E4C7] rounded-full blur-[100px] pointer-events-none opacity-40" />

      <Link to="/" className="absolute top-6 left-6 flex items-center space-x-2 text-[#40916C] hover:text-[#1B4332] transition-colors text-sm font-semibold z-10">
        <ArrowLeft className="w-4 h-4" /><span>Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-white rounded-[32px] p-8 md:p-10 relative z-10 border border-[#B7E4C7]"
        style={{ boxShadow: '0 8px 40px rgba(27,67,50,0.10)' }}
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <img src="/stoshi_logo.webp" alt="Stoshi" className="h-12 w-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-[#1B4332] tracking-tight">Create Your Account</h2>
          <p className="text-[#40916C] text-xs mt-1.5 font-medium">Join the green energy revolution today</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <User className={iconClass} />
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Vijay Kumar" className={inputClass} required />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className={iconClass} />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="vijay@example.com" className={inputClass} required />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className={labelClass}>Phone Number</label>
            <div className="relative">
              <Phone className={iconClass} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="+91 9876543210" className={inputClass} required />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className={iconClass} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors"
                required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#40916C] hover:text-[#1B4332] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <label className={labelClass}>Selected Plan</label>
            <select name="plan" value={formData.plan} onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] transition-colors appearance-none cursor-pointer">
              <option value="Silver">Silver Plan (â‚¹7,500)</option>
              <option value="Gold">Gold Plan (â‚¹15,000)</option>
              <option value="Platinum">Platinum Plan (â‚¹30,000)</option>
            </select>
          </div>

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#40916C] text-white font-sora font-bold uppercase tracking-wider hover:bg-[#1B4332] transition-all duration-300 cursor-pointer flex items-center justify-center text-sm disabled:opacity-60"
            style={{ boxShadow: '0 4px 16px rgba(27,67,50,0.18)' }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Proceed to Payment'}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-[#2D3748] text-sm font-medium">
          Already have an account?{' '}
          <Link to={`/signin${redirectPath ? '?redirect=' + encodeURIComponent(redirectPath) : ''}`}
            className="text-[#40916C] hover:text-[#1B4332] hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

