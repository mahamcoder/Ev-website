import React, { useState, useEffect } from 'react';
import { useNavigate } from '../router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc } from 'firebase/firestore';
import {
  LayoutDashboard, User, Compass, Award, History, Bell, LogOut,
  Menu, X, Check, Info, Gift, Wallet, Leaf, Shield, ChevronRight,
  Download, ArrowUpRight, Phone, Mail, Sparkles, Lock,
  BarChart3, TrendingUp, DollarSign, Clock, Copy, ExternalLink,
  Calendar, Filter, Search, Settings, FileText, Eye, EyeOff, Share2, Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';

const formatRupee = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const getUserBadge = (planType) => {
  const map = {
    Silver: { badge: 'Silver Member', class: 'bg-slate-400/20 text-[#2D3748] border-slate-500/20' },
    Gold: { badge: 'Pioneer Member', class: 'bg-[#74E61F]/20 text-[#74E61F] border-[#74E61F]/20' },
    Platinum: { badge: 'Elite Partner', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20' }
  };
  return map[planType] || map.Gold;
};

const planAmounts = { Silver: 7000, Gold: 15000, Platinum: 30000 };

function PoolCard({ title, amount, icon, color, locked }) {
  return (
    <div className={`p-5 bg-[#F7FBF9] rounded-2xl border border-[#B7E4C7] relative overflow-hidden ${locked ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-black uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${color.split(' ')[0]} flex items-center justify-center ${color.split(' ')[1]} border ${color.split(' ')[2]}`}>{icon}</div>
      </div>
      <span className={`text-xl font-black font-sora ${color.split(' ')[1]}`}>{formatRupee(amount || 0)}</span>
      {locked && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center backdrop-blur-sm z-10 text-center rounded-2xl">
          <Lock className="w-5 h-5 text-black mb-1" />
          <span className="text-[10px] font-bold text-black uppercase">Upgrade to unlock</span>
        </div>
      )}
    </div>
  );
}

function RewardCard({ title, amount, icon, color, locked }) {
  return (
    <div className={`p-5 bg-[#F7FBF9] rounded-2xl border border-[#B7E4C7] relative overflow-hidden ${locked ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-black uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${color.split(' ')[0]} flex items-center justify-center ${color.split(' ')[1]} border ${color.split(' ')[2]}`}>{icon}</div>
      </div>
      <span className={`text-xl font-black font-sora ${color.split(' ')[1]}`}>{formatRupee(amount || 0)}</span>
      <p className="text-[9px] text-black mt-1 font-semibold">Reward Accrued</p>
      {locked && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center backdrop-blur-sm z-10 text-center rounded-2xl">
          <Lock className="w-5 h-5 text-black mb-1" />
          <span className="text-[10px] font-bold text-black uppercase">Upgrade to unlock</span>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ icon, title, desc, time, color }) {
  return (
    <div className="p-4 bg-[#F7FBF9] rounded-2xl border border-[#B7E4C7] flex items-start space-x-3">
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0 border border-[#74E61F]/15`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-black uppercase tracking-wider">{title}</h4>
        <p className="text-[11px] text-[#2D3748] font-medium mt-1 leading-relaxed">{desc}</p>
        <span className="text-[9px] text-slate-500 mt-1.5 block">{time}</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { currentUser, userData, signOut, updateProfileData, changePassword, isImpersonating, stopImpersonating } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', storeNumber: '', labelCode: '' });
  const [profileStatus, setProfileStatus] = useState({ success: false, error: '' });

  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ success: false, error: '' });

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const [projectData, setProjectData] = useState({
    totalCapacity: 0,
    collectedAmount: 0,
    totalMembers: 0,
    status: 'Loading...',
    location: ''
  });

  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [earnings, setEarnings] = useState({
    utilityPool: 0, greenImpactPool: 0, loyaltyPool: 0, totalEarnings: 0
  });

  const [distributions, setDistributions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState({ distributions: true, membership: true, payments: true });

  const currentPlan = userData?.membershipType || 'Gold';
  const badgeInfo = getUserBadge(currentPlan);
  const memberId = currentUser?.uid ? `STS-${currentUser.uid.slice(0, 8).toUpperCase()}` : 'N/A';
  const joinDate = userData?.joinDate?.toDate ? userData.joinDate.toDate() : userData?.joinDate ? new Date(userData.joinDate) : null;

  const groupPaymentsByProject = () => {
    const groups = {};
    payments.forEach(p => {
      const pId = p.projectId || (projectsList[0]?.id || 'unknown');
      if (!groups[pId]) {
        groups[pId] = [];
      }
      groups[pId].push(p);
    });
    return groups;
  };

  const projectGroups = groupPaymentsByProject();

  const userProjects = Object.entries(projectGroups).map(([pId, groupPayments]) => {
    // Prefer the most recent SUCCESSFUL payment for status/amount/txId.
    // Falls back to the most recent payment overall if none succeeded yet
    // (e.g. still pending verification), so those states still show correctly.
    const successfulPayments = groupPayments.filter(
      p => p.status === 'Success' || p.status === 'Paid'
    );
    const latestPayment = successfulPayments[0] || groupPayments[0];

    // Only count successful payments toward the amount actually paid —
    // duplicate/failed retries should not inflate the total.
    const totalAmount = successfulPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0)
      || (latestPayment?.amount || 0);

    const project = projectsList.find(pr => pr.id === pId);

    let mStatus = 'Pending';
    let pStatus = 'Unpaid';
    if (latestPayment?.status === 'Success' || latestPayment?.status === 'Paid') {
      mStatus = 'Active';
      pStatus = 'Paid';
    } else if (latestPayment?.status === 'pending_verification') {
      mStatus = 'Pending';
      pStatus = 'Pending Verification';
    } else if (latestPayment?.status === 'Failed') {
      mStatus = 'Inactive';
      pStatus = 'Failed';
    }

    return {
      projectId: pId,
      projectName: project?.name || 'Active Project',
      planName: latestPayment?.plan || 'Gold',
      amount: totalAmount,
      status: mStatus,
      paymentStatus: pStatus,
      date: latestPayment?.date || new Date().toISOString(),
      transactionId: latestPayment?.transactionId || 'N/A',
      latestPayment
    };
  });

  const selectedProjMembership = userProjects.find(up => up.projectId === selectedProjectId) || userProjects[0] || null;
  const activePlan = selectedProjMembership ? selectedProjMembership.planName : (userData?.membershipType || 'Gold');
  const activeMembershipStatus = selectedProjMembership ? selectedProjMembership.status : (userData?.membershipStatus || 'Pending');
  const activePaymentStatus = selectedProjMembership ? selectedProjMembership.paymentStatus : (userData?.paymentStatus || 'Unpaid');
  const activeJoinDate = selectedProjMembership ? new Date(selectedProjMembership.date) : joinDate;

  const activeProjectPayments = payments.filter(p => (p.projectId || projectsList[0]?.id || '') === selectedProjectId);

  useEffect(() => {
    if (userData) {
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        storeNumber: userData.storeNumber || '',
        labelCode: userData.labelCode || ''
      });
    }
  }, [userData, activeTab]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjectsList(projects);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (userProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(userProjects[0].projectId);
    }
  }, [userProjects, selectedProjectId]);

  useEffect(() => {
    if (projectsList.length > 0) {
      const currentId = selectedProjectId || (userProjects[0]?.projectId) || projectsList.find(p => p.isActive === true || p.status === 'active')?.id || projectsList[0].id;
      const proj = projectsList.find(p => p.id === currentId);
      if (proj) setProjectData(proj);
    }
  }, [projectsList, selectedProjectId, userProjects]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'userEarnings', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setEarnings(docSnap.data());
      else setEarnings({ utilityPool: 0, greenImpactPool: 0, loyaltyPool: 0, totalEarnings: 0 });
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchPayments = async () => {
      try {
        const q = query(collection(db, 'payments'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const pList = snapshot.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(), _sortTime: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now() };
        });
        pList.sort((a, b) => b._sortTime - a._sortTime);
        setPayments(pList);
      } catch (err) { console.error(err); }
      finally { setPaymentsLoading(false); }
    };
    fetchPayments();
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, 'distributions'), orderBy('distributedAt', 'desc')),
      (snapshot) => setDistributions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, 'activityLogs'), where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc')),
      (snapshot) => setActivityLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => { if (err.code !== 'failed-precondition') console.error(err); }
    );
    return () => unsub();
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatus({ success: false, error: '' });
    if (!profileForm.name || !profileForm.phone) {
      setProfileStatus({ success: false, error: 'Name and phone are required.' });
      return;
    }
    try {
      await updateProfileData(profileForm.name, profileForm.phone);
      if (currentUser) {
        const { doc: fd, setDoc: sd } = await import('firebase/firestore');
        const userRef = doc(db, 'users', currentUser.uid);
        await sd(userRef, {
          address: profileForm.address || '',
          storeNumber: profileForm.storeNumber || '',
          labelCode: profileForm.labelCode || ''
        }, { merge: true });
      }
      setProfileStatus({ success: true, error: '' });
      confetti({ particleCount: 50, spread: 40, origin: { y: 0.8 }, colors: ['#74E61F', '#22C55E'] });
      setTimeout(() => setProfileStatus(p => ({ ...p, success: false })), 3000);
    } catch (err) { setProfileStatus({ success: false, error: 'Failed: ' + err.message }); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: false, error: '' });
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordStatus({ success: false, error: 'Password must be at least 6 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ success: false, error: 'Passwords do not match.' });
      return;
    }
    try {
      await changePassword(passwordForm.newPassword);
      setPasswordStatus({ success: true, error: '' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus(p => ({ ...p, success: false })), 3000);
    } catch (err) { setPasswordStatus({ success: false, error: 'Failed: ' + err.message }); }
  };

  const handleLogout = async () => {
    try { await signOut(); navigate('/signin'); }
    catch (err) { console.error(err); }
  };

  const handleDownloadReceipt = (tx) => {
    const receipt = [
      `STOSHI GREEN ENERGY - PAYMENT RECEIPT`,
      `----------------------------------------`,
      `Transaction ID: ${tx.transactionId}`,
      `Date: ${new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `Customer: ${tx.userName || userData?.name}`,
      `Email: ${tx.userEmail || currentUser?.email}`,
      `Plan: ${tx.plan}`,
      `Amount: ${formatRupee(tx.amount)}`,
      `Status: ${tx.status}`,
      `----------------------------------------`,
      `Thank you for supporting green energy!`
    ].join('\n');
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${tx.transactionId || tx.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data, filename, headers) => {
    if (!data.length) return;
    const rows = [headers.join(',')];
    data.forEach(row => {
      const vals = headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`);
      rows.push(vals.join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const target = projectData.totalCapacity || 1500000;
  const collected = projectData.collectedAmount || 975000;
  const percent = Math.min(Math.round((collected / target) * 100), 100);

  // Scoped Earnings metrics for selected project
  const userDistributions = distributions.filter(d => d.projectId === selectedProjectId);
  const userLockedDistributions = userDistributions.filter(d => d.status === 'locked');

  const projectUtilityEarnings = userLockedDistributions.reduce((acc, d) => {
    if (activePlan === 'Silver') return acc + (d.silverUtilityShare || 0);
    if (activePlan === 'Gold') return acc + (d.goldUtilityShare || 0);
    if (activePlan === 'Platinum') return acc + (d.platinumUtilityShare || 0);
    return acc;
  }, 0);

  const projectGreenEarnings = userLockedDistributions.reduce((acc, d) => {
    if (activePlan === 'Gold') return acc + (d.goldGreenShare || 0);
    if (activePlan === 'Platinum') return acc + (d.platinumGreenShare || 0);
    return acc;
  }, 0);

  const projectLoyaltyEarnings = userLockedDistributions.reduce((acc, d) => {
    if (activePlan === 'Platinum') return acc + (d.platinumLoyaltyShare || 0);
    return acc;
  }, 0);

  const projectTotalEarnings = projectUtilityEarnings + projectGreenEarnings + projectLoyaltyEarnings;

  const projectPendingEarnings = userDistributions.filter(d => d.status === 'confirmed').reduce((acc, d) => {
    if (activePlan === 'Silver') return acc + (d.silverUtilityShare || 0);
    if (activePlan === 'Gold') return acc + (d.goldUtilityShare || 0) + (d.goldGreenShare || 0);
    if (activePlan === 'Platinum') return acc + (d.platinumUtilityShare || 0) + (d.platinumGreenShare || 0) + (d.platinumLoyaltyShare || 0);
    return acc;
  }, 0);

  const totalDistributed = projectTotalEarnings;
  const totalEarnings = projectTotalEarnings;
  const pendingEarnings = projectPendingEarnings;
  const availableBalance = projectTotalEarnings;

  const planBenefits = {
    Silver: [
      'Utility Pool Access (0.5% share)',
      'EV Community Forum Access',
      'Monthly Infrastructure Logs',
      'Digital Certificate of Participation',
      'Standard Waitlist Priority'
    ],
    Gold: [
      'Utility Pool Access (0.5% share)',
      'Green Impact Pool Access (1% share)',
      'Priority charging nodes access',
      'Bi-monthly physical impact reports',
      'Green Infrastructure Badge',
      'Invitations to annual energy summits',
      '2x Priority for next project cycles'
    ],
    Platinum: [
      'Utility Pool Access (0.5% share)',
      'Green Impact Pool Access (1% share)',
      'Loyalty Pool Access (2% share)',
      'VIP access to charging node inaugurations',
      'Co-owner voting rights on future locations',
      'Special plaque at Sonbhadra node',
      'Lifetime waiver of standard processing fees',
      'Guaranteed placement in future waitlists'
    ]
  };

  const eligibleBenefits = planBenefits[activePlan] || planBenefits.Gold;
  const allBenefits = planBenefits.Platinum;

  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'earnings', name: 'Earnings', icon: TrendingUp },
    { id: 'payments', name: 'Payments', icon: Wallet },
    { id: 'project', name: 'Project', icon: Compass },
    { id: 'benefits', name: 'Benefits', icon: Award },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const bg = 'bg-[#F7FBF9]';
  const cardBg = 'bg-white';
  const cardBorder = 'border-[#B7E4C7]';
  const textPrimary = 'text-black';
  const textSecondary = 'text-black';
  const inputBg = 'bg-[#F7FBF9]';

  const darkMode = false;

  const renderMembershipCard = (projectMembership) => {
    const pPlan = projectMembership?.planName || currentPlan;
    const pBadge = getUserBadge(pPlan);
    const pStatus = projectMembership?.status || userData?.membershipStatus || 'Pending';
    const pDate = projectMembership ? new Date(projectMembership.date) : joinDate;
    const pTxId = projectMembership?.transactionId || 'N/A';
    const pAmount = projectMembership?.amount || planAmounts[pPlan] || 15000;
    const pProjName = projectMembership?.projectName || 'No project funded';

    return (
      <div key={projectMembership?.projectId || 'empty'} className={`bg-gradient-to-br ${pPlan === 'Silver' ? 'from-slate-700 to-slate-900' : pPlan === 'Gold' ? 'from-emerald-950 to-[#042A1d]' : 'from-slate-900 via-cyan-950 to-[#042A1d] border-cyan-500/10'} rounded-[24px] p-6 border border-[#B7E4C7]`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold font-sora uppercase border inline-block ${pBadge.class}`}>{pBadge.badge}</span>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mt-2">{pProjName}</span>
            <h3 className={`text-xl font-black font-sora text-white mt-1`}>{pPlan} Plan</h3>
            <p className="text-lg font-bold text-[#74E61F] mt-1">{formatRupee(pAmount)}</p>
          </div>
          <Shield className="w-10 h-10 text-[#74E61F] opacity-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Status</span>
            <span className={`font-bold ${pStatus === 'Active' || pStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{pStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Activation Date</span>
            <span className="font-bold text-white">{pDate ? pDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Transaction ID</span>
            <span className="font-mono font-bold text-white text-[10px] truncate block max-w-[150px]" title={pTxId}>{pTxId}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} flex font-inter transition-colors duration-300 relative ${isImpersonating ? 'pt-10' : ''}`}>
      {isImpersonating && (
        <div className="bg-amber-500 text-black py-2.5 px-4 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-4 z-50 fixed top-0 left-0 right-0 shadow-md">
          <span>You are viewing this dashboard as <strong className="underline">{userData?.name || 'User'}</strong> ({userData?.email})</span>
          <button onClick={() => { stopImpersonating(); navigate('/admin/dashboard'); }}
            className="px-3 py-1 bg-black text-white hover:bg-neutral-800 transition-all rounded-lg text-[10px] font-extrabold cursor-pointer">
            Back to Admin
          </button>
        </div>
      )}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#D8F3DC] rounded-full blur-[150px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] bg-[#B7E4C7] rounded-full blur-[150px] pointer-events-none opacity-30" />

      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-white border border-[#B7E4C7] rounded-2xl text-[#40916C] cursor-pointer" style={{ boxShadow: '0 2px 12px rgba(27,67,50,0.10)' }}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#D8F3DC] border-r border-[#B7E4C7] p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-8">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/stoshi_logo.webp" alt="Stoshi" className="h-12 w-auto" />
            <div>
              <span className="text-[10px] font-extrabold text-[#74E61F] tracking-widest block uppercase">Green Energy</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-2xl border border-[#B7E4C7]" style={{ boxShadow: '0 2px 8px rgba(27,67,50,0.06)' }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#40916C] text-black flex items-center justify-center font-bold text-sm font-sora shadow-inner">
                {userData?.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold block truncate text-[#1B4332]">{userData?.name || 'User'}</span>
              <span className="px-2 py-0.5 mt-1 rounded text-[9px] font-extrabold font-sora uppercase border inline-block bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]">{badgeInfo.badge}</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl flex items-center space-x-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#1B4332] text-white border border-[#1B4332]'
                      : 'text-[#40916C] hover:text-[#1B4332] hover:bg-[#B7E4C7] border border-transparent'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-2xl flex items-center space-x-3.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto z-10 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-8">

            {/* DASHBOARD / OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center ${cardBg} p-6 rounded-[32px] border ${cardBorder} backdrop-blur-sm`}>
                  <div>
                    <h2 className={`text-2xl md:text-3xl font-extrabold font-sora ${textPrimary} flex items-center`}>
                      <span>Welcome, {userData?.name || 'Partner'}</span>
                      <Check className="w-5 h-5 text-emerald-400 ml-2 border border-emerald-400/20 rounded-full bg-emerald-500/10 p-0.5 shrink-0" />
                    </h2>
                    <p className={`text-xs font-semibold mt-1 ${textSecondary}`}>
                      Member ID: {memberId}  Joined {joinDate ? joinDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                  {userProjects.length <= 1 ? (
                    <div className="mt-4 md:mt-0 px-4 py-3 bg-[#F7FBF9] rounded-2xl border border-[#B7E4C7] flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 bg-[#74E61F] rounded-full animate-pulse"></div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest block ${textSecondary}`}>Active Project</span>
                        <span className={`text-xs font-bold ${textPrimary}`}>{projectData.name || 'Sonbhadra EV-1'} ({projectData.status})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 md:mt-0 flex flex-wrap gap-2 items-center">
                      {userProjects.map((up) => {
                        const isActive = up.projectId === selectedProjectId;
                        return (
                          <button
                            key={up.projectId}
                            onClick={() => setSelectedProjectId(up.projectId)}
                            className={`px-3.5 py-2.5 rounded-full border flex items-center space-x-2 text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                : 'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] hover:bg-[#B7E4C7]'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#74E61F]' : 'bg-[#40916C]'} animate-pulse`}></div>
                            <span>{up.projectName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* User Data Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickStat icon={<Award className="w-5 h-5" />} label="Package" value={activePlan} color="text-[#74E61F]" bgColor="bg-[#74E61F]/10" borderColor="border-[#74E61F]/10" />
                  <QuickStat icon={<Shield className="w-5 h-5" />} label="Membership Status" value={activeMembershipStatus} color={activeMembershipStatus === 'Active' ? 'text-emerald-400' : 'text-amber-400'} bgColor="bg-emerald-500/10" borderColor="border-emerald-500/10" />
                  <QuickStat icon={<Wallet className="w-5 h-5" />} label="Payment Status" value={activePaymentStatus} color={activePaymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'} bgColor="bg-amber-500/10" borderColor="border-amber-500/10" />
                  <QuickStat icon={<Calendar className="w-5 h-5" />} label="Join Date" value={activeJoinDate ? activeJoinDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} color="text-cyan-400" bgColor="bg-cyan-500/10" borderColor="border-cyan-500/10" />
                </div>

                {/* Membership Package Card */}
                {userProjects.length <= 1 ? (
                  <div className={`${cardBg} border ${cardBorder} rounded-[32px] p-6`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider mb-4`}>Membership Package</h3>
                    {renderMembershipCard(userProjects[0])}
                  </div>
                ) : (
                  <div className={`${cardBg} border ${cardBorder} rounded-[32px] p-6`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider mb-4`}>Membership Packages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProjects.map(up => renderMembershipCard(up))}
                    </div>
                  </div>
                )}

                {/* Quick Access */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${cardBg} border ${cardBorder} rounded-[32px] p-6 space-y-3`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Quick Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => setActiveTab('earnings')}
                        className="w-full p-3 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-2xl border border-[#B7E4C7] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#2D3748] cursor-pointer">
                        <span className="flex items-center space-x-2"><Sparkles className="w-4 h-4" /><span>View Earnings</span></span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveTab('payments')}
                        className="w-full p-3 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-2xl border border-[#B7E4C7] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#2D3748] cursor-pointer">
                        <span className="flex items-center space-x-2"><Wallet className="w-4 h-4" /><span>Payment History</span></span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveTab('project')}
                        className="w-full p-3 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-2xl border border-[#B7E4C7] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#2D3748] cursor-pointer">
                        <span className="flex items-center space-x-2"><Compass className="w-4 h-4" /><span>Project Progress</span></span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`${cardBg} border ${cardBorder} rounded-[32px] p-6 space-y-3`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Earnings Summary</h3>
                    <div className="space-y-2">
                      <EarningRow label="Total Earnings" value={formatRupee(totalEarnings)} color="text-[#74E61F]" />
                      <EarningRow label="Total Distributed" value={formatRupee(totalDistributed)} color="text-emerald-400" />
                      <EarningRow label="Pending" value={formatRupee(Math.max(0, pendingEarnings))} color="text-amber-400" />
                      <EarningRow label="Available Balance" value={formatRupee(availableBalance)} color="text-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EARNINGS */}
            {activeTab === 'earnings' && (
              <div className="space-y-8">
                <div className={`${cardBg} border ${cardBorder} p-8 rounded-[32px]`}>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary} mb-2`}>Earnings Overview</h3>
                  <p className={`text-xs ${textSecondary} mb-6`}>Pool and reward earnings based on your {activePlan} membership</p>

                  <div className="mb-6">
                    <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider mb-3`}>Total Company Pools</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <PoolCard title="Total Utility Pool" amount={projectData?.totalUtilityPool || 0} icon={<Leaf className="w-4 h-4" />} color="bg-[#74E61F]/10 text-[#74E61F] border-[#74E61F]/10" locked={false} />
                      <PoolCard title="Total Green Impact Pool" amount={projectData?.totalGreenImpactPool || 0} icon={<Shield className="w-4 h-4" />} color="bg-emerald-500/10 text-emerald-400 border-emerald-500/10" locked={activePlan === 'Silver'} />
                      <PoolCard title="Total Loyalty Pool" amount={projectData?.totalLoyaltyPool || 0} icon={<Award className="w-4 h-4" />} color="bg-cyan-500/10 text-cyan-400 border-cyan-500/10" locked={activePlan === 'Silver' || activePlan === 'Gold'} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider mb-3`}>My Earned Rewards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <RewardCard title="My Utility Reward" amount={projectUtilityEarnings} icon={<Gift className="w-4 h-4" />} color="bg-[#74E61F]/10 text-[#74E61F] border-[#74E61F]/10" locked={false} />
                      <RewardCard title="My Green Impact Reward" amount={projectGreenEarnings} icon={<Gift className="w-4 h-4" />} color="bg-emerald-500/10 text-emerald-400 border-emerald-500/10" locked={activePlan === 'Silver'} />
                      <RewardCard title="My Loyalty Reward" amount={projectLoyaltyEarnings} icon={<Gift className="w-4 h-4" />} color="bg-cyan-500/10 text-cyan-400 border-cyan-500/10" locked={activePlan === 'Silver' || activePlan === 'Gold'} />
                    </div>
                  </div>

                  <div className={`p-5 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-3 mb-6`}>
                    <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Earnings Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <SummaryBadge label="Total Earnings" value={formatRupee(totalEarnings)} color="text-[#74E61F]" />
                      <SummaryBadge label="Total Distributed" value={formatRupee(totalDistributed)} color="text-emerald-400" />
                      <SummaryBadge label="Pending" value={formatRupee(Math.max(0, pendingEarnings))} color="text-amber-400" />
                      <SummaryBadge label="Available Balance" value={formatRupee(availableBalance)} color="text-cyan-400" />
                    </div>
                  </div>

                  <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider mb-3`}>Distribution History</h4>
                  <div className={`overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                          <th className="p-4">Date</th>
                          <th className="p-4">Project</th>
                          <th className="p-4 text-right">Utility Reward</th>
                          <th className="p-4 text-right">Green Reward</th>
                          <th className="p-4 text-right">Loyalty Reward</th>
                          <th className="p-4 text-right">Total Distributed</th>
                          <th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y ${cardBorder} text-xs font-medium">
                        {distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').map((d) => {
                          let uShare = 0, gShare = 0, lShare = 0;
                          if (activePlan === 'Silver') {
                            uShare = d.silverUtilityShare || 0;
                          } else if (activePlan === 'Gold') {
                            uShare = d.goldUtilityShare || 0;
                            gShare = d.goldGreenShare || 0;
                          } else if (activePlan === 'Platinum') {
                            uShare = d.platinumUtilityShare || 0;
                            gShare = d.platinumGreenShare || 0;
                            lShare = d.platinumLoyaltyShare || 0;
                          }
                          const total = uShare + gShare + lShare;

                          return (
                            <tr key={d.id} className={`${darkMode ? 'hover:bg-[#D8F3DC] text-[#2D3748]' : 'hover:bg-slate-50 text-[#2D3748]'} transition-colors`}>
                              <td className={`p-4 ${textSecondary}`}>
                                {d.distributedAt?.toDate ? new Date(d.distributedAt.toDate()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                              </td>
                              <td className="p-4 font-bold text-[#1B4332]">{projectData.name || 'Active Project'}</td>
                              <td className="p-4 text-right text-[#1B4332] font-semibold">{formatRupee(uShare)}</td>
                              <td className="p-4 text-right text-[#1B4332] font-semibold">{formatRupee(gShare)}</td>
                              <td className="p-4 text-right text-[#1B4332] font-semibold">{formatRupee(lShare)}</td>
                              <td className="p-4 text-right text-[#74E61F] font-bold">{formatRupee(total)}</td>
                              <td className="p-4 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Distributed</span>
                              </td>
                            </tr>
                          );
                        })}
                        {distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').length === 0 && (
                          <tr><td colSpan="7" className={`py-8 text-center ${textSecondary} text-xs`}>No distributions yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Payment History</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Your transaction records from the payments collection</p>
                </div>
                {paymentsLoading ? (
                  <div className={`py-10 text-center ${textSecondary} text-xs`}>Loading payments...</div>
                ) : activeProjectPayments.length === 0 ? (
                  <div className={`py-12 text-center ${textSecondary} font-semibold border border-dashed border-[#B7E4C7] rounded-2xl text-xs`}>No transactions found.</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${cardBorder} text-[10px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Plan</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y ${cardBorder} text-xs font-medium">
                        {activeProjectPayments.map((tx) => (
                          <tr key={tx.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                            <td className={`p-4 font-mono font-bold uppercase ${textPrimary}`}>{tx.transactionId}</td>
                            <td className="p-4">{tx.plan} Plan</td>
                            <td className="p-4 text-right text-[#74E61F] font-sora font-semibold">{formatRupee(tx.amount)}</td>
                            <td className={`p-4 ${textSecondary}`}>{new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{tx.status}</span>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleDownloadReceipt(tx)}
                                className="p-2 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-xl border border-[#B7E4C7] text-[#2D3748] cursor-pointer" title="Download Receipt">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PROJECT */}
            {activeTab === 'project' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-8`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Active Project</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Real-time project funding and progress tracking</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 flex flex-col items-center justify-center py-6">
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="112" cy="112" r="95" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" />
                        <circle cx="112" cy="112" r="95" stroke="#74E61F" strokeWidth="12" fill="transparent"
                          strokeDasharray={2 * Math.PI * 95} strokeDashoffset={2 * Math.PI * 95 * (1 - percent / 100)} strokeLinecap="round"
                          className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold font-sora text-black">{percent}%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${textSecondary}`}>Funded</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                    <div className={`p-5 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} rounded-2xl border ${cardBorder}`}>
                      <h4 className={`text-sm font-bold font-sora ${textPrimary} mb-3`}>{projectData.location || 'Sonbhadra, Uttar Pradesh'}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <ProjectStat label="Project Name" value={projectData.name || 'Active Project'} color="text-[#74E61F]"/>
                        <ProjectStat label="Status" value={projectData.status || 'Operational'} color="text-[#74E61F]" />
                        <ProjectStat label="Funding Goal" value={formatRupee(target)} color="text-[#74E61F]"/>
                        <ProjectStat label="Funding Collected" value={formatRupee(collected)} color="text-[#74E61F]"/>
                      </div>
                    </div>
                    <div className={`p-5 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} rounded-2xl border ${cardBorder} space-y-3`}>
                      <ProjectStat label="Your Contribution" value={formatRupee(selectedProjMembership?.amount || planAmounts[activePlan] || 15000)} color="text-[#74E61F]" />
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={textSecondary}>Progress</span>
                          <span className="text-[#74E61F] font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-[#031E15] h-2 rounded-full overflow-hidden">
                          <div className="bg-[#74E61F] h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                      <p className={`text-[10px] ${textSecondary} mt-2`}>Total Members: {projectData.totalMembers || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BENEFITS */}
            {activeTab === 'benefits' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-8`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Membership Benefits</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Benefits available with your {activePlan} package</p>
                </div>

                <div className={`bg-gradient-to-br ${activePlan === 'Silver' ? 'from-slate-700 to-slate-900' : activePlan === 'Gold' ? 'from-emerald-950 to-[#042A1d]' : 'from-slate-900 via-cyan-950 to-[#042A1d]'} rounded-[28px] p-8 border border-[#B7E4C7] min-h-48 flex flex-col justify-between shadow-2xl relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#74E61F]/5 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#74E61F] uppercase">STOSHI Green Energy</span>
                      <h4 className="text-lg font-black font-sora text-white mt-1 capitalize">{activePlan} Plan</h4>
                      <p className="text-xs text-slate-400 mt-1">{userData?.name}</p>
                    </div>
                    <Shield className="w-8 h-8 text-[#74E61F]" />
                  </div>
                  <div className="mt-6 relative z-10">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">{memberId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider mb-4 flex items-center`}>
                      <Check className="w-4 h-4 text-emerald-400 mr-2" />
                      Your Benefits ({activePlan})
                    </h4>
                    <ul className="space-y-3">
                      {eligibleBenefits.map((b, i) => (
                        <li key={i} className="flex items-start space-x-3 text-xs">
                          <div className="w-5 h-5 rounded-full bg-[#74E61F]/15 border border-[#74E61F]/20 text-[#74E61F] flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className={`${darkMode ? 'text-[#2D3748]' : 'text-slate-600'} font-semibold leading-relaxed`}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider mb-4 flex items-center`}>
                      <Lock className="w-4 h-4 text-slate-400 mr-2" />
                      Locked Benefits
                    </h4>
                    <ul className="space-y-3">
                      {allBenefits.filter(b => !eligibleBenefits.includes(b)).map((b, i) => (
                        <li key={i} className="flex items-start space-x-3 text-xs opacity-50">
                          <div className="w-5 h-5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-3 h-3" />
                          </div>
                          <span className="text-slate-400 font-semibold leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                    {activePlan !== 'Platinum' && (
                      <button onClick={() => navigate(`/payment?plan=Platinum&projectId=${selectedProjectId || ''}`)}
                        className="mt-4 px-4 py-2.5 bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer hover:bg-white transition">
                        Upgrade to Unlock All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className={`max-w-2xl ${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-8`}>
                <div>
                  <h3 className={`text-2xl font-extrabold font-sora ${textPrimary}`}>My Profile</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Manage your personal information</p>
                </div>

                <div className={`flex items-center space-x-4 p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} rounded-2xl border ${cardBorder}`}>
                  <div className={`w-16 h-16 rounded-full ${darkMode ? 'bg-[#105D3D]' : 'bg-[#74E61F]/20'} text-[#74E61F] flex items-center justify-center font-bold text-2xl font-sora`}>
                    {userData?.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold font-sora ${textPrimary}`}>{userData?.name || 'User'}</h4>
                    <p className={`text-xs ${textSecondary}`}>{currentUser?.email}</p>
                    <p className={`text-[10px] ${textSecondary} mt-1`}>Member ID: {memberId}</p>
                  </div>
                </div>

                {profileStatus.success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold">Profile updated successfully!</div>
                )}
                {profileStatus.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-xs font-semibold">{profileStatus.error}</div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <InputField label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} inputBg={inputBg} darkMode={darkMode} required />
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Email (Cannot change)</label>
                    <input type="email" value={currentUser?.email || ''} disabled
                      className={`w-full px-4 py-3.5 rounded-2xl ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-200'} border ${cardBorder} ${textSecondary} text-sm font-semibold cursor-not-allowed`} />
                  </div>
                  <InputField label="Phone Number" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} inputBg={inputBg} darkMode={darkMode} required />
                  <InputField label="Address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} inputBg={inputBg} darkMode={darkMode} />

                  {/* Label Code */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Label Code</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" />
                      <input
                        type="text"
                        placeholder="e.g. LC-001"
                        value={profileForm.labelCode}
                        onChange={(e) => setProfileForm({ ...profileForm, labelCode: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl ${inputBg} border ${cardBorder} focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors`}
                      />
                    </div>
                  </div>

                  {/* Store Number */}
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Store Number</label>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#40916C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <input
                        type="text"
                        placeholder="e.g. STR-001"
                        value={profileForm.storeNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, storeNumber: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl ${inputBg} border ${cardBorder} focus:border-[#40916C] focus:outline-none text-sm font-medium text-[#2D3748] placeholder-[#B7E4C7] transition-colors`}
                      />
                    </div>
                    <p className="text-[10px] text-[#40916C] font-medium mt-1 pl-1">Enter your store or branch number (e.g. STR-001)</p>
                  </div>

                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
                    className="w-full py-4 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer text-xs md:text-sm">
                    Save Changes
                  </motion.button>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Notifications</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Stay updated with your account activity</p>
                </div>

                <div className="space-y-4">
                  <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Distribution Alerts</h4>
                  {distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').length > 0 ? (
                    distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').slice(0, 3).map((d, i) => (
                      <NotificationItem key={d.id || i}
                        icon={<Gift className="w-4 h-4" />}
                        title="Distribution Complete"
                        desc={`A distribution of ${formatRupee(d.totalDistributed)} has been processed. Your share: ${formatRupee(activePlan === 'Silver' ? d.silverUtilityShare : activePlan === 'Gold' ? (d.goldUtilityShare + d.goldGreenShare) : (d.platinumUtilityShare + d.platinumGreenShare + d.platinumLoyaltyShare))}`}
                        time={d.distributedAt?.toDate ? new Date(d.distributedAt.toDate()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                        color="bg-[#74E61F]/10 text-[#74E61F]" />
                    ))
                  ) : (
                    <NotificationItem icon={<Info className="w-4 h-4" />} title="No Distributions" desc="No distributions have been processed yet." time="—" color="bg-slate-500/10 text-slate-400" />
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Membership Updates</h4>
                  <NotificationItem icon={<Award className="w-4 h-4" />} title={`${activePlan} Plan Active`} desc={`Your ${activePlan} membership is ${activeMembershipStatus}.`} time={activeJoinDate ? activeJoinDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} color="bg-emerald-500/10 text-emerald-400" />
                </div>

                <div className="space-y-4">
                  <h4 className={`text-xs font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Payment Updates</h4>
                  {activeProjectPayments.length > 0 ? (
                    activeProjectPayments.slice(0, 3).map((tx, i) => (
                      <NotificationItem key={tx.id || i}
                        icon={<Wallet className="w-4 h-4" />}
                        title="Payment Confirmed"
                        desc={`${formatRupee(tx.amount)} paid for ${tx.plan} plan. Transaction: ${tx.transactionId}`}
                        time={new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        color="bg-[#74E61F]/10 text-[#74E61F]" />
                    ))
                  ) : (
                    <NotificationItem icon={<Info className="w-4 h-4" />} title="No Payments" desc="No payment records found." time="—" color="bg-slate-500/10 text-slate-400" />
                  )}
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Reports</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Download your earnings, distribution, and transaction reports</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ReportCard title="Earnings Report" description="Download your pool earnings summary"
                    onExport={() => {
                      const data = [
                        { Pool: 'Utility Pool', Amount: projectUtilityEarnings },
                        { Pool: 'Green Impact Pool', Amount: projectGreenEarnings },
                        { Pool: 'Loyalty Pool', Amount: projectLoyaltyEarnings }
                      ];
                      exportToCSV(data, `earnings_report_${projectData.name || 'project'}`, ['Pool', 'Amount']);
                    }}
                    count="3 pools" icon={<TrendingUp className="w-5 h-5" />} darkMode={darkMode} />
                  <ReportCard title="Distribution Report" description="Download distribution history"
                    onExport={() => {
                      exportToCSV(
                        distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').map(d => ({
                          Date: d.distributedAt?.toDate ? d.distributedAt.toDate().toLocaleDateString('en-IN') : 'N/A',
                          Amount: d.totalDistributed || 0,
                          Share: activePlan === 'Silver' ? d.silverUtilityShare : activePlan === 'Gold' ? (d.goldUtilityShare + d.goldGreenShare) : (d.platinumUtilityShare + d.platinumGreenShare + d.platinumLoyaltyShare)
                        })),
                        `distribution_report_${projectData.name || 'project'}`,
                        ['Date', 'Amount', 'Share']
                      );
                    }}
                    count={`${distributions.filter(d => d.projectId === selectedProjectId && d.status === 'locked').length} distributions`} icon={<BarChart3 className="w-5 h-5" />} darkMode={darkMode} />
                  <ReportCard title="Transaction Report" description="Download payment history"
                    onExport={() => {
                      exportToCSV(
                        activeProjectPayments.map(p => ({
                          TransactionID: p.transactionId,
                          Plan: p.plan,
                          Amount: p.amount,
                          Date: new Date(p.date).toLocaleDateString('en-IN'),
                          Status: p.status
                        })),
                        `transaction_report_${projectData.name || 'project'}`,
                        ['TransactionID', 'Plan', 'Amount', 'Date', 'Status']
                      );
                    }}
                    count={`${activeProjectPayments.length} transactions`} icon={<FileText className="w-5 h-5" />} darkMode={darkMode} />
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div className={`max-w-2xl ${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-8`}>
                <div>
                  <h3 className={`text-2xl font-extrabold font-sora ${textPrimary}`}>Settings</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Manage your account settings and preferences</p>
                </div>

                <div className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Change Password</h4>
                  {passwordStatus.success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold">Password changed successfully!</div>
                  )}
                  {passwordStatus.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold">{passwordStatus.error}</div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <InputField label="New Password" type="password" value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} inputBg={inputBg} darkMode={darkMode} />
                    <InputField label="Confirm Password" type="password" value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} inputBg={inputBg} darkMode={darkMode} />
                    <button type="submit"
                      className="px-6 py-3 bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer text-xs">
                      Update Password
                    </button>
                  </form>
                </div>

                <div className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Notification Preferences</h4>
                  <div className="space-y-3">
                    <ToggleOption label="Distribution Alerts" enabled={notifPrefs.distributions}
                      onChange={() => setNotifPrefs(p => ({ ...p, distributions: !p.distributions }))} darkMode={darkMode} />
                    <ToggleOption label="Membership Updates" enabled={notifPrefs.membership}
                      onChange={() => setNotifPrefs(p => ({ ...p, membership: !p.membership }))} darkMode={darkMode} />
                    <ToggleOption label="Payment Updates" enabled={notifPrefs.payments}
                      onChange={() => setNotifPrefs(p => ({ ...p, payments: !p.payments }))} darkMode={darkMode} />
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// SUB-COMPONENTS
function QuickStat({ icon, label, value, color, bgColor, borderColor }) {
  return (
    <div className="p-5 bg-white rounded-3xl border border-[#B7E4C7] relative overflow-hidden">
      <div className={`w-9 h-9 rounded-2xl ${bgColor} flex items-center justify-center ${color} mb-3 border ${borderColor}`}>{icon}</div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
      <div className={`text-lg font-extrabold font-sora ${color}`}>{value}</div>
    </div>
  );
}

function EarningRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center p-2.5 bg-[#F7FBF9] rounded-xl border border-[#B7E4C7]">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold font-sora ${color}`}>{value}</span>
    </div>
  );
}

function SummaryBadge({ label, value, color }) {
  return (
    <div className="p-3 bg-white border border-[#B7E4C7] rounded-xl text-center">
      <span className={`text-sm font-bold font-sora block ${color}`}>{value}</span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ProjectStat({ label, value, color = 'text-white' }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 font-bold uppercase block">{label}</span>
      <span className={`text-sm font-bold font-sora ${color}`}>{value}</span>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, inputBg, darkMode, required }) {
  return (
    <div className="space-y-1.5">
      <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        className={`w-full px-4 py-3.5 rounded-2xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} focus:border-[#74E61F] focus:outline-none text-sm font-semibold text-[#1B4332] transition-colors`} required={required} />
    </div>
  );
}

function ReportCard({ title, description, onExport, count, icon, darkMode }) {
  return (
    <div className={`p-6 ${darkMode ? 'bg-white' : 'bg-white'} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} rounded-2xl space-y-4`}>
      <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 flex items-center justify-center text-[#74E61F] border border-[#74E61F]/10">{icon}</div>
      <h4 className={`text-sm font-bold font-sora ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      <div className={`flex items-center justify-between pt-2 border-t ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'}`}>
        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{count}</span>
        <button onClick={onExport}
          className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-[#F7FBF9] border-[#B7E4C7] text-[#2D3748]' : 'bg-slate-100 border-slate-200 text-slate-600'} border hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5`}>
          <Download className="w-3 h-3" /> Export
        </button>
      </div>
    </div>
  );
}

function ToggleOption({ label, enabled, onChange, darkMode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-xs font-semibold ${darkMode ? 'text-[#2D3748]' : 'text-slate-600'}`}>{label}</span>
      <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-[#74E61F]' : 'bg-slate-600'}`}>
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
