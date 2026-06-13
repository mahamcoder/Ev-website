import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Sharma',
    role: 'Gold Member',
    location: 'Varanasi, UP',
    rating: 5,
    text: 'Joining STOSHI was the best investment decision I made this year. The transparency in their project progress and the community support is unmatched. I feel genuinely proud to be part of building Sonbhadra\'s green future.'
  },
  {
    name: 'Priya Agarwal',
    role: 'Platinum Member',
    location: 'Lucknow, UP',
    rating: 5,
    text: 'The NFT membership certificate was a pleasant surprise — it\'s not just a gimmick, it actually gives real governance rights. The team is responsive, professional, and truly committed to sustainable infrastructure.'
  },
  {
    name: 'Amit Kumar Singh',
    role: 'Silver Member',
    location: 'Azamgarh, UP',
    rating: 5,
    text: 'I started with Silver just to test the waters, but the quality of the updates, community engagement, and the sense of real ownership convinced me to upgrade. Excellent initiative for India\'s clean energy future.'
  },
  {
    name: 'Sunita Verma',
    role: 'Gold Member',
    location: 'Sonbhadra, UP',
    rating: 5,
    text: 'As someone from Sonbhadra itself, I can see the real-world impact this EV charging node will have on our city. STOSHI genuinely cares about local communities and not just profits. I am proud to be an early member.'
  },
  {
    name: 'Deepak Mishra',
    role: 'Platinum Member',
    location: 'Allahabad, UP',
    rating: 5,
    text: 'The promotional coupon wallet and partner network benefits have already paid off more than my membership fee. The live funding tracker keeps you informed in real time — this is how green investment should be done.'
  }
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('');

  const avatarColors = [
    'bg-brand-green text-white',
    'bg-brand-parrot text-brand-dark',
    'bg-[#042A1D] text-brand-parrot',
    'bg-emerald-500 text-white',
    'bg-teal-600 text-white'
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-3"
          >
            Member Stories
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black font-sora text-brand-dark leading-tight tracking-tight"
          >
            What Our{' '}
            <span className="text-brand-green italic">Members Say</span>
          </motion.h2>
        </div>

        {/* Testimonial Slider */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-[#F7FAF7] rounded-[36px] p-8 md:p-12 border border-slate-100 relative overflow-hidden"
            >
              {/* Decorative quote mark */}
              <Quote className="absolute top-8 right-8 w-20 h-20 text-brand-green/6 rotate-180" strokeWidth={1} />

              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black font-sora ${avatarColors[current]}`}>
                    {getInitials(testimonials[current].name)}
                  </div>
                </div>

                <div className="flex-1">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonials[current].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium mb-6 italic">
                    "{testimonials[current].text}"
                  </p>

                  {/* Author */}
                  <div>
                    <span className="font-black font-sora text-brand-dark text-sm block">
                      {testimonials[current].name}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {testimonials[current].role} · {testimonials[current].location}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === current
                      ? 'w-6 h-2 bg-brand-green'
                      : 'w-2 h-2 bg-slate-200 hover:bg-brand-green/40'
                  }`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex gap-3">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-brand-green hover:text-brand-green transition-all duration-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center hover:bg-brand-dark transition-all duration-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
