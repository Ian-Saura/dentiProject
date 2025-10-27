import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Clock, Zap } from 'lucide-react';

interface UpgradeBannerProps {
  diasRestantes: number;
  onUpgrade: () => void;
}

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ diasRestantes, onUpgrade }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl p-6 mb-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Trial Activo
            </h3>
            <p className="text-white/90 text-sm">
              {diasRestantes === 0 ? (
                <span className="font-bold">¡Último día de tu prueba gratuita!</span>
              ) : diasRestantes === 1 ? (
                <span>Te queda <span className="font-bold">1 día</span> de prueba gratis</span>
              ) : (
                <span>Te quedan <span className="font-bold">{diasRestantes} días</span> de prueba gratis</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
        >
          <Crown className="h-5 w-5" />
          Actualizar a Premium
        </button>
      </div>
    </motion.div>
  );
};

export default UpgradeBanner;



