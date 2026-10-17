import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Bell,
  Users,
  Activity,
  Sparkles,
} from 'lucide-react';

interface EmergencySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySimulatorModal: React.FC<EmergencySimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedDept, setSelectedDept] = useState<'cardiology' | 'orthopedics'>('cardiology');
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [emergencyReason, setEmergencyReason] = useState<string>(
    'Acute Myocardial Infarction / Cardiac Arrest Triage'
  );
  const [isSimulated, setIsSimulated] = useState<boolean>(true);

  if (!isOpen) return null;

  const mockQueues = {
    cardiology: {
      deptName: 'Cardiology OPD',
      doctor: 'Dr. Rajesh Sharma, MD',
      room: 'Room OPD 101',
      activeToken: 'CARD-014',
      patients: [
        {
          token: 'CARD-015',
          name: 'Ramesh Kumar',
          age: 58,
          currentWait: 18,
          revisedWait: 18 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: true,
        },
        {
          token: 'CARD-016',
          name: 'Sita Devi',
          age: 64,
          currentWait: 32,
          revisedWait: 32 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: true,
        },
        {
          token: 'CARD-017',
          name: 'Vikram Joshi',
          age: 39,
          currentWait: 46,
          revisedWait: 46 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: false,
        },
        {
          token: 'CARD-018',
          name: 'Meena Rao',
          age: 45,
          currentWait: 60,
          revisedWait: 60 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: false,
        },
      ],
    },
    orthopedics: {
      deptName: 'Orthopedics OPD',
      doctor: 'Dr. Anita Deshmukh, MS',
      room: 'Room OPD 104',
      activeToken: 'ORT-007',
      patients: [
        {
          token: 'ORT-008',
          name: 'Aman Singh',
          age: 29,
          currentWait: 12,
          revisedWait: 12 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: false,
        },
        {
          token: 'ORT-009',
          name: 'Kavita Patel',
          age: 52,
          currentWait: 26,
          revisedWait: 26 + delayMinutes,
          delta: delayMinutes,
          status: 'WAITING',
          isSenior: false,
        },
      ],
    },
  };

  const currentData = mockQueues[selectedDept];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-border max-w-3xl w-full overflow-hidden">
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              Core Differentiation Feature
            </span>
            <span className="text-white/80 text-xs font-medium">Zero Silent Shifts</span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white">
            Emergency Impact Preview Simulator
          </h3>
          <p className="text-sm text-red-100 max-w-xl mt-1 leading-relaxed">
            See how an emergency patient affects the existing queue BEFORE confirmation.
            Prevents hospital operational chaos.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Controls: Department & Proposed Delay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Hospital Queue
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDept('cardiology')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDept === 'cardiology'
                      ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Cardiology OPD</div>
                  <div className="text-[11px] text-text-muted">Dr. Rajesh Sharma (101)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDept('orthopedics')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDept === 'orthopedics'
                      ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Orthopedics OPD</div>
                  <div className="text-[11px] text-text-muted">Dr. Anita Deshmukh (104)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Emergency Priority Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDelayMinutes(mins)}
                    className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      delayMinutes === mins
                        ? 'border-red-600 bg-red-600 text-white shadow-sm'
                        : 'border-border bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    +{mins} Mins
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-text-muted mt-2">
                Simulating insertion of 1 priority emergency patient ahead of normal queue.
              </div>
            </div>
          </div>

          {/* Impact Summary Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-border">
            <div className="text-center">
              <div className="text-xs text-text-muted font-medium">Affected Waiting Patients</div>
              <div className="text-2xl font-black text-red-600 mt-0.5">
                {currentData.patients.length}
              </div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-xs text-text-muted font-medium">Estimated Delay Delta</div>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                +{delayMinutes} min
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-muted font-medium">Operational Status</div>
              <div className="text-xs font-bold text-emerald-700 mt-2 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                Auto-Recalculated
              </div>
            </div>
          </div>

          {/* Real-Time Patient Table with Before & After Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Preview: Real-Time Patient Recalculation
              </span>
              <span className="text-[11px] text-text-muted font-medium">
                Showing exact impact before clinical staff confirmation
              </span>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100/80 px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold text-slate-600 border-b border-border">
                <span className="col-span-3">Patient / Token</span>
                <span className="col-span-3">Pre-Impact Wait</span>
                <span className="col-span-3">Revised Wait</span>
                <span className="col-span-3 text-right">Shift Delta</span>
              </div>

              <div className="divide-y divide-border bg-white text-xs">
                {currentData.patients.map((p) => (
                  <div
                    key={p.token}
                    className="px-4 py-3 grid grid-cols-12 items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{p.token}</span>
                      <span className="font-medium text-slate-800 truncate max-w-[90px]">
                        {p.name}
                      </span>
                      {p.isSenior && (
                        <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                          Senior
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-slate-500 font-mono">
                      {p.currentWait} min
                    </div>
                    <div className="col-span-3 font-mono font-bold text-red-600 flex items-center gap-1.5">
                      <span>{p.revisedWait} min</span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.2 rounded">
                        +{p.delta}m
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pushed to phone
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Proactive Push Notification Preview */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-blue-950 flex items-center gap-2">
                <span>Automated Patient Notification Preview</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  Zero Surprise Guarantee
                </span>
              </div>
              <p className="text-blue-900 leading-relaxed">
                "Dear Patient ({currentData.patients[0].token}), an urgent clinical emergency was admitted to {currentData.deptName}. Your estimated consultation time has been revised by +{delayMinutes} minutes. Thank you for your patience."
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-border px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Audit trail compliant with medical regulations</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Close Simulator
            </button>
            <button
              type="button"
              onClick={() => {
                alert(
                  'Simulation confirmed! In live operations, this instantly broadcasts updated wait times to patient phones, TV kiosk displays, and doctor desks via Socket.IO.'
                );
                onClose();
              }}
              className="btn-primary text-xs px-5 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Simulated Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
