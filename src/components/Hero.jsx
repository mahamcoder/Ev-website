import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import background from '../assets/image.webp';

export default function Hero({ onScrollToSection }) {
  const floatAnim = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatAnimReverse = {
    animate: {
      y: [0, 8, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section id="hero" className="relative flex flex-col justify-between pt-36 pb-0 overflow-hidden bg-white select-none">

      <div className="absolute inset-0 z-0">
        <img
          src="https://i.pinimg.com/736x/6f/c1/40/6fc1400c063b81d45bf407fe1b299e72.jpg"
          alt="Sustainable Future Background"
          className="w-full h-full object-cover object-center opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/10 via-35% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent via-20%" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 text-center flex flex-col items-center flex-grow justify-between">

        <div className="flex flex-col items-center max-w-4xl mt-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-white/80 border border-slate-200/60 backdrop-blur-sm rounded-full px-4.5 py-1.5 mb-6 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <span>☘️</span>
            <span className="text-slate-600 capitalize">Powering a Sustainable solution</span>
            <span className="text-slate-300">➔</span>
            <span className="text-amber-500 font-bold">⚡</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[2.2rem] sm:text-5xl lg:text-[4.5rem] font-bold font-sora text-[#10301d] leading-[1.12] tracking-tight mb-5 drop-shadow-sm"
          >
            Building Indian's<br />Green Energy Solutions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-xs sm:text-sm md:text-base text-slate-700 font-semibold leading-relaxed max-w-2xl mb-8 bg-white/20 backdrop-blur-[2px] rounded-xl px-4 py-2"
          >
            STOSHI Green Energy is creating a sustainable ecosystem through Innovation EV solutions, community power and a cleaner tomorrow
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => onScrollToSection('membership')}
              className="bg-[#105D3D] hover:bg-[#0c4c31] text-white rounded-full px-6 py-3.5 font-sora font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2 group cursor-pointer"
            >
              <span className="text-sm">☘️</span>
              <span>Become a member</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onScrollToSection('benefits')}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full px-6 py-3.5 font-sora font-semibold text-xs transition-all duration-300 shadow-sm hover:shadow flex items-center space-x-2 group cursor-pointer"
            >
              <span>Explore Benefits</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>

        <div className="relative w-full flex-grow min-h-[250px] mt-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
          >
          </motion.div>

          <motion.div
            variants={floatAnim}
            animate="animate"
            className="hidden sm:flex absolute left-4 lg:left-8 bottom-6 z-20 flex-col items-start space-y-3 pointer-events-auto"
          >
          </motion.div>
        </div>

      </div>
    </section>
  );
}
