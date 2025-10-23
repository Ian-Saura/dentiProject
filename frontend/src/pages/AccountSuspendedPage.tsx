import React from 'react';
import { motion } from 'framer-motion';
import { Ban, Mail, Phone, CreditCard, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AccountSuspendedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleContact = () => {
    window.location.href = 'mailto:support@manny.com.ar?subject=Mi cuenta está suspendida';
  };

  const handlePayment = () => {
    window.location.href = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                  <Ban className="w-16 h-16" />
                </div>
              </motion.div>
              <h1 className="text-3xl font-black mb-2">Cuenta Suspendida</h1>
              <p className="text-red-100">Tu acceso a Manny ha sido temporalmente suspendido</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Acceso Restringido</h3>
                  <p className="text-sm text-red-800">
                    Tu cuenta <strong>{user?.email || user?.username}</strong> ha sido marcada como inactiva por el administrador.
                    Esto puede deberse a:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                    <li>Pago pendiente de verificación</li>
                    <li>Vencimiento de suscripción</li>
                    <li>Problema con tu forma de pago</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-gray-900 text-lg">¿Qué puedes hacer?</h3>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                Renovar Suscripción ($39.999/mes)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContact}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                Contactar Soporte
              </motion.button>

              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">¿Ya realizaste el pago?</p>
                <p>Contacta al administrador para que verifique tu pago y reactive tu cuenta.</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Cerrar Sesión
              </motion.button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">¿Necesitas ayuda?</p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:support@manny.com.ar" className="flex items-center gap-1 hover:text-blue-600">
              <Mail className="w-4 h-4" />
              support@manny.com.ar
            </a>
            <span className="text-gray-400">|</span>
            <a href="tel:+5491112345678" className="flex items-center gap-1 hover:text-blue-600">
              <Phone className="w-4 h-4" />
              +54 9 11 1234-5678
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

