import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Tv, Clock, AlertTriangle, ArrowRight, Bell, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export const PublicLiveQueuePage: React.FC = () => {
  const { deptId } = useParams<{ deptId?: string }>();
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeDeptId, setActiveDeptId] = useState<string>(deptId || '');
  const [queueData, setQueueData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch departments
  useEffect(() => {
    api.get('/departments')
      .then((res) => {
        if (res.success && res.departments.length > 0) {
          setDepartments(res.departments);
          if (!activeDeptId) {
            setActiveDeptId(res.departments[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch live queue for department
  const fetchQueue = (id: string) => {
    if (!id) return;
    api.get(`/queues/public/${id}`)
      .then((res) => {
        if (res.success) {
          setQueueData(res);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeDeptId) {
      fetchQueue(activeDeptId);
    }

    const socket = getSocket();
    const handleRefresh = (data: any) => {
      if (!data || !data.departmentId || data.departmentId === activeDeptId) {
        if (activeDeptId) fetchQueue(activeDeptId);
      }
    };

    socket.on('queue:public_refresh', handleRefresh);
    socket.on('queue:updated', handleRefresh);
    socket.on('queue:emergency_inserted', handleRefresh);

    return () => {
      socket.off('queue:public_refresh', handleRefresh);
      socket.off('queue:updated', handleRefresh);
      socket.off('queue:emergency_inserted', handleRefresh);
    };
  }, [activeDeptId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header Bar for Waiting Room Screen */}
      <header className="border-b border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                Care<span className="text-primary-light">Q</span>
              </span>
              <span className="bg-primary/20 text-primary-light border border-primary/30 text-xs font-bold px-2 py-0.5 rounded uppercase">
                Public Live Display
              </span>
            </div>
            <p className="text-xs text-slate-400">Waiting Area Live Consultation & Sequence Monitor</p>
          </div>
        </div>

        {/* Live Clock & Department Selector */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {departments.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDeptId(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeDeptId === d.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d.name} ({d.code})
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hospital Time</div>
            <div className="font-mono text-lg font-bold text-amber-400 tracking-wider">{currentTime}</div>
          </div>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="my-8 flex-1">
        {loading ? (
          <div className="h-96 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Connecting to live hospital queue engine...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: NOW SERVING */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-light font-bold text-sm uppercase tracking-wider">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Now Serving in {queueData?.department?.name || 'Department'}
                </div>
                <span className="text-xs text-slate-400">Please proceed when your token is called</span>
              </div>

              {queueData?.nowServing && queueData.nowServing.length > 0 ? (
                <div className="space-y-4">
                  {queueData.nowServing.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-3xl p-8 border-2 transition-all shadow-elevated ${
                        item.isEmergency
                          ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/50'
                          : 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-primary/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                          {item.isEmergency ? '🚨 Emergency Case Priority' : 'Active Consultation Token'}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            item.status === 'CALLED'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-400 animate-pulse'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-400'
                          }`}
                        >
                          {item.status === 'CALLED' ? 'Called Just Now' : 'In Consultation'}
                        </span>
                      </div>

                      <div className="my-6 text-center">
                        <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-wider text-white">
                          {item.tokenNumber}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-sm">
                        <div className="text-slate-300">
                          Consultation Room:{' '}
                          <span className="text-xl font-bold text-amber-400 ml-1">{item.roomNumber}</span>
                        </div>
                        <div className="text-slate-400 text-xs">{item.doctorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/60 rounded-3xl p-12 border border-slate-800 text-center space-y-3">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-lg font-bold text-slate-300">Consultation Station Ready</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Doctor is reviewing current charts. Next waiting patient will be called shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Right 5 cols: NEXT TOKENS IN LINE */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-300 font-bold text-sm uppercase tracking-wider">
                  Upcoming Sequence (Next Tokens)
                </div>
                <span className="text-xs text-slate-500 font-mono">Real-time Order</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800/80 shadow-elevated">
                {queueData?.nextUp && queueData.nextUp.length > 0 ? (
                  queueData.nextUp.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="py-3.5 px-3 flex items-center justify-between hover:bg-slate-800/40 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs font-mono">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-lg font-extrabold text-white font-mono tracking-wide">
                            {item.tokenNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">Assigned: {item.roomNumber}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          ~{item.estimatedWaitMins} min
                        </div>
                        <div className="text-[10px] text-slate-500">Est. Wait</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No additional patients currently waiting in this queue.
                  </div>
                )}
              </div>

              {/* Waiting Room Tips */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-light" />
                  Waiting Room Information:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Estimated waiting times respond dynamically to ongoing consultations and triage decisions. Please stay within auditory range of the announcement speakers.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Ticker */}
      <footer className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-400">CareQ Hospital Digital Display</span>
          <span>•</span>
          <span className="text-emerald-400">Real-Time Socket Connected</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            Exit TV Mode / Home
          </Link>
          <Link to="/book" className="text-primary-light hover:underline">
            Book Token Online
          </Link>
        </div>
      </footer>
    </div>
  );
};
