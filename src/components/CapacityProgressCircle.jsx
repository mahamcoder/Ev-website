import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function CapacityProgressCircle() {
  const [projectData, setProjectData] = useState({
    totalCapacity: 1500000,
    collectedAmount: 975000,
  });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = list.find(p => p.isActive === true) || list[0] || null;
        if (active) {
          setProjectData(active);
        }
      }
    );
    return () => unsub();
  }, []);

  const total = projectData.totalCapacity || 1500000;
  const filled = projectData.collectedAmount || 975000;
  const available = Math.max(total - filled, 0);
  const capacityPercent = Math.min((filled / total) * 100, 100);

  const [activeTab, setActiveTab] = useState('percent'); // 'percent', 'filled', 'available'
  const radius = 120;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate dash offset based on percentage
  const strokeDashoffset = circumference - (capacityPercent / 100) * circumference;

  // Auto-switch tabs every few seconds for visual engagement (can be paused on hover)
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'percent') return 'filled';
        if (prev === 'filled') return 'available';
        return 'percent';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Format currency
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Outer Card Wrapper */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: 'spring' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative p-8 md:p-12 bg-white rounded-[40px] shadow-xl border border-brand-green/10 flex flex-col items-center justify-center max-w-md w-full overflow-hidden group"
      >
        {/* Glow backdrop decorative orb */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-brand-parrot/15 blur-3xl group-hover:bg-brand-parrot/25 transition-all duration-500" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-brand-green/5 blur-3xl" />

        {/* Header tags */}
        <div className="mb-6 flex space-x-2">
          <span className="flex items-center space-x-1 text-[11px] font-bold font-sora text-brand-green bg-brand-green/5 px-3 py-1 rounded-full uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 mr-0.5 text-brand-parrot" />
            Live Meter
          </span>
          <span className="flex items-center space-x-1 text-[11px] font-bold font-sora text-brand-dark bg-brand-parrot/10 px-3 py-1 rounded-full uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 mr-0.5 text-brand-green" />
            Verified Pool
          </span>
        </div>

        {/* Circular Progress Container */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 select-none">
            {/* Background Circle */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="transparent"
              stroke="#E8F1EC"
              strokeWidth={strokeWidth}
              className="transition-all duration-300"
            />
            {/* Active Circle Progress */}
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="transparent"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
            
            {/* Definitions for Gradients */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#105D3D" />    {/* brand-green */}
                <stop offset="60%" stopColor="#22C55E" />   {/* green-500 */}
                <stop offset="100%" stopColor="#74E61F" />  {/* brand-parrot */}
              </linearGradient>
            </defs>
          </svg>

          {/* Core Central Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <AnimatePresence mode="wait">
              {activeTab === 'percent' && (
                <motion.div
                  key="percent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl md:text-5xl font-extrabold font-sora text-brand-dark tracking-tighter">
                    {capacityPercent.toFixed(0)}%
                  </span>
                  <span className="text-[12px] md:text-xs text-brand-green/80 font-bold uppercase tracking-wider mt-1">
                    Completed
                  </span>
                </motion.div>
              )}

              {activeTab === 'filled' && (
                <motion.div
                  key="filled"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-2xl md:text-3xl font-extrabold font-sora text-brand-green tracking-tight">
                    {formatRupee(filled)}
                  </span>
                  <span className="text-[12px] md:text-xs text-brand-dark/70 font-semibold tracking-wide mt-1">
                    Community Filled
                  </span>
                </motion.div>
              )}

              {activeTab === 'available' && (
                <motion.div
                  key="available"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-2xl md:text-3xl font-extrabold font-sora text-amber-600 tracking-tight">
                    {formatRupee(available)}
                  </span>
                  <span className="text-[12px] md:text-xs text-brand-dark/70 font-semibold tracking-wide mt-1">
                    Remaining Available
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs for interactive toggling */}
        <div className="mt-8 flex justify-center bg-brand-light p-1 rounded-full border border-brand-green/10 max-w-xs w-full relative z-10">
          {[
            { id: 'percent', label: 'Progress' },
            { id: 'filled', label: 'Filled' },
            { id: 'available', label: 'Available' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-xs font-bold font-sora rounded-full transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-brand-dark text-white shadow'
                  : 'text-brand-dark/60 hover:text-brand-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Capacity Details under the circle */}
        <div className="mt-6 text-center">
          <p className="text-[13px] font-semibold text-slate-500">
            Project Capacity Limit: <span className="font-bold text-brand-dark">{formatRupee(total)}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
