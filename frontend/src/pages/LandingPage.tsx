import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Ticket,
  Clock,
  Bell,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Stethoscope,
  HeartHandshake,
  TrendingDown,
  Sparkles,
  Zap,
  Calculator,
  GitFork,
  GitMerge,
  PieChart,
  Accessibility,
  UserPlus,
  Timer,
  AlertTriangle,
  RefreshCw,
  Eye,
  UserCheck,
  ArrowLeftRight,
  Tv,
  Monitor,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  UserX,
  FileText,
  Lock,
  ChevronDown,
  HelpCircle,
  Phone,
  Mail,
  Sliders,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge.js';
import { EmergencySimulatorModal } from '../components/EmergencySimulatorModal.js';

export const LandingPage: React.FC = () => {
  // 5-step interactive slider state
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Step 3 (0-indexed: 2)
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const autoplayTimerRef = useRef<any>(null);

  // Emergency Impact Modal state
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);

  // Feature category filter state for 24-card grid
  const [activeFeatureTab, setActiveFeatureTab] = useState<string>('ALL');

  // Interactive Live Impact Widget on page
  const [liveWidgetDelay, setLiveWidgetDelay] = useState<number>(15);

  const steps = [
    {
      number: '01',
      title: 'Book Appointment from Home',
      shortTitle: '1. Online Booking',
      description: 'Choose a department, doctor, and preferred time in a few clicks.',
      tagline: 'Instant OPD Scheduling',
      badge: 'Step 1 of 5',
      visualType: 'booking',
    },
    {
      number: '02',
      title: 'Get Your Digital Token',
      shortTitle: '2. Token Generation',
      description: 'Receive a unique queue token after appointment booking or walk-in registration.',
      tagline: 'Guaranteed Sequence Assignment',
      badge: 'Step 2 of 5',
      visualType: 'token',
    },
    {
      number: '03',
      title: 'Track Your Live Queue',
      shortTitle: '3. Live Queue Tracking',
      description: 'See your queue position, patients ahead, and estimated waiting time.',
      tagline: 'Dynamic Operational Recalculation Engine',
      badge: 'Most Prominent Feature',
      visualType: 'liveQueue',
    },
    {
      number: '04',
      title: 'Receive Queue Updates',
      shortTitle: '4. Real-Time Alerts',
      description: 'Receive updates when the queue changes, a doctor reports a delay, or your turn approaches.',
      tagline: 'Multi-Channel Push & In-App Sync',
      badge: 'Step 4 of 5',
      visualType: 'updates',
    },
    {
      number: '05',
      title: 'Get Called for Consultation',
      shortTitle: '5. OPD Consultation',
      description: 'Know when your token is called and which consultation room to visit.',
      tagline: 'Frictionless Doctor Encounter',
      badge: 'Step 5 of 5',
      visualType: 'consultation',
    },
  ];

  // Autoplay slider every 5.5 seconds (01 -> 02 -> 03 -> 04 -> 05 -> 01)
  useEffect(() => {
    if (isPaused) return;

    autoplayTimerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5500);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPaused, steps.length]);

  const handlePrev = () => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  // 6 Core Differentiation Cards (Image 1)
  const coreDifferentiationCards = [
    {
      id: 'diff-1',
      title: 'Emergency Impact Preview',
      badge: 'Zero Silent Shifts',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      description:
        'See how an emergency patient affects the existing queue BEFORE confirmation. Prevents hospital operational chaos.',
      icon: ShieldAlert,
      iconBg: 'bg-rose-500 text-white',
      interactiveAction: () => setEmergencyModalOpen(true),
      actionText: 'Simulate Impact Preview →',
    },
    {
      id: 'diff-2',
      title: 'Dynamic Queue Recalculation',
      badge: 'Real-Time Precision',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      description:
        'Automatically recalculate waiting times when queue conditions change based on actual doctor consultation duration.',
      icon: Calculator,
      iconBg: 'bg-blue-600 text-white',
    },
    {
      id: 'diff-3',
      title: 'Doctor Reassignment',
      badge: 'Staff Load Balancing',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
      description:
        'Move affected patients to an available doctor when a physician is called to the OT or delayed with zero friction.',
      icon: UserCheck,
      iconBg: 'bg-purple-600 text-white',
    },
    {
      id: 'diff-4',
      title: 'Queue Transfer & Merge',
      badge: 'OPD Flexibility',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      description:
        'Manage changing hospital queues without manually rebuilding them. Transfer single patients or merge entire rooms.',
      icon: GitFork,
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      id: 'diff-5',
      title: 'Delay-Cause Analytics',
      badge: 'Operational Insight',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      description:
        'Understand exactly why patients are waiting with granular breakdowns of doctor delays, emergency influx, and no-shows.',
      icon: PieChart,
      iconBg: 'bg-amber-500 text-white',
    },
    {
      id: 'diff-6',
      title: 'Senior Citizen Easy View',
      badge: 'High Accessibility',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      description:
        'A dedicated simplified high-contrast interface designed for elderly patients with large fonts and 1-tap help.',
      icon: Accessibility,
      iconBg: 'bg-teal-600 text-white',
      linkTo: '/senior-view',
      linkText: 'Try Senior View →',
    },
  ];

  // 24 Platform Capabilities Cards (Image 2)
  const allFeatures = [
    // Row 1
    {
      id: 'f-1',
      category: 'PATIENT',
      title: 'Online Appointment Booking',
      description:
        'Patients select departments, verified doctors, and preferred slots from home in seconds.',
      icon: Calendar,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'f-2',
      category: 'PATIENT',
      title: 'Walk-In Registration',
      description:
        'Reception staff seamlessly registers on-spot patients and generates digital queue tokens.',
      icon: UserPlus,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'f-3',
      category: 'PATIENT',
      title: 'Digital Token Generation',
      description:
        'Sequential department-coded tokens (e.g. CARD-015, ORT-008) eliminate physical paper slips.',
      icon: Ticket,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      id: 'f-4',
      category: 'PATIENT',
      title: 'Real-time Queue Position',
      description:
        'Live bi-directional tracking showing exact queue standing and number of patients ahead.',
      icon: Activity,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },

    // Row 2
    {
      id: 'f-5',
      category: 'CLINICAL',
      title: 'Estimated Waiting Time',
      description:
        'Dynamic formula based on real completed consultation metrics, not static guesswork.',
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'f-6',
      category: 'CLINICAL',
      title: 'Expected Consultation Time',
      description:
        'Precise clock time projection updated instantly whenever queue dynamics shift.',
      icon: Timer,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'f-7',
      category: 'CLINICAL',
      title: 'Doctor Delay Management',
      description:
        'Doctors log delays with one click, triggering automated notifications and schedule shifts.',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    },
    {
      id: 'f-8',
      category: 'PATIENT',
      title: 'Automatic Queue Updates',
      description:
        'Instant socket synchronization across patient phones, doctor desks, and waiting area displays.',
      icon: RefreshCw,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },

    // Row 3
    {
      id: 'f-9',
      category: 'TRIAGE',
      title: 'Emergency Patient Insertion',
      description:
        'Critical trauma and cardiac cases can be immediately prioritized with full audit compliance.',
      icon: Zap,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    },
    {
      id: 'f-10',
      category: 'TRIAGE',
      badge: 'Differentiator',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Emergency Impact Preview',
      description:
        'Preview exactly how many patients are delayed and by how many minutes BEFORE inserting an emergency.',
      icon: Eye,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      action: () => setEmergencyModalOpen(true),
    },
    {
      id: 'f-11',
      category: 'CLINICAL',
      badge: 'Differentiator',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Doctor Reassignment',
      description:
        'Seamlessly transfer affected patient queues when a doctor is called away or unavailable.',
      icon: UserCheck,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'f-12',
      category: 'CLINICAL',
      title: 'Queue Transfer',
      description:
        'Move individual patients across OPD departments and consultation rooms with zero loss of order.',
      icon: ArrowLeftRight,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },

    // Row 4
    {
      id: 'f-13',
      category: 'CLINICAL',
      title: 'Queue Merge',
      description:
        'Merge multi-room queues dynamically during shift handovers with strict duplicate prevention.',
      icon: GitMerge,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    {
      id: 'f-14',
      category: 'PATIENT',
      title: 'Patient Notifications',
      description:
        'Proactive alerts for turn approaching, doctor delays, reassignment, and consultation start.',
      icon: Bell,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'f-15',
      category: 'PATIENT',
      title: 'Public Queue Display',
      description:
        'High-contrast TV kiosk display showing current serving tokens and upcoming patients per room.',
      icon: Tv,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      linkTo: '/live-queue',
    },
    {
      id: 'f-16',
      category: 'GOVERNANCE',
      title: 'Role-based Access (RBAC)',
      description:
        'Tailored views and strict permission barriers for Patients, Doctors, Receptionists, and Admins.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },

    // Row 5
    {
      id: 'f-17',
      category: 'GOVERNANCE',
      title: 'Analytics & Reporting',
      description:
        'Executive dashboard tracking wait times, patient throughput, and hospital department efficiency.',
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      id: 'f-18',
      category: 'GOVERNANCE',
      title: 'Peak Hour Analysis',
      description:
        'Hourly patient volume breakdown helping hospitals optimize staff allocation across peak windows.',
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'f-19',
      category: 'GOVERNANCE',
      badge: 'Differentiator',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Delay Cause Analytics',
      description:
        'Categorized breakdown of wait times by Doctor Delays, Emergencies, No-shows, and Influx.',
      icon: PieChart,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
    {
      id: 'f-20',
      category: 'GOVERNANCE',
      title: 'No-show & Cancellation Analytics',
      description:
        'Track unfulfilled tokens and missed appointments to minimize dead doctor consultation time.',
      icon: UserX,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },

    // Row 6
    {
      id: 'f-21',
      category: 'GOVERNANCE',
      title: 'Audit Logs',
      description:
        'Comprehensive timestamped audit trails of every registration, call, transfer, and delay.',
      icon: FileText,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      id: 'f-22',
      category: 'CLINICAL',
      title: 'Multi-department Support',
      description:
        'Simultaneous queue orchestration across Cardiology, Orthopedics, Medicine, ENT, and more.',
      icon: Building2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      id: 'f-23',
      category: 'PATIENT',
      badge: 'Accessible',
      badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200',
      title: 'Senior Citizen Easy View',
      description:
        'High-contrast, extra-large typography mode with one-click emergency help assistance.',
      icon: Accessibility,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      linkTo: '/senior-view',
    },
    {
      id: 'f-24',
      category: 'GOVERNANCE',
      title: 'Data Security & Access Control',
      description:
        'Encrypted patient identifiers, JWT authorization, and strict compliance-ready safeguards.',
      icon: Lock,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
  ];

  const filteredFeatures = allFeatures.filter((f) => {
    if (activeFeatureTab === 'ALL') return true;
    if (activeFeatureTab === 'DIFFERENTIATOR') return Boolean(f.badge);
    return f.category === activeFeatureTab;
  });

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden">
      {/* Interactive Emergency Impact Modal */}
      <EmergencySimulatorModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-blue-50/50 via-white to-bg-main border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                SMART PATIENT QUEUE MANAGEMENT
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Smart Queue Management for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-700">
                  Hospitals & Clinics
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl">
                Manage patient flow, reduce uncertainty around waiting times, and keep patients and
                hospital staff informed when queue conditions change.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/register" className="btn-primary text-base px-6 py-3 shadow-md">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <button
                  onClick={() => setEmergencyModalOpen(true)}
                  className="btn-secondary text-base px-6 py-3 shadow-xs inline-flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Try Emergency Preview
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-border flex flex-wrap items-center gap-6 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dynamic Wait Recalculation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Emergency Impact Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Senior Citizen Accessible</span>
                </div>
              </div>
            </div>

            {/* Right: Realistic CareQ Dashboard Laptop Frame Mockup */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Decorative glow */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-3xl blur-xl opacity-60" />

                {/* Laptop / Browser Container */}
                <div className="relative bg-white rounded-2xl shadow-elevated border border-border overflow-hidden">
                  {/* Browser Bar */}
                  <div className="bg-slate-100 border-b border-border px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[11px] font-mono text-slate-500">
                        careq.hospital.internal/live-ops
                      </span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      Live Hospital Operations
                    </span>
                  </div>

                  {/* Mockup Dashboard Content */}
                  <div className="p-5 space-y-5 bg-slate-50/50">
                    {/* Header Strip */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-text-muted font-medium">
                          Department Live Operations
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          Cardiology & Multispeciality OPD
                        </div>
                      </div>
                      <span className="badge badge-called text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping mr-1" />
                        Live Engine Connected
                      </span>
                    </div>

                    {/* KPI Mini-Cards */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs text-center">
                        <div className="text-[11px] text-text-muted">Waiting Now</div>
                        <div className="text-lg font-bold text-amber-600 mt-0.5">12</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs text-center">
                        <div className="text-[11px] text-text-muted">In Consultation</div>
                        <div className="text-lg font-bold text-purple-600 mt-0.5">3</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs text-center">
                        <div className="text-[11px] text-text-muted">Completed Today</div>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">28</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs text-center">
                        <div className="text-[11px] text-text-muted">Average Wait</div>
                        <div className="text-lg font-bold text-primary mt-0.5">28 min</div>
                      </div>
                    </div>

                    {/* Example Queue Table */}
                    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-xs">
                      <div className="px-3 py-2 bg-slate-50 border-b border-border flex items-center justify-between text-xs font-semibold text-text-secondary">
                        <span>Live Queue Standings</span>
                        <span className="text-[11px] text-text-muted">Room OPD 101-108</span>
                      </div>

                      <div className="divide-y divide-border text-xs">
                        {/* Row 1 */}
                        <div className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary font-mono">CARD-015</span>
                            <span className="font-medium text-slate-800">Ramesh Kumar</span>
                            <span className="text-text-muted text-[11px] hidden sm:inline">
                              Cardiology
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-text-secondary font-mono text-[11px]">32 min</span>
                            <StatusBadge status="WAITING" />
                          </div>
                        </div>

                        {/* Row 2 */}
                        <div className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary font-mono">CARD-016</span>
                            <span className="font-medium text-slate-800">Sita Devi</span>
                            <span className="text-text-muted text-[11px] hidden sm:inline">
                              Cardiology
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-text-secondary font-mono text-[11px]">18 min</span>
                            <StatusBadge status="WAITING" />
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors bg-blue-50/40">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-700 font-mono">ORT-008</span>
                            <span className="font-medium text-slate-800">Aman Singh</span>
                            <span className="text-text-muted text-[11px] hidden sm:inline">
                              Orthopedics
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-text-secondary font-mono text-[11px]">12 min</span>
                            <StatusBadge status="CALLED" />
                          </div>
                        </div>

                        {/* Row 4 */}
                        <div className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors bg-purple-50/40">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-700 font-mono">ENT-006</span>
                            <span className="font-medium text-slate-800">Priya Mehta</span>
                            <span className="text-text-muted text-[11px] hidden sm:inline">
                              ENT
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status="IN_CONSULTATION" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footnote */}
                    <div className="text-[11px] text-text-muted text-center italic">
                      * CareQ operational engine updates continuously based on clinical durations.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. IMAGE 1: CORE DIFFERENTIATION — Why CareQ Stands Out */}
      <section id="differentiation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-xs">
            <span>#</span>
            <span>CORE DIFFERENTIATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Why CareQ Stands Out
          </h2>

          <p className="text-base sm:text-lg text-text-secondary font-normal italic max-w-2xl mx-auto leading-relaxed">
            "CareQ doesn't just display the queue. It helps the hospital manage how the queue changes."
          </p>
        </div>

        {/* 6 Cards arranged in 3 columns x 2 rows (Exact Image 1 Design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {coreDifferentiationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-7 sm:p-8 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Squircle Icon & Badge */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBg} group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${card.badgeColor} tracking-tight`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>

                {/* Optional Action / Link at Bottom */}
                {card.linkTo ? (
                  <div className="pt-6 mt-2 border-t border-slate-100">
                    <Link
                      to={card.linkTo}
                      className="text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1.5 transition-colors group-hover:underline"
                    >
                      {card.linkText}
                    </Link>
                  </div>
                ) : card.interactiveAction ? (
                  <div className="pt-6 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={card.interactiveAction}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 transition-colors group-hover:underline"
                    >
                      {card.actionText}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION — 5-Step Interactive Slider */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lavender text-purple-800 text-xs font-bold uppercase tracking-wider">
            Patient Journey
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Five steps. Zero confusion.
          </h2>
          <p className="text-text-secondary text-base">
            CareQ streamlines every touchpoint from home booking to digital calling, keeping
            hospital waiting rooms calm and predictable.
          </p>
        </div>

        {/* 2-Column Interactive Slider */}
        <div className="bg-white rounded-3xl border border-border shadow-elevated p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Product Visual for the Active Step */}
            <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-border/80 min-h-[380px] flex flex-col justify-center transition-all duration-500">
              {/* Step 1 Visual: Booking */}
              {activeStep === 0 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-called text-xs">Step 1 — Online Scheduling</span>
                    <span className="text-xs text-text-muted">CareQ Web Portal</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-border shadow-xs space-y-3">
                    <div className="text-sm font-bold text-slate-900">
                      Select Department & Doctor
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 border border-primary bg-primary/5 rounded-lg font-semibold text-primary">
                        Cardiology OPD
                        <div className="text-[10px] font-normal text-text-muted">
                          Dr. Rajesh Sharma, MD
                        </div>
                      </div>
                      <div className="p-3 border border-border rounded-lg text-text-secondary">
                        Orthopedics
                        <div className="text-[10px] text-text-muted">Dr. Anita Deshmukh</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
                      <span>Available: Today, 10:30 AM</span>
                      <span className="btn-primary text-xs py-1.5 px-3">Confirm Slot</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Visual: Digital Token */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-waiting text-xs">
                      Step 2 — Digital Token Generated
                    </span>
                    <span className="text-xs text-text-muted">OPD Registration Pass</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border-2 border-primary/40 shadow-sm text-center space-y-3">
                    <div className="text-xs text-text-muted uppercase font-bold tracking-widest">
                      Your Live Token
                    </div>
                    <div className="text-4xl font-extrabold text-primary font-mono tracking-wider">
                      CARD-015
                    </div>
                    <div className="text-xs text-text-secondary">
                      Department: Cardiology | Dr. Rajesh Sharma (OPD 101)
                    </div>
                    <div className="inline-block bg-slate-100 font-mono text-[11px] px-3 py-1 rounded text-slate-700">
                      ||| | ||||| |||| || |||||| | (Digital Barcode)
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Visual: Live Queue Tracking (MOST PROMINENT) */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-called text-xs bg-purple-100 text-purple-800 border-purple-200">
                      ⭐ Step 3 — Most Prominent Feature: Live Tracking
                    </span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Dynamic Sync
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-navy to-slate-900 text-white p-6 rounded-2xl shadow-elevated space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                      <div>
                        <div className="text-xs text-slate-400">Current Token</div>
                        <div className="text-2xl font-black text-amber-400 font-mono">
                          CARD-015
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Queue Position</div>
                        <div className="text-xl font-bold text-white">#1 Waiting</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                        <div className="text-[11px] text-slate-300">Patients Ahead</div>
                        <div className="text-2xl font-bold text-white">0</div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          You are next in line
                        </div>
                      </div>

                      <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                        <div className="text-[11px] text-slate-300">Estimated Wait</div>
                        <div className="text-2xl font-bold text-amber-400">18 min</div>
                        <div className="text-[10px] text-slate-300">
                          Doctor finishing CARD-014
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-white/5 p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                      <span>🩺 Dr. Rajesh Sharma — OPD Room 101</span>
                      <span className="badge badge-waiting text-[10px]">Waiting</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 Visual: Real-Time Alerts & Delays */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-waiting text-xs">
                      Step 4 — Real-Time Queue Updates
                    </span>
                    <span className="text-xs text-text-muted">Automatic Push Alerts</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-white p-3.5 rounded-xl border border-border shadow-xs flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Your Turn is Approaching!</div>
                        <div className="text-text-muted">
                          Token CARD-015: Only 1 consultation remaining. Please be near Room 101.
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-amber-900">
                          Doctor Delay Recalculation Notice
                        </div>
                        <div className="text-amber-800">
                          Dr. Sharma attended to an urgent case (+15 min). Your revised estimate is
                          updated automatically.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 Visual: Doctor Calling */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-called text-xs">Step 5 — Token Called Now</span>
                    <span className="text-xs text-emerald-600 font-bold">Please Proceed</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-sm text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold tracking-widest">
                      Now Serving
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 font-mono">
                      TOKEN: CARD-015
                    </div>
                    <div className="text-sm font-bold text-emerald-700">
                      Proceed to Consultation Room OPD 101
                    </div>
                    <div className="text-xs text-text-secondary">
                      Dr. Rajesh Sharma, MD (Cardiology) is ready for your consultation.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Numbered Step List */}
            <div className="lg:col-span-5 space-y-3">
              {steps.map((s, index) => {
                const isActive = activeStep === index;
                return (
                  <button
                    key={s.number}
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex items-start gap-3.5 ${
                      isActive
                        ? 'bg-primary-subtle border-primary shadow-xs ring-1 ring-primary/30'
                        : 'bg-white border-border hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isActive ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted'
                      }`}
                    >
                      {s.number}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-slate-900'}`}
                        >
                          {s.title}
                        </span>
                        {index === 2 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary leading-relaxed">{s.description}</p>
                    </div>
                  </button>
                );
              })}

              {/* Controls and Autoplay Indicator */}
              <div className="flex items-center justify-between pt-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg border border-border hover:bg-slate-100"
                    title="Previous step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-lg border border-border hover:bg-slate-100"
                    title="Next step"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-700 ml-1">
                    0{activeStep + 1} / 0{steps.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>{isPaused ? 'Paused (hover)' : 'Autoplaying (5s)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. IMAGE 2: COMPREHENSIVE FEATURES MATRIX (All 24 Specialized Capabilities) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
            <span>#</span>
            <span>COMPLETE PLATFORM MATRIX</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Complete Hospital Queue Capabilities
          </h2>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            24 specialized operational modules purpose-built for clinical precision, patient
            satisfaction, and complete administrative transparency.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'ALL', label: 'All Capabilities (24)' },
              { id: 'DIFFERENTIATOR', label: 'Key Differentiators (4)' },
              { id: 'PATIENT', label: 'Patient Experience (7)' },
              { id: 'CLINICAL', label: 'Doctors & OPD (7)' },
              { id: 'GOVERNANCE', label: 'Governance & Analytics (6)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFeatureTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 24 Feature Cards in 4-Column Grid (Exact Image 2 Matrix Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredFeatures.map((item) => {
            const Icon = item.icon;
            const CardContent = (
              <div
                className={`bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-card-hover hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full ${
                  item.action || item.linkTo ? 'cursor-pointer' : ''
                }`}
                onClick={item.action}
              >
                <div>
                  {/* Top Row: Icon & Optional Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {item.badge && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.badgeStyle || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {item.badge && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-primary">
                    <span>Explore module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );

            if (item.linkTo) {
              return (
                <Link key={item.id} to={item.linkTo} className="block h-full">
                  {CardContent}
                </Link>
              );
            }

            return <div key={item.id}>{CardContent}</div>;
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE LIVE EMERGENCY IMPACT SIMULATOR (On-Page Demo) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-navy to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-elevated border border-slate-800 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                Live Interactive Triage Simulator
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Test the Emergency Impact Preview Algorithm
              </h3>
              <p className="text-sm text-slate-300 max-w-xl">
                Slide below to preview how CareQ computes the exact delay delta across waiting
                tokens in real-time before medical triage confirmation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setEmergencyModalOpen(true)}
                className="btn-primary text-xs sm:text-sm px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
              >
                Open Full Staff Modal
              </button>
            </div>
          </div>

          {/* Interactive Controls & Live Recalculation Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Control Dial */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Emergency Consultation Duration
                </label>
                <div className="flex items-center justify-between text-white font-mono text-xl font-bold mb-3">
                  <span>Simulated Delay:</span>
                  <span className="text-red-400">+{liveWidgetDelay} minutes</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={liveWidgetDelay}
                  onChange={(e) => setLiveWidgetDelay(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>+5 min (Minor)</span>
                  <span>+25 min (Standard)</span>
                  <span>+45 min (Trauma)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Selected Department:</span>
                  <span className="font-semibold text-white">Cardiology OPD Room 101</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Consulting Physician:</span>
                  <span className="font-semibold text-white">Dr. Rajesh Sharma, MD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Affected Wait Tokens:</span>
                  <span className="font-semibold text-amber-400 font-mono">3 Tokens</span>
                </div>
              </div>
            </div>

            {/* Recalculated Queue Feed */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-white/10 px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Simulated Patient Impact Table</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Recalculation
                </span>
              </div>

              <div className="divide-y divide-white/10 text-xs">
                {/* Emergency Item */}
                <div className="p-3.5 bg-red-950/40 border-l-4 border-red-500 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-red-500 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      EMERGENCY
                    </span>
                    <span className="font-bold text-white">Cardiac Arrest Priority Influx</span>
                  </div>
                  <span className="font-mono text-red-300 font-bold">
                    Now Serving (~{liveWidgetDelay} min)
                  </span>
                </div>

                {/* Patient 1 */}
                <div className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <div className="font-mono font-bold text-blue-400">CARD-015</div>
                    <div className="text-slate-300 text-[11px]">Ramesh Kumar (Next in line)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 line-through text-[11px]">Was: 18 min</div>
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      Now: {18 + liveWidgetDelay} min (+{liveWidgetDelay}m)
                    </div>
                  </div>
                </div>

                {/* Patient 2 */}
                <div className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <div className="font-mono font-bold text-blue-400">CARD-016</div>
                    <div className="text-slate-300 text-[11px]">Sita Devi (Waiting)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 line-through text-[11px]">Was: 32 min</div>
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      Now: {32 + liveWidgetDelay} min (+{liveWidgetDelay}m)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ROLE-SPECIFIC BENEFITS */}
      <section className="bg-slate-50/80 border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">
              One Unified System for Every Hospital Role
            </h2>
            <p className="text-text-secondary text-sm">
              Role-tailored dashboards and authorization models built strictly for medical
              operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Patients */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">For Patients</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Know where you stand, watch your turn approach from anywhere, and enjoy Senior
                Citizen Easy View.
              </p>
            </div>

            {/* Doctors */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">For Doctors</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Single-click call next patient, simple consultation notes, and instant operational
                delay broadcasting.
              </p>
            </div>

            {/* Receptionists */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">For Receptionists</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Walk-in registrations, Emergency Impact Preview, doctor reassignment, and queue
                transfers.
              </p>
            </div>

            {/* Administrators */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">For Hospital Admins</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Comprehensive wait time analytics, department peak hours, delay causes detection,
                and audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Answers for Patients and Hospital Operators
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              How does CareQ compute dynamic wait times differently than simple token displays?
            </h4>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              CareQ never uses static multiplication (e.g. position × 10 min). Instead, it accounts
              for the elapsed time of the consultation currently in progress, average historical
              doctor consultation duration, reported clinical delays, and emergency impact.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              What is the Emergency Impact Preview?
            </h4>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              When trauma, cardiac, or acute emergencies arrive, reception staff preview the exact
              recalculated wait times on all waiting patients before confirming. Once approved, CareQ
              automatically sends polite notifications with revised time estimates.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              How does Senior Citizen Easy View support elderly patients?
            </h4>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              It provides a simplified high-contrast view with 24pt+ typography, audio token
              announcements, and a direct 1-tap emergency reception assistance button without
              confusing multi-step menus.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Can doctors reassign or merge queues during shift handovers?
            </h4>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Yes. Receptionists and hospital admins can transfer individual patients or merge
              entire room queues to available doctors when a physician is called to surgery or
              finishing shift handovers, with zero duplicate tokens.
            </p>
          </div>
        </div>
      </section>

      {/* 8. HOSPITAL CONTACT & CALL TO ACTION */}
      <section id="contact" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white rounded-3xl p-10 sm:p-14 shadow-elevated space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          <span className="badge bg-white/20 text-white font-semibold text-xs uppercase tracking-wider">
            Transform Your Hospital Waiting Rooms
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to bring clarity, transparency, and calm to your patient queues?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Experience the complete CareQ suite with pre-seeded hospital data across Cardiology,
            Orthopedics, ENT, and General Medicine.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <Link
              to="/register"
              className="btn-primary text-base px-8 py-3 bg-primary hover:bg-primary-hover shadow-md"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-base px-8 py-3 bg-white text-slate-900 hover:bg-slate-100"
            >
              Explore Demo Logins
            </Link>
            <Link
              to="/senior-view"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-teal-400/40 text-teal-300 hover:bg-teal-500/10 text-sm font-semibold transition-colors"
            >
              <HeartHandshake className="w-4 h-4" />
              Senior Easy View
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
