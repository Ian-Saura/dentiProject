import { motion } from 'framer-motion';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const isImpersonating = sessionStorage.getItem('is_impersonating') === 'true';
  const impersonatedUserId = sessionStorage.getItem('impersonated_user_id');

  if (!isImpersonating) return null;

  const handleExitImpersonation = () => {
    // Restaurar token y usuario de admin
    const adminToken = sessionStorage.getItem('admin_token');
    const adminUser = sessionStorage.getItem('admin_user');

    if (adminToken && adminUser) {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('user', adminUser);
    }

    // Limpiar session storage
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('is_impersonating');
    sessionStorage.removeItem('impersonated_user_id');

    toast.success('Has vuelto a tu cuenta de administrador');
    
    // Redirigir al panel de admin
    window.location.href = '/admin';
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-2xl"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Modo Administrador - Viendo como: {currentUser.nombre} ({currentUser.username})
              </p>
              <p className="text-xs opacity-90">
                Estás navegando la aplicación como este usuario. Todos los cambios se aplicarán a su cuenta.
              </p>
            </div>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            Salir del Modo Admin
          </button>
        </div>
      </div>
    </motion.div>
  );
}

