import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, CheckCircle, Mail, AlertCircle, X, Building2 } from 'lucide-react';

const formatRupee = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const statusStyle = (status) => {
  const map = {
    'Planning': 'text-amber-700 bg-amber-50 border-amber-100',
    'In Progress': 'text-blue-700 bg-blue-50 border-blue-100',
    'Waitlist Open': 'text-amber-700 bg-amber-50 border-amber-100',
    'Planning Phase': 'text-brand-green bg-brand-green/5 border-brand-green/10',
    'Coming Soon': 'text-slate-500 bg-slate-50 border-slate-100',
    'Closed': 'text-red-700 bg-red-50 border-red-100'
  };
  return map[status] || 'text-slate-500 bg-slate-50 border-slate-100';
};

export default function FutureProjects({ projects = [] }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [tierInput, setTierInput] = useState('Gold');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setSelectedProject(null);
      setEmailInput('');
    }, 2500);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-extrabold font-sora text-brand-dark tracking-tight">
          Next Phase Infrastructure Models
        </h3>
        <p className="text-slate-500 font-semibold mt-2 text-sm max-w-lg mx-auto">
          Once the active project is fully subscribed, the community will initiate these next locations. Register early to claim your priority waitlist placement.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold text-sm">No upcoming projects at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {projects.slice(0, 6).map((project, index) => (
            <motion.div
              key={project.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-brand-green/10 rounded-[32px] p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {project.status ? (
                    <span className={`text-[10px] font-bold font-sora uppercase tracking-wider px-3 py-1 rounded-full border ${statusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  ) : <span />}
                </div>

                {project.name && (
                  <h4 className="text-xl font-bold font-sora text-brand-dark mb-1 group-hover:text-brand-green transition-colors">
                    {project.name}
                  </h4>
                )}

                {project.location && (
                  <div className="flex items-center space-x-1 text-xs font-semibold text-brand-green/80 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{project.location}</span>
                  </div>
                )}

                {project.totalCapacity > 0 && (
                  <div className="mb-5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
                      <span>Capacity Tracker</span>
                      <span>0% filled</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-300 w-0" />
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-1">
                      Target Capacity: <span className="font-bold text-brand-dark">{formatRupee(project.totalCapacity)}</span>
                    </div>
                  </div>
                )}

                {project.description && (
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium mb-4">
                    {project.description}
                  </p>
                )}
              </div>

              {project.name && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProject(project)}
                  className="mt-6 w-full py-3 rounded-2xl bg-brand-light text-brand-dark hover:bg-brand-dark hover:text-white border border-brand-green/10 text-xs md:text-sm font-sora font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
                >
                  Join Waitlist
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="bg-white rounded-[40px] border border-brand-green/10 w-full max-w-lg p-8 md:p-10 shadow-2xl relative z-10 overflow-hidden"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-brand-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-green via-brand-parrot to-emerald-500" />

              {!submittedMessage ? (
                <>
                  <h4 className="text-2xl font-extrabold font-sora text-brand-dark tracking-tight mb-2">
                    Priority Waitlist
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 font-semibold mb-6">
                    Sign up for <span className="text-brand-green font-bold">{selectedProject.name || 'this project'}</span>. You will receive priority notifications when the participation period opens.
                  </p>

                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 font-semibold text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Target Membership Level
                      </label>
                      <select
                        value={tierInput}
                        onChange={(e) => setTierInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 font-semibold text-sm bg-white"
                      >
                        <option value="Silver">Silver Tier (₹7,500)</option>
                        <option value="Gold">Gold Tier (₹15,000)</option>
                        <option value="Platinum">Platinum Tier (₹30,000)</option>
                      </select>
                    </div>

                    <div className="flex items-start space-x-2.5 bg-brand-light p-3.5 rounded-2xl border border-brand-green/10">
                      <AlertCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <span className="text-[11px] font-semibold text-slate-500 leading-normal">
                        No immediate commitment needed. You will only be invited to participate once the formal structure goes live.
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-brand-dark text-white hover:text-brand-parrot font-sora font-bold uppercase tracking-wider text-xs md:text-sm shadow-md transition-colors duration-300 mt-2 cursor-pointer"
                    >
                      Secure Priority Spot
                    </motion.button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-16 h-16 text-brand-parrot mb-4" />
                  <h4 className="text-2xl font-extrabold font-sora text-brand-dark tracking-tight mb-2">
                    Priority Secured!
                  </h4>
                  <p className="text-slate-500 font-semibold text-sm max-w-xs">
                    We have registered your spot for the {tierInput} Tier in the upcoming {selectedProject.name || 'project'}.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
