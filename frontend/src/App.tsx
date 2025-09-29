import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ConsultasPage from '@/pages/ConsultasPage';
import PacientesPage from '@/pages/PacientesPage';
import PatientDashboardPage from '@/pages/PatientDashboardPage';
import CalculadoraPage from '@/pages/CalculadoraPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';
import ImportPage from '@/pages/ImportPage';
import FinancialReportsPage from '@/pages/FinancialReportsPage';

// Components
import Layout from '@/components/Layout';
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

// App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultas"
        element={
          <ProtectedRoute>
            <Layout>
              <ConsultasPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes"
        element={
          <ProtectedRoute>
            <Layout>
              <PacientesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:patientName/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <PatientDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculadora"
        element={
          <ProtectedRoute>
            <Layout>
              <CalculadoraPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <Layout>
              <ConfiguracionPage />
            </Layout>
          </ProtectedRoute>
        }
      />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ImportPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FinancialReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
