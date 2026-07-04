import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate, Link } from '../router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

export const AdminProjectContext = createContext({
  projects: [],
  selectedProject: null,
  setSelectedProject: () => {}
});
import { collection, doc, onSnapshot, getDocs, updateDoc, deleteDoc, setDoc, addDoc, orderBy, query, where, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import {
  LayoutDashboard, Users, Wallet, Settings, LogOut,
  Menu, X, Check, Trash2, Shield, Search, ArrowLeft,
  Calendar, RefreshCw, AlertCircle, Edit, ArrowUpRight, TrendingUp,
  PieChart, CheckCircle, Lock, Unlock, Download, ClipboardList, Activity,
  Filter, UserPlus, UserMinus, DollarSign, FileText, Moon, Sun,
  Eye, EyeOff, Copy, Ban, Award, BarChart3, ChevronDown, ChevronUp,
  Clock, List, Mail, Phone, MapPin, ExternalLink, Building2, Plus,
  Image, Globe, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

const formatRupee = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const exportToCSV = (data, filename, headers) => {
  if (!data.length) return;
  const csvRows = [headers.join(',')];
  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] || '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const logActivity = async (userId, userName, action, details) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId: userId || 'unknown',
      userName: userName || 'System',
      action,
      details: details || '',
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

function MiniBarChart({ data, color = '#74E61F', height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[8px] text-slate-500 font-semibold">{d.value}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: `${(d.value / max) * 100}%`,
              backgroundColor: color,
              opacity: 0.6 + (i / data.length) * 0.4,
              minHeight: d.value > 0 ? 4 : 0
            }}
          />
          <span className="text-[7px] text-slate-600 font-medium truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniDoughnut({ percent, color = '#74E61F', size = 80, label, value }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="14" fontWeight="bold">{Math.round(percent)}%</text>
      </svg>
      {label && <span className="text-[9px] text-slate-400 font-semibold">{label}</span>}
      {value && <span className="text-[10px] text-white font-bold">{value}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser, userData, signOut, impersonateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [userData, navigate]);

  const handleImpersonateUser = (user) => {
    if (!user.uid) return;
    impersonateUser(user.uid);
    navigate('/dashboard');
  };

  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageRef = useRef(null);

  const [usersList, setUsersList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', phone: '', labelCode: '', membershipType: '', membershipStatus: '', paymentStatus: '' });

  const [distributionsList, setDistributionsList] = useState([]);
  const [distStep, setDistStep] = useState(1);
  const [distIncomeAmount, setDistIncomeAmount] = useState('');
  const [distPreview, setDistPreview] = useState(null);
  const [currentDistDocId, setCurrentDistDocId] = useState(null);
  const [distLoading, setDistLoading] = useState(false);
  const isDistLocked = distributionsList.some(d => d.status === 'locked');

  const [companyIncomeList, setCompanyIncomeList] = useState([]);
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '' });
  const [incomeSubmitting, setIncomeSubmitting] = useState(false);

  const [projectsList, setProjectsList] = useState([]);
  const [projectForm, setProjectForm] = useState({
    name: '', location: '', totalCapacity: '', collectedAmount: '', totalMembers: '',
    status: 'Pending', description: '', imageUrl: '', isActive: false,
    powerRating: '', chargingBays: '', dailyUsers: '', co2Saved: '',
    silverPrice: '', silverDesc: '', silverFeatures: '',
    goldPrice: '', goldDesc: '', goldFeatures: '',
    platinumPrice: '', platinumDesc: '', platinumFeatures: ''
  });
  const [projectFormTab, setProjectFormTab] = useState('general');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectStatus, setProjectStatus] = useState({ success: false, error: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [waitlist, setWaitlist] = useState([]);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '', preferredPlan: 'Silver', projectId: '' });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const [activityLogs, setActivityLogs] = useState([]);

  const [bulkActionStatus, setBulkActionStatus] = useState('');

  const [distIncomeForms, setDistIncomeForms] = useState({ utility: '', green: '', loyalty: '' });

  // â”€â”€â”€ EFFECTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjectsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubDist = onSnapshot(
      query(collection(db, 'distributions'), orderBy('distributedAt', 'desc')),
      (snapshot) => setDistributionsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubIncome = onSnapshot(
      query(collection(db, 'companyIncome'), orderBy('enteredAt', 'desc')),
      (snapshot) => setCompanyIncomeList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubWaitlist = onSnapshot(
      query(collection(db, 'waitlist'), orderBy('createdAt', 'desc')),
      (snapshot) => setWaitlist(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc')),
      (snapshot) => setActivityLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setPaymentsList(snapshot.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() };
        }));
        setLoadingData(false);
      },
      (err) => {
        console.error(err);
        setLoadingData(false);
      }
    );

    return () => { unsubUsers(); unsubProjects(); unsubDist(); unsubIncome(); unsubWaitlist(); unsubLogs(); unsubPayments(); };
  }, []);

  // ─── COMPUTED STATS ────────────────────────────────────────────────────────
  useEffect(() => {
    if (projectsList.length > 0 && !selectedProjectId) {
      const firstActive = projectsList.find(p => p.isActive === true || p.status === 'active') || projectsList[0];
      setSelectedProjectId(firstActive.id);
    }
  }, [projectsList, selectedProjectId]);

  const selectedProject = projectsList.find(p => p.id === selectedProjectId) || projectsList[0] || null;

  // Let activeProject and activeProjectId represent the selected project globally
  const activeProject = selectedProject;
  const activeProjectId = selectedProjectId;

  useEffect(() => {
    if (activeProjectId && !waitlistForm.projectId) {
      setWaitlistForm(f => ({ ...f, projectId: activeProjectId }));
    }
  }, [activeProjectId, waitlistForm.projectId]);
  const activeProjectMembers = activeProject?.totalMembers || 0;
  const activeProjectCollected = activeProject?.collectedAmount || 0;
  const activeProjectCapacity = activeProject?.totalCapacity || 0;
  const activeProjectPercent = activeProjectCapacity > 0 ? Math.min((activeProjectCollected / activeProjectCapacity) * 100, 100) : 0;

  // ── Project-scoped data (used for analytics stats & charts only) ──────────
  const activeProjUsers = usersList.filter(u => {
    const pId = u.projectId || (projectsList[0]?.id || '');
    return pId === activeProjectId;
  });

  const currentPaymentsProjectId = activeProjectId;
  const selectedProjForPayments = selectedProject;

  const activeProjPayments = paymentsList.filter(p => {
    const pId = p.projectId || (projectsList[0]?.id || '');
    return pId === currentPaymentsProjectId;
  });

  // Analytics stats stay project-scoped
  const totalUsers = activeProjUsers.length;
  const activeMembers = activeProjUsers.filter(u => u.membershipStatus === 'Active').length;
  const inactiveMembers = activeProjUsers.filter(u => u.membershipStatus !== 'Active').length;
  const silverMembers = activeProjUsers.filter(u => u.membershipType === 'Silver' && u.membershipStatus === 'Active').length;
  const goldMembers = activeProjUsers.filter(u => u.membershipType === 'Gold' && u.membershipStatus === 'Active').length;
  const platinumMembers = activeProjUsers.filter(u => u.membershipType === 'Platinum' && u.membershipStatus === 'Active').length;
  
  // Global aggregate metrics (with a note)
  const globalActiveMembers = usersList.filter(u => u.role !== 'admin' && u.membershipStatus === 'Active').length;
  const globalTotalRevenue = paymentsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalRevenue = activeProjPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalCompanyIncome = companyIncomeList.filter(i => i.projectId === selectedProjectId).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalDistributed = distributionsList.filter(d => d.projectId === selectedProjectId && d.status === 'locked').reduce((acc, d) => acc + (d.totalDistributed || 0), 0);
  const pendingDistribution = distributionsList.filter(d => d.projectId === selectedProjectId && d.status === 'confirmed').reduce((acc, d) => acc + (d.totalDistributed || 0), 0);

  const chartData = [
    { label: 'Silver', value: silverMembers },
    { label: 'Gold', value: goldMembers },
    { label: 'Platinum', value: platinumMembers }
  ];

  // ── Member Management table: ALL registered users (including new signups) ──
  const allNonAdminUsers = usersList.filter(u => u.role !== 'admin');

  // ─── FILTERED DATA ─────────────────────────────────────────────────────────
  const filteredUsers = allNonAdminUsers
    .filter(u => u.projectId === selectedProjectId)
    .filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch);
      const matchesPackage = memberFilter === 'All' || u.membershipType === memberFilter;
      return matchesSearch && matchesPackage;
    });

  const filteredPayments = activeProjPayments
    .filter(p => {
      // Only show payments that belong to an existing project
      const pId = p.projectId || (projectsList[0]?.id || '');
      return projectsList.some(proj => proj.id === pId);
    })
    .filter(p =>
      p.userName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.plan?.toLowerCase().includes(paymentSearch.toLowerCase())
    );

  const filteredCompanyIncomeList = companyIncomeList.filter(inc => inc.projectId === selectedProjectId);
  const filteredDistributionsList = distributionsList.filter(d => d.projectId === selectedProjectId);
  const filteredWaitlist = waitlist.filter(w => w.projectId === selectedProjectId);

  // â”€â”€â”€ HANDLERS: MEMBER MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
      await logActivity(currentUser?.uid, userData?.name, 'Update Role', `Changed ${userId} role to ${newRole}`);
      confetti({ particleCount: 30, spread: 30, colors: ['#74E61F', '#105D3D'] });
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this member and ALL their data (payments, earnings)? This cannot be undone.')) return;
    try {
      const batch = writeBatch(db);

      // 1. Fetch user doc to get projectId and payment total
      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
      const userDocSnap = await getDocs(query(collection(db, 'users')));
      const targetUserRef = doc(db, 'users', userId);
      const targetUserData = usersList.find(u => u.uid === userId);

      // 2. Fetch and delete all payments for this user
      const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('userId', '==', userId)));
      let totalPaidAmount = 0;
      paymentsSnap.forEach(d => {
        totalPaidAmount += (d.data().amount || 0);
        batch.delete(d.ref);
      });

      // 3. Delete userEarnings document
      batch.delete(doc(db, 'userEarnings', userId));

      // 4. Decrement project totalMembers and collectedAmount
      const projId = targetUserData?.projectId;
      if (projId) {
        const membersDecrement = targetUserData?.membershipStatus === 'Active' ? -1 : 0;
        batch.set(doc(db, 'projects', projId), {
          totalMembers: increment(membersDecrement),
          collectedAmount: increment(-totalPaidAmount)
        }, { merge: true });
      }

      // 5. Delete the user document
      batch.delete(targetUserRef);

      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Delete User', `Deleted user ${userId} and ${paymentsSnap.size} payment(s), total ₹${totalPaidAmount}`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleEditUserClick = (user) => {
    setEditingUser(user.uid);
    setUserForm({
      name: user.name || '',
      phone: user.phone || '',
      labelCode: user.labelCode || '',
      membershipType: user.membershipType || '',
      membershipStatus: user.membershipStatus || 'Pending',
      paymentStatus: user.paymentStatus || 'Unpaid'
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', editingUser), userForm, { merge: true });
      await logActivity(currentUser?.uid, userData?.name, 'Edit User', `Updated user ${editingUser}`);
      setEditingUser(null);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleActivateMembership = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), { membershipStatus: 'Active', paymentStatus: 'Paid' }, { merge: true });
      await logActivity(currentUser?.uid, userData?.name, 'Activate Membership', `Activated user ${userId}`);
      confetti({ particleCount: 20, spread: 20, colors: ['#74E61F'] });
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDeactivateMembership = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), { membershipStatus: 'Pending' }, { merge: true });
      await logActivity(currentUser?.uid, userData?.name, 'Deactivate Membership', `Deactivated user ${userId}`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleChangePackage = async (userId, pkg) => {
    try {
      await setDoc(doc(db, 'users', userId), { membershipType: pkg }, { merge: true });
      await logActivity(currentUser?.uid, userData?.name, 'Change Package', `Changed ${userId} to ${pkg}`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ─── HANDLERS: DISTRIBUTION SYSTEM ─────────────────────────────────────────
  const handleGeneratePreview = () => {
    if (isDistLocked) return;
    const uIncome = Number(distIncomeForms.utility) || 0;
    const gIncome = Number(distIncomeForms.green) || 0;
    const lIncome = Number(distIncomeForms.loyalty) || 0;
    
    if (uIncome <= 0 && gIncome <= 0 && lIncome <= 0) { alert("Enter a valid income amount for at least one pool."); return; }

    const active = activeProjUsers.filter(u => u.membershipStatus === 'Active');
    const silverCount = active.filter(u => u.membershipType === 'Silver').length;
    const goldCount = active.filter(u => u.membershipType === 'Gold').length;
    const platinumCount = active.filter(u => u.membershipType === 'Platinum').length;

    // Utility Pool Distributions
    const utilityPool_Silver = uIncome * 0.005;
    const utilityPool_Gold = uIncome * 0.01;
    const utilityPool_Platinum = uIncome * 0.02;

    // Green Impact Pool Distributions
    const greenPool_Gold = gIncome * 0.01;
    const greenPool_Platinum = gIncome * 0.02;

    // Loyalty Pool Distributions
    const loyaltyPool_Platinum = lIncome * 0.02;

    setDistPreview({
      utilityIncome: uIncome,
      greenIncome: gIncome,
      loyaltyIncome: lIncome,
      
      silverUtilityShare: silverCount > 0 ? utilityPool_Silver / silverCount : 0,
      
      goldUtilityShare: goldCount > 0 ? utilityPool_Gold / goldCount : 0,
      goldGreenShare: goldCount > 0 ? greenPool_Gold / goldCount : 0,
      
      platinumUtilityShare: platinumCount > 0 ? utilityPool_Platinum / platinumCount : 0,
      platinumGreenShare: platinumCount > 0 ? greenPool_Platinum / platinumCount : 0,
      platinumLoyaltyShare: platinumCount > 0 ? loyaltyPool_Platinum / platinumCount : 0,
      
      silverCount, goldCount, platinumCount,
      totalDistributed: utilityPool_Silver + utilityPool_Gold + utilityPool_Platinum + greenPool_Gold + greenPool_Platinum + loyaltyPool_Platinum
    });
    setDistStep(2);
  };

  const handleConfirmDistribution = async () => {
    setDistLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'distributions'), {
        ...distPreview,
        projectId: activeProjectId,
        distributedAt: serverTimestamp(),
        status: 'confirmed',
        executedBy: currentUser.uid
      });
      setCurrentDistDocId(docRef.id);
      await logActivity(currentUser?.uid, userData?.name, 'Confirm Distribution', `Distribution ${docRef.id} confirmed`);
      setDistStep(3);
    } catch (err) { alert("Error: " + err.message); }
    finally { setDistLoading(false); }
  };

  const handleLockSpecificDistribution = async (distId, distData) => {
    setDistLoading(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'distributions', distId), { status: 'locked' });
      
      const totalIncome = (distData.utilityIncome || 0) + (distData.greenIncome || 0) + (distData.loyaltyIncome || 0);
      const incomeRef = doc(collection(db, 'companyIncome'));
      batch.set(incomeRef, {
        amount: totalIncome,
        utilityIncome: distData.utilityIncome || 0,
        greenIncome: distData.greenIncome || 0,
        loyaltyIncome: distData.loyaltyIncome || 0,
        enteredBy: currentUser.uid,
        enteredAt: serverTimestamp(),
        distributionId: distId,
        projectId: distData.projectId || activeProjectId,
        description: 'Multi-Pool Distribution income'
      });

      if (distData.projectId) {
        batch.set(doc(db, 'projects', distData.projectId), {
          totalUtilityPool: increment(distData.utilityIncome || 0),
          totalGreenImpactPool: increment(distData.greenIncome || 0),
          totalLoyaltyPool: increment(distData.loyaltyIncome || 0),
        }, { merge: true });
      }

      const activeUsers = activeProjUsers.filter(u => u.membershipStatus === 'Active');
      activeUsers.forEach(user => {
        const type = user.membershipType;
        const earnRef = doc(db, 'userEarnings', user.uid);
        const userRef = doc(db, 'users', user.uid);
        
        let uShare = 0, gShare = 0, lShare = 0;
        
        if (type === 'Silver') {
          uShare = distData.silverUtilityShare || 0;
        } else if (type === 'Gold') {
          uShare = distData.goldUtilityShare || 0;
          gShare = distData.goldGreenShare || 0;
        } else if (type === 'Platinum') {
          uShare = distData.platinumUtilityShare || 0;
          gShare = distData.platinumGreenShare || 0;
          lShare = distData.platinumLoyaltyShare || 0;
        }
        
        const totalShare = uShare + gShare + lShare;
        
        if (totalShare > 0) {
          batch.set(earnRef, { 
            utilityPool: increment(uShare), 
            greenImpactPool: increment(gShare),
            loyaltyPool: increment(lShare),
            totalEarnings: increment(totalShare) 
          }, { merge: true });
          batch.set(userRef, { totalEarnings: increment(totalShare) }, { merge: true });
        }
      });

      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Lock Distribution', `Distribution ${distId} locked`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#74E61F', '#105D3D'] });
      return true;
    } catch (err) {
      alert("Error: " + err.message);
      return false;
    } finally {
      setDistLoading(false);
    }
  };

  const handleUnlockSpecificDistribution = async (distId, distData) => {
    if (!window.confirm('Are you sure you want to unlock this distribution? This will deduct the earnings from all active members and reverse the pool increments.')) return;
    setDistLoading(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'distributions', distId), { status: 'confirmed' });

      const incomeSnap = await getDocs(query(collection(db, 'companyIncome'), where('distributionId', '==', distId)));
      incomeSnap.forEach(incomeDoc => {
        batch.delete(doc(db, 'companyIncome', incomeDoc.id));
      });

      if (distData.projectId) {
        batch.set(doc(db, 'projects', distData.projectId), {
          totalUtilityPool: increment(-(distData.utilityIncome || 0)),
          totalGreenImpactPool: increment(-(distData.greenIncome || 0)),
          totalLoyaltyPool: increment(-(distData.loyaltyIncome || 0)),
        }, { merge: true });
      }

      const activeUsers = activeProjUsers.filter(u => u.membershipStatus === 'Active');
      activeUsers.forEach(user => {
        const type = user.membershipType;
        const earnRef = doc(db, 'userEarnings', user.uid);
        const userRef = doc(db, 'users', user.uid);
        
        let uShare = 0, gShare = 0, lShare = 0;
        
        if (type === 'Silver') {
          uShare = distData.silverUtilityShare || 0;
        } else if (type === 'Gold') {
          uShare = distData.goldUtilityShare || 0;
          gShare = distData.goldGreenShare || 0;
        } else if (type === 'Platinum') {
          uShare = distData.platinumUtilityShare || 0;
          gShare = distData.platinumGreenShare || 0;
          lShare = distData.platinumLoyaltyShare || 0;
        }
        
        const totalShare = uShare + gShare + lShare;
        
        if (totalShare > 0) {
          batch.set(earnRef, { 
            utilityPool: increment(-uShare), 
            greenImpactPool: increment(-gShare),
            loyaltyPool: increment(-lShare),
            totalEarnings: increment(-totalShare) 
          }, { merge: true });
          batch.set(userRef, { totalEarnings: increment(-totalShare) }, { merge: true });
        }
      });

      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Unlock Distribution', `Distribution ${distId} unlocked`);
      return true;
    } catch (err) {
      alert("Error: " + err.message);
      return false;
    } finally {
      setDistLoading(false);
    }
  };

  const handleLockDistribution = async () => {
    if (!currentDistDocId || !distPreview) return;
    const success = await handleLockSpecificDistribution(currentDistDocId, distPreview);
    if (success) {
      setDistStep(4);
    }
  };

  // â”€â”€â”€ HANDLERS: COMPANY INCOME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddIncome = async (e) => {
    e.preventDefault();
    const amount = Number(incomeForm.amount);
    if (isNaN(amount) || amount <= 0) { alert('Enter a valid amount.'); return; }
    setIncomeSubmitting(true);
    try {
      await addDoc(collection(db, 'companyIncome'), {
        amount,
        description: incomeForm.description || 'Manual entry',
        enteredBy: currentUser.uid,
        enteredAt: serverTimestamp(),
        projectId: selectedProjectId
      });
      await logActivity(currentUser?.uid, userData?.name, 'Add Company Income', `Added income â‚¹${amount}`);
      setIncomeForm({ amount: '', description: '' });
    } catch (err) { alert('Error: ' + err.message); }
    finally { setIncomeSubmitting(false); }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await deleteDoc(doc(db, 'companyIncome', id));
      await logActivity(currentUser?.uid, userData?.name, 'Delete Income', `Deleted income record ${id}`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  // â”€â”€â”€ HANDLERS: MEMBERSHIP CONTROLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleBulkActivate = async () => {
    if (!window.confirm('Activate ALL pending members?')) return;
    setBulkActionStatus('Processing...');
    try {
      const batch = writeBatch(db);
      const pending = activeProjUsers.filter(u => u.membershipStatus === 'Pending' && u.paymentStatus === 'Paid');
      pending.forEach(u => batch.set(doc(db, 'users', u.uid), { membershipStatus: 'Active' }, { merge: true }));
      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Bulk Activate', `Activated ${pending.length} members`);
      setBulkActionStatus(`Activated ${pending.length} members!`);
      confetti({ particleCount: 50, spread: 50, colors: ['#74E61F'] });
      setTimeout(() => setBulkActionStatus(''), 3000);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm('Deactivate ALL active members?')) return;
    setBulkActionStatus('Processing...');
    try {
      const batch = writeBatch(db);
      const active = activeProjUsers.filter(u => u.membershipStatus === 'Active');
      active.forEach(u => batch.set(doc(db, 'users', u.uid), { membershipStatus: 'Pending' }, { merge: true }));
      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Bulk Deactivate', `Deactivated ${active.length} members`);
      setBulkActionStatus(`Deactivated ${active.length} members!`);
      setTimeout(() => setBulkActionStatus(''), 3000);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleValidateActiveMembers = async () => {
    setBulkActionStatus('Validating...');
    try {
      const active = activeProjUsers.filter(u => u.membershipStatus === 'Active');
      const batch = writeBatch(db);
      let count = 0;
      active.forEach(u => {
        if (u.paymentStatus !== 'Paid') {
          batch.set(doc(db, 'users', u.uid), { membershipStatus: 'Pending' }, { merge: true });
          count++;
        }
      });
      if (count > 0) await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Validate Members', `Deactivated ${count} non-paying members`);
      setBulkActionStatus(`Validated: ${count} members deactivated.`);
      setTimeout(() => setBulkActionStatus(''), 3000);
    } catch (err) { alert('Error: ' + err.message); }
  };

  // â”€â”€â”€ HANDLERS: PROJECTS CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setProjectStatus({ success: false, error: '' });
    const data = {
      name: projectForm.name,
      location: projectForm.location,
      totalCapacity: Number(projectForm.totalCapacity),
      collectedAmount: Number(projectForm.collectedAmount),
      totalMembers: Number(projectForm.totalMembers),
      status: projectForm.status,
      description: projectForm.description,
      imageUrl: projectForm.imageUrl,
      isActive: projectForm.isActive,
      powerRating: projectForm.powerRating,
      chargingBays: projectForm.chargingBays,
      dailyUsers: projectForm.dailyUsers,
      co2Saved: projectForm.co2Saved,
      silverPrice: Number(projectForm.silverPrice) || 0,
      silverDesc: projectForm.silverDesc || '',
      silverFeatures: projectForm.silverFeatures || '',
      goldPrice: Number(projectForm.goldPrice) || 0,
      goldDesc: projectForm.goldDesc || '',
      goldFeatures: projectForm.goldFeatures || '',
      platinumPrice: Number(projectForm.platinumPrice) || 0,
      platinumDesc: projectForm.platinumDesc || '',
      platinumFeatures: projectForm.platinumFeatures || '',
      lastUpdated: new Date().toISOString()
    };
    if (isNaN(data.totalCapacity) || isNaN(data.collectedAmount) || isNaN(data.totalMembers)) {
      setProjectStatus({ success: false, error: 'Numeric fields must be valid numbers.' });
      return;
    }
    try {
      if (editingProjectId) {
        await setDoc(doc(db, 'projects', editingProjectId), data, { merge: true });
        await logActivity(currentUser?.uid, userData?.name, 'Update Project', `Updated project ${editingProjectId}`);
      } else {
        const docRef = await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() });
        await logActivity(currentUser?.uid, userData?.name, 'Create Project', `Created project ${docRef.id}`);
      }
      setProjectStatus({ success: true, error: '' });
      setShowProjectForm(false);
      setEditingProjectId(null);
      setProjectForm({ name: '', location: '', totalCapacity: '', collectedAmount: '', totalMembers: '', status: 'Pending', description: '', imageUrl: '', isActive: false, powerRating: '', chargingBays: '', dailyUsers: '', co2Saved: '', silverPrice: '', silverDesc: '', silverFeatures: '', goldPrice: '', goldDesc: '', goldFeatures: '', platinumPrice: '', platinumDesc: '', platinumFeatures: '' });
      setProjectFormTab('general');
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.8 }, colors: ['#74E61F', '#22C55E'] });
      setTimeout(() => setProjectStatus(p => ({ ...p, success: false })), 3000);
    } catch (err) {
      setProjectStatus({ success: false, error: 'Failed: ' + err.message });
    }
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name || '',
      location: project.location || '',
      totalCapacity: project.totalCapacity || '',
      collectedAmount: project.collectedAmount || '',
      totalMembers: project.totalMembers || '',
      status: project.status || 'Pending',
      description: project.description || '',
      imageUrl: project.imageUrl || '',
      isActive: project.isActive || false,
      powerRating: project.powerRating || '',
      chargingBays: project.chargingBays || '',
      dailyUsers: project.dailyUsers || '',
      co2Saved: project.co2Saved || '',
      silverPrice: project.silverPrice || '',
      silverDesc: project.silverDesc || '',
      silverFeatures: project.silverFeatures || '',
      goldPrice: project.goldPrice || '',
      goldDesc: project.goldDesc || '',
      goldFeatures: project.goldFeatures || '',
      platinumPrice: project.platinumPrice || '',
      platinumDesc: project.platinumDesc || '',
      platinumFeatures: project.platinumFeatures || ''
    });
    setShowProjectForm(true);
    setProjectFormTab('general');
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project? This will also remove all associated payments, members, distributions, and income records.')) return;
    try {
      const batch = writeBatch(db);

      // Delete the project itself
      batch.delete(doc(db, 'projects', projectId));

      // Delete associated payments
      const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('projectId', '==', projectId)));
      paymentsSnap.forEach(d => batch.delete(d.ref));

      // Reset users belonging to this project
      const usersSnap = await getDocs(query(collection(db, 'users'), where('projectId', '==', projectId)));
      usersSnap.forEach(d => batch.update(d.ref, {
        projectId: null,
        membershipStatus: 'Pending',
        paymentStatus: 'Unpaid',
        membershipType: '',
      }));

      // Delete distributions
      const distSnap = await getDocs(query(collection(db, 'distributions'), where('projectId', '==', projectId)));
      distSnap.forEach(d => batch.delete(d.ref));

      // Delete company income records
      const incomeSnap = await getDocs(query(collection(db, 'companyIncome'), where('projectId', '==', projectId)));
      incomeSnap.forEach(d => batch.delete(d.ref));

      // Delete waitlist entries
      const waitlistSnap = await getDocs(query(collection(db, 'waitlist'), where('projectId', '==', projectId)));
      waitlistSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Delete Project', `Deleted project ${projectId} and all associated data`);

      // If the deleted project was selected, switch to another
      if (selectedProjectId === projectId) {
        const remaining = projectsList.filter(p => p.id !== projectId);
        setSelectedProjectId(remaining[0]?.id || '');
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleToggleProjectActive = async (projectId, currentIsActive) => {
    try {
      const newActive = !currentIsActive;
      await updateDoc(doc(db, 'projects', projectId), {
        isActive: newActive,
        status: newActive ? 'active' : 'inactive',
        lastUpdated: new Date().toISOString()
      });
      await logActivity(currentUser?.uid, userData?.name, 'Toggle Project Active', `Set project ${projectId} to ${newActive ? 'active' : 'inactive'}`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  // â”€â”€â”€ HANDLERS: WAITLIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddToWaitlist = async (e) => {
    e.preventDefault();
    if (!waitlistForm.name || !waitlistForm.email) { alert('Name and email required.'); return; }
    setWaitlistSubmitting(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        name: waitlistForm.name,
        email: waitlistForm.email,
        phone: waitlistForm.phone || '',
        preferredPlan: waitlistForm.preferredPlan,
        projectId: waitlistForm.projectId || activeProjectId || '',
        createdAt: serverTimestamp(),
        status: 'Pending'
      });
      await logActivity(currentUser?.uid, userData?.name, 'Add Waitlist', `Added ${waitlistForm.email} to waitlist`);
      setWaitlistForm({ name: '', email: '', phone: '', preferredPlan: 'Silver', projectId: activeProjectId || '' });
    } catch (err) { alert('Error: ' + err.message); }
    finally { setWaitlistSubmitting(false); }
  };

  const handleRemoveFromWaitlist = async (id) => {
    if (!window.confirm('Remove this entry from waitlist?')) return;
    try {
      await deleteDoc(doc(db, 'waitlist', id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleWaitlistStatus = async (id, status) => {
    try {
      await setDoc(doc(db, 'waitlist', id), { status }, { merge: true });
    } catch (err) { alert('Error: ' + err.message); }
  };

  // â”€â”€â”€ HANDLERS: EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExportPayments = () => {
    exportToCSV(
      paymentsList.map(p => ({ Name: p.userName, Email: p.userEmail, Plan: p.plan, Amount: p.amount, TransactionID: p.transactionId, Status: p.status, Date: new Date(p.date).toLocaleDateString('en-IN') })),
      'payments_export',
      ['Name', 'Email', 'Plan', 'Amount', 'TransactionID', 'Status', 'Date']
    );
    logActivity(currentUser?.uid, userData?.name, 'Export Payments', 'Exported payments CSV');
  };

  const handleApprovePayment = async (tx) => {
    if (!window.confirm(`Are you sure you want to approve payment ${tx.transactionId}?`)) return;
    try {
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'payments', tx.id), { status: 'Success' });
      
      const pId = tx.projectId || activeProjectId;
      batch.set(doc(db, 'users', tx.userId), {
        membershipStatus: 'Active',
        paymentStatus: 'Paid',
        membershipType: tx.plan,
        projectId: pId
      }, { merge: true });
      
      if (pId) {
        batch.set(doc(db, 'projects', pId), {
          collectedAmount: increment(tx.amount || 0),
          totalMembers: increment(1)
        }, { merge: true });
      }
      
      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Approve Payment', `Approved manual payment ${tx.transactionId} for ${tx.userEmail}`);
      confetti({ particleCount: 50, spread: 50, colors: ['#74E61F'] });
    } catch (err) {
      alert('Error approving payment: ' + err.message);
    }
  };

  const handleRejectPayment = async (tx) => {
    if (!window.confirm(`Are you sure you want to reject payment ${tx.transactionId}?`)) return;
    try {
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'payments', tx.id), { status: 'Failed' });
      
      batch.set(doc(db, 'users', tx.userId), {
        paymentStatus: 'Failed'
      }, { merge: true });
      
      await batch.commit();
      await logActivity(currentUser?.uid, userData?.name, 'Reject Payment', `Rejected manual payment ${tx.transactionId} for ${tx.userEmail}`);
    } catch (err) {
      alert('Error rejecting payment: ' + err.message);
    }
  };

  const handleExportDistributions = () => {
    exportToCSV(
      distributionsList.map(d => ({
        Date: d.distributedAt?.toDate ? d.distributedAt.toDate().toLocaleDateString('en-IN') : 'N/A',
        'Utility Income': d.utilityIncome || 0,
        'Green Income': d.greenIncome || 0,
        'Loyalty Income': d.loyaltyIncome || 0,
        'Total Dist': d.totalDistributed || 0,
        Status: d.status
      })),
      'distributions_export',
      ['Date', 'Utility Income', 'Green Income', 'Loyalty Income', 'Total Dist', 'Status']
    );
  };

  const handleExportUsers = () => {
    exportToCSV(
      filteredUsers.map(u => ({
        Name: u.name, Email: u.email, Phone: u.phone, Role: u.role,
        'Label Code': u.labelCode || '',
        Package: u.membershipType, Status: u.membershipStatus, Payment: u.paymentStatus
      })),
      'users_export',
      ['Name', 'Email', 'Phone', 'Role', 'Label Code', 'Package', 'Status', 'Payment']
    );
  };

  // â”€â”€â”€ HANDLERS: AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin');
    } catch (err) { console.error(err); }
  };

  // â”€â”€â”€ SIDEBAR ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sidebarMenuItems = [
    { id: 'analytics', name: 'Overview', icon: LayoutDashboard },
    { id: 'users', name: 'Members', icon: Users },
    { id: 'payments', name: 'Payments', icon: Wallet },
    { id: 'earnings', name: 'Company Earnings', icon: TrendingUp },
    { id: 'distribution', name: 'Distribution', icon: PieChart },
    { id: 'membership', name: 'Membership Controls', icon: Shield },
    { id: 'projects', name: 'Projects', icon: Building2 },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'waitlist', name: 'Waitlist', icon: ClipboardList },
    { id: 'logs', name: 'Activity Logs', icon: Activity }
  ];

  const bg = 'bg-[#F7FBF9]';
  const cardBg = 'bg-white';
  const cardBorder = 'border-[#B7E4C7]';
 const textPrimary = 'text-gray-900';
const textSecondary = 'text-gray-700';
  const inputBg = 'bg-[#F7FBF9]';
  // Light mode is always on â€” darkMode kept as false so existing ternaries resolve correctly
  const darkMode = false;

  return (
    <AdminProjectContext.Provider value={{ projects: projectsList, selectedProject, setSelectedProject: (proj) => setSelectedProjectId(proj?.id || '') }}>
      <div ref={pageRef} className={`min-h-screen ${bg} ${textPrimary} flex font-inter relative transition-colors duration-300`}>
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
          <Link to="/" className="flex items-center space-x-3">
            <img src="/stoshi_logo.webp" alt="Stoshi" className="h-12 w-auto" />
            <div>
              <span className="text-[10px] font-extrabold text-[#40916C] tracking-widest block uppercase">Admin Portal</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3 p-4 rounded-2xl border bg-white border-[#B7E4C7]" style={{ boxShadow: '0 2px 8px rgba(27,67,50,0.06)' }}>
            <div className="w-10 h-10 rounded-full bg-[#40916C] text-white flex items-center justify-center font-bold text-sm shadow-inner">AD</div>
            <div>
              <span className="text-xs font-bold block truncate text-[#1B4332]">{userData?.name || 'Administrator'}</span>
              <span className="px-2 py-0.5 mt-1 rounded text-[8px] font-extrabold font-sora uppercase border bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] inline-block">Systems Admin</span>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarMenuItems.map((item) => {
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
          <Link to="/"
            className="w-full px-4 py-3 border border-[#B7E4C7] text-[#40916C] hover:text-[#1B4332] hover:bg-[#B7E4C7] rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Landing Page</span>
          </Link>
          <button onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-2xl flex items-center space-x-3.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto z-10 max-w-7xl mx-auto w-full`}>
        <div className={`flex justify-between items-center mb-8 ${cardBg} p-6 rounded-[32px] border ${cardBorder} backdrop-blur-sm`}>
          <div>
            <h2 className={`text-xl md:text-2xl font-extrabold font-sora ${textPrimary}`}>Green Infrastructure Console</h2>
            <p className={`text-xs font-semibold mt-1 ${textSecondary}`}>Active Control over all operations</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const f = async () => {
                setLoadingData(true);
                try {
                  const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
                  const pSnap = await getDocs(q);
                  setPaymentsList(pSnap.docs.map(d => {
                    const data = d.data();
                    return { id: d.id, ...data, date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() };
                  }));
                } catch (err) { console.error(err); }
                finally { setLoadingData(false); }
              }; f();
            }}
              className="p-3 bg-[#F7FBF9] border border-[#B7E4C7] text-[#40916C] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-2xl cursor-pointer"
              title="Refresh data">
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#74E61F]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Project Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {projectsList.map((project) => {
            const isSelected = project.id === selectedProjectId;
            const isLive = project.isActive === true || project.status === 'active';
            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`px-5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1b4332] border-[#1b4332] text-white shadow-md'
                    : 'bg-white border-[#B7E4C7] text-[#40916C] hover:bg-[#D8F3DC] hover:text-[#1B4332]'
                }`}
              >
                <span>{project.name || 'Unnamed Project'}</span>
                {isLive && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                    isSelected ? 'bg-[#74E61F]/20 text-[#74E61F]' : 'bg-[#74E61F] text-[#042A1d]'
                  }`}>
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-8">

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• OVERVIEW / ANALYTICS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'analytics' && (
                <div className="space-y-8">
                {/* Active Project Banner */}
                {activeProject && (
                  <div className={`p-6 ${cardBg} border-2 border-[#74E61F]/30 rounded-[32px] bg-gradient-to-r from-[#F7FBF9] to-[#D8F3DC]`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#74E61F] uppercase tracking-widest">Active Project</span>
                        <h3 className="text-xl font-black font-sora text-[#1B4332] mt-1">{activeProject.name || 'Active Project'}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs font-semibold text-[#40916C]">Members: <strong className="text-[#1B4332]">{activeProjectMembers}</strong></span>
                          <span className="text-xs font-semibold text-[#40916C]">Collected: <strong className="text-[#1B4332]">{formatRupee(activeProjectCollected)}</strong></span>
                          <span className="text-xs font-semibold text-[#40916C]">Goal: <strong className="text-[#1B4332]">{formatRupee(activeProjectCapacity)}</strong></span>
                          <span className="text-xs font-semibold text-[#40916C]">Progress: <strong className="text-[#1B4332]">{activeProjectPercent.toFixed(0)}%</strong></span>
                        </div>
                      </div>
                      <div className="w-full max-w-xs">
                        <div className="w-full bg-[#B7E4C7] h-2 rounded-full overflow-hidden">
                          <div className="bg-[#74E61F] h-full rounded-full transition-all" style={{ width: `${activeProjectPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Building2 className="w-5 h-5" />} label="Project Members" value={activeProjectMembers} color="text-[#74E61F]" bgColor="bg-[#74E61F]/10" borderColor="border-[#74E61F]/10" note={`Global active members: ${globalActiveMembers}`} />
                  <StatCard icon={<Check className="w-5 h-5" />} label="Active Members (All)" value={loadingData ? '...' : activeMembers} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/10" />
                  <StatCard icon={<Wallet className="w-5 h-5" />} label="Pool Collected" value={formatRupee(activeProjectCollected)} color="text-cyan-400" bgColor="bg-cyan-500/10" borderColor="border-cyan-500/10" />
                  <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Revenue" value={loadingData ? '...' : formatRupee(totalRevenue)} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/10" note={`Global revenue: ${formatRupee(globalTotalRevenue)}`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Award className="w-5 h-5" />} label="Silver Members" value={silverMembers} color="text-[#2D3748]" bgColor="bg-slate-500/10" borderColor="border-slate-500/10" />
                  <StatCard icon={<Award className="w-5 h-5" />} label="Gold Members" value={goldMembers} color="text-amber-400" bgColor="bg-amber-500/10" borderColor="border-amber-500/10" />
                  <StatCard icon={<Award className="w-5 h-5" />} label="Platinum Members" value={platinumMembers} color="text-purple-400" bgColor="bg-purple-500/10" borderColor="border-purple-500/10" />
                  <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Company Income" value={formatRupee(totalCompanyIncome)} color="text-cyan-400" bgColor="bg-cyan-500/10" borderColor="border-cyan-500/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Total Distributed" value={formatRupee(totalDistributed)} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/10" />
                  <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Distribution" value={formatRupee(pendingDistribution)} color="text-amber-400" bgColor="bg-amber-500/10" borderColor="border-amber-500/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className={`lg:col-span-6 p-6 ${cardBg} border ${cardBorder} rounded-[32px] space-y-4`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Members by Package</h3>
                    <div className="h-40">
                      <MiniBarChart data={chartData} color="#74E61F" height={140} />
                    </div>
                  </div>

                  <div className={`lg:col-span-6 p-6 ${cardBg} border ${cardBorder} rounded-[32px] space-y-4`}>
                    <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Active Members Distribution</h3>
                    <div className="flex justify-around items-center pt-4">
                      <MiniDoughnut percent={activeMembers > 0 ? (silverMembers / activeMembers) * 100 : 0} color="#94A3B8" label="Silver" value={silverMembers} />
                      <MiniDoughnut percent={activeMembers > 0 ? (goldMembers / activeMembers) * 100 : 0} color="#FBBF24" label="Gold" value={goldMembers} />
                      <MiniDoughnut percent={activeMembers > 0 ? (platinumMembers / activeMembers) * 100 : 0} color="#A855F7" label="Platinum" value={platinumMembers} />
                    </div>
                  </div>
                </div>

                <div className={`lg:col-span-12 p-6 ${cardBg} border ${cardBorder} rounded-[32px] space-y-4`}>
                  <h3 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Latest Activity</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activityLogs.slice(0, 5).map((log, i) => (
                      <div key={log.id || i} className={`p-3 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} rounded-xl border ${cardBorder} flex justify-between items-center text-xs`}>
                        <div>
                          <span className={`font-bold block ${textPrimary}`}>{log.action}</span>
                          <span className={`text-[10px] font-semibold ${textSecondary}`}>{log.details || ''}  {log.userName}</span>
                        </div>
                        <span className={`text-[10px] ${textSecondary}`}>
                          {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                    {activityLogs.length === 0 && <p className={`text-xs ${textSecondary} text-center py-4`}>No activity yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MEMBERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'users' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Member Management</h3>
                    <p className={`text-xs mt-1 ${textSecondary}`}>Showing members for <strong>{selectedProject?.name || 'selected project'}</strong></p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search members..." value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className={`w-full pl-11 pr-4 py-2.5 rounded-2xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-semibold text-[#1B4332] transition-colors`} />
                    </div>
                    <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}
                      className={`px-4 py-2.5 rounded-2xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-semibold text-[#1B4332] transition-colors`}>
                      <option value="All">All Packages</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                    <button onClick={handleExportUsers}
                      className={`px-4 py-2.5 rounded-2xl ${darkMode ? 'bg-[#F7FBF9] border-[#B7E4C7] text-[#2D3748]' : 'bg-slate-100 border-slate-200 text-slate-600'} border hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-xs font-bold uppercase cursor-pointer flex items-center gap-2`}>
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                        <th className="p-4">Name & Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Label Code</th>
                        <th className="p-4">Package</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y ${cardBorder} text-xs font-medium">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                          <td className="p-4 cursor-pointer text-left group/name" onClick={() => handleImpersonateUser(user)} title="View User Dashboard">
                            <span className={`font-bold block ${textPrimary} group-hover/name:text-[#74E61F] transition-colors`}>{user.name}</span>
                            <span className={`text-[10px] block font-semibold ${textSecondary} group-hover/name:text-[#74E61F]/80 transition-colors`}>{user.email}</span>
                          </td>
                          <td className="p-4 font-mono font-bold">{user.phone || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{user.role}</span>
                          </td>
                          <td className="p-4">
                            {user.labelCode
                              ? <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#74E61F]/10 text-[#1B4332] border border-[#74E61F]/30 font-mono tracking-wider">{user.labelCode}</span>
                              : <span className="text-[10px] text-slate-400 font-semibold">—</span>
                            }
                          </td>
                          <td className="p-4 font-bold">
                            <span>{user.membershipType || 'None'}</span>
                            {!user.projectId && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 align-middle">NEW</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${user.membershipStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{user.membershipStatus || 'Pending'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${user.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{user.paymentStatus || 'Unpaid'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center items-center space-x-1.5 flex-wrap gap-1">
                              <button onClick={() => handleEditUserClick(user)}
                                className="p-2 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-xl border border-[#B7E4C7] text-[#2D3748] cursor-pointer" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {user.membershipStatus !== 'Active' && user.paymentStatus === 'Paid' && (
                                <button onClick={() => handleActivateMembership(user.uid)}
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all rounded-xl border border-emerald-500/20 text-emerald-400 cursor-pointer" title="Activate">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {user.membershipStatus === 'Active' && (
                                <button onClick={() => handleDeactivateMembership(user.uid)}
                                  className="p-2 bg-amber-500/10 hover:bg-amber-500 hover:text-white transition-all rounded-xl border border-amber-500/20 text-amber-400 cursor-pointer" title="Deactivate">
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div className="relative group">
                                <button className="p-2 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-xl border border-[#B7E4C7] text-[#2D3748] cursor-pointer" title="Change Package">
                                  <Award className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white border border-[#B7E4C7] rounded-xl shadow-xl z-50 hidden group-hover:block min-w-[130px]">
                                  {['Silver', 'Gold', 'Platinum'].map(pkg => (
                                    <button key={pkg} onClick={() => handleChangePackage(user.uid, pkg)}
                                      className="block w-full text-left px-4 py-2 text-xs text-[#2D3748] hover:text-white hover:bg-white/5 transition first:rounded-t-xl last:rounded-b-xl cursor-pointer">
                                      {pkg}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button onClick={() => handleToggleAdmin(user.uid, user.role)}
                                className="p-2 bg-[#F7FBF9] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all rounded-xl border border-[#B7E4C7] text-[#2D3748] cursor-pointer" title="Toggle Role">
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteUser(user.uid)}
                                className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/20 text-red-400 cursor-pointer" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan="8" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No matching members found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className={`w-full max-w-md ${cardBg} border ${cardBorder} rounded-[32px] p-6 shadow-2xl space-y-6`}>
                      <div className={`flex justify-between items-center border-b ${cardBorder} pb-4`}>
                        <h4 className={`text-base font-bold font-sora ${textPrimary}`}>Edit Member</h4>
                        <button onClick={() => setEditingUser(null)} className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'} cursor-pointer`}><X className="w-5 h-5" /></button>
                      </div>
                      <form onSubmit={handleUpdateUser} className="space-y-4">
                        <InputField label="Full Name" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                        <InputField label="Phone" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#40916C]">Label Code</label>
                          <input
                            type="text"
                            value={userForm.labelCode || ''}
                            onChange={(e) => setUserForm({...userForm, labelCode: e.target.value})}
                            placeholder="e.g. LC-001"
                            className={`w-full px-4 py-2.5 rounded-2xl ${inputBg} border border-[#B7E4C7] focus:border-[#40916C] focus:outline-none text-xs font-mono font-bold text-[#1B4332] transition-colors`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <SelectField label="Package" value={userForm.membershipType} onChange={(e) => setUserForm({...userForm, membershipType: e.target.value})} options={['', 'Silver', 'Gold', 'Platinum']} inputBg={inputBg} darkMode={darkMode} />
                          <SelectField label="Status" value={userForm.membershipStatus} onChange={(e) => setUserForm({...userForm, membershipStatus: e.target.value})} options={['Pending', 'Active']} inputBg={inputBg} darkMode={darkMode} />
                        </div>
                        <SelectField label="Payment Status" value={userForm.paymentStatus} onChange={(e) => setUserForm({...userForm, paymentStatus: e.target.value})} options={['Unpaid', 'Paid']} inputBg={inputBg} darkMode={darkMode} />
                        <div className="flex gap-3 pt-4 border-t ${cardBorder}">
                          <button type="button" onClick={() => setEditingUser(null)}
                            className={`flex-1 py-3 border ${cardBorder} rounded-2xl text-xs font-bold uppercase ${textSecondary} hover:text-white transition cursor-pointer`}>Cancel</button>
                          <button type="submit"
                            className="flex-1 py-3 bg-[#74E61F] text-[#042A1d] rounded-2xl text-xs font-bold uppercase hover:bg-white hover:text-black transition cursor-pointer">Save</button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PAYMENTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'payments' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Payment Management</h3>
                    <p className={`text-xs mt-1 ${textSecondary}`}>Transactions for <strong>{selectedProject?.name || 'selected project'}</strong></p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search transactions..." value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className={`w-full pl-11 pr-4 py-2.5 rounded-2xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-semibold text-[#1B4332] transition-colors`} />
                    </div>
                    <button onClick={handleExportPayments}
                      className="px-4 py-2.5 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] text-[#2D3748] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-xs font-bold uppercase cursor-pointer flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Project filtered by global selector above */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-3xl border border-[#B7E4C7] shadow-sm flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#40916C] uppercase tracking-widest block mb-1">Total Members</span>
                      <div className="text-2xl font-extrabold font-sora text-[#1B4332]">{selectedProjForPayments?.totalMembers || 0}</div>
                    </div>
                  </div>
                  <div className="p-5 bg-white rounded-3xl border border-[#B7E4C7] shadow-sm flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#74E61F]/10 text-[#74E61F] flex items-center justify-center shrink-0 border border-[#74E61F]/20">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#40916C] uppercase tracking-widest block mb-1">Total Funds Raised</span>
                      <div className="text-2xl font-extrabold font-sora text-[#1B4332]">{formatRupee(selectedProjForPayments?.collectedAmount || 0)}</div>
                    </div>
                  </div>
                </div>

                <div className={`overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                        <th className="p-4">Transaction ID</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Package</th>
                        <th className="p-4">Method</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${cardBorder} text-xs font-medium`}>
                      {filteredPayments.map((tx) => (
                        <tr key={tx.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                          <td className={`p-4 font-mono font-bold uppercase ${textPrimary}`}>{tx.transactionId}</td>
                          <td className="p-4">
                            <span className={`font-bold block ${textPrimary}`}>{tx.userName}</span>
                            <span className={`text-[10px] block font-semibold ${textSecondary}`}>{tx.userEmail}</span>
                          </td>
                          <td className="p-4 font-bold">{tx.plan}</td>
                          <td className={`p-4 font-bold ${textSecondary}`}>{tx.paymentMethod || 'Razorpay'}</td>
                          <td className={`p-4 text-right text-[#74E61F] font-sora font-semibold`}>{formatRupee(tx.amount)}</td>
                          <td className={`p-4 ${textSecondary}`}>
                            {new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === 'Success'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.status === 'pending_verification'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {tx.status === 'pending_verification' ? 'Pending Verification' : tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {tx.status === 'pending_verification' ? (
                                <>
                                  {tx.paymentProofUrl && (
                                    <a
                                      href={tx.paymentProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-[#74E61F]/10 hover:bg-[#74E61F] hover:text-[#042A1d] text-[#74E61F] rounded-lg transition-all border border-[#74E61F]/20 flex items-center justify-center cursor-pointer"
                                      title="View Proof"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleApprovePayment(tx)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg transition-all border border-emerald-500/20 flex items-center justify-center cursor-pointer"
                                    title="Approve"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(tx)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-all border border-red-500/20 flex items-center justify-center cursor-pointer"
                                    title="Reject"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className={`text-[10px] ${textSecondary}`}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr><td colSpan="8" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COMPANY EARNINGS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'earnings' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Company Earning Report</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Manually enter and track company income</p>
                </div>

                <form onSubmit={handleAddIncome} className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Add Company Income</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Amount (â‚¹)</label>
                      <input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                        placeholder="e.g. 500000"
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors`} required />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Description</label>
                      <input type="text" value={incomeForm.description} onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                        placeholder="e.g. Q1 Revenue"
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors`} />
                    </div>
                  </div>
                  <button type="submit" disabled={incomeSubmitting}
                    className="px-6 py-3 bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer text-xs disabled:opacity-50">
                    {incomeSubmitting ? 'Adding...' : 'Add Income Record'}
                  </button>
                </form>

                <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Entered By</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y ${cardBorder} text-xs font-medium">
                      {filteredCompanyIncomeList.map((inc) => (
                        <tr key={inc.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                          <td className={`p-4 ${textSecondary}`}>
                            {inc.enteredAt?.toDate ? new Date(inc.enteredAt.toDate()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="p-4 text-right text-[#74E61F] font-sora font-bold">{formatRupee(inc.amount)}</td>
                          <td className="p-4">{inc.description || 'â€”'}</td>
                          <td className={`p-4 ${textSecondary}`}>{inc.enteredBy?.slice(0, 8) || 'N/A'}...</td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDeleteIncome(inc.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/20 text-red-400 cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCompanyIncomeList.length === 0 && (
                        <tr><td colSpan="5" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No income records for this project.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={`p-4 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl flex justify-between items-center`}>
                  <span className={`text-xs font-bold uppercase ${textSecondary}`}>Total Company Income &mdash; <em className="normal-case font-medium">{selectedProject?.name}</em></span>
                  <span className="text-lg font-bold text-[#74E61F] font-sora">{formatRupee(totalCompanyIncome)}</span>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DISTRIBUTION â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'distribution' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-8`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Distribution System</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Calculate, preview, and lock earnings distributions (ONE TIME ONLY)</p>
                </div>

                <div className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl`}>
                  {distStep === 1 && (
                    <div className="space-y-4">
                      <h4 className={`text-sm font-bold ${textPrimary} uppercase tracking-wider`}>Step 1: Enter Income</h4>
                      {isDistLocked && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          A distribution has already been locked. Cannot run again.
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Utility Pool Income (â‚¹)</label>
                          <input type="number" value={distIncomeForms.utility} onChange={(e) => setDistIncomeForms({...distIncomeForms, utility: e.target.value})}
                            disabled={isDistLocked} placeholder="e.g. 100000"
                            className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors disabled:opacity-50`} />
                        </div>
                        <div>
                          <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Green Impact Pool Income (â‚¹)</label>
                          <input type="number" value={distIncomeForms.green} onChange={(e) => setDistIncomeForms({...distIncomeForms, green: e.target.value})}
                            disabled={isDistLocked} placeholder="e.g. 50000"
                            className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors disabled:opacity-50`} />
                        </div>
                        <div>
                          <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Loyalty Pool Income (â‚¹)</label>
                          <input type="number" value={distIncomeForms.loyalty} onChange={(e) => setDistIncomeForms({...distIncomeForms, loyalty: e.target.value})}
                            disabled={isDistLocked} placeholder="e.g. 20000"
                            className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors disabled:opacity-50`} />
                        </div>
                      </div>
                      <button onClick={handleGeneratePreview} disabled={isDistLocked || (!distIncomeForms.utility && !distIncomeForms.green && !distIncomeForms.loyalty)}
                        className="px-6 py-3 bg-[#1B4332] text-white font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-[#74E61F] hover:text-[#042A1d] transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed mt-4 block">
                        Generate Preview
                      </button>
                    </div>
                  )}

                  {distStep === 2 && distPreview && (
                    <div className="space-y-6">
                      <h4 className={`text-sm font-bold ${textPrimary} uppercase tracking-wider`}>Step 2: Preview Distribution</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 bg-slate-50 border ${cardBorder} rounded-xl`}>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Utility Pool Rewards</h5>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Silver Share:</span> <span>{formatRupee(distPreview.silverUtilityShare)}</span></p>
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Gold Share:</span> <span>{formatRupee(distPreview.goldUtilityShare)}</span></p>
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Platinum Share:</span> <span>{formatRupee(distPreview.platinumUtilityShare)}</span></p>
                          </div>
                        </div>
                        <div className={`p-4 bg-slate-50 border ${cardBorder} rounded-xl`}>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Green Impact Pool Rewards</h5>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Gold Share:</span> <span>{formatRupee(distPreview.goldGreenShare)}</span></p>
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Platinum Share:</span> <span>{formatRupee(distPreview.platinumGreenShare)}</span></p>
                          </div>
                        </div>
                        <div className={`p-4 bg-slate-50 border ${cardBorder} rounded-xl`}>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Loyalty Pool Rewards</h5>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-600 flex justify-between"><span>Platinum Share:</span> <span>{formatRupee(distPreview.platinumLoyaltyShare)}</span></p>
                          </div>
                        </div>
                      </div>
                      <div className={`flex justify-between items-center ${darkMode ? 'bg-white' : 'bg-slate-100'} p-4 rounded-xl border ${cardBorder}`}>
                        <span className={`text-xs ${textSecondary} font-bold uppercase`}>Total Distributing</span>
                        <span className="text-lg font-bold text-emerald-400">{formatRupee(distPreview.totalDistributed)}</span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setDistStep(1)} disabled={distLoading}
                          className={`px-6 py-3 border ${cardBorder} ${textSecondary} font-sora font-bold uppercase tracking-wider rounded-xl hover:text-white transition-all cursor-pointer text-xs disabled:opacity-50`}>Back</button>
                        <button onClick={handleConfirmDistribution} disabled={distLoading}
                          className="px-6 py-3 bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer text-xs disabled:opacity-50 flex items-center">
                          {distLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                          Confirm Distribution
                        </button>
                      </div>
                    </div>
                  )}

                  {distStep === 3 && distPreview && (
                    <div className="space-y-6">
                      <h4 className={`text-sm font-bold ${textPrimary} uppercase tracking-wider flex items-center`}>
                        <Lock className="w-4 h-4 mr-2 text-amber-400" />
                        Step 3: Lock Distribution
                      </h4>
                      <p className={`text-xs ${textSecondary}`}>
                        This will process earnings for {distPreview.silverCount + distPreview.goldCount + distPreview.platinumCount} active members. Cannot be undone.
                      </p>
                      <button onClick={handleLockDistribution} disabled={distLoading}
                        className="w-full py-4 bg-emerald-500 text-white font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center">
                        {distLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
                        Lock and Distribute
                      </button>
                    </div>
                  )}

                  {distStep === 4 && (
                    <div className="space-y-6 text-center py-6">
                      <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8" /></div>
                      <h4 className={`text-xl font-bold ${textPrimary}`}>Distribution Locked</h4>
                      <p className={`text-xs ${textSecondary}`}>Earnings updated across all active member accounts.</p>
                      <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">Distribution Locked</span>
                    </div>
                  )}
                </div>

                <div className={`pt-6 border-t ${cardBorder} space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Distribution Records</h4>
                  <div className="flex gap-3">
                    <button onClick={handleExportDistributions}
                      className="px-4 py-2 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] text-[#2D3748] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-xs font-bold uppercase cursor-pointer flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Utility Inc.</th>
                          <th className="p-4 text-right">Green Inc.</th>
                          <th className="p-4 text-right">Loyalty Inc.</th>
                          <th className="p-4 text-right">Total Distributed</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y ${cardBorder} text-xs font-medium">
                        {filteredDistributionsList.map((dist) => (
                          <tr key={dist.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                            <td className={`p-4 ${textSecondary}`}>
                              {dist.distributedAt?.toDate ? new Date(dist.distributedAt.toDate()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="p-4 text-right text-[#1B4332] font-bold">{formatRupee(dist.utilityIncome || 0)}</td>
                            <td className="p-4 text-right text-[#1B4332] font-semibold">{formatRupee(dist.greenIncome || 0)}</td>
                            <td className="p-4 text-right text-[#1B4332] font-semibold">{formatRupee(dist.loyaltyIncome || 0)}</td>
                            <td className="p-4 text-right text-[#74E61F] font-semibold">{formatRupee(dist.totalDistributed || 0)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${dist.status === 'confirmed' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{dist.status}</span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                {dist.status === 'confirmed' ? (
                                  <button onClick={() => handleLockSpecificDistribution(dist.id, dist)}
                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Lock
                                  </button>
                                ) : (
                                  <button onClick={() => handleUnlockSpecificDistribution(dist.id, dist)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-1">
                                    <Unlock className="w-3 h-3" /> Unlock
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredDistributionsList.length === 0 && (
                          <tr><td colSpan="7" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No distributions for this project yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MEMBERSHIP CONTROLS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'membership' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Membership Controls</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Bulk actions for membership management</p>
                </div>

                {bulkActionStatus && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold">{bulkActionStatus}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ControlCard
                    icon={<UserPlus className="w-6 h-6" />}
                    title="Activate All Paid"
                    description="Activate membership for all paid pending members"
                    action={handleBulkActivate}
                    color="emerald"
                    count={activeProjUsers.filter(u => u.membershipStatus === 'Pending' && u.paymentStatus === 'Paid').length}
                  />
                  <ControlCard
                    icon={<UserMinus className="w-6 h-6" />}
                    title="Deactivate All"
                    description="Deactivate all active memberships"
                    action={handleBulkDeactivate}
                    color="amber"
                    count={activeMembers}
                  />
                  <ControlCard
                    icon={<Shield className="w-6 h-6" />}
                    title="Validate Members"
                    description="Deactivate non-paying active members"
                    action={handleValidateActiveMembers}
                    color="red"
                    count={activeProjUsers.filter(u => u.membershipStatus === 'Active' && u.paymentStatus !== 'Paid').length}
                  />
                </div>

                <div className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Member Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBadge label="Total" value={totalUsers} color="text-[#1B4332]" />
                    <StatBadge label="Active" value={activeMembers} color="text-emerald-400" />
                    <StatBadge label="Pending" value={inactiveMembers} color="text-amber-400" />
                    <StatBadge label="Unpaid Active" value={activeProjUsers.filter(u => u.membershipStatus === 'Active' && u.paymentStatus !== 'Paid').length} color="text-red-400" />
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PROJECTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'projects' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Project Management</h3>
                    <p className={`text-xs mt-1 ${textSecondary}`}>Create, edit, and manage all projects</p>
                  </div>
                  <button onClick={() => { setShowProjectForm(true); setProjectFormTab('general'); setEditingProjectId(null); setProjectForm({ name: '', location: '', totalCapacity: '', collectedAmount: '', totalMembers: '', status: 'Pending', description: '', imageUrl: '', isActive: false, powerRating: '', chargingBays: '', dailyUsers: '', co2Saved: '', silverPrice: '', silverDesc: '', silverFeatures: '', goldPrice: '', goldDesc: '', goldFeatures: '', platinumPrice: '', platinumDesc: '', platinumFeatures: '' }); }}
                    className="px-5 py-3 rounded-2xl bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer text-xs flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>

                {projectStatus.success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold">Project saved successfully!</div>
                )}
                {projectStatus.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-xs font-semibold">{projectStatus.error}</div>
                )}

                {/* Project List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projectsList.map((project) => {
                    const cap = Number(project.totalCapacity) || 0;
                    const col = Number(project.collectedAmount) || 0;
                    const pct = cap > 0 ? Math.min(Math.round((col / cap) * 100), 100) : 0;
                    return (
                      <div key={project.id} className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4 relative overflow-hidden`}>
                        {(project.isActive === true || project.status === 'active') && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-lg tracking-wider border border-emerald-500/20">
                            LIVE
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-white' : 'bg-white'} border ${cardBorder} flex items-center justify-center text-[#74E61F]`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className={`text-sm font-bold font-sora ${textPrimary}`}>{project.name || 'Unnamed Project'}</h4>
                              <p className={`text-[10px] ${textSecondary} flex items-center gap-1`}><MapPin className="w-3 h-3" />{project.location || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className={`text-[9px] font-bold uppercase block ${textSecondary}`}>Goal</span>
                            <span className={`font-bold font-sora ${textPrimary}`}>{formatRupee(cap)}</span>
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold uppercase block ${textSecondary}`}>Collected</span>
                            <span className="font-bold font-sora text-[#74E61F]">{formatRupee(col)}</span>
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold uppercase block ${textSecondary}`}>Members</span>
                            <span className={`font-bold ${textPrimary}`}>{project.totalMembers || 0}</span>
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold uppercase block ${textSecondary}`}>Status</span>
                            <span className={`font-bold ${project.status === 'Operational' ? 'text-emerald-400' : project.status === 'Closed' ? 'text-red-400' : 'text-amber-400'}`}>{project.status || 'Pending'}</span>
                          </div>
                        </div>

                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#74E61F] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>

                        {(project.powerRating || project.chargingBays || project.dailyUsers || project.co2Saved) && (
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {project.powerRating && <span className={textSecondary}>⚡ {project.powerRating}</span>}
                            {project.chargingBays && <span className={textSecondary}>🔌 {project.chargingBays}</span>}
                            {project.dailyUsers && <span className={textSecondary}>👤 {project.dailyUsers}</span>}
                            {project.co2Saved && <span className={textSecondary}>🌿 {project.co2Saved}</span>}
                          </div>
                        )}
                        {(project.silverPrice || project.goldPrice || project.platinumPrice) && (
                          <div className="flex gap-2 text-[9px] font-bold">
                            {project.silverPrice > 0 && <span className="px-2 py-0.5 rounded bg-slate-500/10 text-[#2D3748]">Silver ₹{Number(project.silverPrice).toLocaleString('en-IN')}</span>}
                            {project.goldPrice > 0 && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">Gold ₹{Number(project.goldPrice).toLocaleString('en-IN')}</span>}
                            {project.platinumPrice > 0 && <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">Platinum ₹{Number(project.platinumPrice).toLocaleString('en-IN')}</span>}
                          </div>
                        )}
                        {project.description && (
                          <p className={`text-[10px] ${textSecondary} leading-relaxed`}>{project.description}</p>
                        )}

                        <div className={`flex items-center justify-between pt-2 border-t ${cardBorder}`}>
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={project.isActive === true}
                                onChange={() => handleToggleProjectActive(project.id, project.isActive || false)}
                                className="sr-only peer" 
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                              <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditProject(project)}
                              className="py-2 px-3 rounded-xl bg-[#F7FBF9] border border-[#B7E4C7] text-[#2D3748] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5">
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => handleDeleteProject(project.id)}
                              className="py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {projectsList.length === 0 && (
                    <div className={`col-span-full py-16 text-center ${textSecondary} text-xs font-semibold border-2 border-dashed ${cardBorder} rounded-2xl`}>
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No projects yet. Click "Add Project" to create one.
                    </div>
                  )}
                </div>

                {/* Add / Edit Project Modal */}
                {showProjectForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className={`w-full max-w-2xl ${cardBg} border ${cardBorder} rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[90vh]`}>
                      <div className={`flex justify-between items-center border-b ${cardBorder} pb-4 mb-4 flex-shrink-0`}>
                        <h4 className={`text-base font-bold font-sora ${textPrimary}`}>{editingProjectId ? 'Edit Project' : 'Add New Project'}</h4>
                        <button onClick={() => setShowProjectForm(false)} className={`${darkMode ? 'text-slate-400 hover:text-black' : 'text-slate-500 hover:text-slate-800'} cursor-pointer`}><X className="w-5 h-5" /></button>
                      </div>

                      <div className="flex gap-2 mb-4 overflow-x-auto flex-shrink-0 pb-2">
                        {['general', 'silver', 'gold', 'platinum'].map(tab => (
                          <button key={tab} onClick={() => setProjectFormTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${projectFormTab === tab ? 'bg-[#74E61F] text-[#042A1d]' : `${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}`}>
                            {tab === 'general' ? 'General Info' : `${tab} Tier`}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <form id="project-form" onSubmit={handleProjectSubmit} className="space-y-4">
                          {projectFormTab === 'general' && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <InputField label="Project Name" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} inputBg={inputBg} darkMode={darkMode} required />
                                <InputField label="Location" value={projectForm.location} onChange={(e) => setProjectForm({...projectForm, location: e.target.value})} inputBg={inputBg} darkMode={darkMode} required />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <InputField label="Total Goal (₹)" type="number" value={projectForm.totalCapacity} onChange={(e) => setProjectForm({...projectForm, totalCapacity: e.target.value})} inputBg={inputBg} darkMode={darkMode} required />
                                <InputField label="Collected (₹)" type="number" value={projectForm.collectedAmount} onChange={(e) => setProjectForm({...projectForm, collectedAmount: e.target.value})} inputBg={inputBg} darkMode={darkMode} required />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <InputField label="Total Members" type="number" value={projectForm.totalMembers} onChange={(e) => setProjectForm({...projectForm, totalMembers: e.target.value})} inputBg={inputBg} darkMode={darkMode} required />
                                <div className="space-y-1">
                                  <label className={`text-[10px] font-bold uppercase ${textSecondary} block`}>Status</label>
                                  <select value={projectForm.status} onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                                    className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F]`}>
                                    <option value="Planning">Planning</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Operational">Operational</option>
                                    <option value="Closed">Closed</option>
                                  </select>
                                </div>
                              </div>

                              <div className={`p-4 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-3`}>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${textSecondary}`}>Project Specifications</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <InputField label="Power Rating (e.g. 120 kW)" value={projectForm.powerRating} onChange={(e) => setProjectForm({...projectForm, powerRating: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                                  <InputField label="Charging Bays (e.g. 8 Ports)" value={projectForm.chargingBays} onChange={(e) => setProjectForm({...projectForm, chargingBays: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                                  <InputField label="Daily Users (e.g. 120+)" value={projectForm.dailyUsers} onChange={(e) => setProjectForm({...projectForm, dailyUsers: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                                  <InputField label="CO₂ Saved/yr (e.g. 48 Tonnes)" value={projectForm.co2Saved} onChange={(e) => setProjectForm({...projectForm, co2Saved: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                                </div>
                              </div>

                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Description</label>
                                <textarea value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} rows={2}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Brief project description..." />
                              </div>
                              
                              <label className="flex items-center space-x-3 cursor-pointer mt-2">
                                <input type="checkbox" checked={projectForm.isActive} onChange={(e) => setProjectForm({...projectForm, isActive: e.target.checked})}
                                  className="w-4 h-4 rounded bg-[#0B3022] border border-[#B7E4C7] accent-[#74E61F]" />
                                <span className={`text-xs font-semibold ${textPrimary}`}>Set as active project (visible on landing page)</span>
                              </label>
                            </>
                          )}

                          {projectFormTab === 'silver' && (
                            <div className="space-y-4">
                              <InputField label="Silver Tier Price (₹)" type="number" value={projectForm.silverPrice} onChange={(e) => setProjectForm({...projectForm, silverPrice: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Silver Tier Description</label>
                                <textarea value={projectForm.silverDesc} onChange={(e) => setProjectForm({...projectForm, silverDesc: e.target.value})} rows={2}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Description for Silver Membership..." />
                              </div>
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Features (Comma Separated)</label>
                                <textarea value={projectForm.silverFeatures} onChange={(e) => setProjectForm({...projectForm, silverFeatures: e.target.value})} rows={3}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Feature 1, Feature 2, Feature 3..." />
                              </div>
                            </div>
                          )}

                          {projectFormTab === 'gold' && (
                            <div className="space-y-4">
                              <InputField label="Gold Tier Price (₹)" type="number" value={projectForm.goldPrice} onChange={(e) => setProjectForm({...projectForm, goldPrice: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Gold Tier Description</label>
                                <textarea value={projectForm.goldDesc} onChange={(e) => setProjectForm({...projectForm, goldDesc: e.target.value})} rows={2}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Description for Gold Membership..." />
                              </div>
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Features (Comma Separated)</label>
                                <textarea value={projectForm.goldFeatures} onChange={(e) => setProjectForm({...projectForm, goldFeatures: e.target.value})} rows={3}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Feature 1, Feature 2, Feature 3..." />
                              </div>
                            </div>
                          )}

                          {projectFormTab === 'platinum' && (
                            <div className="space-y-4">
                              <InputField label="Platinum Tier Price (₹)" type="number" value={projectForm.platinumPrice} onChange={(e) => setProjectForm({...projectForm, platinumPrice: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Platinum Tier Description</label>
                                <textarea value={projectForm.platinumDesc} onChange={(e) => setProjectForm({...projectForm, platinumDesc: e.target.value})} rows={2}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Description for Platinum Membership..." />
                              </div>
                              <div>
                                <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-1`}>Features (Comma Separated)</label>
                                <textarea value={projectForm.platinumFeatures} onChange={(e) => setProjectForm({...projectForm, platinumFeatures: e.target.value})} rows={3}
                                  className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg} border ${darkMode ? 'border-[#B7E4C7]' : 'border-slate-200'} text-xs font-semibold text-black focus:outline-none focus:border-[#74E61F] resize-none`} placeholder="Feature 1, Feature 2, Feature 3..." />
                              </div>
                            </div>
                          )}
                        </form>
                      </div>

                      <div className={`flex gap-3 pt-4 border-t ${cardBorder} mt-4 flex-shrink-0`}>
                        <button type="button" onClick={() => setShowProjectForm(false)}
                          className={`flex-1 py-3 border ${cardBorder} rounded-2xl text-xs font-bold uppercase ${textSecondary} hover:text-white transition cursor-pointer`}>Cancel</button>
                        <button type="submit" form="project-form"
                          className="flex-1 py-3 bg-[#74E61F] text-[#042A1d] rounded-2xl text-xs font-bold uppercase hover:bg-white hover:text-black transition cursor-pointer">
                          {editingProjectId ? 'Update Project' : 'Create Project'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• REPORTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'reports' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Reports & Export</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Download analytics and data reports</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ReportCard title="Members Report" description={`Members for ${selectedProject?.name || 'project'}`} onExport={handleExportUsers} count={filteredUsers.length} icon={<Users className="w-5 h-5" />} />
                  <ReportCard title="Payments Report" description={`Transactions for ${selectedProject?.name || 'project'}`} onExport={handleExportPayments} count={filteredPayments.length} icon={<Wallet className="w-5 h-5" />} />
                  <ReportCard title="Distributions Report" description={`Distributions for ${selectedProject?.name || 'project'}`} onExport={handleExportDistributions} count={filteredDistributionsList.length} icon={<PieChart className="w-5 h-5" />} />
                  <ReportCard title="Company Income Report" description={`Income for ${selectedProject?.name || 'project'}`}
                    onExport={() => {
                      exportToCSV(
                        filteredCompanyIncomeList.map(i => ({ Date: i.enteredAt?.toDate ? i.enteredAt.toDate().toLocaleDateString('en-IN') : 'N/A', Amount: i.amount, Description: i.description || '' })),
                        `company_income_${selectedProject?.name || 'export'}`,
                        ['Date', 'Amount', 'Description']
                      );
                    }}
                    count={filteredCompanyIncomeList.length} icon={<TrendingUp className="w-5 h-5" />} />
                  <ReportCard title="Analytics Summary" description="Download key dashboard metrics"
                    onExport={() => {
                      const summary = [
                        { Metric: 'Total Members', Value: totalUsers },
                        { Metric: 'Active Members', Value: activeMembers },
                        { Metric: 'Silver Members', Value: silverMembers },
                        { Metric: 'Gold Members', Value: goldMembers },
                        { Metric: 'Platinum Members', Value: platinumMembers },
                        { Metric: 'Total Revenue', Value: totalRevenue },
                        { Metric: 'Company Income', Value: totalCompanyIncome },
                        { Metric: 'Total Distributed', Value: totalDistributed }
                      ];
                      exportToCSV(summary, 'analytics_summary', ['Metric', 'Value']);
                    }}
                    count={8} icon={<BarChart3 className="w-5 h-5" />} />
                  <ReportCard title="Activity Logs" description="Export audit trail"
                    onExport={() => {
                      exportToCSV(
                        activityLogs.map(l => ({
                          Action: l.action,
                          Details: l.details || '',
                          User: l.userName || '',
                          Timestamp: l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : ''
                        })),
                        'activity_logs_export',
                        ['Action', 'Details', 'User', 'Timestamp']
                      );
                    }}
                    count={activityLogs.length} icon={<Activity className="w-5 h-5" />} />
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• WAITLIST â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'waitlist' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div>
                  <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Waitlist Management</h3>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Manage user signup waitlist</p>
                </div>

                <form onSubmit={handleAddToWaitlist} className={`p-6 ${darkMode ? 'bg-[#F7FBF9]' : 'bg-slate-50'} border ${cardBorder} rounded-2xl space-y-4`}>
                  <h4 className={`text-sm font-bold font-sora ${textPrimary} uppercase tracking-wider`}>Add to Waitlist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Name" value={waitlistForm.name} onChange={(e) => setWaitlistForm({...waitlistForm, name: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                    <InputField label="Email" type="email" value={waitlistForm.email} onChange={(e) => setWaitlistForm({...waitlistForm, email: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                    <InputField label="Phone" value={waitlistForm.phone} onChange={(e) => setWaitlistForm({...waitlistForm, phone: e.target.value})} inputBg={inputBg} darkMode={darkMode} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Preferred Plan</label>
                      <select value={waitlistForm.preferredPlan} onChange={(e) => setWaitlistForm({...waitlistForm, preferredPlan: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors`}>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold uppercase ${textSecondary} block mb-2`}>Target Project</label>
                      <select value={waitlistForm.projectId} onChange={(e) => setWaitlistForm({...waitlistForm, projectId: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${cardBorder} focus:border-[#74E61F] focus:outline-none text-xs font-bold text-[#1B4332] transition-colors`}>
                        <option value="">-- Select Project --</option>
                        {projectsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={waitlistSubmitting}
                    className="px-6 py-3 bg-[#74E61F] text-[#042A1d] font-sora font-bold uppercase tracking-wider rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer text-xs disabled:opacity-50">
                    {waitlistSubmitting ? 'Adding...' : 'Add to Waitlist'}
                  </button>
                </form>

                <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Preferred Plan</th>
                        <th className="p-4">Target Project</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y ${cardBorder} text-xs font-medium">
                      {filteredWaitlist.map((entry) => (
                        <tr key={entry.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                          <td className={`p-4 font-bold ${textPrimary}`}>{entry.name}</td>
                          <td className={`p-4 ${textSecondary}`}>{entry.email}</td>
                          <td className="p-4">{entry.phone || '—'}</td>
                          <td className="p-4">{entry.preferredPlan}</td>
                          <td className="p-4 font-semibold text-emerald-800">
                            {projectsList.find(p => p.id === entry.projectId)?.name || 'General / Unknown'}
                          </td>
                          <td className="p-4">
                            <select value={entry.status || 'Pending'} onChange={(e) => handleWaitlistStatus(entry.id, e.target.value)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cardBorder} ${inputBg} text-[#1B4332] cursor-pointer`}>
                              <option value="Pending">Pending</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Registered">Registered</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className={`p-4 ${textSecondary}`}>
                            {entry.createdAt?.toDate ? new Date(entry.createdAt.toDate()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleRemoveFromWaitlist(entry.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/20 text-red-400 cursor-pointer" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredWaitlist.length === 0 && (
                        <tr><td colSpan="8" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No waitlist entries for this project.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ACTIVITY LOGS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {activeTab === 'logs' && (
              <div className={`${cardBg} border ${cardBorder} p-8 md:p-10 rounded-[32px] space-y-6`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-xl font-extrabold font-sora ${textPrimary}`}>Activity Logs</h3>
                    <p className={`text-xs mt-1 ${textSecondary}`}>Complete audit trail of all admin actions</p>
                  </div>
                  <button onClick={() => {
                    exportToCSV(
                      activityLogs.map(l => ({
                        Action: l.action,
                        Details: l.details || '',
                        User: l.userName || '',
                        Timestamp: l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : ''
                      })),
                      'activity_logs_export',
                      ['Action', 'Details', 'User', 'Timestamp']
                    );
                  }}
                    className="px-4 py-2.5 rounded-2xl bg-[#F7FBF9] border border-[#B7E4C7] text-[#2D3748] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-xs font-bold uppercase cursor-pointer flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border ${cardBorder} ${darkMode ? 'bg-[#F7FBF9]' : 'bg-white'}">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${cardBorder} text-[9px] font-extrabold uppercase ${textSecondary} tracking-wider`}>
                        <th className="p-4">Action</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y ${cardBorder} text-xs font-medium">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className={`${darkMode ? 'hover:bg-white/5 text-[#2D3748]' : 'hover:bg-slate-50 text-slate-600'} transition-colors`}>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-[#74E61F]/10 text-[#74E61F] border border-[#74E61F]/20`}>{log.action}</span>
                          </td>
                          <td className={`p-4 ${textSecondary}`}>{log.details || 'â€”'}</td>
                          <td className={`p-4 font-bold ${textPrimary}`}>{log.userName || 'System'}</td>
                          <td className={`p-4 ${textSecondary}`}>
                            {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                      {activityLogs.length === 0 && (
                        <tr><td colSpan="4" className={`py-12 text-center ${textSecondary} text-xs font-semibold`}>No activity logs yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </AdminProjectContext.Provider>
  );
}

// â”€â”€â”€ SUB-COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ icon, label, value, color, bgColor, borderColor, note }) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-[#B7E4C7] relative overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(27,67,50,0.07)' }}>
      <div className={`w-10 h-10 rounded-2xl ${bgColor} flex items-center justify-center ${color} mb-4 border ${borderColor}`}>{icon}</div>
      <span className="text-[10px] font-bold text-[#40916C] uppercase tracking-widest block mb-1">{label}</span>
      <div className="text-3xl font-extrabold font-sora text-[#1B4332]">{value}</div>
      {note && <span className="text-[9px] text-slate-400 mt-1 block font-medium">{note}</span>}
    </div>
  );
}

function PoolCard({ label, pool, count, share }) {
  return (
    <div className="p-4 bg-[#F7FBF9] rounded-xl border border-[#B7E4C7] space-y-2">
      <span className="text-[10px] text-[#40916C] font-bold uppercase tracking-wider">{label}</span>
      <div className="text-lg font-bold text-[#1B4332]">{formatRupee(pool)}</div>
      <div className="text-xs text-[#40916C]">Members: {count}</div>
      <div className="text-xs font-bold text-[#40916C]">Share: {formatRupee(share)}</div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, inputBg, darkMode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-[#1B4332] block">{label}</label>
      <input type={type} value={value} onChange={onChange}
        className={`w-full px-3.5 py-2.5 rounded-xl ${inputBg || 'bg-[#F7FBF9]'} border border-[#B7E4C7] text-xs font-semibold text-[#2D3748] focus:outline-none focus:border-[#40916C] transition-colors`} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, inputBg, darkMode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-[#1B4332] block">{label}</label>
      <select value={value} onChange={onChange}
        className={`w-full px-3 py-2 rounded-xl ${inputBg || 'bg-[#F7FBF9]'} border border-[#B7E4C7] text-xs font-semibold text-[#2D3748] focus:outline-none`}>
        {options.map(opt => <option key={opt} value={opt}>{opt || 'None'}</option>)}
      </select>
    </div>
  );
}

function ControlCard({ icon, title, description, action, color, count }) {
  const colors = { emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white', amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white', red: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white' };
  return (
    <div className="p-6 bg-white border border-[#B7E4C7] rounded-2xl space-y-4" style={{ boxShadow: '0 2px 8px rgba(27,67,50,0.07)' }}>
      <div className={`w-12 h-12 rounded-2xl ${colors[color].split(' ')[0]} flex items-center justify-center ${colors[color].split(' ')[1]} border ${colors[color].split(' ')[2]}`}>{icon}</div>
      <h4 className="text-sm font-bold font-sora text-[#1B4332]">{title}</h4>
      <p className="text-xs text-[#40916C]">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#40916C]">{count} members</span>
        <button onClick={action} className={`px-4 py-2 rounded-xl ${colors[color]} transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer`}>
          Run
        </button>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className={`p-4 bg-white border border-[#B7E4C7] rounded-xl text-center`}>
      <span className={`text-lg font-bold font-sora block ${color}`}>{value}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ReportCard({ title, description, onExport, count, icon }) {
  return (
    <div className="p-6 bg-white border border-[#B7E4C7] rounded-2xl space-y-4" style={{ boxShadow: '0 2px 8px rgba(27,67,50,0.07)' }}>
      <div className="w-10 h-10 rounded-2xl bg-[#D8F3DC] flex items-center justify-center text-[#1B4332] border border-[#B7E4C7]">{icon}</div>
      <h4 className="text-sm font-bold font-sora text-[#1B4332]">{title}</h4>
      <p className="text-xs text-[#40916C]">{description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-[#B7E4C7]">
        <span className="text-xs text-slate-500">{count} records</span>
        <button onClick={onExport}
          className="px-4 py-2 rounded-xl bg-[#F7FBF9] border border-[#B7E4C7] text-[#2D3748] hover:bg-[#D8F3DC] hover:text-[#1B4332] transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5">
          <Download className="w-3 h-3" /> Export
        </button>
      </div>
    </div>
  );
}

