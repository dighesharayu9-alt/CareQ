import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartHandshake, Phone, Mail, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Care<span className="text-primary-light">Q</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Hospital Patient Queue Management System. Dynamic operational wait estimates, clinical emergency coordination, and patient-first transparency.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Engine Active</span>
            </div>
          </div>

          {/* Patient Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Patient Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/book" className="hover:text-white transition-colors">
                  Book OPD Appointment
                </Link>
              </li>
              <li>
                <Link to="/live-queue" className="hover:text-white transition-colors">
                  Live Public Display
                </Link>
              </li>
              <li>
                <Link to="/senior-view" className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-300">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Senior Citizen Easy View
                </Link>
              </li>
              <li>
                <Link to="/patient/dashboard" className="hover:text-white transition-colors">
                  Patient Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Hospital Staff */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Hospital Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/doctor/dashboard" className="hover:text-white transition-colors">
                  Doctor OPD Station
                </Link>
              </li>
              <li>
                <Link to="/reception/dashboard" className="hover:text-white transition-colors">
                  Reception Desk
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">
                  Administration & Reports
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Emergency Impact Preview (Staff Auth)</span>
              </li>
            </ul>
          </div>

          {/* Hospital Contact & Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
              Clinical Disclaimer
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-primary inline mr-1" />
              CareQ manages operational queues and estimated wait times. Clinical triage, triage priority, and emergency decisions are made strictly by qualified medical staff.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>OPD Hours: 08:00 AM - 08:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Hospital Triage Helpdesk: +91 (80) 4100-2200</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} CareQ Hospital Systems. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link to="/live-queue" className="hover:text-slate-400">Waiting Room TV Display</Link>
            <Link to="/senior-view" className="hover:text-slate-400">Senior Accessibility</Link>
            <Link to="/login" className="hover:text-slate-400">Staff Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
