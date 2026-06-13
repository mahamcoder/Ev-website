import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is STOSHI Green Energy?',
    a: 'STOSHI Green Energy Private Limited is a community-funded EV charging infrastructure company. We allow members to collectively finance, build, and benefit from clean EV charging stations across Uttar Pradesh and beyond.'
  },
  {
    q: 'What is the SONBHADRA EV-1 project?',
    a: 'SONBHADRA EV-1 is our first active EV charging node project, located in Sonbhadra, Uttar Pradesh. With a total project capacity of ₹15,00,000, members can participate as Silver (₹7,500), Gold (₹15,000), or Platinum (₹30,000) members to jointly fund this clean infrastructure.'
  },
  {
    q: 'How do I become a member?',
    a: 'Simply choose your preferred membership tier (Silver, Gold, or Platinum), click "Get Started", and complete your pledge. Membership is open to individuals across India and will remain active until project capacity is fully filled.'
  },
  {
    q: 'What do I get as a member?',
    a: 'All members receive a digital NFT certificate of participation, access to the STOSHI community, utility rewards, promotional coupons, priority access to future projects, and tier-specific benefits including co-owner voting rights and physical recognition at the charging node.'
  },
  {
    q: 'What is an NFT membership certificate?',
    a: 'Your NFT certificate is a blockchain-backed digital record of your participation in the project. It acts as immutable proof of ownership, enables loyalty reward tracking, and grants you governance rights in future project decisions.'
  },
  {
    q: 'Is there a waitlist if the project is full?',
    a: 'Yes. Once the project capacity of ₹15,00,000 is reached, new applications will be placed on a priority waitlist. Waitlisted members get first access to the next project (SONBHADRA EV-2, AZAMGARH EV-1, LUCKNOW EV-1).'
  },
  {
    q: 'Can I upgrade my membership tier?',
    a: 'Yes, members can upgrade their tier at any time, subject to available capacity. Please contact the STOSHI support team to facilitate your upgrade and pay the difference in membership fees.'
  },
  {
    q: 'How is my investment protected?',
    a: 'STOSHI operates with full transparency — members receive regular project progress reports, live funding updates on the platform, and an NFT certificate creating a verifiable record. The cooperative model ensures collective accountability across all members.'
  }
];

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        open
          ? 'border-brand-green/30 shadow-md shadow-brand-green/5 bg-white'
          : 'border-slate-100 bg-white hover:border-brand-green/20'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
      >
        <span className={`text-sm font-bold font-sora transition-colors ${open ? 'text-brand-green' : 'text-brand-dark group-hover:text-brand-green'}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className={`shrink-0 ml-4 w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
            open
              ? 'bg-brand-green border-brand-green text-white'
              : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-brand-green/40 group-hover:text-brand-green'
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5">
              <div className="w-full h-px bg-brand-green/10 mb-4" />
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 px-4 md:px-8 bg-[#F7FAF7] overflow-hidden">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-3"
          >
            Got Questions?
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black font-sora text-brand-dark leading-tight tracking-tight mb-4"
          >
            Frequently Asked{' '}
            <span className="text-brand-green italic">Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-sm"
          >
            Everything you need to know about STOSHI membership and projects.
          </motion.p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3">
          {faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
