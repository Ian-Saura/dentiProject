import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      await login(username, password);
      // Force full page reload to ensure auth state is updated
      window.location.href = '/';
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleLogin(credentialResponse.credential);
      // Force full page reload to ensure auth state is updated
      window.location.href = '/';
    } catch (error: any) {
      toast.error('Error al autenticar con Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-dental-50 to-trust-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-dental-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-trust-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-gradient-dental rounded-full blur-xl opacity-50 animate-pulse-slow"></div>
              <div className="relative flex items-center justify-center space-x-3 bg-white rounded-2xl px-6 py-4 shadow-glow-dental">
                <Activity className="h-10 w-10 text-transparent bg-gradient-dental bg-clip-text" style={{ 
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} />
                <span className="text-3xl font-black gradient-text">Manny App</span>
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
            </motion.div>
          </div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-extrabold text-gray-900"
          >
            Sistema de Gestión <span className="gradient-text">Dental Premium</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-3 text-base text-gray-600 font-medium"
          >
            Transforma tu práctica con tecnología de vanguardia
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20"
        >
          {/* Google Sign In */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Error al autenticar con Google')}
              useOneTap
              shape="rectangular"
              size="large"
              width="100%"
              text="signin_with"
            />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 glass-dark text-white text-xs font-medium rounded-full">O continúa con email</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="form-label">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="form-input"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input pr-10"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="show-demo"
                name="show-demo"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={showDemo}
                onChange={(e) => setShowDemo(e.target.checked)}
              />
              <label htmlFor="show-demo" className="ml-2 block text-sm text-gray-700">
                Mostrar credenciales de prueba
              </label>
            </div>

            {showDemo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Usuario:</strong> admin<br />
                  <strong>Contraseña:</strong> Contact administrator
                </p>
              </div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Ingresar al Dashboard
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="gradient-text font-bold hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Sistema Activo
            </span>
            <span>•</span>
            <span>v7.0 Premium</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
