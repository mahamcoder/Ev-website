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
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProjects(list);
        const active = list.find(p => p.isActive === true);
        if (active) setActiveProject(active);
        else if (list.length > 0) setActiveProject(list[0]);
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

  const handleSelectPlan = (amount) => {
    const planMap = { 7500: 'Silver', 15000: 'Gold', 30000: 'Platinum' };
    const planName = planMap[amount] || 'Gold';
    navigate(`/payment?plan=${planName}`);
  };

  const nonActiveProjects = projects.filter(p => p.isActive !== true && p.id !== activeProject?.id);

  return (
    <div className="relative min-h-screen bg-brand-light selection:bg-brand-parrot selection:text-brand-dark">
      <Navbar capacityPercent={capacityPercent} onScrollToSection={handleScrollToSection} />

      <Hero onScrollToSection={handleScrollToSection} />

      <WhoWeAre />

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
