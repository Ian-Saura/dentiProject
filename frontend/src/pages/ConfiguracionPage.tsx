import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { equiposService, gastosService, configService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Wrench, Building2, Sliders, Sparkles, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Equipo {
  id: number;
  nombre_equipo: string;
  monto_compra_usd: number;
  anios_vida_util: number;
  fecha_compra: string;
  observaciones?: string;
  activo: boolean;
}

interface Gasto {
  id: number;
  concepto: string;
  monto_mensual_ars: number;
  observaciones?: string;
  activo: boolean;
}

interface EquipoForm {
  nombre_equipo: string;
  monto_compra_usd: number;
  anios_vida_util: number;
  fecha_compra: string;
  observaciones: string;
}

interface GastoForm {
  concepto: string;
  monto_mensual_ars: number;
  observaciones?: string;
}

const ConfiguracionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equipos' | 'gastos' | 'parametros'>('equipos');
  const [showEquipoForm, setShowEquipoForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  const [equipoForm, setEquipoForm] = useState<EquipoForm>({
    nombre_equipo: '',
    monto_compra_usd: 0,
    anios_vida_util: 5,
    fecha_compra: '',
    observaciones: ''
  });

  const [gastoForm, setGastoForm] = useState<GastoForm>({
    concepto: '',
    monto_mensual_ars: 0
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: equipos, isLoading: loadingEquipos } = useQuery<Equipo[]>('equipos', equiposService.getEquipos);
  const { data: gastos, isLoading: loadingGastos } = useQuery<Gasto[]>('gastos', gastosService.getGastos);
  const { data: config, isLoading: loadingConfig } = useQuery('configuracion', configService.getConfig);

  // Equipment mutations
  const createEquipoMutation = useMutation(equiposService.createEquipo, {
    onSuccess: () => {
      queryClient.invalidateQueries('equipos');
      setShowEquipoForm(false);
      resetEquipoForm();
    }
  });

  const updateEquipoMutation = useMutation(
    ({ id, data }: { id: number; data: EquipoForm }) => equiposService.updateEquipo(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('equipos');
        setEditingEquipo(null);
        setShowEquipoForm(false);
        resetEquipoForm();
      }
    }
  );

  const deleteEquipoMutation = useMutation(equiposService.deleteEquipo, {
    onSuccess: () => queryClient.invalidateQueries('equipos')
  });

  // Expense mutations
  const createGastoMutation = useMutation(gastosService.createGasto, {
    onSuccess: () => {
      queryClient.invalidateQueries('gastos');
      setShowGastoForm(false);
      resetGastoForm();
    }
  });

  const updateGastoMutation = useMutation(
    ({ id, data }: { id: number; data: GastoForm }) => gastosService.updateGasto(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('gastos');
        setEditingGasto(null);
        setShowGastoForm(false);
        resetGastoForm();
      }
    }
  );

  const deleteGastoMutation = useMutation(gastosService.deleteGasto, {
    onSuccess: () => queryClient.invalidateQueries('gastos')
  });

  // Config mutation
  const updateConfigMutation = useMutation(configService.updateConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries('configuracion');
      toast.success('✅ Parámetros actualizados correctamente');
    },
    onError: () => {
      toast.error('❌ Error al actualizar parámetros');
    }
  });

  const resetEquipoForm = () => {
    setEquipoForm({
      nombre_equipo: '',
      monto_compra_usd: 0,
      anios_vida_util: 5,
      fecha_compra: '',
      observaciones: ''
    });
  };

  const resetGastoForm = () => {
    setGastoForm({
      concepto: '',
      monto_mensual_ars: 0
    });
  };

  const handleEquipoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipo) {
      updateEquipoMutation.mutate({ id: editingEquipo.id, data: equipoForm });
    } else {
      createEquipoMutation.mutate(equipoForm);
    }
  };

  const handleGastoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGasto) {
      updateGastoMutation.mutate({ id: editingGasto.id, data: gastoForm });
    } else {
      createGastoMutation.mutate(gastoForm);
    }
  };

  const handleEditEquipo = (equipo: Equipo) => {
    setEditingEquipo(equipo);
    setEquipoForm({
      nombre_equipo: equipo.nombre_equipo,
      monto_compra_usd: equipo.monto_compra_usd,
      anios_vida_util: equipo.anios_vida_util,
      fecha_compra: equipo.fecha_compra || '',
      observaciones: equipo.observaciones || ''
    });
    setShowEquipoForm(true);
  };

  const handleEditGasto = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setGastoForm({
      concepto: gasto.concepto,
      monto_mensual_ars: gasto.monto_mensual_ars
    });
    setShowGastoForm(true);
  };

  const handleDeleteEquipo = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este equipo?')) {
      deleteEquipoMutation.mutate(id);
    }
  };

  const handleDeleteGasto = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      deleteGastoMutation.mutate(id);
    }
  };

  if (loadingEquipos || loadingGastos || loadingConfig) return <LoadingSpinner />;

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
        <div className="relative flex items-center space-x-4">
          <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-black flex items-center gap-2"
            >
              <Sparkles className="h-8 w-8 animate-pulse" />
              Configuración de Costos
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 mt-1 text-lg"
            >
              Gestiona equipos y gastos fijos para el análisis de costos
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <AnimatedCard delay={0.1}>
        <div className="glass rounded-2xl p-2 shadow-soft border border-white/20">
          <nav className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('equipos')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'equipos'
                  ? 'bg-gradient-dental text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wrench className="h-5 w-5" />
              Equipos
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('gastos')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'gastos'
                  ? 'bg-gradient-dental text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-5 w-5" />
              Gastos Fijos
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('parametros')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'parametros'
                  ? 'bg-gradient-dental text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sliders className="h-5 w-5" />
              Parámetros
            </motion.button>
          </nav>
        </div>
      </AnimatedCard>

      {/* Equipment Tab */}
      {activeTab === 'equipos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Wrench className="h-6 w-6 text-dental-500" />
              Equipamiento del Consultorio
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEquipoForm(true)}
              className="btn-premium flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nuevo Equipo
            </motion.button>
          </div>

          {/* Equipment Form Modal */}
          <AnimatePresence>
          {showEquipoForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowEquipoForm(false); setEditingEquipo(null); resetEquipoForm(); }}
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
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
                  <h3 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-dental-500" />
                    {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
                  </h3>
                  <button
                    onClick={() => { setShowEquipoForm(false); setEditingEquipo(null); resetEquipoForm(); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleEquipoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Equipo *
                    </label>
                    <input
                      type="text"
                      value={equipoForm.nombre_equipo}
                      onChange={(e) => setEquipoForm({ ...equipoForm, nombre_equipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Sillón Dental"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio pagado (USD) *
                    </label>
                    <input
                      type="number"
                      value={equipoForm.monto_compra_usd}
                      onChange={(e) => setEquipoForm({ ...equipoForm, monto_compra_usd: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vida Útil (años) *
                    </label>
                    <input
                      type="number"
                      value={equipoForm.anios_vida_util}
                      onChange={(e) => setEquipoForm({ ...equipoForm, anios_vida_util: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="50"
                      step="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Compra
                    </label>
                    <input
                      type="date"
                      value={equipoForm.fecha_compra}
                      onChange={(e) => setEquipoForm({ ...equipoForm, fecha_compra: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={equipoForm.observaciones}
                      onChange={(e) => setEquipoForm({ ...equipoForm, observaciones: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={createEquipoMutation.isLoading || updateEquipoMutation.isLoading}
                      className="flex-1 btn-premium disabled:opacity-50"
                    >
                      {createEquipoMutation.isLoading || updateEquipoMutation.isLoading ? 'Guardando...' : 'Guardar'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowEquipoForm(false);
                        setEditingEquipo(null);
                        resetEquipoForm();
                      }}
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

          {/* Equipment List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Equipos Registrados ({equipos?.length || 0})</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {equipos?.map((equipo) => (
                <div key={equipo.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{equipo.nombre_equipo}</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>💰 ${equipo.monto_compra_usd.toLocaleString('es-AR')} USD</div>
                        <div>⏱️ {equipo.anios_vida_util} años de vida útil</div>
                        <div>📅 Comprado: {equipo.fecha_compra ? new Date(equipo.fecha_compra).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No especificada'}</div>
                        <div className={`font-medium ${equipo.activo ? 'text-green-600' : 'text-red-600'}`}>
                          {equipo.activo ? '✅ Activo' : '❌ Inactivo'}
                        </div>
                      </div>
                      {equipo.observaciones && (
                        <p className="mt-2 text-sm text-gray-500">{equipo.observaciones}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditEquipo(equipo)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEquipo(equipo.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {equipos?.length === 0 && (
              <AnimatedCard delay={0.3}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-16 px-6"
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-dental-400 to-dental-600 rounded-3xl flex items-center justify-center shadow-glow-dental">
                    <Wrench className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text mb-3">No hay equipos registrados</h3>
                  <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                    Agrega equipos de tu consultorio para calcular los costos de amortización y tener un análisis financiero preciso.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEquipoForm(true)}
                    className="btn-premium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Primer Equipo
                  </motion.button>
                </motion.div>
              </AnimatedCard>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'gastos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gastos Fijos Mensuales</h2>
            <button
              onClick={() => setShowGastoForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              ➕ Nuevo Gasto
            </button>
          </div>

          {/* Expense Form Modal */}
          {showGastoForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold mb-4">
                  {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto Fijo'}
                </h3>
                
                <form onSubmit={handleGastoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concepto *
                    </label>
                    <input
                      type="text"
                      value={gastoForm.concepto}
                      onChange={(e) => setGastoForm({ ...gastoForm, concepto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Alquiler"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto mensual (ARS) *
                    </label>
                    <input
                      type="number"
                      value={gastoForm.monto_mensual_ars}
                      onChange={(e) => setGastoForm({ ...gastoForm, monto_mensual_ars: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createGastoMutation.isLoading || updateGastoMutation.isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    >
                      {createGastoMutation.isLoading || updateGastoMutation.isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGastoForm(false);
                        setEditingGasto(null);
                        resetGastoForm();
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Gastos Fijos Registrados ({gastos?.length || 0})</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {gastos?.map((gasto) => (
                <div key={gasto.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{gasto.concepto}</h4>
                      <div className="mt-1 text-2xl font-bold text-blue-600">
                        ${gasto.monto_mensual_ars.toLocaleString('es-AR')} ARS/mes
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Anual: ${(gasto.monto_mensual_ars * 12).toLocaleString('es-AR')} ARS
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditGasto(gasto)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteGasto(gasto.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {gastos && gastos.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Gastos Fijos:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${gastos.reduce((sum, gasto) => sum + gasto.monto_mensual_ars, 0).toLocaleString('es-AR')} ARS/mes
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(gastos.reduce((sum, gasto) => sum + gasto.monto_mensual_ars, 0) * 12).toLocaleString('es-AR')} ARS/año
                    </div>
                  </div>
                </div>
              </div>
            )}

            {gastos?.length === 0 && (
              <AnimatedCard delay={0.3}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-16 px-6"
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text mb-3">No hay gastos fijos registrados</h3>
                  <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                    Registra tus gastos fijos mensuales (alquiler, servicios, etc.) para calcular los costos operativos reales de tu consultorio.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGastoForm(true)}
                    className="btn-premium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Primer Gasto
                  </motion.button>
                </motion.div>
              </AnimatedCard>
            )}
          </div>
        </div>
      )}

      {/* Parameters Tab */}
      {activeTab === 'parametros' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Parámetros de Cálculo</h2>
            <p className="text-gray-600 mt-1">Configura los parámetros para el cálculo automático del costo por hora</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateConfigMutation.mutate({
                horas_anuales_trabajadas: Number(formData.get('horas_anuales')),
                tipo_cambio_usd_ars: Number(formData.get('tipo_cambio')),
                margen_ganancia_porcentaje: Number(formData.get('margen_ganancia')),
                costo_hora_manual_ars: Number(formData.get('costo_hora_manual')),
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas anuales trabajadas
                  </label>
                  <input
                    type="number"
                    name="horas_anuales"
                    defaultValue={config?.horas_anuales_trabajadas || 1100}
                    min={500}
                    max={3000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Horas productivas anuales (descontando vacaciones, días no trabajados, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de cambio USD/ARS
                  </label>
                  <input
                    type="number"
                    name="tipo_cambio"
                    defaultValue={config?.tipo_cambio_usd_ars || 1335}
                    min={100}
                    max={10000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Para convertir equipos en USD a ARS
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margen de ganancia objetivo (%)
                  </label>
                  <input
                    type="range"
                    name="margen_ganancia"
                    defaultValue={config?.margen_ganancia_porcentaje || 40}
                    min={10}
                    max={200}
                    step={5}
                    className="w-full"
                    id="margen-range"
                    onChange={(e) => {
                      const display = document.getElementById('margen-display');
                      if (display) display.textContent = e.target.value + '%';
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10%</span>
                    <span id="margen-display" className="font-bold text-dental-600 text-lg">{config?.margen_ganancia_porcentaje || 40}% (actual)</span>
                    <span>200%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Margen de ganancia deseado sobre los costos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo por hora manual (ARS)
                  </label>
                  <input
                    type="number"
                    name="costo_hora_manual"
                    defaultValue={config?.costo_hora_manual_ars || 29000}
                    min={5000}
                    max={500000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Usado cuando no se calcula automáticamente desde equipos y gastos
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updateConfigMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateConfigMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      💾 Actualizar Parámetros
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Cost Calculation Summary */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Cálculo Actual del Costo por Hora</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$28,500</div>
                <div className="text-sm text-blue-700">Costo/Hora Real</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-blue-700">Equipos Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">4</div>
                <div className="text-sm text-blue-700">Gastos Fijos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1,100</div>
                <div className="text-sm text-blue-700">Horas Anuales</div>
              </div>
            </div>

            <div className="text-sm text-blue-700">
              <p><strong>Fórmula:</strong> (Costo Anual Equipos + Gastos Fijos Anuales) ÷ Horas Anuales</p>
              <p className="mt-2">
                <strong>Cálculo:</strong> Los equipos se amortizan con inflación del 4% anual. 
                Los gastos fijos se multiplican por 12 meses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionPage;