import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Search, Filter, Sparkles, Edit, Trash2, X } from 'lucide-react';

interface ConsultaForm {
  paciente_nombre: string;
  paciente_apellido: string;
  tratamiento: string;
  monto_ars: number;
  medio_pago: string;
  fecha_consulta: string;
}

const ConsultasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [formData, setFormData] = useState<ConsultaForm>({
    paciente_nombre: '',
    paciente_apellido: '',
    tratamiento: 'Consulta',
    monto_ars: 30000,
    medio_pago: 'Efectivo',
    fecha_consulta: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    mostrar_desde: 'Más recientes',
    cantidad: '25',
    ordenar_por: 'Fecha (desc)',
  });

  const queryClient = useQueryClient();

  const { data: consultasData, isLoading } = useQuery(
    ['consultas', filters],
    () => consultasService.getConsultas({
      limit: filters.cantidad === 'Todas' ? 100 : parseInt(filters.cantidad),
      order_by: filters.ordenar_por,
    }),
    { keepPreviousData: true }
  );

  // Create consultation mutation
  const createMutation = useMutation(consultasService.createConsulta, {
    onSuccess: () => {
      queryClient.invalidateQueries('consultas');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
      queryClient.invalidateQueries('costos-analisis');
      queryClient.invalidateQueries('punto-equilibrio');
      setShowForm(false);
      resetForm();
    }
  });

  // Update consultation mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: ConsultaForm }) => 
      consultasService.updateConsulta(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('consultas');
        queryClient.invalidateQueries('analytics-resumen');
        queryClient.invalidateQueries('analytics-kpis');
        queryClient.invalidateQueries('costos-analisis');
        queryClient.invalidateQueries('punto-equilibrio');
        setEditingConsulta(null);
        setShowForm(false);
        resetForm();
      }
    }
  );

  // Delete consultation mutation
  const deleteMutation = useMutation(consultasService.deleteConsulta, {
    onSuccess: () => {
      queryClient.invalidateQueries('consultas');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
      queryClient.invalidateQueries('costos-analisis');
      queryClient.invalidateQueries('punto-equilibrio');
    }
  });

  const resetForm = () => {
    setFormData({
      paciente_nombre: '',
      paciente_apellido: '',
      tratamiento: 'Consulta',
      monto_ars: 30000,
      medio_pago: 'Efectivo',
      fecha_consulta: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingConsulta) {
      updateMutation.mutate({ id: editingConsulta.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConsulta(null);
    resetForm();
  };

  const handleEdit = (consulta: Consulta) => {
    setEditingConsulta(consulta);
    setFormData({
      paciente_nombre: consulta.paciente.nombre,
      paciente_apellido: consulta.paciente.apellido,
      tratamiento: consulta.prestacion_usuario.nombre_personalizado,
      monto_ars: consulta.monto_ars,
      medio_pago: consulta.medio_pago,
      fecha_consulta: consulta.fecha_consulta.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta consulta?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <Sparkles className="h-8 w-8 animate-pulse" />
                Gestión de Consultas
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Administra todas las consultas de tu consultorio
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
            <span>Nueva Consulta</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Filters */}
      <AnimatedCard delay={0.1}>
        <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="🔍 Buscar por paciente..."
                  className="form-input pl-10 bg-white/50 backdrop-blur-sm border-primary-200 focus:border-primary-500 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="form-input bg-white/50 backdrop-blur-sm border-primary-200"
                value={filters.mostrar_desde}
                onChange={(e) => setFilters({ ...filters, mostrar_desde: e.target.value })}
              >
                <option>Más recientes</option>
                <option>Este mes</option>
                <option>Último mes</option>
                <option>Este año</option>
              </select>
              <select
                className="form-input bg-white/50 backdrop-blur-sm border-primary-200"
                value={filters.cantidad}
                onChange={(e) => setFilters({ ...filters, cantidad: e.target.value })}
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>Todas</option>
              </select>
            </div>
          </div>
        </div>
      </AnimatedCard>

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
                    {editingConsulta ? 'Editar Consulta' : 'Nueva Consulta'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    value={formData.paciente_nombre}
                    onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.paciente_apellido}
                    onChange={(e) => setFormData({ ...formData, paciente_apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratamiento *
                </label>
                <select
                  value={formData.tratamiento}
                  onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Consulta">Consulta</option>
                  <option value="Consulta de Urgencia">Consulta de Urgencia</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Operatoria Simple">Operatoria Simple</option>
                  <option value="Operatoria Compleja">Operatoria Compleja</option>
                  <option value="Endodoncia">Endodoncia</option>
                  <option value="Corona">Corona</option>
                  <option value="Extracción Simple">Extracción Simple</option>
                  <option value="Extracción Compleja">Extracción Compleja</option>
                  <option value="Blanqueamiento">Blanqueamiento</option>
                  <option value="Implante">Implante</option>
                  <option value="Placa estabilizadora oclusal">Placa estabilizadora oclusal</option>
                  <option value="Obra social">Obra social</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (ARS) *
                </label>
                <input
                  type="number"
                  value={formData.monto_ars}
                  onChange={(e) => setFormData({ ...formData, monto_ars: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medio de Pago *
                </label>
                <select
                  value={formData.medio_pago}
                  onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de la Consulta *
                </label>
                <input
                  type="date"
                  value={formData.fecha_consulta}
                  onChange={(e) => setFormData({ ...formData, fecha_consulta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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

      {/* Premium Results */}
      <AnimatedCard delay={0.2}>
        <div className="glass rounded-2xl shadow-soft border border-white/20">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <h3 className="text-xl font-bold gradient-text flex items-center gap-2">
              <Calendar className="h-6 w-6 text-dental-500" />
              Consultas ({consultasData?.total || 0})
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-5 w-5 text-primary-500" />
              <span className="font-medium">Filtrado activo</span>
            </div>
          </div>

          {consultasData?.data && consultasData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Tratamiento</th>
                  <th>Monto</th>
                  <th>Medio de Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultasData.data.map((consulta) => (
                  <tr key={consulta.id}>
                    <td>
                      {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td>
                      {consulta.paciente ? 
                        `${consulta.paciente.nombre} ${consulta.paciente.apellido}` : 
                        'N/A'
                      }
                    </td>
                    <td>
                      {consulta.prestacion_usuario?.nombre_personalizado || 
                       consulta.prestacion_usuario?.prestacion?.nombre || 
                       'N/A'}
                    </td>
                    <td className="font-medium">
                      ${consulta.monto_ars.toLocaleString('es-AR')} ARS
                    </td>
                    <td>
                      <span className="capitalize">{consulta.medio_pago}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                        consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {consulta.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(consulta)}
                          className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(consulta.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
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
        ) : (
          <div className="text-center py-12 px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-dental rounded-full flex items-center justify-center shadow-glow-dental">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay consultas</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {searchTerm ? 'No se encontraron consultas con ese criterio' : 'Aún no hay consultas registradas'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="btn-premium inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Registrar Primera Consulta
              </motion.button>
            </motion.div>
          </div>
        )}
        </div>
      </AnimatedCard>
    </div>
  );
};

export default ConsultasPage;
