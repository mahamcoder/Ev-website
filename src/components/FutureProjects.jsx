import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, CheckCircle, Mail, AlertCircle, X, Building2, Phone, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [tierInput, setTierInput] = useState('Gold');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !nameInput) return;

    try {
      // 1. Add to Firestore waitlist
      await addDoc(collection(db, 'waitlist'), {
        name: nameInput,
        email: emailInput,
        phone: phoneInput || '',
        preferredPlan: tierInput,
        projectId: selectedProject?.id || '',
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      // 2. Post to Web3Forms for email alert
      const formData = new FormData();
      formData.append("access_key", "c6b1d2d6-0aea-4603-91bd-24a557c3d9eb");
      formData.append("subject", `New Waitlist Signup: ${nameInput} for ${selectedProject?.name || 'Upcoming Project'}`);
      formData.append("name", nameInput);
      formData.append("email", emailInput);
      formData.append("phone", phoneInput || 'N/A');
      formData.append("preferredPlan", tierInput);
      formData.append("projectName", selectedProject?.name || 'Upcoming Project');

      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      setSubmittedMessage(true);
      setTimeout(() => {
        setSubmittedMessage(false);
        setSelectedProject(null);
        setEmailInput('');
        setNameInput('');
        setPhoneInput('');
      }, 2500);
    } catch (err) {
      console.error("Error joining waitlist:", err);
      alert("Failed to join waitlist. Please try again.");
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-4">
          {projects.slice(0, 6).map((project, index) => (
            <motion.div
              key={project.id || index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -12 }}
              className="bg-white border border-[#B7E4C7] rounded-[40px] p-8 hover:shadow-[0_20px_40px_rgba(27,67,50,0.12)] transition-all duration-500 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#D8F3DC] to-transparent rounded-bl-full opacity-60 -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  {project.status ? (
                    <span className={`text-[10px] font-extrabold font-sora uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${statusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  ) : <span />}
                  <div className="w-12 h-12 rounded-full bg-[#F7FBF9] flex items-center justify-center border border-[#B7E4C7] shadow-sm group-hover:bg-[#74E61F] transition-colors duration-300">
                    <Building2 className="w-5 h-5 text-[#1B4332]" />
                  </div>
                </div>

                {project.name && (
                  <h4 className="text-2xl font-black font-sora text-[#1B4332] mb-3 group-hover:text-[#40916C] transition-colors leading-tight">
                    {project.name}
                  </h4>
                )}

                {project.location && (
                  <div className="flex items-center space-x-2 text-sm font-bold text-[#40916C] mb-8">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                )}

                <div className="flex gap-4 mb-8">
                  <div className="flex-1 bg-[#F7FBF9] rounded-2xl p-4 border border-[#B7E4C7] text-center group-hover:border-[#74E61F]/30 group-hover:bg-white transition-colors duration-300 shadow-inner group-hover:shadow-md">
                     <span className="block text-[10px] uppercase font-bold text-[#40916C] mb-1 tracking-wider">Site Status</span>
                     <span className="block text-sm font-black text-[#1B4332]">Evaluating</span>
                  </div>
                  <div className="flex-1 bg-[#F7FBF9] rounded-2xl p-4 border border-[#B7E4C7] text-center group-hover:border-[#74E61F]/30 group-hover:bg-white transition-colors duration-300 shadow-inner group-hover:shadow-md">
                     <span className="block text-[10px] uppercase font-bold text-[#40916C] mb-1 tracking-wider">Launch ETA</span>
                     <span className="block text-sm font-black text-[#1B4332]">TBA</span>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-slate-600 leading-relaxed font-semibold mb-8 line-clamp-3">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="relative z-10 mt-auto">
                {project.name && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProject(project)}
                    className="w-full py-4 rounded-2xl bg-[#1B4332] text-white hover:bg-[#74E61F] hover:text-[#042A1d] text-sm font-sora font-extrabold uppercase tracking-wider transition-all duration-300 shadow-[0_8px_20px_rgba(27,67,50,0.2)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Join Priority List</span>
                    <Calendar className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
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
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 font-semibold text-sm"
                        />
                      </div>
                    </div>

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
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="9876543210"
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
