import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Users,
  Calculator,
  Settings,
  Upload,
  Menu,
  X,
  LogOut,
  User,
  TrendingUp,
  Shield,
  Sparkles,
  Clock,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const AnalyticalLayout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { setMode } = useAppMode();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/analytical/dashboard', icon: Home },
    { name: 'Reportes', href: '/analytical/reportes', icon: TrendingUp },
    { name: 'Configuración de Costos', href: '/analytical/configuracion', icon: Settings },
    { name: 'Calculadora', href: '/analytical/calculadora', icon: Calculator },
    { name: 'Importar', href: '/analytical/import', icon: Upload },
    ...(isAdmin ? [{ name: 'Admin', href: '/analytical/admin', icon: Shield }] : []),
  ];

  const switchToOperational = () => {
    setMode('operational');
    navigate('/operational/turnos');
  };

  const getEspecialidadEmoji = (especialidad: string) => {
    const emojis = {
      odontologia: '🦷',
      dermatologia: '🧴',
      kinesiologia: '🏃‍♂️',
    };
    return emojis[especialidad as keyof typeof emojis] || '🏥';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-dental-50/20">
      {/* Mobile sidebar backdrop and menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
            </motion.div>

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col glass-dark shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
                <Link 
                  to="/analytical/dashboard" 
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-dental rounded-lg blur opacity-50"></div>
                    <div className="relative bg-white rounded-lg p-1.5">
                      <TrendingUp className="h-6 w-6 text-dental-500" />
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">Análisis</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-dental text-white shadow-lg shadow-primary-500/30'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              
              {/* Mobile switch mode & logout */}
              <div className="px-4 py-4 border-t border-white/10 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={switchToOperational}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-white/20 text-white hover:bg-white/30 w-full transition-all"
                >
                  <Zap className="h-5 w-5" />
                  <span>Modo Operativo</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </motion.button>

                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white w-full transition-all"
                  >
                    <User className="h-5 w-5" />
                    <span>Mi Perfil</span>
                  </motion.div>
                </Link>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-red-500/20 hover:text-white w-full transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-soft">
          <div className="flex h-16 items-center px-6 border-b border-gray-200/50">
            <Link 
              to="/analytical/dashboard" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-dental rounded-lg blur opacity-50 animate-pulse-slow"></div>
                <div className="relative bg-white rounded-lg p-1.5 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-dental-500" />
                </div>
              </div>
              <span className="text-xl font-bold gradient-text">Análisis</span>
            </Link>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200/50">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-dental-50 border border-primary-100/50"
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-dental rounded-full flex items-center justify-center shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.nombre} {getEspecialidadEmoji(user?.especialidad || 'odontologia')}
                </p>
                <p className="text-xs text-gray-600 capitalize font-medium">
                  {user?.especialidad} • <span className="text-primary-600">{user?.plan}</span>
                </p>
              </div>
            </motion.div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-dental text-white shadow-lg shadow-primary-500/20'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-200/50 space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={switchToOperational}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 w-full transition-all"
            >
              <Zap className="h-5 w-5" />
              <span>Modo Operativo</span>
              <ChevronRight className="h-4 w-4 ml-auto" />
            </motion.button>

            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full transition-all"
              >
                <User className="h-5 w-5" />
                <span>Mi Perfil</span>
              </motion.div>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 w-full transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {/* Title removed - each page has its own premium header */}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline font-medium">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content with animation */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="py-6"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AnalyticalLayout;













