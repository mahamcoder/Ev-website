import React from 'react';
import { motion } from 'framer-motion';
import { Users, Landmark, Target, Award, Clock } from 'lucide-react';

export default function DashboardStats({ totalMembers, filled, total, available, percent }) {
  // Format numbers in Indian currency format
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const statItems = [
    {
      id: 1,
      name: 'Total Members',
      value: totalMembers.toLocaleString('en-IN'),
      sub: 'Active participants',
      icon: Users,
      color: 'text-brand-green bg-brand-green/5',
      borderColor: 'border-brand-green/10'
    },
    {
      id: 2,
      name: 'Community Participation',
      value: formatRupee(filled),
      sub: 'Total funds raised',
      icon: Landmark,
      color: 'text-brand-dark bg-brand-parrot/10',
      borderColor: 'border-brand-parrot/20'
    },
    {
      id: 3,
      name: 'Target Capacity',
      value: formatRupee(total),
      sub: 'Phase 1 cap limit',
      icon: Target,
      color: 'text-brand-dark bg-brand-dark/5',
      borderColor: 'border-brand-dark/10'
    },
    {
      id: 4,
      name: 'Remaining Capacity',
      value: formatRupee(available),
      sub: 'Open for registration',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      id: 5,
      name: 'Project Completion',
      value: `${percent.toFixed(1)}%`,
      sub: 'Filled capacity ratio',
      icon: Award,
      color: 'text-emerald-700 bg-emerald-50',
      borderColor: 'border-emerald-100'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full"
    >
      {statItems.map((stat) => (
        <motion.div
          key={stat.id}
          variants={itemVariants}
          className={`bg-white border ${stat.borderColor} rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between relative overflow-hidden group`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-parrot/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              {stat.name}
            </span>
            <div className={`p-2.5 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h4 className="text-xl md:text-2xl font-extrabold font-sora text-brand-dark tracking-tight leading-none">
              {stat.value}
            </h4>
            <p className="text-[12px] font-semibold text-slate-500 mt-1.5">
              {stat.sub}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
