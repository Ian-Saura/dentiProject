import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, CheckCircle, ArrowRight, Mail } from 'lucide-react';

export default function TrialExpiredPage() {
  const handlePayment = () => {
    // Redirect a MercadoPago
    window.location.href = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <AlertCircle className="w-20 h-20 text-white mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-2">
            Tu período de prueba ha finalizado
          </h1>
          <p className="text-xl text-blue-100">
            ¡Esperamos que hayas disfrutado Manny!
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Continúa transformando tu consultorio
            </h2>
            <p className="text-gray-600 text-lg">
              Tus 14 días de prueba han terminado. Para seguir usando todas las funcionalidades de Manny, 
              suscribite al plan mensual.
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Plan Premium</h3>
              <div className="text-right">
                <div className="text-4xl font-black text-blue-600">$39.999</div>
                <div className="text-sm text-gray-600">por mes</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                'Acceso completo a ambos módulos',
                'Pacientes ilimitados',
                'Análisis financiero completo',
                'Calculadora de precios',
                'Gestión de turnos',
                'Soporte prioritario',
                'Actualizaciones constantes'
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
          >
            <CreditCard className="w-6 h-6" />
            <span>Suscribirse Ahora</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Pago seguro procesado por MercadoPago
          </p>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-3">
              ¿Necesitás ayuda o tenés alguna consulta?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a 
                href="mailto:soporte@manny.com.ar" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                soporte@manny.com.ar
              </a>
              <span className="hidden sm:inline text-gray-300">•</span>
              <a 
                href="mailto:info@manny.com.ar" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@manny.com.ar
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
















