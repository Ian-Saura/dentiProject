import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Mail } from 'lucide-react';

const AccountSuspendedPage: React.FC = () => {
  const handlePayment = () => {
    window.open('https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-6"
          >
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </motion.div>

          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Cuenta Suspendida
          </h1>

          <p className="text-gray-600 mb-6">
            Tu período de prueba ha finalizado o tu suscripción está pendiente de pago.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg text-blue-900 mb-3">Plan Premium</h3>
            <div className="text-4xl font-black text-blue-600 mb-2">$39.999</div>
            <p className="text-sm text-blue-700 mb-4">Por mes</p>
            <ul className="text-left space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Acceso completo a todas las funciones
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Analytics avanzados en tiempo real
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Gestión ilimitada de pacientes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Reportes financieros detallados
              </li>
            </ul>
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 mb-4"
          >
            <CreditCard className="h-5 w-5" />
            Activar Suscripción
          </button>

          <p className="text-xs text-gray-500 mb-4">
            Pago seguro a través de MercadoPago
          </p>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-3">
              ¿Necesitás ayuda o tenés alguna consulta?
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="mailto:soporte@manny.com.ar"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                soporte@manny.com.ar
              </a>
              <a
                href="mailto:info@manny.com.ar"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                info@manny.com.ar
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountSuspendedPage;

