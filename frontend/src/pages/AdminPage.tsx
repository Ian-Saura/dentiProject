import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Activity, Trash2, Ban, Check, Info, CreditCard, Crown, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminService, UserWithRole, Role, AdminStats } from '../services/admin';
import { plansService } from '../services/plans';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [planDuration, setPlanDuration] = useState<number | undefined>(undefined);
  const [hasExpiration, setHasExpiration] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('No tienes permisos para acceder a esta página');
      navigate('/');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, statsData] = await Promise.all([
        adminService.listUsers(),
        adminService.listRoles(),
        adminService.getStats(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      await adminService.assignRole(selectedUser.id, selectedRole);
      toast.success(`Rol asignado exitosamente a ${selectedUser.username}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole('');
      loadData();
    } catch (error: any) {
      toast.error('Error al asignar rol: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    if (user.username === 'admin') {
      toast.error('No puedes desactivar al administrador principal');
      return;
    }

    try {
      await adminService.updateUserStatus(user.id, !user.activo);
      toast.success(`Usuario ${user.activo ? 'desactivado' : 'activado'} exitosamente`);
      loadData();
    } catch (error: any) {
      toast.error('Error al cambiar estado: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    if (user.username === 'admin') {
      toast.error('No puedes eliminar al administrador principal');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar a ${user.username}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await adminService.deleteUser(user.id);
      toast.success(`Usuario ${user.username} eliminado exitosamente`);
      loadData();
    } catch (error: any) {
      toast.error('Error al eliminar usuario: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    
    try {
      await plansService.assignPlan(selectedUser.id, {
        plan: selectedPlan as 'trial' | 'premium' | 'enterprise',
        dias_duracion: hasExpiration ? planDuration : undefined,
      });
      toast.success(`Plan ${selectedPlan} asignado exitosamente a ${selectedUser.username}`);
      setShowPlanModal(false);
      setSelectedUser(null);
      setSelectedPlan('');
      setPlanDuration(undefined);
      setHasExpiration(false);
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido';
      toast.error('Error al asignar plan: ' + errorMessage);
      console.error('Error completo:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'active') return user.activo;
    if (filter === 'inactive') return !user.activo;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Helper function to get plan badge styling
  const getPlanBadge = (plan: string) => {
    if (plan === 'premium' || plan === 'enterprise') {
      return {
        bg: 'bg-gradient-to-r from-purple-600 to-pink-600',
        text: 'text-white',
        icon: <Crown className="w-4 h-4" />,
        label: plan === 'premium' ? 'Premium' : 'Enterprise',
      };
    }
    if (plan === 'trial') {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Clock className="w-4 h-4" />,
        label: 'Trial',
      };
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: <Info className="w-4 h-4" />,
      label: 'Sin plan',
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-white" />
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-white">
            Panel de Administración
          </h1>
          <p className="mt-2 text-blue-100 text-lg">Gestiona usuarios, planes y permisos del sistema</p>
        </div>
      </motion.div>

      {/* Stats Cards with animations */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Usuarios</p>
                <p className="text-3xl font-black mt-1">{stats.total_users}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Activos</p>
                <p className="text-3xl font-black mt-1">{stats.active_users}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Check className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Inactivos</p>
                <p className="text-3xl font-black mt-1">{stats.inactive_users}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Ban className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Sin Rol</p>
                <p className="text-3xl font-black mt-1">{stats.users_without_role}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activos ({users.filter(u => u.activo).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactivos ({users.filter(u => !u.activo).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">
                        {user.nombre} {user.apellido}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role_name === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role_name === 'moderator'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role_name === 'user'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role_display_name || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const badge = getPlanBadge(user.plan || '');
                      return (
                        <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.activo ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedRole(user.role_name || '');
                          setShowRoleModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Cambiar rol"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedPlan(user.plan || '');
                          setShowPlanModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Asignar plan"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`${
                          user.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                        disabled={user.username === 'admin'}
                      >
                        {user.activo ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar usuario"
                        disabled={user.username === 'admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Asignar Rol
                  </h3>
                  <p className="text-sm text-gray-500">{selectedUser.username}</p>
                </div>
              </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.display_name} ({role.permissions_count} permisos)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setSelectedRole('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignRole}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedRole}
              >
                Asignar Rol
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Assignment Modal */}
      <AnimatePresence>
        {showPlanModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-xl">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Asignar Plan
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedUser.username}</p>
                </div>
              </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecciona un plan</option>
                <option value="trial">Trial (Prueba gratuita)</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={hasExpiration}
                  onChange={(e) => {
                    setHasExpiration(e.target.checked);
                    if (!e.target.checked) setPlanDuration(undefined);
                    else if (selectedPlan === 'trial') setPlanDuration(7);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Plan con fecha de vencimiento
                </span>
              </label>
              
              {hasExpiration && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de duración
                  </label>
                  <input
                    type="number"
                    value={planDuration || ''}
                    onChange={(e) => setPlanDuration(parseInt(e.target.value) || undefined)}
                    min="1"
                    max="365"
                    placeholder="Ej: 30, 90, 365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {planDuration ? `El plan expirará después de ${planDuration} días` : 'Ingrese la cantidad de días'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-800">
                {selectedPlan === 'trial' && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Trial: Acceso limitado por tiempo
                  </span>
                )}
                {selectedPlan === 'premium' && (
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Premium: Acceso completo sin límites
                  </span>
                )}
                {selectedPlan === 'enterprise' && (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Enterprise: Acceso completo + funciones empresariales
                  </span>
                )}
                {!selectedPlan && (
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Selecciona un plan para ver detalles
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedUser(null);
                  setSelectedPlan('');
                  setPlanDuration(undefined);
                  setHasExpiration(false);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignPlan}
                disabled={!selectedPlan}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar Plan
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

