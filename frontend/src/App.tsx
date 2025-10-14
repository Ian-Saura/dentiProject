import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppModeProvider, useAppMode } from '@/contexts/AppModeContext';

// Pages
import LandingPage from '@/pages/LandingPage';
import FAQPage from '@/pages/FAQPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AdminPage from '@/pages/AdminPage';
import DashboardPage from '@/pages/DashboardPage';
import ConsultasPage from '@/pages/ConsultasPage';
import PacientesPage from '@/pages/PacientesPage';
import PatientDashboardPage from '@/pages/PatientDashboardPage';
import CalculadoraPage from '@/pages/CalculadoraPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';
import ImportPage from '@/pages/ImportPage';
import FinancialReportsPage from '@/pages/FinancialReportsPage';
import TrialExpiredPage from '@/pages/TrialExpiredPage';
import TurnosPage from '@/pages/TurnosPage';
import ReservarTurnoPage from '@/pages/ReservarTurnoPage';
import OperationalDashboard from '@/pages/OperationalDashboard';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '814453800673-39hb3apvtc1d5bdo68k9cq83isn75n2j.apps.googleusercontent.com';

// Components
import AnalyticalLayout from '@/components/AnalyticalLayout';
import OperationalLayout from '@/components/OperationalLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Mode Router Component
const ModeRouter: React.FC = () => {
  const { mode } = useAppMode();
  const { isAuthenticated } = useAuth();

  // Redirect based on mode when accessing root
  if (isAuthenticated) {
    if (mode === 'operational') {
      return <Navigate to="/operational/turnos" replace />;
    } else {
      return <Navigate to="/analytical/dashboard" replace />;
    }
  }

  // If not authenticated, this shouldn't be called (handled by routes)
  return <Navigate to="/" replace />;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <ModeRouter /> : <LandingPage />} 
      />
      <Route 
        path="/landing" 
        element={isAuthenticated ? <ModeRouter /> : <LandingPage />} 
      />
      <Route 
        path="/faq" 
        element={<FAQPage />} 
      />
      <Route 
        path="/login" 
        element={isAuthenticated ? <ModeRouter /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <ModeRouter /> : <RegisterPage />} 
      />
      <Route 
        path="/trial-expired" 
        element={
          <ProtectedRoute>
            <TrialExpiredPage />
          </ProtectedRoute>
        } 
      />

      {/* Root redirect based on mode */}
      <Route path="/" element={<ProtectedRoute><ModeRouter /></ProtectedRoute>} />

      {/* Analytical Mode Routes */}
      <Route
        path="/analytical/dashboard"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <DashboardPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/admin"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <AdminPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/prestaciones"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <ConsultasPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/pacientes"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <PacientesPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/pacientes/:patientName/dashboard"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <PatientDashboardPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/calculadora"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <CalculadoraPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/configuracion"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <ConfiguracionPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/import"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <ImportPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/reportes"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <FinancialReportsPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytical/turnos"
        element={
          <ProtectedRoute>
            <AnalyticalLayout>
              <TurnosPage />
            </AnalyticalLayout>
          </ProtectedRoute>
        }
      />

      {/* Operational Mode Routes */}
      <Route
        path="/operational/turnos"
        element={
          <ProtectedRoute>
            <OperationalLayout>
              <TurnosPage />
            </OperationalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operational/prestaciones"
        element={
          <ProtectedRoute>
            <OperationalLayout>
              <ConsultasPage />
            </OperationalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operational/pacientes"
        element={
          <ProtectedRoute>
            <OperationalLayout>
              <PacientesPage />
            </OperationalLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operational/pacientes/:patientName/dashboard"
        element={
          <ProtectedRoute>
            <OperationalLayout>
              <PatientDashboardPage />
            </OperationalLayout>
          </ProtectedRoute>
        }
      />

      {/* Legacy redirects */}
      <Route path="/consultas" element={<Navigate to="/analytical/prestaciones" replace />} />
      <Route path="/prestaciones" element={<Navigate to="/analytical/prestaciones" replace />} />
      <Route path="/pacientes" element={<Navigate to="/analytical/pacientes" replace />} />
      <Route path="/turnos" element={<Navigate to="/analytical/turnos" replace />} />
      <Route path="/admin" element={<Navigate to="/analytical/admin" replace />} />
      <Route path="/calculadora" element={<Navigate to="/analytical/calculadora" replace />} />
      <Route path="/configuracion" element={<Navigate to="/analytical/configuracion" replace />} />
      <Route path="/import" element={<Navigate to="/analytical/import" replace />} />
      <Route path="/reportes" element={<Navigate to="/analytical/reportes" replace />} />

      {/* Ruta pública para reservar turnos */}
      <Route path="/reservar-turno/:token" element={<ReservarTurnoPage />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppModeProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </AppModeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
