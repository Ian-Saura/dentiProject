import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function ImpersonationBanner() {
  const { isImpersonating, exitImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-3 text-center shadow-lg z-50 flex items-center justify-center gap-4"
    >
      <LogOut className="h-5 w-5" />
      <span className="font-semibold">Modo Administrador: Estás viendo la aplicación como otro usuario.</span>
      <button
        onClick={exitImpersonation}
        className="ml-4 bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-100 transition-colors"
      >
        Salir del Modo Admin
      </button>
    </motion.div>
  );
}





