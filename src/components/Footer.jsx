import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Send, X, Mail, User, CheckCircle, MessageSquare } from 'lucide-react';


export default function Footer({ onScrollToSection, onOpenPolicy }) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactStatus('submitting');
    
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: "c6b1d2d6-0aea-4603-91bd-24a557c3d9eb",
          subject: `New Contact Form Submission from ${contactForm.name}`,
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
        })
      });

      const data = await response.json();
      if (data.success) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => {
          setContactStatus('idle');
          setShowContactModal(false);
        }, 3000);
      } else {
        setContactStatus('error');
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setContactStatus('error');
    }
  };

  return (
    <footer className="bg-brand-dark text-white rounded-t-[50px] pt-16 pb-8 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-parrot/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          
          <div className="md:col-span-4 flex flex-col items-start">
            <div className="flex items-center space-x-2 mb-4 cursor-pointer" onClick={() => onScrollToSection('hero')}>
              <img
              src="/stoshi_logo.webp"
              alt="STOSHI Green Energy"
              className="h-24 md:h-24 w-auto group-hover:scale-102 transition-transform duration-300"
            />
            </div>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
              Dedicated to accelerating the deployment of sustainable EV charging infrastructure across local and regional corridors. Powered by community participation.
            </p>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-[11px] font-bold font-sora uppercase tracking-widest text-slate-400 mb-4">
                Framework
              </h5>
              <ul className="space-y-2.5">
                {['Overview', 'Capacity Tracker', 'Memberships', 'Future Project'].map((name, i) => {
                  const ids = ['hero', 'tracker', 'membership', 'future'];
                  return (
                    <li key={i}>
                      <button
                        onClick={() => onScrollToSection(ids[i])}
                        className="text-xs md:text-sm text-slate-300 hover:text-brand-parrot font-semibold transition-colors"
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] font-bold font-sora uppercase tracking-widest text-slate-400 mb-4">
                Resources
              </h5>
              <ul className="space-y-2.5">
                {['Green Energy Planners', 'FAQ Guide', 'Waitlist Status', 'Support Hub'].map((name, i) => {
                  const clickHandlers = [
                    () => onScrollToSection('membership'),
                    () => onScrollToSection('faq'),
                    () => onScrollToSection('future'),
                    () => setShowContactModal(true)
                  ];
                  return (
                    <li key={i}>
                      <button 
                        onClick={clickHandlers[i]} 
                        className="text-xs md:text-sm text-slate-300 hover:text-brand-parrot font-semibold transition-colors cursor-pointer"
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="md:col-span-4">
            <h5 className="text-[11px] font-bold font-sora uppercase tracking-widest text-slate-400 mb-4">
              Get in Touch
            </h5>
            <p className="text-xs text-slate-300 mb-4 font-semibold">
              Have questions about memberships or our green infrastructure? We are here to help.
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full py-3.5 rounded-2xl bg-brand-parrot text-brand-dark hover:bg-white font-sora font-bold uppercase tracking-wider text-xs md:text-sm shadow-md transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Contact Us</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        <div className="h-px bg-white/10 w-full mb-8" />

        <div className="py-6 select-none pointer-events-none text-center">
          <h2 className="text-[12vw] font-black font-sora text-white/5 tracking-tighter uppercase leading-none">
            Stoshi Energy
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <span>
            © {new Date().getFullYear()} Stoshi Green Energy. All Rights Reserved.
          </span>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <button
              onClick={() => onOpenPolicy && onOpenPolicy('terms')}
              className="hover:text-brand-parrot transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button
              onClick={() => onOpenPolicy && onOpenPolicy('coupon')}
              className="hover:text-brand-parrot transition-colors cursor-pointer"
            >
              Coupon Wallet Policy
            </button>
            <button
              onClick={() => onOpenPolicy && onOpenPolicy('refund')}
              className="hover:text-brand-parrot transition-colors cursor-pointer"
            >
              Refund &amp; Cancellation
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (contactStatus !== 'submitting') setShowContactModal(false);
              }}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="bg-[#042A1d] rounded-[40px] border border-white/10 w-full max-w-lg p-8 md:p-10 shadow-2xl relative z-10 overflow-hidden text-white font-inter"
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                disabled={contactStatus === 'submitting'}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-parrot to-emerald-500" />

              {contactStatus !== 'success' ? (
                <>
                  <h4 className="text-2xl font-extrabold font-sora text-white tracking-tight mb-2 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-brand-parrot" /> Contact Us
                  </h4>
                  <p className="text-xs md:text-sm text-slate-300 font-semibold mb-6">
                    Fill out the form below to get in touch with our team. We usually reply within 24 hours.
                  </p>

                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          name="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="John Doe"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-parrot focus:ring-2 focus:ring-brand-parrot/10 font-semibold text-sm transition-colors"
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
                          name="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-parrot focus:ring-2 focus:ring-brand-parrot/10 font-semibold text-sm transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Message
                      </label>
                      <textarea
                        required
                        name="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Write your message here..."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-parrot focus:ring-2 focus:ring-brand-parrot/10 font-semibold text-sm transition-colors resize-none"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={contactStatus === 'submitting'}
                      className="w-full py-3.5 rounded-2xl bg-brand-parrot text-brand-dark hover:bg-white font-sora font-bold uppercase tracking-wider text-xs md:text-sm shadow-md transition-colors duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {contactStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                    </motion.button>

                    {contactStatus === 'error' && (
                      <p className="text-red-400 text-xs font-semibold text-center mt-2">
                        Failed to send message. Please try again.
                      </p>
                    )}
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-16 h-16 text-brand-parrot mb-4" />
                  <h4 className="text-2xl font-extrabold font-sora text-white tracking-tight mb-2">
                    Message Sent!
                  </h4>
                  <p className="text-slate-300 font-semibold text-sm max-w-xs">
                    Thank you, {contactForm.name}! Your message has been sent successfully. We will get back to you soon.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}