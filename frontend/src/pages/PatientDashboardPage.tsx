import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  Clock,
  User,
  Bell,
  HeartHandshake,
  Tv,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { getSocket } from '../services/socket.js';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPatientData = () => {
    api.get('/patients/me')
      .then((res) => {
        if (res.success && res.patient) {
          setPatientData(res.patient);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatientData();

    const socket = getSocket();
    const handleUpdate = () => fetchPatientData();
    socket.on('queue:updated', handleUpdate);
    socket.on('queue:global_change', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:global_change', handleUpdate);
    };
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment and release your queue token?')) {
      return;
    }
    setCancellingId(appointmentId);
    try {
      const res = await api.post(`/appointments/${appointmentId}/cancel`);
      if (res.success) {
        setMessage('Appointment cancelled successfully.');
        fetchPatientData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const activeQueue = patientData?.activeQueue;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="text-xs text-text-muted font-medium">Patient OPD Station</div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {patientData?.fullName || user?.fullName}
          </h1>
          <p className="text-xs text-text-secondary">
            Track your OPD tokens, wait estimates, and consultation history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/senior-view"
            className="btn-secondary text-xs flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            Senior Citizen View
          </Link>

          <Link to="/book" className="btn-primary text-xs flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Book New Token
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-text-secondary flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Loading patient records and live queues...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Token / Live Queue Card */}
          <div className="lg:col-span-8 space-y-6">
            {activeQueue ? (
              <div className="card-base border-2 border-primary/30 p-6 sm:p-8 space-y-6 shadow-elevated">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Live Queue Active Today
                    </span>
                  </div>
                  <StatusBadge status={activeQueue.status} isEmergency={activeQueue.isEmergency} />
                </div>

                {/* Big Token Display */}
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-border space-y-2">
                  <div className="text-xs text-text-muted uppercase font-bold tracking-widest">
                    Your Token Number
                  </div>
                  <div className="text-5xl font-black text-primary font-mono tracking-wider">
                    {activeQueue.tokenNumber}
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {activeQueue.department.name} OPD — Dr. {activeQueue.doctor.user.fullName}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Consultation Room: <strong className="text-slate-900">{activeQueue.doctor.roomNumber}</strong>
                  </div>
                </div>

                {/* Live Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-50 rounded-xl border border-border">
                    <div className="text-xs text-text-muted font-medium">Patients Ahead</div>
                    <div className="text-3xl font-extrabold text-slate-900 mt-1">
                      {activeQueue.patientsAhead ?? (activeQueue.status === 'CALLED' ? 0 : 1)}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {activeQueue.patientsAhead === 0 ? 'You are next' : 'In waiting line'}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                    <div className="text-xs text-amber-800 font-medium">Estimated Wait Time</div>
                    <div className="text-3xl font-extrabold text-amber-700 mt-1">
                      {activeQueue.status === 'CALLED' ? '0 min' : `~${activeQueue.estimatedWaitMins} min`}
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      {activeQueue.status === 'CALLED' ? 'Proceed inside' : 'Dynamic estimate'}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-4 bg-slate-50 rounded-xl border border-border">
                    <div className="text-xs text-text-muted font-medium">Queue Standing</div>
                    <div className="text-xl font-bold text-slate-900 mt-2">
                      Position #{activeQueue.sequenceNumber}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border text-xs">
                  <div className="flex gap-2">
                    <Link
                      to={`/token/${activeQueue.tokenNumber}`}
                      className="btn-secondary text-xs"
                    >
                      View Digital Pass
                    </Link>

                    <Link
                      to={`/live-queue/${activeQueue.departmentId}`}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      Live Display
                    </Link>
                  </div>

                  {activeQueue.appointmentId && (
                    <button
                      onClick={() => handleCancelAppointment(activeQueue.appointmentId)}
                      disabled={cancellingId === activeQueue.appointmentId}
                      className="text-red-600 hover:text-red-700 font-medium py-1.5 px-3 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {cancellingId === activeQueue.appointmentId ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card-base p-8 text-center space-y-4">
                <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Active Queue Token Today</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  You are not currently queued in any department. Choose an OPD clinic to book an appointment and receive a token.
                </p>
                <Link to="/book" className="btn-primary text-xs inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Book Doctor Consultation
                </Link>
              </div>
            )}

            {/* Recent Appointments & Consultation History */}
            <div className="card-base p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Appointment History</h3>
                <span className="text-xs text-text-muted">Past OPD records</span>
              </div>

              {patientData?.recentAppointments && patientData.recentAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-text-secondary">
                        <th className="py-2.5 px-3 font-semibold">Token</th>
                        <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                        <th className="py-2.5 px-3 font-semibold">Department</th>
                        <th className="py-2.5 px-3 font-semibold">Doctor</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {patientData.recentAppointments.map((appt: any) => (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold font-mono text-primary">
                            <Link to={`/token/${appt.tokenNumber}`} className="hover:underline">
                              {appt.tokenNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3">
                            {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{appt.department.name}</td>
                          <td className="py-2.5 px-3 text-text-secondary">Dr. {appt.doctor.user.fullName}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={appt.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-text-muted">
                  No previous consultation records found.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile & Quick Links */}
          <div className="lg:col-span-4 space-y-6">
            {/* Patient Info Card */}
            <div className="card-base p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Patient Details</h3>
                <Link to="/profile" className="text-xs text-primary font-medium hover:underline">
                  Edit Profile
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Full Name</span>
                  <span className="font-semibold text-slate-900">{patientData?.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Email</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[160px]">{patientData?.email}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Mobile Phone</span>
                  <span className="font-semibold text-slate-900">{patientData?.phone || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Blood Group</span>
                  <span className="font-bold text-red-600">{patientData?.bloodGroup || 'O+'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Emergency Contact</span>
                  <span className="font-semibold text-slate-900">{patientData?.emergencyContact || '—'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card-base p-6 space-y-3 bg-gradient-to-br from-lavender/40 to-white">
              <h3 className="text-sm font-bold text-purple-950">Patient Support</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Need wheelchair support, language assistance, or guidance to consultation rooms?
              </p>
              <Link
                to="/senior-view"
                className="w-full btn-secondary text-xs flex items-center justify-center gap-2 text-emerald-800 bg-white"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Open Senior Citizen Easy View
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
