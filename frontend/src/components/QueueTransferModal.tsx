import React, { useState } from 'react';
import { ArrowRightLeft, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface QueueTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: any; // QueueEntry to transfer
  doctors: any[];
}

export const QueueTransferModal: React.FC<QueueTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  entry,
  doctors,
}) => {
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');
  const [reason, setReason] = useState<string>('Specialist referral / cross-consultation');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDoctorId) {
      setError('Please select a target doctor.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/queue-transfers/transfer-patient', {
        queueEntryId: entry.id,
        targetDoctorId,
        reason,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Transfer failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to transfer patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-primary px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Transfer Patient Queue</h3>
              <p className="text-xs text-blue-100">Token: {entry.tokenNumber} — {entry.patient?.user?.fullName}</p>
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
              Destination Doctor & Clinic
            </label>
            <select
              value={targetDoctorId}
              onChange={(e) => setTargetDoctorId(e.target.value)}
              className="input-field text-sm"
              required
            >
              <option value="">-- Select Target Doctor --</option>
              {doctors
                .filter((d) => d.id !== entry.doctorId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.fullName} ({d.department.name} - {d.roomNumber})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Transfer Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cross-consultation needed for joint pain"
              className="input-field text-sm"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !targetDoctorId}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
