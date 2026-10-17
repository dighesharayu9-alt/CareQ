import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Heart, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/patients/me')
      .then((res) => {
        if (res.success && res.patient) {
          const p = res.patient;
          setFullName(p.fullName || '');
          setPhone(p.phone || '');
          setDob(p.dob ? p.dob.split('T')[0] : '');
          setGender(p.gender || 'Male');
          setBloodGroup(p.bloodGroup || 'B+');
          setEmergencyContact(p.emergencyContact || '');
          setAddress(p.address || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await api.put('/patients/me', {
        fullName,
        phone,
        dob,
        gender,
        bloodGroup,
        emergencyContact,
        address,
      });

      if (res.success) {
        setSuccessMsg('Profile details updated successfully.');
        refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Profile & Health Details</h1>
        <p className="text-xs text-text-secondary">
          Keep your medical contact and emergency information accurate for hospital staff
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-text-secondary flex justify-center items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">Loading patient profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-base p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="input-field"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 00000"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1">
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your home address"
              rows={2}
              className="input-field"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2 px-6 flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
