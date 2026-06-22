import React, { useState, useEffect } from 'react';
import { useNavigate } from '../router';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WhoWeAre from '../components/WhoWeAre';
import LiveFundingTracker from '../components/LiveFundingTracker';
import CurrentProject from '../components/CurrentProject';
import WhyJoin from '../components/WhyJoin';
import MemberBenefits from '../components/MemberBenefits';
import MembershipCards from '../components/MembershipCards';
import FutureProjects from '../components/FutureProjects';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import PolicyModal from '../components/PolicyModal';

export default function Home() {
  const { currentUser, userData, updateMembershipPlan } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProjects(list);
        const actives = list.filter(p => p.isActive === true || p.status === 'active');
        setActiveProjects(actives);
        
        setActiveProject(current => {
          if (current && actives.find(p => p.id === current.id)) {
            return actives.find(p => p.id === current.id);
          }
          return actives.length > 0 ? actives[0] : (list.length > 0 ? list[0] : null);
        });
      }
    );
    return () => unsub();
  }, []);

  const targetCapacity = activeProject?.totalCapacity || 0;
  const filledCapacity = activeProject?.collectedAmount || 0;
  const totalMembers = activeProject?.totalMembers || 0;
  const remainingCapacity = targetCapacity - filledCapacity;
  const capacityPercent = targetCapacity > 0 ? (filledCapacity / targetCapacity) * 100 : 0;

  const [activePolicyPage, setActivePolicyPage] = useState(null);

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectPlan = (planKey, planPrice) => {
    const projectId = activeProject?.id || '';
    navigate(`/payment?plan=${planKey}&projectId=${projectId}`, {
      state: { planName: planKey, planPrice: planPrice || 0, projectId }
    });
  };

  const nonActiveProjects = projects.filter(p => p.isActive !== true && p.status !== 'active' && p.id !== activeProject?.id);

  return (
    <div className="relative min-h-screen bg-brand-light selection:bg-brand-parrot selection:text-brand-dark">
      <Navbar capacityPercent={capacityPercent} onScrollToSection={handleScrollToSection} />

      <Hero onScrollToSection={handleScrollToSection} />

      <WhoWeAre />

      {activeProjects.length > 0 && (
        <section className="pt-16 pb-4 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-widest text-[#3B6D11] uppercase block mb-2 font-sora">
              ACTIVE PROJECTS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-sora text-[#042A1d] mb-2 text-center">
              Choose a project to explore
            </h2>
            <p className="text-slate-500 font-semibold text-xs sm:text-sm max-w-xl text-center mb-8">
              Select any live project below to view its capacity, details & pricing
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-6 w-full max-w-5xl justify-center items-center px-4">
              {activeProjects.map(proj => {
                const total = proj.totalCapacity || 0;
                const filled = proj.collectedAmount || 0;
                const fundingPercent = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
                const isActiveTab = activeProject?.id === proj.id;
                return (
                  <div key={proj.id} className="relative">
                    <button 
                      onClick={() => setActiveProject(proj)}
                      className={`flex flex-col p-5 rounded-2xl transition-all text-left shadow-sm cursor-pointer w-64 border-2 ${
                        isActiveTab 
                        ? 'border-[#3B6D11] bg-[#EAF3DE]' 
                        : 'border-slate-200 bg-white hover:border-[#3B6D11] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 bg-[#EAF3DE] text-[#3B6D11] text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase border border-[#3B6D11]/10 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] animate-pulse" />
                        <span>LIVE</span>
                      </div>
                      <span className="text-sm font-black font-sora text-[#042A1d] mb-1">
                        {proj.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {fundingPercent.toFixed(0)}% Funded
                      </span>
                    </button>
                    {isActiveTab && (
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-[8px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#3B6D11] z-10" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-[#3B6D11]/30 to-transparent mt-8" />
          </div>
        </section>
      )}

      <LiveFundingTracker activeProject={activeProject} />

      <CurrentProject activeProject={activeProject} upcomingProjects={nonActiveProjects} onScrollToSection={handleScrollToSection} />

      <WhyJoin onScrollToSection={handleScrollToSection} />
      <MemberBenefits />

      <section id="membership" className="py-20 md:py-28 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <MembershipCards
            onPledge={handleSelectPlan}
            remainingCapacity={remainingCapacity}
            activeProject={activeProject}
          />
        </div>
      </section>

      <section id="future" className="py-20 md:py-28 px-4 md:px-8 bg-[#F7FAF7]">
        <div className="max-w-7xl mx-auto">
          <FutureProjects projects={nonActiveProjects} />
        </div>
      </section>

      <Testimonials />
      <FAQ />

      <Footer
        onScrollToSection={handleScrollToSection}
        onOpenPolicy={setActivePolicyPage}
      />

      {activePolicyPage && (
        <PolicyModal page={activePolicyPage} onClose={() => setActivePolicyPage(null)} />
      )}
    </div>
  );
}
