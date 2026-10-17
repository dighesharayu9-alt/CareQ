import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, UserRole, DEMO_CREDENTIALS } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login, quickLoginDemo } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (role: UserRole) => {
    switch (role) {
      case 'PATIENT':
        navigate('/patient/dashboard');
        break;
      case 'DOCTOR':
        navigate('/doctor/dashboard');
        break;
      case 'RECEPTIONIST':
        navigate('/reception/dashboard');
        break;
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      handleRedirect(user.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const user = await quickLoginDemo(role);
      handleRedirect(user.role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-border shadow-elevated">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to CareQ</h2>
          <p className="text-xs text-text-secondary">
            Access your patient queue token, OPD consultations, or hospital station
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="p-4 rounded-2xl bg-lavender/60 border border-purple-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            1-Click Demo Account Login
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('PATIENT')}
              disabled={loading}
              className="p-2.5 bg-white border border-purple-200 rounded-xl hover:border-purple-400 font-medium text-left shadow-xs transition-all flex flex-col"
            >
              <span className="font-bold text-slate-900">👤 Patient</span>
              <span className="text-[10px] text-text-muted">Ramesh Kumar (CARD-015)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('DOCTOR')}
              disabled={loading}
              className="p-2.5 bg-white border border-purple-200 rounded-xl hover:border-purple-400 font-medium text-left shadow-xs transition-all flex flex-col"
            >
              <span className="font-bold text-slate-900">🩺 Doctor</span>
              <span className="text-[10px] text-text-muted">Dr. Rajesh Sharma (Cardio)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('RECEPTIONIST')}
              disabled={loading}
              className="p-2.5 bg-white border border-purple-200 rounded-xl hover:border-purple-400 font-medium text-left shadow-xs transition-all flex flex-col"
            >
              <span className="font-bold text-slate-900">📋 Reception</span>
              <span className="text-[10px] text-text-muted">Sarah Jenkins (Desk)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              disabled={loading}
              className="p-2.5 bg-white border border-purple-200 rounded-xl hover:border-purple-400 font-medium text-left shadow-xs transition-all flex flex-col"
            >
              <span className="font-bold text-slate-900">⚙️ Hospital Admin</span>
              <span className="text-[10px] text-text-muted">System Oversight</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@careq.demo"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};
