import React from 'react';
import { Clock, Bell, UserCheck, CheckCircle2, UserX, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  isEmergency?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isEmergency, className = '' }) => {
  if (isEmergency) {
    return (
      <span className={`badge badge-emergency ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Emergency Priority
      </span>
    );
  }

  const s = status.toUpperCase();

  switch (s) {
    case 'WAITING':
      return (
        <span className={`badge badge-waiting ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          Waiting
        </span>
      );
    case 'CALLED':
      return (
        <span className={`badge badge-called ${className}`}>
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          Called Now
        </span>
      );
    case 'IN_CONSULTATION':
      return (
        <span className={`badge badge-in-consultation ${className}`}>
          <UserCheck className="w-3.5 h-3.5" />
          In Consultation
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`badge badge-completed ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case 'NO_SHOW':
      return (
        <span className={`badge badge-no-show ${className}`}>
          <UserX className="w-3.5 h-3.5" />
          No-Show
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`badge badge-cancelled ${className}`}>
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`badge bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          {status}
        </span>
      );
  }
};
