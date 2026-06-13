import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, Battery, Users, Leaf, ArrowUpRight, Building2 } from 'lucide-react';

const formatRupee = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const statusStyle = (status) => {
  const map = {
    'Planning': 'text-amber-600 bg-amber-50 border-amber-200',
    'In Progress': 'text-blue-600 bg-blue-50 border-blue-200',
    'Operational': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Coming Soon': 'text-slate-500 bg-slate-50 border-slate-100',
    'Closed': 'text-red-600 bg-red-50 border-red-200'
  };
  return map[status] || 'text-slate-500 bg-slate-50 border-slate-100';
};

export default function CurrentProject({ activeProject, upcomingProjects = [], onScrollToSection }) {
  if (!activeProject) return null;

  return (
    <section id="current-project" className="py-20 md:py-28 px-4 md:px-8 bg-[#F7FAF7] overflow-hidden">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-3"
          >
            Active Project
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black font-sora text-brand-dark leading-tight tracking-tight"
          >
            {activeProject.name || 'Active Project'}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 bg-[#042A1D] rounded-[36px] p-8 md:p-10 text-white overflow-hidden relative"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-parrot/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="inline-flex items-center gap-2 bg-brand-parrot/20 text-brand-parrot text-[10px] font-extrabold tracking-wider px-3.5 py-1.5 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-parrot animate-pulse" />
                  {activeProject.status || 'Active'}
                </span>
                {activeProject.location && (
                  <div className="flex items-center gap-1.5 text-emerald-300/60 text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeProject.location}</span>
                  </div>
                )}
              </div>

              <h3 className="text-2xl md:text-3xl font-black font-sora text-white mb-3 tracking-tight">
                {activeProject.name}
              </h3>

              {activeProject.description && (
                <p className="text-emerald-100/70 text-sm leading-relaxed mb-8 max-w-md">
                  {activeProject.description}
                </p>
              )}

              {(activeProject.powerRating || activeProject.chargingBays || activeProject.dailyUsers || activeProject.co2Saved) && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {activeProject.powerRating && (
                    <div className="bg-white/8 rounded-2xl p-4 border border-white/10">
                      <Zap className="w-4 h-4 text-brand-parrot mb-2" strokeWidth={1.5} />
                      <span className="text-lg font-black font-sora text-white block">{activeProject.powerRating}</span>
                      <span className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider">Power Rating</span>
                    </div>
                  )}
                  {activeProject.chargingBays && (
                    <div className="bg-white/8 rounded-2xl p-4 border border-white/10">
                      <Battery className="w-4 h-4 text-brand-parrot mb-2" strokeWidth={1.5} />
                      <span className="text-lg font-black font-sora text-white block">{activeProject.chargingBays}</span>
                      <span className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider">Charging Bays</span>
                    </div>
                  )}
                  {activeProject.dailyUsers && (
                    <div className="bg-white/8 rounded-2xl p-4 border border-white/10">
                      <Users className="w-4 h-4 text-brand-parrot mb-2" strokeWidth={1.5} />
                      <span className="text-lg font-black font-sora text-white block">{activeProject.dailyUsers}</span>
                      <span className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider">Daily Users</span>
                    </div>
                  )}
                  {activeProject.co2Saved && (
                    <div className="bg-white/8 rounded-2xl p-4 border border-white/10">
                      <Leaf className="w-4 h-4 text-brand-parrot mb-2" strokeWidth={1.5} />
                      <span className="text-lg font-black font-sora text-white block">{activeProject.co2Saved}</span>
                      <span className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider">CO₂ Saved/yr</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                {activeProject.totalCapacity > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-wider block">Project Capacity</span>
                    <span className="text-2xl font-black font-sora text-white">{formatRupee(activeProject.totalCapacity)}</span>
                  </div>
                )}
                <button
                  onClick={() => onScrollToSection && onScrollToSection('membership')}
                  className="flex items-center gap-2 bg-brand-parrot hover:bg-white text-[#042A1D] font-sora font-bold text-xs rounded-full px-5 py-2.5 transition-all duration-300 cursor-pointer ml-auto"
                >
                  Join Now
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-2"
            >
              <span className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-1">
                Upcoming Projects
              </span>
              <h3 className="text-xl font-black font-sora text-brand-dark">
                Next Charging Nodes
              </h3>
            </motion.div>

            {upcomingProjects.length > 0 ? (
              upcomingProjects.slice(0, 6).map((project, i) => (
                <motion.div
                  key={project.id || i}
                  initial={{ opacity: 0, x: 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-black font-sora text-brand-dark">{project.name || 'Upcoming Project'}</h4>
                      {project.location && (
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {project.location}
                        </div>
                      )}
                    </div>
                    {project.status && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border ${statusStyle(project.status)}`}>
                        {project.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {project.totalCapacity > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capacity</span>
                        <span className="text-sm font-black font-sora text-brand-dark">{formatRupee(project.totalCapacity)}</span>
                      </div>
                    )}
                    {project.totalMembers > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Members</span>
                        <div className="flex items-center gap-1 text-brand-green text-xs font-bold">
                          <Users className="w-3 h-3" />
                          {project.totalMembers}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No upcoming projects yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
