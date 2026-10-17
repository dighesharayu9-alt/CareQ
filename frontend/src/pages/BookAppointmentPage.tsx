import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Stethoscope, Building2, AlertCircle, Loader2, Check, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const BookAppointmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState<string>(todayStr);
  const [appointmentTime, setAppointmentTime] = useState<string>('10:30');
  const [symptoms, setSymptoms] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load departments
  useEffect(() => {
    api.get('/departments')
      .then((res) => {
        if (res.success && res.departments.length > 0) {
          setDepartments(res.departments);
          setSelectedDeptId(res.departments[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Load doctors when department changes
  useEffect(() => {
    if (selectedDeptId) {
      api.get(`/doctors?departmentId=${selectedDeptId}`)
        .then((res) => {
          if (res.success && res.doctors.length > 0) {
            setDoctors(res.doctors);
            setSelectedDoctorId(res.doctors[0].id);
          } else {
            setDoctors([]);
            setSelectedDoctorId('');
          }
        })
        .catch(() => {});
    }
  }, [selectedDeptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedDeptId || !selectedDoctorId) {
      setError('Please select a department and doctor');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/appointments', {
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId,
        appointmentDate,
        appointmentTime,
        symptoms,
      });

      if (res.success && res.appointment) {
        navigate(`/token/${res.appointment.tokenNumber}`);
      } else {
        setError(res.message || 'Failed to book appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating appointment and generating token');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Book OPD Appointment & Digital Token
        </h1>
        <p className="text-text-secondary text-sm">
          Select department, consulting doctor, and date to generate your unique queue sequence token.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Loading hospital clinical departments...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Booking Form */}
          <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-elevated space-y-6">
            {/* Step 1: Department Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2">
                1. Select Clinical Department
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <button
                    type="button"
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedDeptId === dept.id
                        ? 'border-primary bg-primary-subtle ring-1 ring-primary/40'
                        : 'border-border bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {dept.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-2">
                      Avg: ~{dept.avgConsultationMins} mins / patient
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Doctor Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2">
                2. Select Consulting Specialist
              </label>
              {doctors.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-text-muted">
                  No specialists currently configured in this department.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {doctors.map((doc) => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedDoctorId === doc.id
                          ? 'border-primary bg-primary-subtle ring-1 ring-primary/40'
                          : 'border-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-primary font-bold flex items-center justify-center text-sm">
                          Dr
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">Dr. {doc.user.fullName}</div>
                          <div className="text-xs text-text-secondary">{doc.specialization}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-primary">{doc.roomNumber}</span>
                        <div className="text-[11px] text-emerald-600 font-medium">{doc.status}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Date & Preferred Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="input-field"
                >
                  <option value="09:00">09:00 AM - 09:30 AM</option>
                  <option value="10:00">10:00 AM - 10:30 AM</option>
                  <option value="10:30">10:30 AM - 11:00 AM</option>
                  <option value="11:30">11:30 AM - 12:00 PM</option>
                  <option value="14:00">02:00 PM - 02:30 PM</option>
                  <option value="15:30">03:30 PM - 04:00 PM</option>
                  <option value="16:30">04:30 PM - 05:00 PM</option>
                </select>
              </div>
            </div>

            {/* Step 4: Symptoms / Medical Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Reason for Visit / Primary Symptoms (Optional)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Follow-up consultation, ECG checkup, mild chest palpitations, joint stiffness"
                rows={2}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedDoctorId}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Unique Token...
                </>
              ) : (
                <>
                  Confirm Appointment & Generate Token
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Right Summary Card */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-slate-50 rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Booking Summary</h3>

              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="pt-2 flex justify-between">
                  <span className="text-text-muted">Department</span>
                  <span className="font-semibold text-slate-900">{selectedDept?.name || '—'}</span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-text-muted">Doctor</span>
                  <span className="font-semibold text-slate-900">
                    {selectedDoctor ? `Dr. ${selectedDoctor.user.fullName}` : '—'}
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-text-muted">OPD Clinic</span>
                  <span className="font-semibold text-primary">{selectedDoctor?.roomNumber || '—'}</span>
                </div>

                <div className="pt-2 flex justify-between">
                  <span className="text-text-muted">Date & Time</span>
                  <span className="font-semibold text-slate-900">
                    {appointmentDate} at {appointmentTime}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-border text-[11px] text-text-secondary space-y-1">
                <div className="font-bold text-slate-900">💡 Dynamic Queue Notice</div>
                <p>
                  Tokens are assigned in real-time. Upon confirmation, you will receive an active token code e.g. <span className="font-mono font-bold text-primary">{selectedDept?.code || 'CARD'}-XXX</span> to track your live queue standing.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
