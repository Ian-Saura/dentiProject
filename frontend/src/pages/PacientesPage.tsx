import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { pacientesService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Edit, Trash2, Users, Sparkles, X, BarChart3, ArrowUpDown, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDateToDDMMYYYY, calculateAge } from '../utils/dateFormat';
import { useAppMode } from '../contexts/AppModeContext';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  obra_social?: string;
  activo: boolean;
}

interface PacienteForm {
  nombre: string;
  apellido: string;
  dni?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  obra_social?: string;
}

const PacientesPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [sortBy, setSortBy] = useState<'nombre' | 'apellido' | 'fecha_registro'>('apellido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<PacienteForm>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    obra_social: ''
  });

  const queryClient = useQueryClient();

  // Fetch patients
  const { data: pacientes, isLoading, error } = useQuery<Paciente[]>(
    'pacientes',
    () => pacientesService.getPacientes()
  );

  // Sort patients
  const sortedPacientes = React.useMemo(() => {
    if (!pacientes) return [];
    
    return [...pacientes].sort((a, b) => {
      let compareA, compareB;
      
      if (sortBy === 'nombre') {
        compareA = a.nombre.toLowerCase();
        compareB = b.nombre.toLowerCase();
      } else if (sortBy === 'apellido') {
        compareA = a.apellido.toLowerCase();
        compareB = b.apellido.toLowerCase();
      } else {
        // fecha_registro - assuming it exists or using id as proxy
        compareA = a.id;
        compareB = b.id;
      }
      
      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pacientes, sortBy, sortOrder]);

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
      dni: '',
      email: '',
      telefono: '',
      fecha_nacimiento: '',
      obra_social: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data, removing empty optional fields
    const dataToSend = {
      ...formData,
      email: formData.email?.trim() === '' ? undefined : formData.email,
      telefono: formData.telefono?.trim() === '' ? undefined : formData.telefono,
      fecha_nacimiento: formData.fecha_nacimiento === '' ? undefined : formData.fecha_nacimiento,
      obra_social: formData.obra_social?.trim() === '' ? undefined : formData.obra_social,
      dni: formData.dni?.trim() === '' ? undefined : formData.dni,
    };
    
    if (editingPaciente) {
      updateMutation.mutate({ id: editingPaciente.id, data: dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni || '',
      email: paciente.email || '',
      telefono: paciente.telefono || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      obra_social: paciente.obra_social || ''
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
                  DNI * <span className="text-xs text-gray-500 font-normal">(obligatorio)</span>
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678"
                  minLength={7}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obra Social <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.obra_social}
                  onChange={(e) => setFormData({ ...formData, obra_social: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="OSDE, Swiss Medical, etc. (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@ejemplo.com (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+54 9 11 1234-5678 (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento <span className="text-xs text-gray-500 font-normal">(opcional)</span>
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

      {/* Premium Patients Grid */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold gradient-text mb-1">Pacientes Registrados</h3>
            <p className="text-gray-600">Gestiona tu cartera de pacientes ({sortedPacientes?.length || 0} pacientes)</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'nombre' | 'apellido' | 'fecha_registro')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dental-500 bg-white"
            >
              <option value="apellido">Apellido</option>
              <option value="nombre">Nombre</option>
              <option value="fecha_registro">Fecha</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </button>
          </div>
        </div>

        {sortedPacientes?.length === 0 ? (
          <AnimatedCard delay={0.2}>
            <div className="text-center py-16 px-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-dental rounded-3xl flex items-center justify-center shadow-glow-dental">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text mb-3">No hay pacientes</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Comienza agregando tu primer paciente para gestionar su historial y tratamientos
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="btn-premium inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Primer Paciente
                </motion.button>
              </motion.div>
            </div>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPacientes?.map((paciente: Paciente, index) => (
              <AnimatedCard key={paciente.id} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-dental-400 transition-all duration-300"
                >
                  {/* Header with Avatar */}
                  <div className="bg-gradient-dental p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                          <span className="text-2xl font-bold text-white">
                            {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {paciente.nombre} {paciente.apellido}
                          </h4>
                          <p className="text-xs text-white/80">ID: {paciente.id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        paciente.activo 
                          ? 'bg-green-400 text-green-900' 
                          : 'bg-gray-400 text-gray-900'
                      }`}>
                        {paciente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* DNI Temporal Warning */}
                    {paciente.dni && paciente.dni.startsWith('CSV-') && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-900">DNI Temporal</p>
                          <p className="text-xs text-amber-700 truncate">{paciente.dni}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {paciente.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span className="truncate">{paciente.email}</span>
                        </div>
                      )}
                      {paciente.telefono && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span>{paciente.telefono}</span>
                        </div>
                      )}
                      {paciente.obra_social && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span>{paciente.obra_social}</span>
                        </div>
                      )}
                    </div>

                    {/* Birth Date & Age */}
                    {paciente.fecha_nacimiento && (
                      <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium mb-1">Nacimiento</div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-blue-900">
                            {formatDateToDDMMYYYY(paciente.fecha_nacimiento)}
                          </div>
                          {calculateAge(paciente.fecha_nacimiento) && (
                            <div className="text-xl font-black text-blue-600">
                              {calculateAge(paciente.fecha_nacimiento)} años
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const fullName = `${paciente.nombre}${paciente.apellido ? ' ' + paciente.apellido : ''}`.trim();
                          navigate(`/${mode}/pacientes/${encodeURIComponent(fullName)}/dashboard`);
                        }}
                        className="flex flex-col items-center gap-1 p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Ver</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(paciente)}
                        className="flex flex-col items-center gap-1 p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(paciente.id)}
                        disabled={deleteMutation.isLoading}
                        className="flex flex-col items-center gap-1 p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PacientesPage;