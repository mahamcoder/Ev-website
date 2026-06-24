import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Shield, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from '../router';

export default function Navbar({ onScrollToSection }) {
  const [activeItem, setActiveItem] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, userData, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', id: 'hero' },
    { name: 'About', id: 'whoweare' },
    { name: 'Projects', id: 'tracker' },
    { name: 'Membership', id: 'membership' },
    { name: 'Future Plans', id: 'future' },
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
      className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-3.5 md:py-5 bg-[#F9FAF9]/90 backdrop-blur-md border-b border-slate-100/40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => {
              setMobileMenuOpen(false);
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
              className="h-12 md:h-16 w-auto group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Nav (Desktop) */}
        {window.location.pathname === '/' ? (
          <nav className="hidden md:flex items-center bg-[#ECECEC]/60 border border-slate-200/40 rounded-full p-1">
            {navItems.map((item) => {
              const isActive = activeItem === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveItem(item.name);
                    onScrollToSection(item.id);
                  }}
                  className={`px-5 py-3 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
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

        {/* Right Side (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
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

              {/* Shop Button */}
              <a
                href="https://market.stoshisolution.com/shop?category=31bfe800-9cf5-4dcc-bd40-c19bc92fa7e3"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#74E61F] text-[#042A1d] text-xs font-black uppercase tracking-wider hover:bg-[#5BC916] transition-all shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Now</span>
              </a>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden mt-4 pt-4 pb-6 border-t border-slate-100 flex flex-col space-y-4"
          >
            {/* Nav Links */}
            {window.location.pathname === '/' ? (
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => {
                  const isActive = activeItem === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveItem(item.name);
                        setMobileMenuOpen(false);
                        onScrollToSection(item.id);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF3DE] text-[#3B6D11] shadow-sm border border-[#3B6D11]/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Back to Homepage
                </Link>
              </div>
            )}

            {/* Divider line */}
            <div className="h-px bg-slate-100 w-full" />

            {/* Actions */}
            <div className="px-4 flex flex-col space-y-3">
              {currentUser ? (
                <>
                  {userData?.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3 text-xs font-bold transition-all shadow flex items-center justify-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  ) : (
                    <Link
                      to={userData?.paymentStatus === 'Paid' ? '/dashboard' : '/payment'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-brand-dark hover:bg-brand-dark/80 text-[#74E61F] border border-[#74E61F]/30 hover:border-[#74E61F] rounded-2xl py-3 text-xs font-bold transition-all shadow flex items-center justify-center space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>My Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-2xl py-3 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-3 text-xs font-bold text-center transition-colors block"
                  >
                    Sign In
                  </Link>

                  <a
                    href="https://market.stoshisolution.com/shop?category=31bfe800-9cf5-4dcc-bd40-c19bc92fa7e3"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-2xl bg-[#74E61F] text-[#042A1d] text-xs font-black uppercase text-center tracking-wider hover:bg-[#5BC916] transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shop Now</span>
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}