import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface DoctorReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctors: any[];
}

export const DoctorReassignModal: React.FC<DoctorReassignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  doctors,
}) => {
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('');
  const [replacementDoctorId, setReplacementDoctorId] = useState<string>('');
  const [reason, setReason] = useState<string>('Doctor called to urgent surgery / unavailable');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctors.length > 0 && !currentDoctorId) {
      setCurrentDoctorId(doctors[0].id);
      if (doctors.length > 1) {
        setReplacementDoctorId(doctors[1].id);
      }
    }
  }, [doctors]);

  if (!isOpen) return null;

  const currentDoctor = doctors.find((d) => d.id === currentDoctorId);
  // Eligible replacement doctors in the same department
  const eligibleReplacements = doctors.filter(
    (d) => d.id !== currentDoctorId && (!currentDoctor || d.departmentId === currentDoctor.departmentId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctorId || !replacementDoctorId) {
      setError('Please select both current and replacement doctors.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/queue-transfers/reassign-doctor', {
        currentDoctorId,
        replacementDoctorId,
        reason,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Reassignment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reassign doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-navy px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Doctor Reassignment</h3>
              <p className="text-xs text-slate-300">Controlled workflow for doctor unavailability</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Unavailable Doctor
              </label>
              <select
                value={currentDoctorId}
                onChange={(e) => {
                  setCurrentDoctorId(e.target.value);
                  setReplacementDoctorId('');
                }}
                className="input-field text-xs"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.fullName} ({d.department.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Replacement Doctor
              </label>
              <select
                value={replacementDoctorId}
                onChange={(e) => setReplacementDoctorId(e.target.value)}
                className="input-field text-xs"
              >
                <option value="">-- Select Replacement --</option>
                {eligibleReplacements.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.fullName} ({d.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Reason for Doctor Unavailability
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Urgent emergency surgery, medical leave"
              className="input-field text-sm"
              required
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-border text-xs text-text-secondary space-y-1.5">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <span>Workflow Impact:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-text-muted">
              <li>All today's pending appointments will be transferred to replacement doctor</li>
              <li>Active queue tokens will be reassigned without requiring re-registration</li>
              <li>Affected patients receive push alerts with the replacement doctor's name & room</li>
              <li>An audit log record is created for hospital compliance</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !currentDoctorId || !replacementDoctorId}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Reassignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
