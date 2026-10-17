import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  patientId?: string;
  doctorId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  quickLoginDemo: (role: UserRole) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; label: string }> = {
  PATIENT: { email: 'patient@careq.demo', pass: 'CareQ@2025', label: 'Ramesh Kumar (Patient)' },
  DOCTOR: { email: 'doctor@careq.demo', pass: 'CareQ@2025', label: 'Dr. Rajesh Sharma (Cardiology)' },
  RECEPTIONIST: { email: 'reception@careq.demo', pass: 'CareQ@2025', label: 'Sarah Jenkins (Reception Desk)' },
  ADMIN: { email: 'admin@careq.demo', pass: 'CareQ@2025', label: 'System Administrator' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('careq_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('careq_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        // Connect socket room
        const socket = getSocket();
        socket.emit('join:user', res.user.id);
        if (res.user.doctorId) socket.emit('join:doctor', res.user.doctorId);
        if (res.user.patientId) socket.emit('join:patient', res.user.patientId);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token && res.user) {
      localStorage.setItem('careq_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const socket = getSocket();
      socket.emit('join:user', res.user.id);
      if (res.user.doctorId) socket.emit('join:doctor', res.user.doctorId);
      if (res.user.patientId) socket.emit('join:patient', res.user.patientId);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData: any): Promise<User> => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.token && res.user) {
      localStorage.setItem('careq_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('careq_token');
    setToken(null);
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  };

  const quickLoginDemo = async (role: UserRole): Promise<User> => {
    const creds = DEMO_CREDENTIALS[role];
    return await login(creds.email, creds.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickLoginDemo,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
