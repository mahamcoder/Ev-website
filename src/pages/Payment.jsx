import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from '../router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Shield, AlertCircle, Lock, ArrowRight, CheckCircle, CreditCard, WifiOff, Copy, Check, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import useRazorpay from '../hooks/useRazorpay';
import { BANK_DETAILS, CRYPTO_WALLETS } from '../config/paymentConfig';
import PolicyModal from '../components/PolicyModal';

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
  const [allActiveProjects, setAllActiveProjects] = useState([]);
  // 'loading' | 'project_select' | 'plan_select' | 'checkout'
  const [setupStep, setSetupStep] = useState('loading');

  // Router state (from Home pricing card click) takes priority over URL params
  const routerLocation = useLocation();
  const routerState = routerLocation.state || null; // { planName, planPrice, projectId }

  const urlProjectId = searchParams.get('projectId');
  const planParam = searchParams.get('plan');

  // Merged: router state wins, URL params are the fallback
  const incomingProjectId = routerState?.projectId || urlProjectId || null;
  const incomingPlan = routerState?.planName || planParam || null;

  const [selectedPlan, setSelectedPlan] = useState(incomingPlan || 'Gold');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activePolicyPage, setActivePolicyPage] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const actives = list.filter(p => p.isActive === true || p.status === 'active');
        setAllActiveProjects(actives);

        if (incomingProjectId && incomingPlan) {
          const proj = list.find(p => p.id === incomingProjectId) || actives[0] || list[0] || null;
          setActiveProject(proj);
          setSelectedPlan(incomingPlan);
          setSetupStep('checkout');
        } else if (actives.length === 0) {
          const proj = list[0] || null;
          setActiveProject(proj);
          setSetupStep('plan_select');
        } else if (actives.length === 1) {
          setActiveProject(actives[0]);
          setSetupStep('plan_select');
        } else {
          if (incomingProjectId) {
            const proj = actives.find(p => p.id === incomingProjectId) || actives[0];
            setActiveProject(proj);
            setSetupStep('plan_select');
          } else {
            setSetupStep('project_select');
          }
        }
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingProjectId, incomingPlan]);

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

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'StoshiEnergy');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/do2fuiszt/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setPaymentProofUrl(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage('');

    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
      return;
    }

    if (!paymentProofUrl) {
      setErrorMessage('Please upload a screenshot of your payment proof before placing the order.');
      return;
    }

    setStatus('processing');

    try {
      const { doc: fd, setDoc: sd, collection: cl, addDoc: ad, serverTimestamp: st } = await import('firebase/firestore');

      const manualId = (paymentMethod === 'bank_transfer' ? 'BANK_' : 'CRYPTO_') + Date.now();
      let activeProjId = activeProject?.id || '';

      await ad(cl(db, 'payments'), {
        userId: currentUser.uid,
        userName: userData?.name || 'User',
        userEmail: currentUser.email,
        plan: selectedPlan,
        amount: price,
        transactionId: manualId,
        status: 'pending_verification',
        paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Crypto',
        paymentProofUrl: paymentProofUrl,
        projectId: activeProjId,
        createdAt: st()
      });

      await sd(fd(db, 'users', currentUser.uid), {
        paymentStatus: 'Pending Verification',
        membershipType: selectedPlan,
        projectId: activeProjId
      }, { merge: true });

      setTransactionDetails({
        id: manualId,
        amount: price,
        date: new Date().toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      });

      setStatus('pending_success');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to place order: ' + err.message);
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
    }
  }, [currentUser, navigate, selectedPlan]);

  const recordPayment = useCallback((paymentId) => {
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
  }, [price]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (status === 'pending_success') {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleRazorpayPayment = async () => {
    setErrorMessage('');

    if (!currentUser) {
      navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
      return;
    }

    if (!isRazorpayLoaded) {
      setErrorMessage(
        'Razorpay payment gateway failed to load. Please check your internet connection, disable any ad-blockers or script blockers, and refresh the page. Alternatively, use Bank Transfer manual payment below.'
      );
      setStatus('idle');
      return;
    }

    setStatus('processing');

    try {
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price * 100, currency: 'INR' })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Stoshi Green Energy',
        description: currentPlanInfo.label,
        image: '/stoshi_logo.webp',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-payment`, {
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
              console.log('✅ Frontend: Transaction Successful & Verified!', response);
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
        ) : status === 'pending_success' ? (
          <motion.div
            key="pending_success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md glassmorphism-dark rounded-[32px] p-8 text-center border border-white/10 relative z-10 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <Clock className="w-20 h-20 text-[#74E61F]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white mb-2">
              Payment Submitted!
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-semibold mb-6">
              Your payment proof has been submitted for admin verification.
            </p>

            <div className="bg-[#0B3022] rounded-2xl p-5 mb-8 text-left border border-white/5 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Reference ID:</span>
                <span className="text-slate-200 font-mono">{transactionDetails?.id}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="text-[#74E61F]">{selectedPlan} Plan</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Amount:</span>
                <span className="text-slate-200">{formatRupee(transactionDetails?.amount)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Status:</span>
                <span className="text-yellow-400">Pending Verification</span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#74E61F] font-bold tracking-wider uppercase animate-pulse">
                Redirecting to your Dashboard...
              </p>
            </div>
          </motion.div>
        ) : setupStep === 'project_select' ? (
          <motion.div
            key="project_select"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 relative z-10 my-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <img src="/stoshi_logo.webp" alt="Stoshi" className="h-10 w-auto mx-auto mb-4" />
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#74E61F]/20 text-[#74E61F] uppercase tracking-wider">
                Step 1 of 2
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white mt-2">
                Select Your Project Node
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Choose which green energy charging station node you want to contribute to.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {allActiveProjects.map(proj => {
                const isSelected = activeProject?.id === proj.id;
                const pct = proj.totalCapacity > 0 ? Math.min(100, Math.round((proj.collectedAmount / proj.totalCapacity) * 100)) : 0;
                return (
                  <div
                    key={proj.id}
                    onClick={() => setActiveProject(proj)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#74E61F]/10 border-[#74E61F] shadow-lg shadow-[#74E61F]/10'
                        : 'bg-[#0B3022]/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#74E61F] uppercase tracking-wider block">
                          {proj.location || 'Node'}
                        </span>
                        <h4 className="text-base font-bold font-sora text-white mt-0.5">{proj.name}</h4>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#74E61F] bg-[#74E61F]' : 'border-slate-500'}`}>
                        {isSelected && <Check className="w-3 h-3 text-[#042A1d]" />}
                      </div>
                    </div>
                    <div className="space-y-1.5 mt-4">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                        <span>Funding Progress</span>
                        <span className="text-[#74E61F] font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
                        <div className="bg-[#74E61F] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (activeProject) setSetupStep('plan_select');
              }}
              disabled={!activeProject}
              className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue to Select Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

        ) : setupStep === 'plan_select' ? (
          <motion.div
            key="plan_select"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 relative z-10 my-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                {allActiveProjects.length > 1 && (
                  <button
                    onClick={() => setSetupStep('project_select')}
                    className="text-xs text-slate-400 hover:text-[#74E61F] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    &larr; Change Project
                  </button>
                )}
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#74E61F]/20 text-[#74E61F] uppercase tracking-wider">
                  Step 2 of 2
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white">
                Choose Your Membership Tier
              </h2>
              {activeProject && (
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Contributing to: <span className="text-[#74E61F]">{activeProject.name}</span> ({activeProject.location})
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { name: 'Silver', price: projectPricing.Silver, desc: 'Entry partner tier with full access to revenue sharing pools.' },
                { name: 'Gold', price: projectPricing.Gold, desc: 'Most popular tier with boosted pool weight and referral rewards.', popular: true },
                { name: 'Platinum', price: projectPricing.Platinum, desc: 'Elite partner status with maximum pool shares and priority perks.' }
              ].map(p => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPlan(p.name)}
                  className={`p-6 rounded-3xl border flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                    selectedPlan === p.name
                      ? 'bg-[#74E61F]/10 border-[#74E61F] shadow-xl shadow-[#74E61F]/10 scale-[1.02]'
                      : 'bg-[#0B3022]/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#74E61F] text-[#042A1d] text-[9px] font-black uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-bold font-sora text-white">{p.name}</h3>
                    <div className="text-2xl font-black font-sora text-[#74E61F] my-2">
                      {formatRupee(p.price)}
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{p.desc}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(p.name);
                      setSetupStep('checkout');
                    }}
                    className={`mt-6 w-full py-3 rounded-xl font-sora font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      selectedPlan === p.name
                        ? 'bg-[#74E61F] text-[#042A1d] hover:bg-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Select Plan &rarr;
                  </button>
                </div>
              ))}
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

                {routerState?.planPrice > 0 && (
                  <div className="mb-5 px-4 py-3 rounded-xl bg-[#74E61F]/10 border border-[#74E61F]/25 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#74E61F]/20 border border-[#74E61F]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#74E61F]" />
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-[#74E61F] uppercase tracking-wider block mb-0.5">
                        Auto-filled from your selection
                      </span>
                      <span className="text-sm font-black font-sora text-white">
                        {routerState.planName} Plan &mdash; {formatRupee(routerState.planPrice)}
                      </span>
                    </div>
                  </div>
                )}

                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#74E61F]/20 text-[#74E61F] uppercase tracking-wider block w-fit mb-3">
                  Checkout Summary
                </span>
                <h3 className="text-2xl font-extrabold font-sora mb-4 tracking-tight">
                  {currentPlanInfo.label}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
                  Support sustainable EV infrastructure. Your pledge helps construct the EV charging node.
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

            <div className="lg:col-span-7 glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
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
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start space-x-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <div className="flex-1">{errorMessage}</div>
                  </motion.div>
                )}

                {/* Payment Method Selector Dropdown */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors cursor-pointer"
                  >
                    <option value="razorpay">Razorpay (UPI / Card / Net Banking)</option>
                    <option value="bank_transfer">Bank Transfer (Manual Verification)</option>
                  </select>
                </div>

                {paymentMethod === 'razorpay' && (
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
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-5">
                    <div className="p-5 bg-[#0B3022]/60 rounded-2xl border border-white/10 space-y-4">
                      <h5 className="text-xs font-bold uppercase text-[#74E61F]">Bank Account Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Account Holder", value: BANK_DETAILS.accountHolder, id: "accHolder" },
                          { label: "Account Number", value: BANK_DETAILS.accountNumber, id: "accNum" },
                          { label: "IFSC Code", value: BANK_DETAILS.ifsc, id: "ifsc" },
                          { label: "Branch", value: BANK_DETAILS.branch, id: "branch" },
                          { label: "Account Type", value: BANK_DETAILS.accountType, id: "accType" },
                        ].map((item) => (
                          <div key={item.id} className="flex flex-col space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.label}</span>
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                              <span className="text-xs font-semibold text-slate-200 select-all font-mono">{item.value}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.value, item.id)}
                                className="text-slate-400 hover:text-[#74E61F] p-1 transition-colors cursor-pointer"
                              >
                                {copiedField === item.id ? <Check className="w-3.5 h-3.5 text-[#74E61F]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Proof Upload Container */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block">
                        Upload Payment Proof
                      </label>
                      
                      {!paymentProofUrl ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleImageUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                            isDragging
                              ? "border-[#74E61F] bg-[#74E61F]/5"
                              : "border-white/10 hover:border-white/20 bg-white/5"
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageUpload(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            disabled={uploading}
                          />
                          <div className="flex flex-col items-center space-y-2">
                            {uploading ? (
                              <>
                                <div className="w-8 h-8 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-slate-300">Uploading proof to Cloudinary...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                  <Upload className="w-5 h-5 text-slate-400" />
                                </div>
                                <span className="text-xs font-bold text-white">Drag & drop your screenshot here</span>
                                <span className="text-[10px] text-slate-400">or click to browse from device (JPEG, PNG)</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B3022]/60 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${paymentProofUrl})` }} />
                            <div>
                              <span className="text-xs font-bold text-white block">Payment Proof Uploaded</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Ready to submit for verification</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentProofUrl('')}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="mt-6 space-y-2">
                <label
                  htmlFor="payment-terms"
                  className={`flex items-start space-x-3 cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none min-h-[44px] ${
                    agreedToTerms
                      ? 'bg-[#74E61F]/10 border-[#74E61F]/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="relative flex items-center justify-center shrink-0 min-w-[24px] min-h-[24px] mt-0.5">
                    <input
                      id="payment-terms"
                      type="checkbox"
                      className="sr-only peer"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 pointer-events-none ${
                        agreedToTerms
                          ? 'bg-[#74E61F] border-[#74E61F]'
                          : 'bg-white/10 border-white/20'
                      }`}
                    >
                      {agreedToTerms && (
                        <svg className="w-3 h-3 text-[#042A1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-300 leading-relaxed">
                    By proceeding, I confirm that I have read, understood, and agree to the{' '}
                    <button
                      type="button"
                      className="text-[#74E61F] hover:underline font-bold inline cursor-pointer align-baseline relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActivePolicyPage('terms');
                      }}
                    >
                      Terms &amp; Conditions
                    </button>
                    {' '}and Privacy Policy.
                  </span>
                </label>
              </div>

              <div className="space-y-3 mt-4">
                {paymentMethod === 'razorpay' ? (
                  <motion.button
                    whileHover={online && agreedToTerms ? { scale: 1.01 } : {}}
                    whileTap={online && agreedToTerms ? { scale: 0.99 } : {}}
                    onClick={handleRazorpayPayment}
                    disabled={status === 'processing' || !online || !agreedToTerms}
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
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={agreedToTerms ? { scale: 1.01 } : {}}
                    whileTap={agreedToTerms ? { scale: 0.99 } : {}}
                    onClick={handlePlaceOrder}
                    disabled={status === 'processing' || uploading || !agreedToTerms}
                    className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center space-x-2 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'processing' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#042A1d] border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              <div className="mt-4 text-center text-slate-500 text-[10px] font-medium">
                Your payment is processed securely.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activePolicyPage && (
        <PolicyModal page={activePolicyPage} onClose={() => setActivePolicyPage(null)} />
      )}
    </div>
  );
}
