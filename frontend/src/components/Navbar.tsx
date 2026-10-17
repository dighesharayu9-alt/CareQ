import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Tv,
  Calendar,
  HeartHandshake,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Layers,
  HelpCircle,
  Phone,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { EmergencySimulatorModal } from './EmergencySimulatorModal.js';

export const Navbar: React.FC = () => {
  const { user, logout, quickLoginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState<boolean>(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);

  // Fetch unread notifications
  const fetchUnread = () => {
    if (user) {
      api
        .get('/notifications')
        .then((res) => {
          if (res.success) setUnreadCount(res.unreadCount || 0);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchUnread();
    const socket = getSocket();
    const handleNotification = () => fetchUnread();
    socket.on('notification:received', handleNotification);
    return () => {
      socket.off('notification:received', handleNotification);
    };
  }, [user]);

  const handleRoleSwitch = async (role: UserRole) => {
    setDemoMenuOpen(false);
    await quickLoginDemo(role);
    if (role === 'PATIENT') navigate('/patient/dashboard');
    else if (role === 'DOCTOR') navigate('/doctor/dashboard');
    else if (role === 'RECEPTIONIST') navigate('/reception/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'PATIENT':
        return '/patient/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'RECEPTIONIST':
        return '/reception/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <EmergencySimulatorModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand (Matching Image 2 Style) */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900">
                    Care<span className="text-primary">Q</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="text-[9px] font-bold tracking-widest text-text-muted uppercase leading-none">
                  PATIENT QUEUE MANAGEMENT
                </div>
              </div>
            </Link>

            {/* Desktop Navigation (Matching Image 2 Menu Links) */}
            <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-text-secondary">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Features
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                How It Works
              </button>

              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Emergency Preview
              </button>

              <Link
                to="/live-queue"
                className={`flex items-center gap-1 transition-colors ${
                  location.pathname.startsWith('/live-queue')
                    ? 'text-primary font-bold'
                    : 'hover:text-primary'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Public Display
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection('faq')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                FAQ
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Contact
              </button>

              <Link
                to="/senior-view"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all ${
                  location.pathname === '/senior-view'
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold'
                    : 'bg-slate-50 text-slate-700 border-border hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                <span>Senior Easy View</span>
              </Link>
            </nav>

            {/* Mid-screen condensed nav for medium screens */}
            <nav className="hidden md:flex xl:hidden items-center gap-4 text-xs font-semibold text-text-secondary">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-primary"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="hover:text-red-600 text-red-600 font-bold"
              >
                Emergency
              </button>
              <Link to="/live-queue" className="hover:text-primary">
                Live TV
              </Link>
              <Link to="/senior-view" className="text-teal-700 font-bold">
                Senior View
              </Link>
            </nav>

            {/* Right Action Bar */}
            <div className="hidden md:flex items-center gap-3">
              {/* Quick Demo Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Demo Switcher</span>
                  <ChevronDown className="w-3 h-3 text-indigo-600" />
                </button>

                {demoMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-elevated border border-border py-2 z-50 text-xs divide-y divide-border">
                    <div className="px-3 py-1.5 font-bold text-text-muted uppercase tracking-wider text-[10px]">
                      Switch User Role Instantly
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => handleRoleSwitch('PATIENT')}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-text-primary">Ramesh Kumar</div>
                          <div className="text-text-muted text-[11px]">
                            Patient (CARD-015 in queue)
                          </div>
                        </div>
                        <span className="badge badge-waiting text-[10px]">Patient</span>
                      </button>

                      <button
                        onClick={() => handleRoleSwitch('DOCTOR')}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-text-primary">Dr. Rajesh Sharma</div>
                          <div className="text-text-muted text-[11px]">Cardiologist (OPD 101)</div>
                        </div>
                        <span className="badge badge-in-consultation text-[10px]">Doctor</span>
                      </button>

                      <button
                        onClick={() => handleRoleSwitch('RECEPTIONIST')}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-text-primary">Sarah Jenkins</div>
                          <div className="text-text-muted text-[11px]">
                            Reception & Emergency Triage
                          </div>
                        </div>
                        <span className="badge badge-called text-[10px]">Staff</span>
                      </button>

                      <button
                        onClick={() => handleRoleSwitch('ADMIN')}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-text-primary">
                            System Administrator
                          </div>
                          <div className="text-text-muted text-[11px]">Full Hospital Oversight</div>
                        </div>
                        <span className="badge bg-slate-100 text-slate-800 text-[10px]">Admin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard Link / Admin Dashboard Button (Matching Image 2) */}
              <Link
                to={user ? getDashboardPath() : '/admin/dashboard'}
                className="px-3.5 py-1.5 rounded-lg border border-primary/40 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors uppercase tracking-wider"
              >
                {user ? `${user.role} DASHBOARD` : 'ADMIN DASHBOARD'}
              </Link>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Notification Bell */}
                  <Link
                    to="/notifications"
                    className="relative p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {user.fullName.substring(0, 1).toUpperCase()}
                    </div>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="p-1.5 text-text-secondary hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-secondary text-xs px-3 py-1.5">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-text-secondary hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('features');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-text-primary"
            >
              Platform Features
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('how-it-works');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-text-primary"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setEmergencyModalOpen(true);
              }}
              className="block w-full text-left py-2 text-sm font-bold text-red-600"
            >
              Emergency Impact Preview
            </button>
            <Link
              to="/live-queue"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-text-primary"
            >
              Public Live Queue Display
            </Link>
            <Link
              to="/senior-view"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-teal-700 font-bold"
            >
              Senior Citizen Easy View
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('faq');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-text-primary"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('contact');
              }}
              className="block w-full text-left py-2 text-sm font-medium text-text-primary"
            >
              Contact Hospital Desk
            </button>

            {user && (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-primary"
              >
                Go to {user.role} Dashboard
              </Link>
            )}

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="text-xs font-semibold text-text-muted uppercase">
                Quick Demo Switcher:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleRoleSwitch('PATIENT');
                  }}
                  className="p-2 text-xs bg-slate-50 rounded border text-left font-medium"
                >
                  👤 Patient (Ramesh)
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleRoleSwitch('DOCTOR');
                  }}
                  className="p-2 text-xs bg-slate-50 rounded border text-left font-medium"
                >
                  🩺 Doctor (Dr. Sharma)
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleRoleSwitch('RECEPTIONIST');
                  }}
                  className="p-2 text-xs bg-slate-50 rounded border text-left font-medium"
                >
                  📋 Reception Desk
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleRoleSwitch('ADMIN');
                  }}
                  className="p-2 text-xs bg-slate-50 rounded border text-left font-medium"
                >
                  ⚙️ Hospital Admin
                </button>
              </div>

              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="btn-secondary w-full text-xs mt-2"
                >
                  Log Out
                </button>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary w-1/2 text-xs text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-1/2 text-xs text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
