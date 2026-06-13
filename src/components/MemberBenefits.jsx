import React from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Car, Target, Wallet, Leaf,
  Shield, Handshake, LayoutDashboard, Users, Award
} from 'lucide-react';

const benefits = [
  {
    icon: Gift,
    title: 'UTILITY\nREWARDS',
    desc: 'Earn exciting utility rewards and unlock valuable ecosystem incentives.'
  },
  {
    icon: Car,
    title: 'EV ECOSYSTEM\nACCESS',
    desc: "Be part of India's growing EV ecosystem and access innovative mobility solutions."
  },
  {
    icon: Target,
    title: 'PRIORITY\nOPPORTUNITIES',
    desc: 'Get priority access to selected programs, launches and exclusive ecosystem opportunities.'
  },
  {
    icon: Wallet,
    title: 'PROMOTIONAL\nCOUPON WALLET',
    desc: 'Enjoy a high-value promotional coupon wallet with amazing discounts and offers.'
  },
  {
    icon: Leaf,
    title: 'GREEN IMPACT\nRECOGNITION',
    desc: 'Contribute to a greener planet and earn recognition for your green impact.'
  },
  {
    icon: Shield,
    title: 'LOYALTY\nADVANTAGES',
    desc: 'Unlock loyalty-based benefits and special privileges as you grow with us.'
  },
  // {
  //   icon: Handshake,
  //   title: 'PARTNER NETWORK\nBENEFITS',
  //   desc: 'Access partner discounts, collaborations and exclusive member-only privileges.'
  // },
  // {
  //   icon: LayoutDashboard,
  //   title: 'PERSONAL\nDASHBOARD',
  //   desc: 'Track your membership, benefits, rewards and activities in your personal dashboard.'
  // },
  // {
  //   icon: Users,
  //   title: 'COMMUNITY\nPROGRAMS',
  //   desc: 'Engage in community programs, events and initiatives for learning and growth.'
  // },
  // {
  //   icon: Award,
  //   title: 'EXCLUSIVE MEMBER\nSTATUS',
  //   desc: 'Enjoy a special member status with premium features and ecosystem privileges.'
  // }
];

export default function MemberBenefits() {
  return (
    <section id="benefits" className="py-20 md:py-28 px-4 md:px-8 bg-[#F7FAF7] overflow-hidden container mx-auto">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white border border-brand-green/20 text-brand-green rounded-full px-5 py-2 text-[11px] font-bold font-sora uppercase tracking-widest shadow-sm mb-6"
          >
            <Leaf className="w-3.5 h-3.5" />
            Member Benefits
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[2.8rem] font-black font-sora text-brand-dark leading-tight tracking-tight mb-4"
          >
            ONE MEMBERSHIP,{' '}
            <span className="text-brand-green">MULTIPLE BENEFITS</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-sm md:text-base max-w-xl mx-auto"
          >
            Unlock exclusive advantages and grow with the STOSHI Green Energy ecosystem.
          </motion.p>

          {/* Decorative underline */}
          <div className="w-10 h-0.5 bg-brand-green mx-auto mt-5 rounded-full" />
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 flex flex-col items-center text-center border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Icon circle */}
                <div className="w-16 h-16 rounded-full bg-[#EAF6EE] flex items-center justify-center mb-5 group-hover:bg-brand-green/15 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-brand-green" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-[11px] font-black font-sora text-brand-dark uppercase tracking-wide leading-snug mb-3 whitespace-pre-line">
                  {benefit.title}
                </h3>

                {/* Thin green separator */}
                <div className="w-6 h-0.5 bg-brand-green/40 rounded-full mb-3" />

                {/* Description */}
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {benefit.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
