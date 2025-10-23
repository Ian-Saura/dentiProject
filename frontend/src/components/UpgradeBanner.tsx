import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';

interface UpgradeBannerProps {
  diasRestantes: number;
  onUpgrade: () => void;
}

export default function UpgradeBanner({ diasRestantes, onUpgrade }: UpgradeBannerProps) {
  const urgente = diasRestantes <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-xl mb-6 ${
        urgente 
          ? 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-600' 
          : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600'
      }`}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-4 -right-4 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left side - Info */}
        <div className="flex-1 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-2xl font-black">
              {urgente ? '⚠️ Tu trial está por vencer' : '🎉 Disfrutando tu trial'}
            </h3>
          </div>
          <p className="text-white/90 text-lg mb-2">
            {urgente 
              ? `Solo te quedan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} de acceso gratuito` 
              : `Te quedan ${diasRestantes} días de acceso completo gratuito`
            }
          </p>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Actualiza ahora y nunca pierdas el acceso a tus datos
            </span>
          </div>
        </div>

        {/* Right side - CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade}
          className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 group whitespace-nowrap"
        >
          <span>Actualizar a Premium</span>
          <span className="text-2xl font-black">$39.999</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(diasRestantes / 14) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${urgente ? 'bg-red-300' : 'bg-white'}`}
        />
      </div>
    </motion.div>
  );
}

