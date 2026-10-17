import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-border shadow-elevated">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Reset</h2>
          <p className="text-xs text-text-secondary">
            Reset access to your CareQ hospital patient or staff account
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Password Reset Instructions Sent
              </div>
              <p>
                A password reset token has been generated for <strong>{email}</strong>.
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 font-mono text-[11px] text-slate-700">
                Development Safe Note: All demo accounts use the standard documented password: <span className="font-bold text-primary">CareQ@2025</span>
              </div>
            </div>

            <Link to="/login" className="btn-primary w-full text-xs py-2.5 text-center flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@careq.demo"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-sm">
              Send Password Reset Link
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
