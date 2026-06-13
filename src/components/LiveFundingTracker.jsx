import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Landmark, Target, Hourglass, ArrowUpRight, PartyPopper, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LiveFundingTracker({ activeProject }) {
  const total = activeProject?.totalCapacity || 0;
  const filled = activeProject?.collectedAmount || 0;
  const available = Math.max(total - filled, 0);
  const capacityPercent = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
  const totalMembers = activeProject?.totalMembers || 0;
  const isFullyFunded = capacityPercent >= 100;

  useEffect(() => {
    if (isFullyFunded) {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#74E61F', '#22C55E', '#EAB308', '#105D3D'],
      });
    }
  }, [isFullyFunded]);

  if (!activeProject) return null;

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const circleRadius = 78;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (Math.min(capacityPercent, 100) / 100) * circumference;

  return (
    <section id="tracker" className="py-20 md:py-28 px-4 md:px-8 bg-[#F6FAF7] overflow-hidden">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[11px] font-extrabold font-sora text-brand-green uppercase tracking-widest block mb-3"
        >
          PROJECT CAPACITY PROGRESS
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black font-sora text-brand-dark leading-tight tracking-tight mb-4"
        >
          {(activeProject.name || '').toUpperCase()} • <span className="text-brand-green">Live Funding</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-500 font-medium max-w-2xl mx-auto text-sm sm:text-[15px] leading-relaxed"
        >
          {isFullyFunded
            ? 'The project capacity has been fully subscribed! Thank you to all community members for your contributions.'
            : 'Membership participation contributes toward the overall project capacity. Once the maximum capacity is reached, new registrations may be placed on a waiting list.'
          }
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
          className={`lg:col-span-5 bg-white rounded-[36px] border shadow-xl shadow-brand-dark/5 p-8 flex flex-col justify-between relative overflow-hidden group min-h-[440px] ${isFullyFunded ? 'border-yellow-300' : 'border-slate-100'}`}
        >
          <div className={`absolute top-6 right-6 ${isFullyFunded ? 'animate-bounce' : ''}`}>
            {isFullyFunded ? (
              <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold tracking-wider px-3.5 py-1.5 rounded-full uppercase shadow-sm">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>FUNDED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 bg-[#4AA65C] text-white text-[10px] font-extrabold tracking-wider px-3.5 py-1.5 rounded-full uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>LIVE</span>
              </span>
            )}
          </div>

          {isFullyFunded && (
            <div className="absolute top-6 left-6">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                Fully Subscribed
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center mt-6">
            <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 select-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  fill="transparent"
                  stroke="#EBF3EE"
                  strokeWidth="15"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  fill="transparent"
                  stroke={isFullyFunded ? "url(#fundedGradient)" : "url(#dashboardGradient)"}
                  strokeWidth="15"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  whileInView={{ strokeDashoffset }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#105D3D" />
                    <stop offset="100%" stopColor="#74E61F" />
                  </linearGradient>
                  <linearGradient id="fundedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isFullyFunded ? (
                  <>
                    <PartyPopper className="w-8 h-8 text-yellow-500 mb-1" />
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">COMPLETED</span>
                    <span className="text-4xl md:text-5xl font-black font-sora text-yellow-500 my-1 leading-none">100%</span>
                    <span className="text-[11px] font-black text-brand-dark leading-none">Pool Full</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Completion</span>
                    <span className="text-4xl md:text-5xl font-black font-sora text-[#105D3D] my-1 leading-none">
                      {capacityPercent.toFixed(0)}%
                    </span>
                    <span className="text-[11px] font-black text-brand-dark leading-none">
                      {formatRupee(filled)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                      of {formatRupee(total)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                {isFullyFunded ? 'TOTAL RAISED' : 'REMAINING'}
              </span>
              <span className={`text-sm font-extrabold block ${isFullyFunded ? 'text-yellow-500' : 'text-brand-dark'}`}>
                {isFullyFunded ? formatRupee(filled) : formatRupee(available)}
              </span>
            </div>
            {!isFullyFunded && (
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        </motion.div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-green/5 text-brand-green flex items-center justify-center shrink-0 border border-brand-green/10">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black font-sora text-brand-dark block leading-tight">
                  {totalMembers}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Members
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-green/5 text-brand-green flex items-center justify-center shrink-0 border border-brand-green/10">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black font-sora text-brand-dark block leading-tight">
                  {formatRupee(filled)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Participation
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-green/5 text-brand-green flex items-center justify-center shrink-0 border border-brand-green/10">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black font-sora text-brand-dark block leading-tight">
                  {formatRupee(total)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Capacity
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`bg-white rounded-3xl p-6 border shadow-md flex items-center space-x-4 transition-shadow ${isFullyFunded ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-100'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isFullyFunded ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-brand-green/5 text-brand-green border-brand-green/10'}`}>
                {isFullyFunded ? <CheckCircle className="w-6 h-6" /> : <Hourglass className="w-6 h-6" />}
              </div>
              <div>
                <span className={`text-2xl font-black font-sora block leading-tight ${isFullyFunded ? 'text-yellow-600' : 'text-brand-dark'}`}>
                  {isFullyFunded ? 'FULL' : formatRupee(available)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isFullyFunded ? 'Pool Status' : 'Remaining'}
                </span>
              </div>
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`bg-white rounded-3xl p-6 border shadow-md ${isFullyFunded ? 'border-yellow-200' : 'border-slate-100'}`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-black text-brand-dark">Project Capacity</span>
              <span className={`text-sm font-black ${isFullyFunded ? 'text-yellow-500' : 'text-brand-green'}`}>
                {isFullyFunded ? '100%' : `${capacityPercent.toFixed(0)}%`}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: isFullyFunded ? '100%' : `${capacityPercent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full rounded-full ${isFullyFunded ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-brand-green to-brand-parrot'}`}
              />
            </div>

            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{formatRupee(filled)} filled</span>
              <span>{isFullyFunded ? 'Target Reached' : `${formatRupee(available)} available`}</span>
            </div>
          </motion.div>

          {(activeProject.silverPrice > 0 || activeProject.goldPrice > 0 || activeProject.platinumPrice > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-3 gap-3"
            >
              {activeProject.silverPrice > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Silver</span>
                  <span className="text-sm font-black font-sora text-slate-500 block mt-0.5">{formatRupee(activeProject.silverPrice)}</span>
                </div>
              )}
              {activeProject.goldPrice > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gold</span>
                  <span className="text-sm font-black font-sora text-amber-500 block mt-0.5">{formatRupee(activeProject.goldPrice)}</span>
                </div>
              )}
              {activeProject.platinumPrice > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-cyan-100 shadow-sm text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Platinum</span>
                  <span className="text-sm font-black font-sora text-cyan-500 block mt-0.5">{formatRupee(activeProject.platinumPrice)}</span>
                </div>
              )}
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}