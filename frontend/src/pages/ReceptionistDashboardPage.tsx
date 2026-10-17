import React, { useState, useEffect } from 'react';
import {
  Users,
  Ticket,
  Clock,
  ShieldAlert,
  UserCheck,
  ArrowRightLeft,
  Search,
  PlusCircle,
  AlertTriangle,
  Loader2,
  Tv,
  CheckCircle2,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { EmergencyImpactModal } from '../components/EmergencyImpactModal.js';
import { DoctorReassignModal } from '../components/DoctorReassignModal.js';
import { QueueTransferModal } from '../components/QueueTransferModal.js';
import { getSocket } from '../services/socket.js';

export const ReceptionistDashboardPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [activeQueueEntries, setActiveQueueEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Walk-in modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInDeptId, setWalkInDeptId] = useState<string>('');
  const [walkInDocId, setWalkInDocId] = useState<string>('');
  const [walkInSubmitting, setWalkInSubmitting] = useState<boolean>(false);
  const [walkInSuccess, setWalkInSuccess] = useState<any | null>(null);

  // Workflow modals
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [reassignModalOpen, setReassignModalOpen] = useState<boolean>(false);
  const [transferModalEntry, setTransferModalEntry] = useState<any | null>(null);

  const fetchHospitalOverview = () => {
    Promise.all([api.get('/departments'), api.get('/doctors')])
      .then(([deptRes, docRes]) => {
        if (deptRes.success) {
          setDepartments(deptRes.departments || []);
          if (!selectedDeptId && deptRes.departments.length > 0) {
            setSelectedDeptId(deptRes.departments[0].id);
          }
        }
        if (docRes.success) {
          setDoctors(docRes.doctors || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchSelectedDeptQueue = (deptId: string) => {
    if (!deptId) return;
    api.get(`/queues/department/${deptId}`)
      .then((res) => {
        if (res.success) {
          setActiveQueueEntries([
            ...(res.waiting || []),
            ...(res.called || []),
            ...(res.inConsultation || []),
            ...(res.completed || []),
          ]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchHospitalOverview();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchHospitalOverview();
      if (selectedDeptId) fetchSelectedDeptQueue(selectedDeptId);
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:global_change', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:global_change', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      fetchSelectedDeptQueue(selectedDeptId);
    }
  }, [selectedDeptId]);

  // Handle Walk-in Registration
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInDeptId || !walkInDocId) return;
    setWalkInSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.post('/appointments', {
        isWalkIn: true,
        walkInPatientName: walkInName,
        walkInPatientPhone: walkInPhone,
        departmentId: walkInDeptId,
        doctorId: walkInDocId,
        appointmentDate: todayStr,
      });

      if (res.success && res.appointment) {
        setWalkInSuccess(res.appointment);
        fetchHospitalOverview();
        if (selectedDeptId === walkInDeptId) fetchSelectedDeptQueue(walkInDeptId);
      }
    } catch (err: any) {
      alert(err.message || 'Walk-in registration failed');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const filteredEntries = activeQueueEntries.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.tokenNumber.toLowerCase().includes(q) ||
      e.patient?.user?.fullName?.toLowerCase().includes(q) ||
      e.patient?.user?.phone?.includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Reception Header */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">
            Front Desk & Clinical Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Receptionist Dashboard</h1>
          <p className="text-xs text-text-secondary">
            Manage registrations, prioritize clinical emergency overrides, and supervise OPD queues
          </p>
        </div>

        {/* Quick Operational Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="btn-danger text-xs flex items-center gap-1.5 shadow-sm bg-red-600 hover:bg-red-700"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            Emergency Impact Preview
          </button>

          <button
            onClick={() => setReassignModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            Reassign Doctor
          </button>

          <button
            onClick={() => {
              setWalkInSuccess(null);
              setWalkInModalOpen(true);
            }}
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Walk-in Patient
          </button>
        </div>
      </div>

      {/* Hospital Departments Queue Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const isSelected = selectedDeptId === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary-subtle border-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-white border-border hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                <span className="text-xs font-mono font-bold text-primary">{dept.code}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {dept.waitingCount} Waiting
                </span>
                <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {dept.inConsultationCount} Active
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Department Queue Management Table */}
      <div className="card-base p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Department Patient Queue — {departments.find((d) => d.id === selectedDeptId)?.name}
            </h3>
            <p className="text-xs text-text-muted">
              Live patient sequence, walk-ins, and transfer triggers
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token / patient..."
                className="input-field pl-9 py-1.5 text-xs w-48 sm:w-64"
              />
            </div>

            <a
              href={`/live-queue/${selectedDeptId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5" />
              Launch TV Display
            </a>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-text-secondary">
                <th className="py-2.5 px-3 font-semibold">Token</th>
                <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Doctor Assigned</th>
                <th className="py-2.5 px-3 font-semibold">Est. Wait</th>
                <th className="py-2.5 px-3 font-semibold">Notes</th>
                <th className="py-2.5 px-3 font-semibold text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted text-xs">
                    No matching queue entries found for this department.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold font-mono text-primary">
                      {entry.tokenNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {entry.patient?.user?.fullName}
                      {entry.patient?.user?.phone && (
                        <span className="block text-[10px] font-normal text-text-muted">
                          {entry.patient.user.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={entry.status} isEmergency={entry.isEmergency} />
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      Dr. {entry.doctor?.user?.fullName} ({entry.doctor?.roomNumber})
                    </td>
                    <td className="py-3 px-3 font-mono text-text-secondary">
                      {entry.status === 'WAITING' ? `~${entry.estimatedWaitMins}m` : '—'}
                    </td>
                    <td className="py-3 px-3 text-text-secondary max-w-xs truncate">
                      {entry.notes || 'Routine consultation'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {['WAITING', 'CALLED'].includes(entry.status) && (
                          <button
                            onClick={() => setTransferModalEntry(entry)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-primary" />
                            Transfer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Availability & Delay Overview */}
      <div className="card-base p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Hospital Specialists Availability & Delays</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Dr. {doc.user.fullName}</span>
                <span className="text-[10px] font-bold text-primary font-mono">{doc.roomNumber}</span>
              </div>
              <div className="text-xs text-text-secondary truncate">{doc.department.name}</div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-slate-700 font-semibold">{doc.status}</span>
                {doc.currentDelayMins > 0 ? (
                  <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[11px]">
                    +{doc.currentDelayMins}m Delay
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium text-[11px]">On Schedule</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Walk-in Registration Modal */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <h3 className="text-base font-bold">Register Walk-in Patient</h3>
              </div>
              <button onClick={() => setWalkInModalOpen(false)} className="text-white/80 hover:text-white">
                ×
              </button>
            </div>

            {walkInSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Token Generated Successfully!</h4>
                <div className="text-4xl font-black text-primary font-mono">{walkInSuccess.tokenNumber}</div>
                <p className="text-xs text-text-secondary">
                  Patient <strong>{walkInSuccess.patient?.user?.fullName || walkInName}</strong> has been added to the active queue.
                </p>
                <div className="flex gap-2 pt-2">
                  <a
                    href={`/token/${walkInSuccess.tokenNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs flex-1 text-center"
                  >
                    View Pass
                  </a>
                  <button
                    onClick={() => {
                      setWalkInSuccess(null);
                      setWalkInName('');
                      setWalkInPhone('');
                    }}
                    className="btn-primary text-xs flex-1"
                  >
                    Register Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={walkInDeptId}
                    onChange={(e) => {
                      setWalkInDeptId(e.target.value);
                      const docs = doctors.filter((d) => d.departmentId === e.target.value);
                      if (docs.length > 0) setWalkInDocId(docs[0].id);
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                    Doctor
                  </label>
                  <select
                    value={walkInDocId}
                    onChange={(e) => setWalkInDocId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors
                      .filter((d) => !walkInDeptId || d.departmentId === walkInDeptId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.user.fullName} ({d.roomNumber})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setWalkInModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={walkInSubmitting || !walkInName || !walkInDeptId || !walkInDocId}
                    className="btn-primary text-xs"
                  >
                    {walkInSubmitting ? 'Registering...' : 'Generate Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Emergency Impact Modal */}
      <EmergencyImpactModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onSuccess={() => {
          fetchHospitalOverview();
          if (selectedDeptId) fetchSelectedDeptQueue(selectedDeptId);
        }}
      />

      {/* Doctor Reassign Modal */}
      <DoctorReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        onSuccess={() => {
          fetchHospitalOverview();
          if (selectedDeptId) fetchSelectedDeptQueue(selectedDeptId);
        }}
        doctors={doctors}
      />

      {/* Queue Transfer Modal */}
      {transferModalEntry && (
        <QueueTransferModal
          isOpen={!!transferModalEntry}
          onClose={() => setTransferModalEntry(null)}
          onSuccess={() => {
            if (selectedDeptId) fetchSelectedDeptQueue(selectedDeptId);
          }}
          entry={transferModalEntry}
          doctors={doctors}
        />
      )}
    </div>
  );
};
