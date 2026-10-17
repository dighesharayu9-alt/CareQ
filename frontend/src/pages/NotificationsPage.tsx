import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Ticket, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = () => {
    api.get('/notifications')
      .then((res) => {
        if (res.success) {
          setNotifications(res.notifications || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    const handleNotification = () => fetchNotifications();
    socket.on('notification:received', handleNotification);

    return () => {
      socket.off('notification:received', handleNotification);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'DELAY':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'TURN_APPROACHING':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'APPOINTMENT':
        return <Ticket className="w-5 h-5 text-primary" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications Center</h1>
          <p className="text-xs text-text-secondary">
            Real-time updates regarding your queue standing, doctor delays, and clinical alerts
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4 text-primary" />
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-secondary flex justify-center items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-base p-12 text-center text-xs text-text-muted space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-700 text-sm">No Notifications</div>
          <p>You have no queue alerts or doctor updates at this moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                n.isRead ? 'bg-white border-border' : 'bg-primary-subtle/50 border-primary/40 shadow-xs'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-border shrink-0 shadow-xs">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${n.isRead ? 'text-slate-900' : 'text-primary'}`}>
                    {n.title}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" title="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
