import React, { useState } from 'react';
import { Clock, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface DoctorDelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctorId: string;
  doctorName: string;
}

export const DoctorDelayModal: React.FC<DoctorDelayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  doctorId,
  doctorName,
}) => {
  const [delayMinutes, setDelayMinutes] = useState<number>(20);
  const [reason, setReason] = useState<string>('Extended consultation');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/delays', {
        doctorId,
        delayMinutes,
        reason,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to report delay');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to report doctor delay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Report Doctor Delay</h3>
              <p className="text-xs text-amber-100">{doctorName}</p>
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

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Estimated Delay Duration: <span className="text-primary font-bold">{delayMinutes} Minutes</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 20, 30, 45].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDelayMinutes(mins)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    delayMinutes === mins
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 border-border text-text-secondary hover:bg-slate-100'
                  }`}
                >
                  +{mins} min
                </button>
              ))}
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Reason for Operational Delay
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
            >
              <option value="Extended consultation">Extended consultation with complex patient</option>
              <option value="Doctor unavailable">Doctor momentarily unavailable / called to ward</option>
              <option value="Emergency case">Emergency acute case in progress</option>
              <option value="Department overload">High department patient volume</option>
              <option value="Other operational delay">Other operational delay</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs leading-relaxed">
            📢 Submitting this delay will immediately update the live waiting room display, recalculate all waiting patient estimates, and push real-time alerts to affected mobile patient devices.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Broadcast Delay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
