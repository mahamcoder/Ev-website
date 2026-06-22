// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate, useSearchParams } from '../router';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '../context/AuthContext';
// import { db } from '../firebase';
// import { collection, query, onSnapshot, where } from 'firebase/firestore';
// import { Shield, AlertCircle, Lock, ArrowRight, CheckCircle, CreditCard, WifiOff, RefreshCw, Smartphone, Building2 } from 'lucide-react';
// import confetti from 'canvas-confetti';
// import useRazorpay from '../hooks/useRazorpay';

// function useOnlineStatus() {
//   const [online, setOnline] = useState(navigator.onLine);
//   useEffect(() => {
//     const go = () => setOnline(true);
//     const gn = () => setOnline(false);
//     window.addEventListener('online', go);
//     window.addEventListener('offline', gn);
//     return () => { window.removeEventListener('online', go); window.removeEventListener('offline', gn); };
//   }, []);
//   return online;
// }

// export default function Payment() {
//   const { currentUser, userData } = useAuth();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const online = useOnlineStatus();
//   const isRazorpayLoaded = useRazorpay();

//   const [activeProject, setActiveProject] = useState(null);

//   const urlProjectId = searchParams.get('projectId');
//   const planParam = searchParams.get('plan');
//   const selectedPlan = planParam || userData?.membershipType || 'Gold';

//   useEffect(() => {
//     const unsub = onSnapshot(
//       query(collection(db, 'projects')),
//       (snapshot) => {
//         const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
//         let active = null;
//         if (urlProjectId) {
//           active = list.find(p => p.id === urlProjectId);
//         }
//         if (!active) {
//           active = list.find(p => p.isActive === true) || list[0] || null;
//         }
//         setActiveProject(active);
//       }
//     );
//     return () => unsub();
//   }, [urlProjectId]);

//   const projectPricing = {
//     Silver: activeProject?.silverPrice || 7500,
//     Gold: activeProject?.goldPrice || 15000,
//     Platinum: activeProject?.platinumPrice || 30000
//   };

//   const plansInfo = {
//     Silver: { price: projectPricing.Silver, label: 'Silver Membership' },
//     Gold: { price: projectPricing.Gold, label: 'Gold Membership' },
//     Platinum: { price: projectPricing.Platinum, label: 'Platinum Membership' }
//   };

//   const currentPlanInfo = plansInfo[selectedPlan] || plansInfo.Gold;
//   const price = currentPlanInfo.price;

//   const [status, setStatus] = useState('idle');
//   const [errorMessage, setErrorMessage] = useState('');
//   const [transactionDetails, setTransactionDetails] = useState(null);
//   const [loadingMessage, setLoadingMessage] = useState('');

//   // Protect the payment route instantly
//   useEffect(() => {
//     if (!currentUser) {
//       navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
//     }
//   }, [currentUser, navigate, selectedPlan]);

//   // Removed redirect hook to allow guest payments

//   // Local storage helpers removed as we use Firestore from backend

//   const recordPayment = useCallback(async (paymentId) => {
//     const txId = paymentId || ('STS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase());
//     const dateString = new Date().toISOString();

//     setTransactionDetails({
//       id: txId,
//       amount: price,
//       date: new Date(dateString).toLocaleDateString('en-IN', {
//         year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
//       })
//     });

//     setStatus('success');

//     confetti({
//       particleCount: 150, spread: 80, origin: { y: 0.6 },
//       colors: ['#042A1d', '#105D3D', '#74E61F', '#22C55E']
//     });

//     setTimeout(() => {
//       navigate('/dashboard');
//     }, 1500);
//   }, [price, navigate]);

//   const handleRazorpayPayment = async () => {
//     setErrorMessage('');

//     if (!currentUser) {
//       navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
//       return;
//     }

//     if (!isRazorpayLoaded) {
//       setErrorMessage('Razorpay SDK failed to load. Please check your internet connection.');
//       setStatus('card'); // Fallback to simulated flow if offline
//       return;
//     }

//     setStatus('processing');

//     try {
//       // 1. Fetch order_id from our backend
//       const orderRes = await fetch('http://localhost:5000/api/create-order', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ amount: price * 100, currency: 'INR' })
//       });

//       const orderData = await orderRes.json();
//       if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

//       // 2. Initialize Razorpay checkout with the real order_id
//       const options = {
//         key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
//         amount: orderData.amount,
//         currency: orderData.currency,
//         name: 'Stoshi Green Energy',
//         description: currentPlanInfo.label,
//         image: '/stoshi_logo.webp',
//         order_id: orderData.id, // The real order ID from backend
//         handler: async function (response) {
//           // 3. Verify signature on the backend
//           try {
//             const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 userId: currentUser ? currentUser.uid : `guest_${Date.now()}`,
//                 plan: selectedPlan,
//                 amount: price,
//                 projectId: activeProject?.id
//               })
//             });

//             const verifyData = await verifyRes.json();
//             if (verifyData.success) {
//               console.log('✅ Frontend: Transaction Successful!', response);
//               recordPayment(response.razorpay_payment_id);
//             } else {
//               console.error('❌ Frontend: Transaction verification failed!', verifyData);
//               setErrorMessage('Payment verification failed: ' + verifyData.message);
//               setStatus('idle');
//             }
//           } catch (verifyErr) {
//             console.error('❌ Frontend: Error verifying payment:', verifyErr);
//             setErrorMessage('Error verifying payment: ' + verifyErr.message);
//             setStatus('idle');
//           }
//         },
//         prefill: {
//           name: userData?.name || 'User',
//           email: currentUser?.email || 'user@example.com',
//           contact: userData?.phone || '9999999999'
//         },
//         theme: {
//           color: '#74E61F'
//         }
//       };

//       const rzp = new window.Razorpay(options);

//       rzp.on('payment.failed', function (response) {
//         console.error('❌ Frontend: Payment failed at Razorpay checkout:', response.error);
//         setErrorMessage('Payment failed: ' + response.error.description);
//         setStatus('idle');
//       });

//       rzp.open();
//     } catch (error) {
//       console.error('❌ Frontend: Could not initialize payment:', error);
//       setErrorMessage('Could not initialize payment: ' + error.message);
//       setStatus('idle');
//     }
//   };

//   const handleCardSubmit = async () => {
//     setErrorMessage('');

//     if (!currentUser) {
//       navigate(`/signin?redirect=/payment?plan=${selectedPlan}`);
//       return;
//     }

//     setStatus('processing');

//     try {
//       const { doc: fd, setDoc: sd, collection: cl, addDoc: ad, serverTimestamp: st, increment: inc } = await import('firebase/firestore');

//       const mockPaymentId = 'pay_simulated_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

//       // Find and update active project
//       let activeProjId = activeProject?.id;
      
//       if (!activeProjId) {
//         const q = await import('firebase/firestore').then(m => m.getDocs(m.query(cl(db, 'projects'), m.where('isActive', '==', true))));
//         if (!q.empty) {
//           activeProjId = q.docs[0].id;
//         } else {
//           const allQ = await import('firebase/firestore').then(m => m.getDocs(cl(db, 'projects')));
//           if (!allQ.empty) activeProjId = allQ.docs[0].id;
//         }
//       }

//       if (activeProjId) {
//         await sd(fd(db, 'projects', activeProjId), {
//           collectedAmount: inc(price),
//           totalMembers: inc(1)
//         }, { merge: true });
//       }

//       // Record payment in Firestore
//       await ad(cl(db, 'payments'), {
//         userId: currentUser.uid,
//         userName: userData?.name || 'User',
//         userEmail: currentUser.email,
//         plan: selectedPlan,
//         amount: price,
//         transactionId: mockPaymentId,
//         status: 'Success',
//         projectId: activeProjId,
//         createdAt: st()
//       });

//       // Update user membership status
//       await sd(fd(db, 'users', currentUser.uid), {
//         membershipStatus: 'Active',
//         paymentStatus: 'Paid',
//         membershipType: selectedPlan,
//         projectId: activeProjId
//       }, { merge: true });

//       await recordPayment(mockPaymentId);
//     } catch (err) {
//       setErrorMessage('Payment confirmed but failed to update records: ' + err.message);
//       setStatus('card');
//     }
//   };

//   const formatRupee = (value) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(value);
//   };

//   return (
//     <div className="min-h-screen bg-[#042A1d] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-inter">
//       <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#74E61F]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
//       <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#105D3D]/30 rounded-full blur-[120px] pointer-events-none"></div>

//       {!online && (
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold"
//         >
//           <WifiOff className="w-4 h-4" />
//           No internet connection
//         </motion.div>
//       )}

//       <AnimatePresence mode="wait">
//         {status === 'success' ? (
//           <motion.div
//             key="success"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0 }}
//             className="w-full max-w-md glassmorphism-dark rounded-[32px] p-8 text-center border border-white/10 relative z-10 shadow-2xl"
//           >
//             <div className="flex justify-center mb-6">
//               <CheckCircle className="w-20 h-20 text-[#74E61F]" />
//             </div>
//             <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white mb-2">
//               Payment Successful!
//             </h2>
//             <p className="text-slate-300 text-xs md:text-sm font-semibold mb-6">
//               Welcome to Stoshi Green Energy
//             </p>

//             <div className="bg-[#0B3022] rounded-2xl p-5 mb-8 text-left border border-white/5 space-y-3">
//               <div className="flex justify-between text-xs font-semibold">
//                 <span className="text-slate-400">Transaction ID:</span>
//                 <span className="text-slate-200 font-mono">{transactionDetails?.id}</span>
//               </div>
//               <div className="flex justify-between text-xs font-semibold">
//                 <span className="text-slate-400">Plan Activated:</span>
//                 <span className="text-[#74E61F]">{selectedPlan} Plan</span>
//               </div>
//               <div className="flex justify-between text-xs font-semibold">
//                 <span className="text-slate-400">Amount Paid:</span>
//                 <span className="text-slate-200">{formatRupee(transactionDetails?.amount)}</span>
//               </div>
//               <div className="flex justify-between text-xs font-semibold">
//                 <span className="text-slate-400">Payment Date:</span>
//                 <span className="text-slate-200">{transactionDetails?.date}</span>
//               </div>
//             </div>

//             <div className="flex flex-col items-center space-y-3">
//               <div className="w-6 h-6 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin"></div>
//               <p className="text-xs text-[#74E61F] font-bold tracking-wider uppercase animate-pulse">
//                 Unlocking your Dashboard...
//               </p>
//             </div>
//           </motion.div>
//         ) : (
//           <motion.div
//             key="checkout"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 my-8 px-2"
//           >
//             <div className="lg:col-span-5 glassmorphism-dark rounded-[32px] p-8 border border-white/10 flex flex-col justify-between shadow-2xl">
//               <div>
//                 <img src="/stoshi_logo.webp" alt="Stoshi" className="h-10 w-auto mb-8" />
//                 <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#74E61F]/20 text-[#74E61F] uppercase tracking-wider block w-fit mb-3">
//                   Checkout Summary
//                 </span>
//                 <h3 className="text-2xl font-extrabold font-sora mb-4 tracking-tight">
//                   {currentPlanInfo.label}
//                 </h3>
//                 <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
//                   Support sustainable EV infrastructure. Your pledge helps construct the Sonbhadra EV-1 charging node.
//                 </p>

//                 <div className="border-t border-white/10 pt-6 space-y-4">
//                   <div className="flex items-center space-x-3 text-xs font-medium">
//                     <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
//                     <span className="text-slate-300">Automatic active membership activation</span>
//                   </div>
//                   <div className="flex items-center space-x-3 text-xs font-medium">
//                     <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
//                     <span className="text-slate-300">Access to Green Energy Dashboard widgets</span>
//                   </div>
//                   <div className="flex items-center space-x-3 text-xs font-medium">
//                     <div className="w-1.5 h-1.5 rounded-full bg-[#74E61F]"></div>
//                     <span className="text-slate-300">Live progress tracking & community voting</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-white/10 pt-6 mt-8 flex justify-between items-end">
//                 <div>
//                   <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total to Pay</span>
//                   <div className="text-3xl font-extrabold font-sora text-[#74E61F] mt-1">
//                     {formatRupee(price)}
//                   </div>
//                 </div>
//                 <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-[#042A1d] px-3 py-1.5 rounded-xl border border-white/5 space-x-1.5 shadow-sm">
//                   <Shield className="w-3.5 h-3.5 text-emerald-400" />
//                   <span>Secure 256-bit SSL</span>
//                 </div>
//               </div>
//             </div>

//             {status === 'card' ? (
//               <CardForm
//                 price={price}
//                 plan={selectedPlan}
//                 formatRupee={formatRupee}
//                 onSubmit={handleCardSubmit}
//                 onBack={() => { setStatus('idle'); setErrorMessage(''); }}
//                 errorMessage={errorMessage}
//                 userName={userData?.name || ''}
//               />
//             ) : (
//               <div className="lg:col-span-7 glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
//                 <div>
//                   <div className="flex items-center space-x-3 mb-8">
//                     <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 flex items-center justify-center border border-[#74E61F]/20">
//                       <Lock className="w-5 h-5 text-[#74E61F]" />
//                     </div>
//                     <div>
//                       <h4 className="text-base font-bold font-sora text-white">
//                         Secure Checkout
//                       </h4>
//                       <p className="text-[10px] text-slate-400 font-semibold">
//                         Secured Checkout Portal
//                       </p>
//                     </div>
//                   </div>

//                   {errorMessage && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start space-x-2"
//                     >
//                       <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
//                       <div className="flex-1">{errorMessage}</div>
//                     </motion.div>
//                   )}

//                   {loadingMessage && (
//                     <div className="mb-6 p-4 rounded-2xl bg-[#74E61F]/5 border border-[#74E61F]/10 text-[#74E61F] text-xs font-semibold flex items-center space-x-2">
//                       <div className="w-4 h-4 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin" />
//                       <span>{loadingMessage}</span>
//                     </div>
//                   )}

//                   <div className="space-y-5">
//                     <div className="p-5 bg-[#0B3022]/40 rounded-2xl border border-white/5 space-y-3">
//                       <div className="flex justify-between text-xs">
//                         <span className="text-slate-400">Plan</span>
//                         <span className="text-white font-bold">{selectedPlan}</span>
//                       </div>
//                       <div className="flex justify-between text-xs">
//                         <span className="text-slate-400">Amount</span>
//                         <span className="text-[#74E61F] font-bold font-sora text-base">
//                           {formatRupee(price)}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
//                       <Shield className="w-3.5 h-3.5 text-emerald-400" />
//                       <span>Secured with 256-bit SSL encryption</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-3 mt-6">
//                   <motion.button
//                     whileHover={online ? { scale: 1.01 } : {}}
//                     whileTap={online ? { scale: 0.99 } : {}}
//                     onClick={handleRazorpayPayment}
//                     disabled={status === 'processing' || !online}
//                     className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center space-x-2 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {status === 'processing' ? (
//                       <>
//                         <div className="w-5 h-5 border-2 border-[#042A1d] border-t-transparent rounded-full animate-spin" />
//                         <span>Processing...</span>
//                       </>
//                     ) : !online ? (
//                       <>
//                         <WifiOff className="w-4 h-4" />
//                         <span>No Internet Connection</span>
//                       </>
//                     ) : (
//                       <>
//                         <span>Pay {formatRupee(price)}</span>
//                         <ArrowRight className="w-4 h-4" />
//                       </>
//                     )}
//                   </motion.button>                </div>

//                 <div className="mt-6 text-center text-slate-500 text-[10px] font-medium">
//                   By proceeding, you agree to our terms. Your payment is processed securely.
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// function CardForm({ price, plan, formatRupee, onSubmit, onBack, errorMessage, userName }) {
//   const [payTabs, setPayTabs] = useState('card');

//   const tabs = [
//     { id: 'card', label: 'Card', icon: CreditCard },
//     { id: 'upi', label: 'UPI', icon: Smartphone },
//     { id: 'netbanking', label: 'Net Banking', icon: Building2 },
//   ];

//   return (
//     <div className="lg:col-span-7 glassmorphism-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-between">
//       <div>
//         <div className="flex items-center space-x-3 mb-6">
//           <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 flex items-center justify-center border border-[#74E61F]/20">
//             <CreditCard className="w-5 h-5 text-[#74E61F]" />
//           </div>
//           <div>
//             <h4 className="text-base font-bold font-sora text-white">Enter Payment Details</h4>
//             <p className="text-[10px] text-slate-400 font-semibold">Demo Mode — Test transaction</p>
//           </div>
//         </div>

//         {errorMessage && (
//           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
//             className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start space-x-2"
//           >
//             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
//             <div className="flex-1">{errorMessage}</div>
//           </motion.div>
//         )}

//         <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
//           {tabs.map(t => {
//             const Icon = t.icon;
//             const active = payTabs === t.id;
//             return (
//               <button key={t.id} onClick={() => setPayTabs(t.id)}
//                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${active ? 'bg-[#74E61F] text-[#042A1d]' : 'text-slate-400 hover:text-white'
//                   }`}
//               >
//                 <Icon className="w-3.5 h-3.5" />
//                 {t.label}
//               </button>
//             );
//           })}
//         </div>

//         <div className="p-3 mb-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[10px] font-bold text-center">
//           TEST MODE — Use card 4111 1111 1111 1111
//         </div>

//         {payTabs === 'card' && (
//           <div className="space-y-4">
//             <div>
//               <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Card Number</label>
//               <input type="text" defaultValue="4111 1111 1111 1111"
//                 className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//               />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Valid Thru</label>
//                 <input type="text" defaultValue="12/28"
//                   className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//                 />
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">CVV</label>
//                 <input type="password" defaultValue="123"
//                   className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//                 />
//               </div>
//             </div>
//             <div>
//               <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Cardholder Name</label>
//               <input type="text" defaultValue={userName || 'John Doe'}
//                 className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//               />
//             </div>
//           </div>
//         )}

//         {payTabs === 'upi' && (
//           <div>
//             <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">UPI ID</label>
//             <input type="text" defaultValue="user@paytm"
//               className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//             />
//           </div>
//         )}

//         {payTabs === 'netbanking' && (
//           <div>
//             <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">Select Bank</label>
//             <select defaultValue="sbi"
//               className="w-full px-4 py-3 rounded-xl bg-[#0B3022]/60 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#74E61F] transition-colors"
//             >
//               <option value="sbi">State Bank of India</option>
//               <option value="hdfc">HDFC Bank</option>
//               <option value="icici">ICICI Bank</option>
//               <option value="axis">Axis Bank</option>
//               <option value="kotak">Kotak Mahindra</option>
//             </select>
//           </div>
//         )}

//         <div className="flex items-center gap-2 mt-5 text-[10px] text-slate-500 font-semibold">
//           <Shield className="w-3.5 h-3.5 text-emerald-400" />
//           <span>Secured with 256-bit SSL encryption</span>
//         </div>
//       </div>

//       <div className="space-y-3 mt-6">
//         <motion.button
//           whileHover={{ scale: 1.01 }}
//           whileTap={{ scale: 0.99 }}
//           onClick={onSubmit}
//           className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm"
//         >
//           <Lock className="w-4 h-4" />
//           Pay {formatRupee(price)}
//         </motion.button>

//         <motion.button
//           whileHover={{ scale: 1.01 }}
//           whileTap={{ scale: 0.99 }}
//           onClick={onBack}
//           className="w-full py-3 rounded-2xl border border-white/20 text-white/80 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all duration-300 cursor-pointer"
//         >
//           Back to Summary
//         </motion.button>
//       </div>

//       <div className="mt-4 text-center text-slate-500 text-[10px] font-medium">
//         By proceeding, you agree to our terms.
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from '../router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Shield, AlertCircle, Lock, ArrowRight, CheckCircle, CreditCard, WifiOff, RefreshCw, Smartphone, Building2, Copy, Check, Upload, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import useRazorpay from '../hooks/useRazorpay';
import { BANK_DETAILS, CRYPTO_WALLETS } from '../config/paymentConfig';

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

  // ── Router state (from Home pricing card click) takes priority over URL params ──
  const routerLocation = useLocation();
  const routerState = routerLocation.state || null; // { planName, planPrice, projectId }

  const urlProjectId = searchParams.get('projectId');
  const planParam = searchParams.get('plan');

  // Merged: router state wins, URL params are the fallback (for direct links / back-compat)
  const incomingProjectId = routerState?.projectId || urlProjectId || null;
  const incomingPlan = routerState?.planName || planParam || null;

  const [selectedPlan, setSelectedPlan] = useState(incomingPlan || 'Gold');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const actives = list.filter(p => p.isActive === true || p.status === 'active');
        setAllActiveProjects(actives);

        if (incomingProjectId && incomingPlan) {
          // Came from Home pricing card (router state) or URL with both project + plan → skip to checkout
          const proj = list.find(p => p.id === incomingProjectId) || actives[0] || list[0] || null;
          setActiveProject(proj);
          setSelectedPlan(incomingPlan);
          setSetupStep('checkout');
        } else if (actives.length === 0) {
          // No active projects, fall back to first project in list
          const proj = list[0] || null;
          setActiveProject(proj);
          setSetupStep('plan_select');
        } else if (actives.length === 1) {
          // Only 1 active project → auto-select silently, go straight to plan selector
          setActiveProject(actives[0]);
          setSetupStep('plan_select');
        } else {
          // Multiple active projects
          if (incomingProjectId) {
            // Project hint present → use it, skip project selector
            const proj = actives.find(p => p.id === incomingProjectId) || actives[0];
            setActiveProject(proj);
            setSetupStep('plan_select');
          } else {
            // No hint → show project selector first
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
  const [loadingMessage, setLoadingMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [selectedWallet, setSelectedWallet] = useState(CRYPTO_WALLETS[0]);
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
    formData.append('upload_preset', 'Evwebsite');
    
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/ddiryhexg/image/upload', {
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
  }, [price]);

  useEffect(() => {
    // Razorpay / Card success: navigate to dashboard
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
    // Bank Transfer / Crypto: also redirect immediately after order placed
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
      setErrorMessage('Razorpay SDK failed to load. Please check your internet connection.');
      setStatus('card');
      return;
    }

    setStatus('processing');

    try {
      // ✅ FIXED: localhost ki jagah VITE_API_URL use ho raha hai
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
              console.log('✅ Frontend: Transaction Successful!', response);

              // ✅ FIX: Save payment to Firestore from frontend so Admin tab shows it
              try {
                const { doc: fd, setDoc: sd, collection: cl, addDoc: ad, serverTimestamp: st, increment: inc } = await import('firebase/firestore');
                const activeProjId = activeProject?.id || '';

                if (activeProjId) {
                  await sd(fd(db, 'projects', activeProjId), {
                    collectedAmount: inc(price),
                    totalMembers: inc(1)
                  }, { merge: true });
                }

                await ad(cl(db, 'payments'), {
                  userId: currentUser.uid,
                  userName: userData?.name || 'User',
                  userEmail: currentUser.email,
                  plan: selectedPlan,
                  amount: price,
                  transactionId: response.razorpay_payment_id,
                  status: 'Success',
                  paymentMethod: 'Razorpay',
                  projectId: activeProjId,
                  createdAt: st()
                });

                await sd(fd(db, 'users', currentUser.uid), {
                  membershipStatus: 'Active',
                  paymentStatus: 'Paid',
                  membershipType: selectedPlan,
                  projectId: activeProjId
                }, { merge: true });
              } catch (fsErr) {
                console.error('⚠️ Firestore save failed after Razorpay success:', fsErr);
              }

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
        {status === 'pending_success' ? (
          <motion.div
            key="pending_success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md glassmorphism-dark rounded-[32px] p-8 text-center border border-white/10 relative z-10 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <Clock className="w-20 h-20 text-yellow-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-white mb-2">
              Verification Pending
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-semibold mb-6">
              Order Placed Successfully
            </p>

            <div className="bg-[#0B3022] rounded-2xl p-5 mb-6 text-left border border-white/5 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-slate-200 font-mono">{transactionDetails?.id}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Plan Selected:</span>
                <span className="text-[#74E61F]">{selectedPlan} Plan</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Amount:</span>
                <span className="text-slate-200">{formatRupee(transactionDetails?.amount)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Payment Date:</span>
                <span className="text-slate-200">{transactionDetails?.date}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium mb-8 text-left">
              Your payment proof is under verification. Our admin will review and approve it within 24 hours.
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 shadow-md cursor-pointer text-xs md:text-sm"
            >
              Go to Dashboard
            </motion.button>
          </motion.div>
        ) : status === 'success' ? (
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
        ) : setupStep === 'loading' ? (
          <motion.div
            key="setup_loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center relative z-10 my-8"
          >
            <div className="glassmorphism-dark rounded-[32px] p-12 border border-white/10 shadow-2xl text-center">
              <div className="w-12 h-12 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-semibold">Loading projects...</p>
            </div>
          </motion.div>

        ) : setupStep === 'project_select' ? (
          <motion.div
            key="project_select"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-3xl relative z-10 my-8 px-2"
          >
            <div className="glassmorphism-dark rounded-[32px] p-8 border border-white/10 shadow-2xl">
              <img src="/stoshi_logo.webp" alt="Stoshi" className="h-10 w-auto mb-8" />
              <span className="text-[11px] font-extrabold tracking-widest text-[#74E61F] uppercase block mb-2">
                STEP 1 OF 2
              </span>
              <h3 className="text-2xl font-extrabold font-sora mb-2 tracking-tight">Choose a Project</h3>
              <p className="text-xs text-slate-400 mb-8">
                Select the project you'd like to fund before choosing your membership plan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allActiveProjects.map(proj => {
                  const total = proj.totalCapacity || 0;
                  const filled = proj.collectedAmount || 0;
                  const fundingPct = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setSetupStep('plan_select');
                      }}
                      className="flex flex-col p-5 rounded-2xl transition-all text-left cursor-pointer border-2 border-white/10 bg-white/5 hover:border-[#74E61F]/60 hover:bg-[#74E61F]/5 group"
                    >
                      <div className="flex items-center gap-1.5 bg-[#74E61F]/20 text-[#74E61F] text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase border border-[#74E61F]/20 mb-3 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#74E61F] animate-pulse" />
                        LIVE
                      </div>
                      <span className="text-base font-black font-sora text-white mb-1 group-hover:text-[#74E61F] transition-colors">
                        {proj.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {fundingPct.toFixed(0)}% Funded
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

        ) : setupStep === 'plan_select' ? (
          <motion.div
            key="plan_select"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl relative z-10 my-8 px-2"
          >
            <div className="glassmorphism-dark rounded-[32px] p-8 border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                {allActiveProjects.length > 1 && (
                  <button
                    onClick={() => setSetupStep('project_select')}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
                    title="Back to project selection"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <div className="flex-1">
                  <img src="/stoshi_logo.webp" alt="Stoshi" className="h-8 w-auto mb-2" />
                  <span className="text-[11px] font-extrabold tracking-widest text-[#74E61F] uppercase block mb-0.5">
                    {allActiveProjects.length > 1 ? 'STEP 2 OF 2 — SELECT YOUR PLAN' : 'SELECT YOUR PLAN'}
                  </span>
                  <h3 className="text-lg font-extrabold font-sora tracking-tight text-white">
                    {activeProject?.name || 'Active Project'}
                  </h3>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    key: 'Silver',
                    price: activeProject?.silverPrice || 7500,
                    badge: 'Basic',
                    desc: activeProject?.silverDesc || 'Entry-level green energy membership'
                  },
                  {
                    key: 'Gold',
                    price: activeProject?.goldPrice || 15000,
                    badge: 'Advanced',
                    desc: activeProject?.goldDesc || 'Best choice for most members',
                    popular: true
                  },
                  {
                    key: 'Platinum',
                    price: activeProject?.platinumPrice || 30000,
                    badge: 'Premium',
                    desc: activeProject?.platinumDesc || 'Maximum impact & exclusive benefits'
                  }
                ].map(plan => (
                  <button
                    key={plan.key}
                    onClick={() => {
                      setSelectedPlan(plan.key);
                      setSetupStep('checkout');
                    }}
                    className={`flex flex-col p-6 rounded-2xl transition-all text-left cursor-pointer border-2 relative ${
                      incomingPlan === plan.key
                        ? 'border-[#74E61F] bg-[#74E61F]/10 ring-1 ring-[#74E61F]/30'
                        : plan.popular
                          ? 'border-[#74E61F]/40 bg-[#74E61F]/5 hover:border-[#74E61F] hover:bg-[#74E61F]/10'
                          : 'border-white/10 bg-white/5 hover:border-[#74E61F]/50 hover:bg-[#74E61F]/5'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute top-3 right-3 text-[9px] font-extrabold text-[#74E61F] uppercase tracking-widest">
                        Best choice
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 w-fit ${
                      plan.popular ? 'bg-[#74E61F]/20 text-[#74E61F]' : 'bg-white/10 text-slate-300'
                    }`}>
                      {plan.badge}
                    </span>
                    <span className="text-2xl font-extrabold font-sora text-white mb-1">
                      {formatRupee(Number(plan.price))}
                    </span>
                    <span className="text-[11px] text-slate-400 mb-5 leading-relaxed">{plan.desc}</span>
                    <div className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-center transition-all ${
                      plan.popular
                        ? 'bg-[#74E61F] text-[#042A1d]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}>
                      Select Plan →
                    </div>
                  </button>
                ))}
              </div>
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

                {/* Auto-fill banner: shown when user arrived from a Home pricing card */}
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
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">{errorMessage}</div>
                    </motion.div>
                  )}

                  {loadingMessage && (
                    <div className="p-4 rounded-2xl bg-[#74E61F]/5 border border-[#74E61F]/10 text-[#74E61F] text-xs font-semibold flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-[#74E61F] border-t-transparent rounded-full animate-spin" />
                      <span>{loadingMessage}</span>
                    </div>
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
                      <option value="razorpay">Razorpay (UPI / card / netbanking)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="crypto">Crypto</option>
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
                                <a
                                  href={paymentProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-[#74E61F] hover:underline"
                                >
                                  View Full Image
                                </a>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPaymentProofUrl("")}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'crypto' && (
                    <div className="space-y-5">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block">Select Crypto Currency</label>
                        <div className="grid grid-cols-2 gap-4">
                          {CRYPTO_WALLETS.map((wallet) => {
                            const active = selectedWallet.symbol === wallet.symbol;
                            return (
                              <button
                                key={wallet.symbol}
                                type="button"
                                onClick={() => setSelectedWallet(wallet)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                  active
                                    ? "bg-[#74E61F]/10 border-[#74E61F]"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs">
                                  {wallet.symbol}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white">{wallet.name}</div>
                                  <div className="text-[10px] text-slate-400">{wallet.symbol}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="p-5 bg-[#0B3022]/60 rounded-2xl border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-[#74E61F]">
                              {selectedWallet.name} Address
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                            <span className="text-xs font-semibold text-slate-200 select-all font-mono break-all pr-2">
                              {selectedWallet.address}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedWallet.address, 'crypto_address')}
                              className="text-slate-400 hover:text-[#74E61F] p-1 transition-colors cursor-pointer shrink-0"
                            >
                              {copiedField === 'crypto_address' ? <Check className="w-3.5 h-3.5 text-[#74E61F]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
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
                                <a
                                  href={paymentProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-[#74E61F] hover:underline"
                                >
                                  View Full Image
                                </a>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPaymentProofUrl("")}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  {paymentMethod === 'razorpay' ? (
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
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handlePlaceOrder}
                      disabled={status === 'processing' || uploading}
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
