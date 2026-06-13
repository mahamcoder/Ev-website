import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from '../router';

export default function Navbar({ onScrollToSection }) {
  const [activeItem, setActiveItem] = useState('Green Energy');
  const { currentUser, userData, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Green Energy', id: 'hero' },
    { name: 'Consulting', id: 'tracker' },
    { name: 'Solar Power', id: 'membership' },
    { name: 'Wind Turbine', id: 'future' },
    { name: 'Pricing', id: 'membership' }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 w-full z-50 px-6 py-5 bg-[#F9FAF9]/90 backdrop-blur-md border-b border-slate-100/40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section: Logo & Language */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => {
              if (window.location.pathname === '/') {
                onScrollToSection('hero');
              } else {
                navigate('/');
              }
            }}
            className="flex items-center cursor-pointer group"
          >
            <img
              src="/stoshi_logo.webp"
              alt="STOSHI Green Energy"
              className="h-14 md:h-16 w-auto group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Center Section: Navigation Pill (Only active on Home page) */}
        {window.location.pathname === '/' ? (
          <nav className="hidden md:flex items-center bg-[#ECECEC]/60 border border-slate-200/40 rounded-full p-1 max-w-lvh">
            {navItems.map((item) => {
              const isActive = activeItem === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveItem(item.name);
                    onScrollToSection(item.id);
                  }}
                  className={`px-5 py-3 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer ${isActive
                    ? 'bg-[#E1E3E1] text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center bg-[#ECECEC]/60 border border-slate-200/40 rounded-full p-1">
            <Link
              to="/"
              className="px-5 py-3 text-xs font-semibold rounded-full text-slate-500 hover:text-slate-900 transition-all"
            >
              Back to Homepage
            </Link>
          </nav>
        )}

        {/* Right Section: Join Us / CTA / User Auth */}
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3.5">
              {userData?.role === 'admin' ? (
                <Link
                  to="/admin/dashboard"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 py-2 text-xs font-bold transition-all shadow flex items-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <Link
                  to={userData?.paymentStatus === 'Paid' ? '/dashboard' : '/payment'}
                  className="bg-brand-dark hover:bg-brand-dark/80 text-[#74E61F] border border-[#74E61F]/30 hover:border-[#74E61F] rounded-full px-4 py-2 text-xs font-bold transition-all shadow flex items-center space-x-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Dashboard</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-red-500 font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    onScrollToSection('membership');
                  } else {
                    navigate('/signup');
                  }
                }}
                className="bg-slate-950 hover:bg-slate-800 text-white rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
              >
                Green Power
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
