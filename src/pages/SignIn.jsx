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

       
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from '../router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Shield, AlertCircle, Lock, ArrowRight, CheckCircle, CreditCard, WifiOff, RefreshCw, Smartphone, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import useRazorpay from '../hooks/useRazorpay';

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const go = () => setOnline(true);
    const gn = () => setOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', gn);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', gn); };
  }, []);
  return online;
}

export default function Payment() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const online = useOnlineStatus();
  const isRazorpayLoaded = useRazorpay();

  const [activeProject, setActiveProject] = useState(null);

  const urlProjectId = searchParams.get('projectId');
  const planParam = searchParams.get('plan');
  const selectedPlan = planParam || userData?.membershipType || 'Gold';

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let active = null;
        if (urlProjectId) {
          active = list.find(p => p.id === urlProjectId);
        }
        if (!active) {
          active = list.find(p => p.isActive === true) || list[0] || null;
        }
        setActiveProject(active);
      }
    );
    return () => unsub();
  }, [urlProjectId]);

  const projectPricing = {
    Silver: activeProject?.silverPrice || 7500,
    Gold: activeProject?.goldPrice || 15000,
    Platinum: activeProject?.platinumPrice || 30000
  };

  const plansInfo = {
    Silver: { price: projectPricing.Silver, label: 'Silver Membership' },
    Gold: { price: projectPricing.Gold, label: 'Gold Membership' },
    Platinum: { price: projectPricing.Platinum, label: 'Platinum Membership' }
  };

  const currentPlanInfo = plansInfo[selectedPlan] || plansInfo.Gold;
  const price = currentPlanInfo.price;

  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Protect the payment route instantly
  useEffect(() => {
    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
    }
  }, [currentUser, navigate, selectedPlan]);

  // Removed redirect hook to allow guest payments

  // Local storage helpers removed as we use Firestore from backend

  const recordPayment = useCallback(async (paymentId) => {
    const txId = paymentId || ('STS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase());
    const dateString = new Date().toISOString();

    setTransactionDetails({
      id: txId,
      amount: price,
      date: new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    });

    setStatus('success');

    confetti({
      particleCount: 150, spread: 80, origin: { y: 0.6 },
      colors: ['#042A1d', '#105D3D', '#74E61F', '#22C55E']
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  }, [price, navigate]);

  const handleRazorpayPayment = async () => {
    setErrorMessage('');

    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
      return;
    }

    if (!isRazorpayLoaded) {
      setErrorMessage('Razorpay SDK failed to load. Please check your internet connection.');
      setStatus('card'); // Fallback to simulated flow if offline
      return;
    }

    setStatus('processing');

    try {
      // 1. Fetch order_id from our backend
      const orderRes = await fetch('http://localhost:5000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price * 100, currency: 'INR' })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      // 2. Initialize Razorpay checkout with the real order_id
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Stoshi Green Energy',
        description: currentPlanInfo.label,
        image: '/stoshi_logo.webp',
        order_id: orderData.id, // The real order ID from backend
        handler: async function (response) {
          // 3. Verify signature on the backend
          try {
            const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser ? currentUser.uid : `guest_${Date.now()}`,
                plan: selectedPlan,
                amount: price,
                projectId: activeProject?.id
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              console.log('✅ Frontend: Transaction Successful!', response);
              recordPayment(response.razorpay_payment_id);
            } else {
              console.error('❌ Frontend: Transaction verification failed!', verifyData);
              setErrorMessage('Payment verification failed: ' + verifyData.message);
              setStatus('idle');
            }
          } catch (verifyErr) {
            console.error('❌ Frontend: Error verifying payment:', verifyErr);
            setErrorMessage('Error verifying payment: ' + verifyErr.message);
            setStatus('idle');
          }
        },
        prefill: {
          name: userData?.name || 'User',
          email: currentUser?.email || 'user@example.com',
          contact: userData?.phone || '9999999999'
        },
        theme: {
          color: '#74E61F'
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('❌ Frontend: Payment failed at Razorpay checkout:', response.error);
        setErrorMessage('Payment failed: ' + response.error.description);
        setStatus('idle');
      });

      rzp.open();
    } catch (error) {
      console.error('❌ Frontend: Could not initialize payment:', error);
      setErrorMessage('Could not initialize payment: ' + error.message);
      setStatus('idle');
    }
  };

  const handleCardSubmit = async () => {
    setErrorMessage('');

    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
      return;
    }

    setStatus('processing');

    try {
      const { doc: fd, setDoc: sd, collection: cl, addDoc: ad, serverTimestamp: st, increment: inc } = await import('firebase/firestore');

      const mockPaymentId = 'pay_simulated_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

      // Find and update active project
      let activeProjId = activeProject?.id;
      
      if (!activeProjId) {
        const q = await import('firebase/firestore').then(m => m.getDocs(m.query(cl(db, 'projects'), m.where('isActive', '==', true))));
        if (!q.empty) {
          activeProjId = q.docs[0].id;
        } else {
          const allQ = await import('firebase/firestore').then(m => m.getDocs(cl(db, 'projects')));
          if (!allQ.empty) activeProjId = allQ.docs[0].id;
        }
      }

      if (activeProjId) {
        await sd(fd(db, 'projects', activeProjId), {
          collectedAmount: inc(price),
          totalMembers: inc(1)
        }, { merge: true });
      }

      // Record payment in Firestore
      await ad(cl(db, 'payments'), {
        userId: currentUser.uid,
        userName: userData?.name || 'User',
        userEmail: currentUser.email,
        plan: selectedPlan,
        amount: price,
        transactionId: mockPaymentId,
        status: 'Success',
        projectId: activeProjId,
        createdAt: st()
      });

      // Update user membership status
      await sd(fd(db, 'users', currentUser.uid), {
        membershipStatus: 'Active',
        paymentStatus: 'Paid',
        membershipType: selectedPlan,
        projectId: activeProjId
      }, { merge: true });

      await recordPayment(mockPaymentId);
    } catch (err) {
      setErrorMessage('Payment confirmed but failed to update records: ' + err.message);
      setStatus('card');
    }
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#042A1d] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-inter">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#74E61F]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#105D3D]/30 rounded-full blur-[120px] pointer-events-none"></div>

      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold"
        >
          <WifiOff className="w-4 h-4" />
          No internet connection
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md glassmorphism-dark rounded-[32px] p-8 text-center border border-white/10 relative z-10 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-20 h-20 text-[#74E61F]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-semibold mb-6">
              Welcome to Stoshi Green Energy
            </p>

            <div className="bg-[#0B3022] rounded-2xl p-5 mb-8 text-left border border-white/5 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-slate-200 font-mono">{transactionDetails?.id}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Plan Activated:</span>
                <span className="text-[#74E61F]">{selectedPlan} Plan</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-slate-200">{formatRupee(transactionDetails?.amount)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Payment Date:</span>
                <span className="text-slate-200">{transactionDetails?.date}</span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#74E61F] font-bold tracking-wider uppercase animate-pulse">
                Unlocking your Dashboard...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 my-8 px-2"
          >
            <div className="lg:col-span-5 glassmorphism-dark rounded-[32px] p-8 border border-white/10 flex flex-col justify-between shadow-2xl">
              <div>
                <img src="/stoshi_logo.webp" alt="Stoshi" className="h-10 w-auto mb-8" />
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#74E61F]/20 text-[#74E61F] uppercase tracking-wider block w-fit mb-3">
                  Checkout Summary
                </span>
                <h3 className="text-2xl font-extrabold font-sora mb-4 tracking-tight">
                  {currentPlanInfo.label}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
                  Support sustainable EV infrastructure. Your pledge helps construct the Sonbhadra EV-1 charging node.
                </p>

                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div className="flex items-center space-x-3 text-xs font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
                    <span className="text-slate-300">Automatic active membership activation</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
                    <span className="text-slate-300">Access to Green Energy Dashboard widgets</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
                    <span className="text-slate-300">Live progress tracking & community voting</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 mt-8 flex justify-between items-end">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total to Pay</span>
                  <div className="text-3xl font-extrabold font-sora text-[#74E61F] mt-1">
                    {formatRupee(price)}
                  </div>
                </div>
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-[#042A1d] px-3 py-1.5 rounded-xl border border-white/5 space-x-1.5 shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secure 256-bit SSL</span>
                </div>
              </div>
            </div>

            {status === 'card' ? (
              <CardForm
                price={price}
                plan={selectedPlan}
                formatRupee={formatRupee}
                onSubmit={handleCardSubmit}
                onBack={() => { setStatus('idle'); setErrorMessage(''); }}
                errorMessage={errorMessage}
                userName={userData?.name || ''}
              />
            ) : (
              <div className="lg:col-span-7 glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 flex items-center justify-center border border-[#74E61F]/20">
                      <Lock className="w-5 h-5 text-[#74E61F]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-sora text-white">
                        Secure Checkout
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Secured Checkout Portal
                      </p>
                    </div>
                  </div>

                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start space-x-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">{errorMessage}</div>
                    </motion.div>
                  )}

                  {loadingMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#74E61F]/5 border border-[#74E61F]/10 text-[#74E61F] text-xs font-semibold flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin" />
                      <span>{loadingMessage}</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="p-5 bg-[#0B3022]/40 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Plan</span>
                        <span className="text-white font-bold">{selectedPlan}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Amount</span>
                        <span className="text-[#74E61F] font-bold font-sora text-base">
                          {formatRupee(price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Secured with 256-bit SSL encryption</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <motion.button
                    whileHover={online ? { scale: 1.01 } : {}}
                    whileTap={online ? { scale: 0.99 } : {}}
                    onClick={handleRazorpayPayment}
                    disabled={status === 'processing' || !online}
                    className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center space-x-2 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'processing' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#042A1d] border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : !online ? (
                      <>
                        <WifiOff className="w-4 h-4" />
                        <span>No Internet Connection</span>
                      </>
                    ) : (
                      <>
                        <span>Pay {formatRupee(price)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>                </div>

                <div className="mt-6 text-center text-slate-500 text-[10px] font-medium">
                  By proceeding, you agree to our terms. Your payment is processed securely.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardForm({ price, plan, formatRupee, onSubmit, onBack, errorMessage, userName }) {
  const [payTabs, setPayTabs] = useState('card');

  const tabs = [
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'netbanking', label: 'Net Banking', icon: Building2 },
  ];

  return (
    <div className="lg:col-span-7 glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 flex items-center justify-center border border-[#74E61F]/20">
            <CreditCard className="w-5 h-5 text-[#74E61F]" />
          </div>
          <div>
            <h4 className="text-base font-bold font-sora text-white">Enter Payment Details</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Demo Mode — Test transaction</p>
          </div>
        </div>

        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </motion.div>
        )}

        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = payTabs === t.id;
            return (
              <button key={t.id} onClick={() => setPayTabs(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${active ? 'bg-[#74E61F] text-[#042A1d]' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-3 mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[10px] font-bold text-center">
          TEST MODE — Use card 4111 1111 1111 1111
        </div>

        {payTabs === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Card Number</label>
              <input type="text" defaultValue="4111 1111 1111 1111"
                className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Valid Thru</label>
                <input type="text" defaultValue="12/28"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">CVV</label>
                <input type="password" defaultValue="123"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Cardholder Name</label>
              <input type="text" defaultValue={userName || 'John Doe'}
                className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
              />
            </div>
          </div>
        )}

        {payTabs === 'upi' && (
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">UPI ID</label>
            <input type="text" defaultValue="user@paytm"
              className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
            />
          </div>
        )}

        {payTabs === 'netbanking' && (
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Select Bank</label>
            <select defaultValue="sbi"
              className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
            >
              <option value="sbi">State Bank of India</option>
              <option value="hdfc">HDFC Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="axis">Axis Bank</option>
              <option value="kotak">Kotak Mahindra</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 mt-5 text-[10px] text-slate-500 font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSubmit}
          className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm"
        >
          <Lock className="w-4 h-4" />
          Pay {formatRupee(price)}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onBack}
          className="w-full py-3 rounded-2xl border border-white/20 text-white/80 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all duration-300 cursor-pointer"
        >
          Back to Summary
        </motion.button>
      </div>

      <div className="mt-4 text-center text-slate-500 text-[10px] font-medium">
        By proceeding, you agree to our terms.
      </div>
    </div>
  );
}
