import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Ticket,
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  Printer,
  ArrowRight,
  Tv,
  HeartHandshake,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { StatusBadge } from '../components/StatusBadge.js';

export const TokenConfirmationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenDetails = () => {
    if (!token) return;
    api.get(`/appointments/token/${token}`)
      .then((res) => {
        if (res.success && res.appointment) {
          setAppointment(res.appointment);
        } else {
          setError(res.message || 'Token not found');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTokenDetails();

    // Listen to real-time queue updates
    const socket = getSocket();
    const handleUpdate = () => fetchTokenDetails();
    socket.on('queue:updated', handleUpdate);
    socket.on('queue:global_change', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:global_change', handleUpdate);
    };
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-text-secondary">Retrieving digital queue pass...</span>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-border shadow-elevated text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Token Not Found</h2>
        <p className="text-xs text-text-secondary">{error || 'Unable to locate token details.'}</p>
        <Link to="/" className="btn-primary text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  const queueEntry = appointment.queueEntry;
  const status = queueEntry?.status || appointment.status || 'WAITING';
  const estimatedWait = queueEntry?.estimatedWaitMins ?? 20;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Appointment Confirmed
        </h1>
        <p className="text-xs text-text-secondary">
          Your digital queue token is active and linked to the hospital live queue engine.
        </p>
      </div>

      {/* Digital Pass Ticket Card */}
      <div className="bg-white rounded-3xl border-2 border-primary/30 shadow-elevated overflow-hidden print:border-none print:shadow-none">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">CareQ Digital Token Pass</div>
              <div className="text-xs text-slate-300">{appointment.department.name}</div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Big Token Number Display */}
        <div className="p-8 text-center bg-slate-50/60 border-b border-dashed border-border space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Queue Token Number
          </div>
          <div className="text-5xl sm:text-6xl font-black text-primary font-mono tracking-wider">
            {appointment.tokenNumber}
          </div>
          <div className="text-xs text-text-secondary font-medium">
            Room: <span className="font-bold text-slate-900">{appointment.doctor.roomNumber}</span> | Consulting Specialist:{' '}
            <span className="font-bold text-slate-900">Dr. {appointment.doctor.user.fullName}</span>
          </div>
        </div>

        {/* Live Wait Metrics */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center border-b border-border bg-white">
          <div className="p-3 bg-slate-50 rounded-xl border border-border/80">
            <div className="text-[11px] text-text-muted font-medium">Patients Ahead</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {appointment.patientsAhead ?? (status === 'CALLED' ? 0 : 1)}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <div className="text-[11px] text-amber-800 font-medium">Estimated Wait</div>
            <div className="text-2xl font-bold text-amber-700 mt-0.5">
              {status === 'CALLED' ? '0 min' : `~${estimatedWait} min`}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 rounded-xl border border-border/80">
            <div className="text-[11px] text-text-muted font-medium">Scheduled Time</div>
            <div className="text-sm font-bold text-slate-900 mt-2 truncate">
              {appointment.appointmentTime}
            </div>
          </div>
        </div>

        {/* Patient Details & Instructions */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-text-muted block">Patient Name:</span>
              <span className="font-bold text-slate-900 text-sm">{appointment.patient.user.fullName}</span>
            </div>
            <div>
              <span className="text-text-muted block">Appointment Date:</span>
              <span className="font-bold text-slate-900 text-sm">
                {new Date(appointment.appointmentDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Barcode Mockup */}
          <div className="pt-2 text-center space-y-1">
            <div className="inline-block bg-slate-100 font-mono tracking-widest text-xs px-6 py-2 rounded-lg border border-border text-slate-800 font-bold">
              ||| | ||||| |||| || |||||| | |||| |||
            </div>
            <div className="text-[10px] text-text-muted">Pass ID: {appointment.id}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <button
          onClick={handlePrint}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          Print Digital Pass
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/senior-view"
            className="btn-secondary text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            Senior Citizen View
          </Link>

          <Link
            to={`/live-queue/${appointment.departmentId}`}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Tv className="w-4 h-4" />
            Watch Waiting Room Live Display
          </Link>
        </div>
      </div>
    </div>
  );
};
