import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Mail, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HelpButton() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Solo mostrar el botón si el usuario está autenticado
  if (!isAuthenticated) {
    return null;
  }

  const handleEmailSupport = () => {
    window.location.href = 'mailto:soporte@manny.com.ar?subject=Consulta desde Manny App';
  };

  return (
    <>
      {/* Botón flotante principal */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:shadow-cyan-500/50 transition-all"
        title="Ayuda y Soporte"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </motion.button>

      {/* Modal de ayuda */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-40 bg-white rounded-2xl shadow-2xl border-2 border-cyan-200 overflow-hidden"
            style={{ width: '320px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                ¿Necesitás ayuda?
              </h3>
              <p className="text-sm text-white/90 mt-1">
                Estamos aquí para ayudarte
              </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Botón principal de email */}
              <button
                onClick={handleEmailSupport}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl p-4 flex items-start gap-3 transition-all transform hover:scale-105 shadow-lg"
              >
                <Mail className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-bold">Contactar Soporte</p>
                  <p className="text-sm text-white/90">soporte@manny.com.ar</p>
                </div>
              </button>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-800 mb-2">
                  ¿Cómo podemos ayudarte?
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Problemas técnicos o errores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Consultas sobre tu cuenta o plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Dudas sobre funcionalidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Sugerencias y feedback</span>
                  </li>
                </ul>
              </div>

              {/* Horarios de atención */}
              <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3">
                <p className="font-semibold text-gray-700">
                  ⏰ Horario de atención
                </p>
                <p className="mt-1">
                  Lunes a Viernes: 9:00 - 18:00 hs
                </p>
                <p className="text-gray-400 mt-1">
                  Te responderemos lo antes posible
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop para cerrar al hacer click fuera */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
}

