import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MembershipCards({ onPledge, remainingCapacity, activeProject }) {
  const silverPrice = activeProject?.silverPrice || 7500;
  const goldPrice = activeProject?.goldPrice || 15000;
  const platinumPrice = activeProject?.platinumPrice || 30000;

  const tiers = [
    {
      name: 'Silver Membership',
      price: Number(silverPrice),
      badge: 'Basic',
      bgClass: 'bg-white border-slate-200 text-brand-dark',
      badgeClass: 'bg-slate-100 text-slate-600',
      priceClass: 'text-brand-dark',
      descClass: 'text-slate-500',
      featureClass: 'text-slate-600',
      checkBg: 'bg-emerald-50 text-brand-green border-brand-green/10',
      buttonClass: 'bg-brand-dark text-white hover:bg-brand-green',
      arrowBg: 'bg-white text-brand-dark',
      features: [
        activeProject?.powerRating || '120 kW Power Rating',
        activeProject?.chargingBays || '8 Charging Bays',
        activeProject?.dailyUsers || '120+ Daily Users',
        activeProject?.co2Saved || '48 Tonnes CO₂ Saved/yr'
      ]
    },
    {
      name: 'Gold Membership',
      price: Number(goldPrice),
      badge: 'Advanced',
      bgClass: 'bg-[#0B3022] border-[#154634] text-white shadow-2xl shadow-brand-dark/20',
      badgeClass: 'bg-brand-parrot/20 text-brand-parrot',
      priceClass: 'text-white',
      descClass: 'text-emerald-100/70',
      featureClass: 'text-emerald-100/90',
      checkBg: 'bg-[#154634] text-brand-parrot border-brand-parrot/10',
      buttonClass: 'bg-[#74E61F] text-[#0B3022] hover:bg-white hover:text-brand-dark',
      arrowBg: 'bg-[#0B3022] text-[#74E61F]',
      popular: true,
      features: [
        'Priority charging nodes access',
        'Bi-monthly physical impact reports',
        'Green Infrastructure Badge',
        'Invitations to annual energy summits',
        '2x Priority for next project cycles'
      ]
    },
    {
      name: 'Platinum Membership',
      price: Number(platinumPrice),
      badge: 'Premium',
      bgClass: 'bg-white border-slate-200 text-brand-dark',
      badgeClass: 'bg-slate-100 text-slate-600',
      priceClass: 'text-brand-dark',
      descClass: 'text-slate-500',
      featureClass: 'text-slate-600',
      checkBg: 'bg-emerald-50 text-brand-green border-brand-green/10',
      buttonClass: 'bg-brand-dark text-white hover:bg-brand-green',
      arrowBg: 'bg-white text-brand-dark',
      features: [
        'VIP access to charging node inaugurations',
        'Co-owner voting rights on future locations',
        'Special plaque at Sonbhadra node',
        'Lifetime waiver of standard processing fees',
        'Guaranteed placement in future waitlists'
      ]
    }
  ];

  const handlePledgeClick = (tierName, amount) => {
    if (remainingCapacity < amount) {
      alert(`Pledge of ₹${amount.toLocaleString('en-IN')} exceeds remaining project capacity of ₹${remainingCapacity.toLocaleString('en-IN')}. Try a smaller membership tier!`);
      return;
    }

    // Trigger Canvas Confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#042A1d', '#105D3D', '#74E61F', '#22C55E']
    });

    onPledge(amount);
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-16">
        <span className="text-[11px] font-bold text-brand-green uppercase tracking-widest block mb-2">
          Our Pricing Plan
        </span>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-sora text-brand-dark tracking-tight">
          Affordable & Transparent Pricing for Every Energy Need
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch px-4">
        {tiers.map((tier, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className={`border-2 rounded-[32px] p-8 ${tier.bgClass} transition-all duration-300 flex flex-col justify-between relative overflow-hidden group`}
          >
            <div>
              {/* Badge & Meta */}
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-sora uppercase tracking-wider ${tier.badgeClass}`}>
                  {tier.badge}
                </span>
                
                {tier.popular && (
                  <span className="text-[9px] font-extrabold text-[#74E61F] uppercase tracking-widest">
                    Best choice
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-4xl font-extrabold font-sora tracking-tight ${tier.priceClass}`}>
                  {formatRupee(tier.price)}
                </span>
                <span className={`text-[12px] font-semibold block mt-1.5 ${tier.descClass}`}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut rhoncus purus.
                </span>
              </div>

              {/* CTA Button matching Reference 5 (Circle arrow icon) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePledgeClick(tier.name, tier.price)}
                className={`w-full py-3.5 rounded-2xl text-xs md:text-sm font-sora font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-3 mb-8 shadow-sm ${tier.buttonClass} cursor-pointer`}
              >
                <span>Get Started</span>
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 ${tier.arrowBg}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </motion.button>

              {/* Features List */}
              <ul className="space-y-4 mb-6">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${tier.checkBg}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={`text-xs md:text-sm font-medium leading-tight ${tier.featureClass}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
