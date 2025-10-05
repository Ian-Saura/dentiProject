import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { pacientesService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Sparkles, Edit, Trash2, X, BarChart3, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  activo: boolean;
}

interface PacienteForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
}

const PacientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState<PacienteForm>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: ''
  });

  const queryClient = useQueryClient();

  // Fetch patients
  const { data: pacientes, isLoading, error } = useQuery<Paciente[]>(
    'pacientes',
    () => pacientesService.getPacientes()
  );

  // Create patient mutation
  const createMutation = useMutation(pacientesService.createPaciente, {
    onSuccess: () => {
      queryClient.invalidateQueries('pacientes');
      setShowForm(false);
      resetForm();
    }
  });

  // Update patient mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: PacienteForm }) => 
      pacientesService.updatePaciente(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pacientes');
        setEditingPaciente(null);
        setShowForm(false);
        resetForm();
      }
    }
  );

  // Delete patient mutation
  const deleteMutation = useMutation(pacientesService.deletePaciente, {
    onSuccess: () => {
      queryClient.invalidateQueries('pacientes');
    }
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fecha_nacimiento: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPaciente) {
      updateMutation.mutate({ id: editingPaciente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      email: paciente.email,
      telefono: paciente.telefono,
      fecha_nacimiento: paciente.fecha_nacimiento
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este paciente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPaciente(null);
    resetForm();
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error al cargar pacientes</div>;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-dental rounded-3xl p-8 text-white shadow-glow-dental"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <Sparkles className="h-8 w-8 animate-pulse" />
                Gestión de Pacientes
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Administra la información de tus pacientes
              </motion.p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-premium flex items-center space-x-2 text-base"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Paciente</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="glass rounded-3xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 pointer-events-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-dental-500" />
                    {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 btn-premium disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </motion.button>
              </div>
            </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Patients Table */}
      <AnimatedCard delay={0.2}>
        <div className="glass rounded-2xl shadow-soft border border-white/20">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <h3 className="text-xl font-bold gradient-text flex items-center gap-2">
              <Users className="h-6 w-6 text-dental-500" />
              Lista de Pacientes ({pacientes?.length || 0})
            </h3>
          </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pacientes?.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {paciente.nombre} {paciente.apellido}
                      </div>
                      <div className="text-sm text-gray-500">ID: {paciente.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{paciente.email}</div>
                    <div className="text-sm text-gray-500">{paciente.telefono}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {paciente.fecha_nacimiento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      paciente.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {paciente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const fullName = `${paciente.nombre}${paciente.apellido ? ' ' + paciente.apellido : ''}`.trim();
                          navigate(`/pacientes/${encodeURIComponent(fullName)}/dashboard`);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(paciente)}
                        className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(paciente.id)}
                        disabled={deleteMutation.isLoading}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pacientes?.length === 0 && (
          <div className="text-center py-12 px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-dental rounded-full flex items-center justify-center shadow-glow-dental">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay pacientes</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Comienza agregando tu primer paciente
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="btn-premium inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Agregar Paciente
              </motion.button>
            </motion.div>
          </div>
        )}
        </div>
      </AnimatedCard>
    </div>
  );
};

export default PacientesPage;