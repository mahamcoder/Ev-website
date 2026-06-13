import React, { useState } from 'react';
import { Leaf, Send } from 'lucide-react';


export default function Footer({ onScrollToSection, onOpenPolicy }) {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  return (
    <footer className="bg-brand-dark text-white rounded-t-[50px] pt-16 pb-8 px-4 md:px-8 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-parrot/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          
          {/* Logo & Pitch */}
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

          {/* Links columns */}
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
                {['Green Energy Planners', 'FAQ Guide', 'Waitlist Status', 'Support Hub'].map((name, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs md:text-sm text-slate-300 hover:text-brand-parrot font-semibold transition-colors">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="md:col-span-4">
            <h5 className="text-[11px] font-bold font-sora uppercase tracking-widest text-slate-400 mb-4">
              Join the newsletter
            </h5>
            <p className="text-xs text-slate-300 mb-4 font-semibold">
              Get the latest updates on infrastructure capacity thresholds and launch dates.
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-brand-parrot transition-colors pr-12 font-medium"
              />
              <button
                type="submit"
                className="absolute right-2.5 p-2 rounded-xl bg-brand-parrot text-brand-dark hover:bg-white transition-colors cursor-pointer"
              >
                {subscribed ? <span className="text-[10px] font-bold">Done</span> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full mb-8" />

        {/* Giant footer logo brand */}
        <div className="py-6 select-none pointer-events-none text-center">
          <h2 className="text-[12vw] font-black font-sora text-white/5 tracking-tighter uppercase leading-none">
            Stoshi Energy
          </h2>
        </div>

        {/* Bottom copyright details */}
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
    </footer>
  );
}
