import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Mail, Phone, Sparkles, Star, Check, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TrialExpiredPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent user from navigating back
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const features = [
    { icon: '🚀', title: 'Acceso Ilimitado', description: 'Sin restricciones en consultas ni pacientes' },
    { icon: '📊', title: 'Analytics Avanzados', description: 'Reportes detallados de rentabilidad y flujo de caja' },
    { icon: '💎', title: 'Soporte Premium', description: 'Asistencia prioritaria 24/7 vía WhatsApp y email' },
    { icon: '🧮', title: 'Calculadora Pro', description: 'Precios inteligentes basados en tus costos reales' },
    { icon: '📈', title: 'Dashboard en Vivo', description: 'Métricas y KPIs actualizados en tiempo real' },
    { icon: '🔒', title: 'Seguridad Total', description: 'Backups automáticos y encriptación de datos' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Logout button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleLogout}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/20"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Cerrar Sesión</span>
      </motion.button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <Crown className="w-16 h-16 text-yellow-400" />
              <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-black text-white mb-4"
            >
              Tu Prueba Ha Terminado
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto"
            >
              ¡Esperamos que hayas disfrutado de Manny App! 
              Actualiza ahora a Premium para seguir gestionando tu consultorio como un profesional.
            </motion.p>

            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-gray-900 font-bold text-lg shadow-2xl"
            >
              <Star className="w-6 h-6 fill-current" />
              Plan Premium
              <Star className="w-6 h-6 fill-current" />
            </motion.div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-blue-200 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
              <Crown className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-2">Plan Premium</h2>
              <p className="text-blue-100 mb-4">Gestión profesional para tu consultorio dental</p>
              <div className="text-5xl font-black mb-2">Contáctanos</div>
              <p className="text-blue-100">para conocer precios y promociones exclusivas</p>
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Todo lo que necesitas incluido:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  'Pacientes ilimitados',
                  'Consultas ilimitadas',
                  'Reportes financieros avanzados',
                  'Análisis de rentabilidad',
                  'Calculadora de precios',
                  'Dashboard en tiempo real',
                  'Gestión de equipos y gastos',
                  'Importación de datos CSV',
                  'Backups automáticos',
                  'Soporte prioritario',
                  'Actualizaciones gratuitas',
                  'Seguridad de datos premium',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Contact buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="mailto:contacto@mannyapp.com?subject=Quiero actualizar a Premium&body=Hola! Me interesa actualizar mi cuenta a Premium. Por favor, envíenme información sobre precios y el proceso de pago."
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-bold text-lg shadow-xl transition-all"
                >
                  <Mail className="w-6 h-6" />
                  Contactar por Email
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://wa.me/5493624105370?text=Hola!%20Quiero%20actualizar%20mi%20cuenta%20a%20Premium%20en%20Manny%20App.%20Me%20pueden%20enviar%20información%20sobre%20precios%20y%20el%20proceso%20de%20pago?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl text-white font-bold text-lg shadow-xl transition-all"
                >
                  <Phone className="w-6 h-6" />
                  WhatsApp Directo
                </motion.a>
              </div>

              <p className="text-center text-gray-500 text-sm mt-6">
                📞 Horario de atención: Lunes a Viernes, 9:00 - 18:00 hs
              </p>
            </div>
          </motion.div>

          {/* Bottom text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center text-blue-200 text-sm"
          >
            ¿Tienes dudas? Contáctanos y resolveremos todas tus consultas 💬
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default TrialExpiredPage;

