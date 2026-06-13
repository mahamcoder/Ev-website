import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Gem } from 'lucide-react';

const pillars = [
  {
    icon: Zap,
    number: '01',
    title: 'Sustainable Infrastructure',
    desc: 'We build scalable EV charging networks powered by clean energy. Our nodes are designed for long-term reliability, integrated with solar generation to minimize grid dependency and ensure zero-carbon charging for communities.',
    tags: ['Solar Integration', 'Zero Carbon', 'Scalable Grid']
  },
  {
    icon: Users,
    number: '02',
    title: 'Community Growth',
    desc: 'STOSHI operates on a cooperative funding model — members collectively finance and benefit from each charging project. This democratizes access to green infrastructure and creates a stake for every participant in the ecosystem.',
    tags: ['Cooperative Model', 'Local Ownership', 'Shared Returns']
  },
  {
    icon: Gem,
    number: '03',
    title: 'NFT Membership Benefits',
    desc: 'Every membership is backed by a digital NFT certificate of participation — providing immutable ownership records, loyalty rewards, co-owner governance rights, and eligibility for future project allocations on the blockchain.',
    tags: ['Digital Certificate', 'Loyalty Rewards', 'Co-Governance']
  }
];

export default function WhyJoin({ onScrollToSection }) {
  return (
    <section id="why-join" className="py-20 md:py-28 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-3"
          >
            Why Join STOSHI
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black font-sora text-brand-dark leading-tight tracking-tight mb-4"
          >
            The Future of Green Energy{' '}
            <span className="text-brand-green italic">starts here</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-sm md:text-[15px] leading-relaxed"
          >
            Joining STOSHI means more than membership — it means being a co-creator of India's clean energy future.
          </motion.p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: i * 0.15 }}
                className="group relative bg-[#F7FAF7] hover:bg-white rounded-3xl p-8 border border-slate-100 hover:border-brand-green/20 hover:shadow-xl transition-all duration-400"
              >
                {/* Number */}
                <span className="text-[68px] font-black font-sora text-brand-green/8 leading-none absolute top-6 right-8 select-none pointer-events-none">
                  {pillar.number}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-6 group-hover:bg-brand-green/15 transition-colors">
                  <Icon className="w-7 h-7 text-brand-green" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-black font-sora text-brand-dark mb-3 tracking-tight">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {pillar.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {pillar.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="text-[10px] font-bold text-brand-green bg-brand-green/10 rounded-full px-3 py-1 uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          <button
            onClick={() => onScrollToSection && onScrollToSection('membership')}
            className="bg-brand-green hover:bg-[#0c4c31] text-white font-sora font-bold text-sm rounded-full px-10 py-4 transition-all duration-300 shadow-lg hover:shadow-brand-green/20 hover:-translate-y-0.5 cursor-pointer"
          >
            Join the Movement
          </button>
        </motion.div>

      </div>
    </section>
  );
}
