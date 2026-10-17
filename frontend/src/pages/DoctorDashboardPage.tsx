import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Bell,
  Play,
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  Loader2,
  Tv,
  ArrowRight,
  FileText,
  User,
  Activity,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { DoctorDelayModal } from '../components/DoctorDelayModal.js';
import { getSocket } from '../services/socket.js';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState<any | null>(null);
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [queueId, setQueueId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [delayModalOpen, setDelayModalOpen] = useState<boolean>(false);

  // Complete consultation modal state
  const [completeModalEntry, setCompleteModalEntry] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState<string>('Standard clinical examination completed');
  const [prescription, setPrescription] = useState<string>('');
  const [opNotes, setOpNotes] = useState<string>('');

  const fetchDoctorQueue = () => {
    if (!user) return;
    const docId = user.doctorId;

    // If user is doctor or admin viewing doctor station
    const targetDoctorId = docId || 'cmvbznrut000k2mfbj9l6j1a7'; // fallback to seeded demo doctor if admin

    api.get(`/queues/doctor/${targetDoctorId}`)
      .then((res) => {
        if (res.success) {
          setDoctorInfo(res.doctor);
          setQueueEntries(res.entries || []);
          setQueueId(res.queueId || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctorQueue();

    const socket = getSocket();
    const handleUpdate = () => fetchDoctorQueue();
    socket.on('queue:updated', handleUpdate);
    socket.on('queue:global_change', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:global_change', handleUpdate);
    };
  }, [user]);

  const handleStatusChange = async (newStatus: string) => {
    if (!doctorInfo) return;
    try {
      await api.put(`/doctors/${doctorInfo.id}/status`, { status: newStatus });
      fetchDoctorQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleCallNext = async () => {
    if (!doctorInfo || !queueId) return;
    setActionLoading(true);
    try {
      const res = await api.post('/queues/call-next', {
        queueId,
        doctorId: doctorInfo.id,
      });
      if (res.success) {
        fetchDoctorQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to call next patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartConsultation = async (entry: any) => {
    setActionLoading(true);
    try {
      const res = await api.post('/queues/start-consultation', {
        queueEntryId: entry.id,
      });
      if (res.success) {
        fetchDoctorQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start consultation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalEntry) return;
    setActionLoading(true);
    try {
      const res = await api.post('/queues/complete-consultation', {
        queueEntryId: completeModalEntry.id,
        diagnosis,
        prescription,
        operationalNotes: opNotes,
      });
      if (res.success) {
        setCompleteModalEntry(null);
        fetchDoctorQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async (entry: any) => {
    if (!window.confirm(`Mark patient token ${entry.tokenNumber} as No-Show?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post('/queues/mark-no-show', {
        queueEntryId: entry.id,
      });
      if (res.success) {
        fetchDoctorQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const waitingPatients = queueEntries.filter((e) => e.status === 'WAITING');
  const calledPatients = queueEntries.filter((e) => e.status === 'CALLED');
  const inConsultationPatients = queueEntries.filter((e) => e.status === 'IN_CONSULTATION');
  const completedPatients = queueEntries.filter((e) => e.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Doctor Profile Bar */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs text-text-muted font-semibold uppercase tracking-wider">
              Doctor Consultation Station
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dr. {doctorInfo?.name || user?.fullName}
            </h1>
            <p className="text-xs text-text-secondary">
              {doctorInfo?.department} • Room: <strong>{doctorInfo?.roomNumber}</strong>
            </p>
          </div>
        </div>

        {/* Doctor Status & Delay Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-border text-xs">
            <span className="text-text-muted font-medium pl-1">Status:</span>
            <select
              value={doctorInfo?.status || 'AVAILABLE'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-white border border-border rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="AVAILABLE">🟢 Available</option>
              <option value="IN_CONSULTATION">🟣 In Consultation</option>
              <option value="ON_BREAK">☕ On Break</option>
              <option value="DELAYED">⏳ Delayed</option>
              <option value="OFF_DUTY">🔴 Off Duty</option>
            </select>
          </div>

          <button
            onClick={() => setDelayModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            Report Delay
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-xs text-center">
          <div className="text-xs text-text-muted font-medium">Waiting in Queue</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{waitingPatients.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border shadow-xs text-center">
          <div className="text-xs text-text-muted font-medium">Called / Ready</div>
          <div className="text-3xl font-black text-blue-600 mt-1">{calledPatients.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border shadow-xs text-center">
          <div className="text-xs text-text-muted font-medium">In Consultation</div>
          <div className="text-3xl font-black text-purple-600 mt-1">{inConsultationPatients.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border shadow-xs text-center">
          <div className="text-xs text-text-muted font-medium">Completed Consultations</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{completedPatients.length}</div>
        </div>
      </div>

      {/* Primary Action Button: CALL NEXT PATIENT */}
      <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white p-6 rounded-2xl shadow-elevated flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Consultation Queue Control</h3>
          <p className="text-xs text-slate-300">
            {waitingPatients.length > 0
              ? `Next eligible patient in sequence: Token ${waitingPatients[0]?.tokenNumber} (${waitingPatients[0]?.patient?.user?.fullName})`
              : 'All waiting patients in this queue have been served.'}
          </p>
        </div>

        <button
          onClick={handleCallNext}
          disabled={actionLoading || waitingPatients.length === 0}
          className="btn-primary py-3 px-6 text-sm font-bold bg-primary hover:bg-primary-hover shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Bell className="w-5 h-5 animate-bounce" />
              Call Next Patient ({waitingPatients[0]?.tokenNumber || 'Queue Empty'})
            </>
          )}
        </button>
      </div>

      {/* Live Queue Table */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Patient Queue</h3>
            <p className="text-xs text-text-muted">Real-time patient sequence for this OPD room</p>
          </div>
          <span className="text-xs font-mono text-text-secondary">
            Total {queueEntries.length} Scheduled
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-secondary flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading doctor station queue...</span>
          </div>
        ) : queueEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No patients registered in today's queue yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-text-secondary">
                  <th className="py-2.5 px-3 font-semibold">Seq</th>
                  <th className="py-2.5 px-3 font-semibold">Token</th>
                  <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Est. Wait</th>
                  <th className="py-2.5 px-3 font-semibold">Symptoms / Notes</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queueEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      entry.status === 'CALLED'
                        ? 'bg-blue-50/50'
                        : entry.status === 'IN_CONSULTATION'
                        ? 'bg-purple-50/50'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-500">#{entry.sequenceNumber}</td>
                    <td className="py-3 px-3 font-mono font-bold text-primary">
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
                    <td className="py-3 px-3 font-mono text-text-secondary">
                      {entry.status === 'WAITING' ? `~${entry.estimatedWaitMins}m` : '—'}
                    </td>
                    <td className="py-3 px-3 text-text-secondary max-w-xs truncate">
                      {entry.appointment?.symptoms || entry.notes || 'Routine checkup'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.status === 'CALLED' && (
                          <button
                            onClick={() => handleStartConsultation(entry)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <Play className="w-3 h-3" />
                            Start Consultation
                          </button>
                        )}

                        {entry.status === 'IN_CONSULTATION' && (
                          <button
                            onClick={() => setCompleteModalEntry(entry)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Complete & Prescribe
                          </button>
                        )}

                        {entry.status === 'CALLED' && (
                          <button
                            onClick={() => handleMarkNoShow(entry)}
                            disabled={actionLoading}
                            className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded text-xs"
                            title="Patient did not respond"
                          >
                            No-Show
                          </button>
                        )}

                        {entry.status === 'COMPLETED' && (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Consultation Modal */}
      {completeModalEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold">Complete Consultation</h3>
                  <p className="text-xs text-emerald-100">
                    Token: {completeModalEntry.tokenNumber} — {completeModalEntry.patient?.user?.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompleteModalEntry(null)}
                className="text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                  Primary Clinical Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential Hypertension, Well Controlled"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                  Prescription / Follow-Up Advice
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="e.g. Tab Amlodipine 5mg OD x 30 days. Review in 1 month."
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                  Operational & Queue Notes (Optional)
                </label>
                <input
                  type="text"
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  placeholder="e.g. Patient advised for blood tests"
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCompleteModalEntry(null)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading ? 'Saving...' : 'Finish Consultation & Advance Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay Modal */}
      {doctorInfo && (
        <DoctorDelayModal
          isOpen={delayModalOpen}
          onClose={() => setDelayModalOpen(false)}
          onSuccess={fetchDoctorQueue}
          doctorId={doctorInfo.id}
          doctorName={doctorInfo.name}
        />
      )}
    </div>
  );
};
