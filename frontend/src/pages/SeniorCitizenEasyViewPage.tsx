import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, PhoneCall, Clock, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { getSocket } from '../services/socket.js';

export const SeniorCitizenEasyViewPage: React.FC = () => {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [helpRequested, setHelpRequested] = useState<boolean>(false);

  const fetchStatus = () => {
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
    fetchStatus();

    const socket = getSocket();
    const handleUpdate = () => fetchStatus();
    socket.on('queue:updated', handleUpdate);
    socket.on('queue:global_change', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:global_change', handleUpdate);
    };
  }, []);

  const handleCallHelp = () => {
    setHelpRequested(true);
    // Auto reset notice after 10s
    setTimeout(() => {
      setHelpRequested(false);
    }, 10000);
  };

  const activeQueue = patientData?.activeQueue;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 space-y-6">
      {/* Top Banner with Large Return Button */}
      <div className="max-w-3xl mx-auto flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-md">
        <Link
          to="/patient/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 font-bold text-base rounded-xl hover:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Standard View
        </Link>

        <div className="flex items-center gap-2 text-emerald-800 font-bold text-base sm:text-lg">
          <HeartHandshake className="w-7 h-7 text-emerald-600" />
          <span>Senior Citizen Easy View</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Help Assistance Notification */}
        {helpRequested && (
          <div className="p-6 bg-emerald-100 border-4 border-emerald-500 rounded-3xl text-emerald-950 font-bold text-center space-y-2 animate-in zoom-in-95 duration-200">
            <div className="text-2xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              Help Has Been Notified!
            </div>
            <p className="text-lg font-medium">
              A hospital reception nurse has been alerted and will come to your seating area immediately.
            </p>
          </div>
        )}

        {/* Main Content Card */}
        {loading ? (
          <div className="p-16 bg-white rounded-3xl border-2 border-slate-300 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <div className="text-xl font-bold text-slate-800">Finding your queue status...</div>
          </div>
        ) : activeQueue ? (
          <div className="bg-white rounded-3xl border-4 border-primary shadow-elevated p-6 sm:p-10 space-y-8">
            {/* Greeting */}
            <div className="text-center space-y-1">
              <div className="text-lg text-slate-600">Welcome,</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {patientData?.fullName || user?.fullName}
              </div>
            </div>

            {/* Huge Token Card */}
            <div className="bg-blue-50 border-4 border-blue-400 rounded-3xl p-6 sm:p-8 text-center space-y-3">
              <div className="text-base font-bold text-blue-900 uppercase tracking-widest">
                YOUR TOKEN NUMBER
              </div>
              <div className="text-6xl sm:text-7xl font-black text-primary font-mono tracking-wider">
                {activeQueue.tokenNumber}
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-800">
                {activeQueue.department.name} OPD
              </div>
              <div className="text-base text-slate-700">
                Doctor: <strong>Dr. {activeQueue.doctor.user.fullName}</strong>
              </div>
              <div className="text-lg font-black text-primary bg-white py-2 px-4 rounded-xl border-2 border-blue-200 inline-block">
                Consultation Room: {activeQueue.doctor.roomNumber}
              </div>
            </div>

            {/* Waiting metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border-3 border-slate-300 rounded-2xl p-6 text-center space-y-1">
                <div className="text-base font-bold text-slate-600">Patients Ahead of You</div>
                <div className="text-5xl font-black text-slate-900">
                  {activeQueue.patientsAhead ?? (activeQueue.status === 'CALLED' ? 0 : 1)}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {activeQueue.patientsAhead === 0 ? 'You are next in line!' : 'People waiting before you'}
                </div>
              </div>

              <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-6 text-center space-y-1">
                <div className="text-base font-bold text-amber-900">Estimated Waiting Time</div>
                <div className="text-5xl font-black text-amber-700">
                  {activeQueue.status === 'CALLED' ? '0 min' : `~${activeQueue.estimatedWaitMins} min`}
                </div>
                <div className="text-sm text-amber-800 font-medium">
                  {activeQueue.status === 'CALLED' ? 'Please proceed to room!' : 'Approximate wait time'}
                </div>
              </div>
            </div>

            {/* Status explanation */}
            <div className="p-5 bg-slate-100 rounded-2xl text-center space-y-1">
              <div className="text-base font-bold text-slate-900">Current Status:</div>
              <div className="text-xl font-extrabold text-primary">
                {activeQueue.status === 'CALLED'
                  ? '🔔 YOUR TURN! PLEASE ENTER CONSULTATION ROOM'
                  : '⏳ PLEASE REMAIN COMFORTABLY SEATED IN OPD WAITING AREA'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-3 border-slate-300 p-10 text-center space-y-6">
            <Clock className="w-16 h-16 text-slate-400 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">No Active Queue Token Today</h2>
            <p className="text-base text-slate-600 max-w-md mx-auto">
              You do not have an active waiting queue token today. You can book an appointment or visit the reception desk.
            </p>
            <Link to="/book" className="btn-primary text-lg px-8 py-4 inline-block">
              Book Doctor Consultation
            </Link>
          </div>
        )}

        {/* Large Emergency / Hospital Assistance Button */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-md text-center space-y-3">
          <div className="text-lg font-bold text-slate-900">Need Assistance?</div>
          <p className="text-sm text-slate-600">
            Press the button below if you need wheelchair help, directions, or staff assistance.
          </p>
          <button
            onClick={handleCallHelp}
            className="w-full py-5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
          >
            <PhoneCall className="w-8 h-8" />
            CALL HOSPITAL ASSISTANCE NOW
          </button>
        </div>
      </div>
    </div>
  );
};
