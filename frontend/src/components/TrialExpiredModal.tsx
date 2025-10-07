import React from 'react';
import { AlertTriangle, Mail, Phone, Sparkles, Crown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrialExpiredModalProps {
  diasRestantes?: number;
  mensaje?: string;
  onClose?: () => void;
  isExpired?: boolean;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ 
  diasRestantes, 
  mensaje,
  onClose,
  isExpired: forceExpired
}) => {
  const isExpired = forceExpired || (diasRestantes !== undefined && diasRestantes < 0);
  const isAboutToExpire = !isExpired && (diasRestantes !== undefined && diasRestantes >= 0 && diasRestantes <= 3);

  if (!isExpired && !isAboutToExpire && !mensaje) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-gray-100"
        >
        {/* Close button */}
        {!isExpired && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Premium Header with gradient */}
        <div className={`relative overflow-hidden ${isExpired ? 'bg-gradient-to-br from-red-500 via-red-600 to-pink-600' : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500'}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 mb-4"
                >
                  <Crown className="w-8 h-8" />
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </motion.div>
                
                <h2 className="text-3xl font-black mb-2">
                  {isExpired ? 'Período de Prueba Expirado' : '¡Actualiza a Premium!'}
                </h2>
                
                {diasRestantes !== undefined && diasRestantes >= 0 ? (
                  <p className="text-lg opacity-90">
                    Te quedan <span className="font-bold text-2xl">{diasRestantes}</span> {diasRestantes === 1 ? 'día' : 'días'} de prueba
                  </p>
                ) : (
                  <p className="text-lg opacity-90">
                    Desbloquea todo el potencial de Manny App
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Message */}
          {mensaje && (
            <p className="text-gray-700 text-center text-lg">
              {mensaje}
            </p>
          )}

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🚀', text: 'Acceso ilimitado a todas las funcionalidades' },
              { icon: '📊', text: 'Reportes y analytics avanzados' },
              { icon: '💎', text: 'Soporte prioritario 24/7' },
              { icon: '∞', text: 'Sin límites de consultas y pacientes' },
              { icon: '🧮', text: 'Calculadora de precios inteligente' },
              { icon: '📈', text: 'Dashboard de rentabilidad en tiempo real' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100/50"
              >
                <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-6 h-6" />
              <h3 className="text-2xl font-bold">Plan Premium</h3>
            </div>
            <p className="text-blue-100 mb-4">Gestión profesional para tu consultorio dental</p>
            <div className="text-4xl font-black mb-1">Contáctanos</div>
            <p className="text-sm text-blue-100">para conocer precios y promociones</p>
          </div>

          {/* Contact Methods */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-center text-lg mb-4">
              💬 Elige cómo contactarnos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="mailto:contacto@mannyapp.com?subject=Quiero actualizar a Premium"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all shadow-lg text-white"
              >
                <div className="bg-white/20 p-3 rounded-lg">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Email</p>
                  <p className="text-xs opacity-90">contacto@mannyapp.com</p>
                </div>
              </motion.a>
              
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://wa.me/5493624105370?text=Hola!%20Quiero%20actualizar%20a%20Premium%20en%20Manny%20App"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl transition-all shadow-lg text-white"
              >
                <div className="bg-white/20 p-3 rounded-lg">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">WhatsApp</p>
                  <p className="text-xs opacity-90">+54 9 362 410-5370</p>
                </div>
              </motion.a>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-800 font-medium">
                Tu acceso está limitado hasta que actualices tu plan
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExpired && onClose && (
          <div className="px-8 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Lo pensaré más tarde
            </button>
          </div>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialExpiredModal;


