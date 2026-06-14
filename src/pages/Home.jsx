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
        const actives = list.filter(p => p.isActive === true);
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

  const handleSelectPlan = (planKey) => {
    navigate(`/payment?plan=${planKey}&projectId=${activeProject?.id || ''}`);
  };

  const nonActiveProjects = projects.filter(p => p.isActive !== true && p.id !== activeProject?.id);

  return (
    <div className="relative min-h-screen bg-brand-light selection:bg-brand-parrot selection:text-brand-dark">
      <Navbar capacityPercent={capacityPercent} onScrollToSection={handleScrollToSection} />

      <Hero onScrollToSection={handleScrollToSection} />

      <WhoWeAre />

      {activeProjects.length > 1 && (
        <section className="pt-10 pb-2 bg-brand-light">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 font-sora">Select Active Project</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 w-full justify-center custom-scrollbar">
              {activeProjects.map(proj => (
                <button 
                  key={proj.id}
                  onClick={() => setActiveProject(proj)}
                  className={`px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    activeProject?.id === proj.id 
                    ? 'bg-brand-dark text-[#74E61F] border border-[#74E61F]' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#74E61F] hover:text-brand-dark'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeProject?.id === proj.id ? 'bg-[#74E61F] animate-pulse' : 'bg-slate-300'}`}></span>
                  {proj.name}
                </button>
              ))}
            </div>
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
