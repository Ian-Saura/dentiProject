import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Sparkles,
  ExternalLink,
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';
import { plansService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

const MERCADOPAGO_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1';

const SubscriptionPage: React.FC = () => {
  const { data: planStatus, isLoading } = useQuery('plan-status', () => 
    plansService.getMyPlanStatus()
  );

  const handlePayment = () => {
    window.open(MERCADOPAGO_LINK, '_blank');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isPremium = planStatus?.plan === 'premium';
  const isTrial = planStatus?.plan === 'trial';
  const isExpired = planStatus?.trial_expirado || false;
  const daysRemaining = planStatus?.dias_restantes || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3">
            Tu Suscripción
          </h1>
          <p className="text-xl text-gray-600">
            Gestiona tu plan y mantén el acceso completo a Manny
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Estado Actual */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              {isPremium ? (
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              ) : isExpired ? (
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Estado del Plan</h2>
                <p className="text-sm text-gray-500">Información actual de tu cuenta</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              {isPremium ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-lg text-green-900">Plan Premium Activo</span>
                  </div>
                  <p className="text-sm text-green-700">
                    ✨ Tu suscripción está activa y al día. ¡Disfruta de todas las funciones!
                  </p>
                </div>
              ) : isTrial ? (
                <div className={`${isExpired ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isExpired ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-bold text-lg text-red-900">Período de Prueba Vencido</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-lg text-blue-900">Período de Prueba</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-blue-700'}`}>
                    {isExpired ? (
                      <>⚠️ Tu prueba gratuita ha finalizado. Activa tu suscripción para seguir usando Manny.</>
                    ) : (
                      <>⏳ Te quedan <strong>{daysRemaining} días</strong> de prueba gratuita. Activa tu suscripción antes de que expire.</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    Estado del plan no disponible
                  </p>
                </div>
              )}
            </div>

            {/* Detalles del Plan */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Plan Actual:</span>
                <span className="text-sm font-bold text-gray-900 uppercase">
                  {planStatus?.plan || 'N/A'}
                </span>
              </div>

              {planStatus?.fecha_inicio_plan && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Fecha de Inicio:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {new Date(planStatus.fecha_inicio_plan).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {planStatus?.fecha_vencimiento && isTrial && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Fecha de Vencimiento:</span>
                  <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(planStatus.fecha_vencimiento).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Plan Premium Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Plan Premium</h2>
                  <p className="text-sm text-blue-100">Todo lo que necesitás para crecer</p>
                </div>
              </div>

              {/* Precio */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">$39.999</span>
                  <span className="text-xl text-blue-100">ARS/mes</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Acceso completo a todas las funciones</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Gestión ilimitada de pacientes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Analytics y reportes en tiempo real</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Calculadora de precios avanzada</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Soporte prioritario</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">Actualizaciones automáticas</span>
                </div>
              </div>

              {/* CTA Button */}
              {!isPremium && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  className="w-full bg-white text-blue-600 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {isTrial ? 'Activar Suscripción' : 'Renovar Suscripción'}
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              )}

              {isPremium && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                  <p className="font-bold text-lg">¡Ya sos Premium!</p>
                  <p className="text-sm text-blue-100 mt-1">Gracias por confiar en Manny</p>
                </div>
              )}

              <p className="text-xs text-blue-100 text-center mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Pago seguro procesado por MercadoPago
              </p>
            </div>
          </motion.div>
        </div>

        {/* Beneficios Adicionales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            ¿Por qué elegir Premium?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Gestión Completa
              </h3>
              <p className="text-sm text-gray-600">
                Administra pacientes, consultas, turnos y finanzas desde un solo lugar
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Analytics Avanzados
              </h3>
              <p className="text-sm text-gray-600">
                Visualiza tus métricas financieras en tiempo real y toma decisiones informadas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Datos Seguros
              </h3>
              <p className="text-sm text-gray-600">
                Toda tu información encriptada y respaldada automáticamente
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ o Contacto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 text-sm">
            ¿Tenés alguna pregunta sobre tu suscripción?{' '}
            <a 
              href="mailto:soporte@manny.com.ar" 
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Contactanos
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

