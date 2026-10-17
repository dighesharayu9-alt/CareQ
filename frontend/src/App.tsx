import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { BookAppointmentPage } from './pages/BookAppointmentPage.js';
import { TokenConfirmationPage } from './pages/TokenConfirmationPage.js';
import { PublicLiveQueuePage } from './pages/PublicLiveQueuePage.js';
import { SeniorCitizenEasyViewPage } from './pages/SeniorCitizenEasyViewPage.js';
import { PatientDashboardPage } from './pages/PatientDashboardPage.js';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage.js';
import { ReceptionistDashboardPage } from './pages/ReceptionistDashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

// Protected Route Component
const ProtectedRoute: React.FC<{
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-secondary text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized dashboard
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'RECEPTIONIST') return <Navigate to="/reception/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout Component
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-primary selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Full-screen TV Display (No Navbar/Footer) */}
          <Route path="/live-queue" element={<PublicLiveQueuePage />} />
          <Route path="/live-queue/:deptId" element={<PublicLiveQueuePage />} />

          {/* Standard Pages wrapped with Navbar & Footer */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/book" element={<BookAppointmentPage />} />
                  <Route path="/token/:token" element={<TokenConfirmationPage />} />
                  <Route path="/senior-view" element={<SeniorCitizenEasyViewPage />} />

                  {/* Authenticated Role Dashboards */}
                  <Route
                    path="/patient/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                        <PatientDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/doctor/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                        <DoctorDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reception/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                        <ReceptionistDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
