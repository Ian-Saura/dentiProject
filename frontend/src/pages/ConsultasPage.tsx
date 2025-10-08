import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import AddConsultaModal from '@/components/AddConsultaModal';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, Filter, ChevronDown, Plus, Search, Edit, Trash2, Sparkles } from 'lucide-react';
import { formatDateToDDMMYYYY } from '@/utils/dateFormat';

const ConsultasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<any | null>(null);
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

  const handleEdit = (consulta: any) => {
    setEditingConsulta(consulta);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta prestación?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConsulta(null);
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
                Gestión de Prestaciones
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Administra todas las prestaciones de tu consultorio
              </motion.p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="btn-premium flex items-center space-x-2 text-base"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Prestación</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Instagram-Style Stats */}
      {consultasData?.data && consultasData.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard delay={0.1}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Total Prestaciones</div>
                <div className="text-4xl font-black">{consultasData.total}</div>
              </div>
            </motion.div>
          </AnimatedCard>

          <AnimatedCard delay={0.15}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Ingresos Total</div>
                <div className="text-3xl font-black">
                  ${(consultasData.data.reduce((sum, c) => sum + c.monto_ars, 0) / 1000).toFixed(1)}K
                </div>
              </div>
            </motion.div>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Promedio</div>
                <div className="text-3xl font-black">
                  ${(consultasData.data.reduce((sum, c) => sum + c.monto_ars, 0) / consultasData.data.length / 1000).toFixed(1)}K
                </div>
              </div>
            </motion.div>
          </AnimatedCard>

          <AnimatedCard delay={0.25}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Este Mes</div>
                <div className="text-4xl font-black">
                  {consultasData.data.filter(c => {
                    const date = new Date(c.fecha_consulta);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
            </motion.div>
          </AnimatedCard>
        </div>
      )}

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

      {/* Add Consulta Modal */}
      <AddConsultaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editingConsulta={editingConsulta}
      />

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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                        {formatDateToDDMMYYYY(consulta.fecha_consulta)}
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {consultasData.data.map((consulta) => (
                <motion.div
                  key={consulta.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {consulta.paciente ? 
                          `${consulta.paciente.nombre} ${consulta.paciente.apellido}` : 
                          'N/A'
                        }
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDateToDDMMYYYY(consulta.fecha_consulta)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                      consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {consulta.estado}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tratamiento:</span>
                      <span className="font-medium text-gray-900">
                        {consulta.prestacion_usuario?.nombre_personalizado || 
                         consulta.prestacion_usuario?.prestacion?.nombre || 
                         'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-bold text-primary-600">
                        ${consulta.monto_ars.toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medio de Pago:</span>
                      <span className="capitalize text-gray-900">{consulta.medio_pago}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(consulta)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(consulta.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
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
                onClick={() => setShowModal(true)}
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
