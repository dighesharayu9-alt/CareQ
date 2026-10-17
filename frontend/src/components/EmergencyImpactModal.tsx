import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, Check, X, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface EmergencyImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialQueueId?: string;
}

export const EmergencyImpactModal: React.FC<EmergencyImpactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialQueueId,
}) => {
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>(initialQueueId || '');
  const [proposedDelayMins, setProposedDelayMins] = useState<number>(15);
  const [reason, setReason] = useState<string>('Acute Medical Emergency requiring immediate clinical intervention');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active queues
  useEffect(() => {
    if (isOpen) {
      api.get('/departments')
        .then((res) => {
          if (res.success) {
            const allQueues: any[] = [];
            res.departments.forEach((dept: any) => {
              // Fetch department full queues
              api.get(`/queues/department/${dept.id}`).then((qRes) => {
                if (qRes.success && qRes.queues) {
                  qRes.queues.forEach((q: any) => {
                    allQueues.push({
                      id: q.id,
                      name: `${dept.name} — ${q.doctor ? `Dr. ${q.doctor.user.fullName}` : 'General Room'}`,
                      waitingCount: q.entries.filter((e: any) => e.status === 'WAITING').length,
                    });
                    setQueues([...allQueues]);
                    if (!selectedQueueId && allQueues.length > 0) {
                      setSelectedQueueId(allQueues[0].id);
                    }
                  });
                }
              });
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Fetch preview whenever queue or delay changes
  const fetchPreview = async (queueId: string, delay: number) => {
    if (!queueId) return;
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await api.get(`/emergencies/preview?queueId=${queueId}&proposedDelayMins=${delay}`);
      if (res.success) {
        setPreviewData(res.preview);
      } else {
        setError(res.message || 'Failed to calculate impact preview');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching emergency impact preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedQueueId) {
      fetchPreview(selectedQueueId, proposedDelayMins);
    }
  }, [isOpen, selectedQueueId, proposedDelayMins]);

  const handleConfirm = async () => {
    if (!reason || reason.trim().length < 5) {
      setError('A clinical justification reason is required.');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const res = await api.post('/emergencies/confirm', {
        queueId: selectedQueueId,
        reason: reason.trim(),
        proposedDelayMins,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to apply emergency queue change.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm emergency insertion');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-elevated border border-border w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Emergency Impact Preview</h3>
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  Clinical Operational Override
                </span>
              </div>
              <p className="text-xs text-red-100">
                Preview estimated waiting-time impacts before authorized queue modification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                Target Department / Queue
              </label>
              <select
                value={selectedQueueId}
                onChange={(e) => setSelectedQueueId(e.target.value)}
                className="input-field"
              >
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} ({q.waitingCount} waiting)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
                Estimated Emergency Duration: <span className="text-primary font-bold">{proposedDelayMins} mins</span>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={proposedDelayMins}
                onChange={(e) => setProposedDelayMins(parseInt(e.target.value, 10))}
                className="w-full accent-red-600 cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>5 min (Minor)</span>
                <span>15 min (Standard)</span>
                <span>30 min (Urgent)</span>
                <span>60 min (Critical)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              Clinical Justification & Medical Reason (Mandatory for Audit Trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Acute chest pain with ST elevation / Trauma triage"
              className="input-field"
            />
          </div>

          {/* Impact Preview Section */}
          <div className="border border-border rounded-xl bg-slate-50/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-text-primary">
                  Calculated Operational Impact Analysis
                </h4>
              </div>
              {loadingPreview && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recalculating...
                </div>
              )}
            </div>

            {previewData && (
              <>
                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-border shadow-xs text-center">
                    <div className="text-xs text-text-secondary">Affected Patients</div>
                    <div className="text-xl font-bold text-amber-600 mt-0.5">
                      {previewData.affectedPatientsCount}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-border shadow-xs text-center">
                    <div className="text-xs text-text-secondary">Department</div>
                    <div className="text-sm font-bold text-text-primary mt-1 truncate">
                      {previewData.departmentName}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-border shadow-xs text-center">
                    <div className="text-xs text-text-secondary">Additional Delay</div>
                    <div className="text-xl font-bold text-red-600 mt-0.5">
                      +{previewData.proposedDelayMins} min
                    </div>
                  </div>
                </div>

                {/* Patient Delta Table */}
                <div className="overflow-hidden border border-border rounded-lg bg-white">
                  <div className="px-3 py-2 bg-slate-100/70 text-xs font-semibold text-text-secondary flex justify-between">
                    <span>Patient Token & Name</span>
                    <span className="flex gap-10 mr-4">
                      <span>Previous Est.</span>
                      <span>Revised Est.</span>
                      <span>Impact</span>
                    </span>
                  </div>

                  <div className="divide-y divide-border max-h-48 overflow-y-auto">
                    {previewData.affectedPatients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-text-muted">
                        No waiting patients in this queue currently. Emergency entry can proceed with zero wait disruption.
                      </div>
                    ) : (
                      previewData.affectedPatients.map((p: any) => (
                        <div key={p.id} className="px-3 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div>
                            <span className="font-bold text-primary mr-2">{p.tokenNumber}</span>
                            <span className="text-text-primary">{p.patientName}</span>
                          </div>

                          <div className="flex items-center gap-6">
                            <span className="text-text-secondary font-mono w-16 text-right">
                              {p.previousEstimateMins} min
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-amber-700 font-bold font-mono w-16 text-right">
                              {p.revisedEstimateMins} min
                            </span>
                            <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded text-[11px] w-14 text-center">
                              +{p.additionalDelayMins}m
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <p className="text-xs text-text-muted italic bg-white p-2.5 rounded border border-border">
                  ℹ️ {previewData.summary} All affected patients will automatically receive push notifications with their revised waiting times upon confirmation.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
            disabled={confirming}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchPreview(selectedQueueId, proposedDelayMins)}
              className="btn-outline-primary text-sm"
              disabled={loadingPreview || confirming}
            >
              Re-Calculate Preview
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || !selectedQueueId || !reason}
              className="btn-danger text-sm flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying Priority...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Emergency Priority
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
