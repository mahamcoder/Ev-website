import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Leaf } from 'lucide-react';

export default function WhoWeAre() {
  const checkItems = [
    'Reduce Carbon Footprint',
    'Cost Effective',
    'Clean & Safe Energy',
    'Building a Sustainable Future'
  ];

  return (
    <section id="whoweare" className="py-20 md:py-28 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ===== LEFT: Image Collage ===== */}
          <div className="relative flex items-center justify-center min-h-[420px]">

            {/* Large card: Wind Turbine */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -3 }}
              whileInView={{ opacity: 1, y: 0, rotate: -3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
              className="relative w-56 md:w-64 h-72 md:h-80 rounded-[32px] overflow-hidden shadow-xl border-4 border-white z-10"
            >
              <img
                src="/sustainable_hero.webp"
                alt="Wind Turbines and Solar Panels"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>

            {/* Overlapping card: Solar Farm Sunset */}
            <motion.div
              initial={{ opacity: 0, y: 60, rotate: 3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, type: 'spring', bounce: 0.4 }}
              className="absolute bottom-0 right-4 md:right-12 w-52 md:w-60 h-56 md:h-64 rounded-[28px] overflow-hidden shadow-xl border-4 border-white z-20"
            >
              <img
                src="/stoshi_hero_bg.webp"
                alt="EV Charging Infrastructure"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>

            {/* Small circular accent image */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, type: 'spring', bounce: 0.5 }}
              className="absolute top-8 right-0 md:right-8 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg z-30 bg-brand-parrot/20"
            >
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-parrot/30 to-brand-green/20">
                <Leaf className="w-8 h-8 text-brand-green" />
              </div>
            </motion.div>

            {/* Floating stats badge */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, type: 'spring', bounce: 0.35 }}
              className="absolute bottom-4 left-0 md:left-4 glassmorphism rounded-2xl px-4 py-3 shadow-lg border border-white/50 z-30"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <span className="text-xl font-black font-sora text-brand-green">10+</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Years pioneering</span>
                  <span className="text-xs font-bold text-brand-dark">clean energy</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ===== RIGHT: Text Content ===== */}
          <div className="text-left">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-3"
            >
              WHO WE ARE
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black font-sora text-brand-dark leading-[1.1] tracking-tight mb-6"
            >
              Building a <span className="text-brand-green italic">cleaner</span>,
              <br />
              <span className="text-brand-green italic">brighter</span> future.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm md:text-[15px] text-slate-500 font-medium leading-relaxed max-w-lg mb-8"
            >
              Satoshis Green Energy Private Limited is committed to delivering sustainable, innovative, and efficient green energy solutions. We design, build, and operate clean power systems for homes, businesses and entire cities.
            </motion.p>

            {/* Check list */}
            <div className="space-y-4">
              {checkItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1, type: 'spring', bounce: 0.3 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-brand-dark">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
