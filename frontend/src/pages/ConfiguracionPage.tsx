import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { equiposService, gastosService, configService, analyticsService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import ParametrosTab from '../components/ParametrosTab';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Wrench, Building2, Sliders, Sparkles, Plus, X, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDateToDDMMYYYY } from '../utils/dateFormat';
import { dateInputToISO, isoToDateInput } from '../utils/dateUtils';
import type { GastoFijo } from '@/types';

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
  monto_mensual: number;
  moneda: 'ARS' | 'USD';
  observaciones?: string;
}

const ConfiguracionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equipos' | 'gastos' | 'parametros'>('equipos');
  const [showEquipoForm, setShowEquipoForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
  const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null);
  
  // Estados para parámetros
  const [dolarBlue, setDolarBlue] = useState<number | null>(null);
  const [dolarOficialVenta, setDolarOficialVenta] = useState<number | null>(null);
  const [usarCostoManual, setUsarCostoManual] = useState(false);
  const [verEnMoneda, setVerEnMoneda] = useState<'ARS' | 'USD'>('ARS'); // Toggle para visualización

  const [equipoForm, setEquipoForm] = useState<EquipoForm>({
    nombre_equipo: '',
    monto_compra_usd: 0,
    anios_vida_util: 5,
    fecha_compra: '',
    observaciones: ''
  });

  const [gastoForm, setGastoForm] = useState<GastoForm>({
    concepto: '',
    monto_mensual: 0,
    moneda: 'ARS'
  });

  const queryClient = useQueryClient();

  // Fetch data (interceptor handles error toasts automatically)
  const { data: equipos, isLoading: loadingEquipos } = useQuery<Equipo[]>(
    'equipos', 
    equiposService.getEquipos,
    {
      onError: (error: any) => {
        console.error('Error loading equipos:', error);
      }
    }
  );
  
  const { data: gastos, isLoading: loadingGastos } = useQuery<GastoFijo[]>(
    'gastos', 
    gastosService.getGastos,
    {
      onError: (error: any) => {
        console.error('Error loading gastos:', error);
      }
    }
  );
  
  const { data: config, isLoading: loadingConfig } = useQuery(
    'configuracion', 
    configService.getConfig,
    {
      retry: 1,
      onError: (error: any) => {
        console.error('Error loading config:', error);
        // Config errors are not critical - we have fallback values
      }
    }
  );

  const { data: costosAnalisis } = useQuery(
    'costos-analisis',
    analyticsService.getCostosAnalisis
  );

  // Fetch dólar oficial venta from API (for conversions)
  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const [oficialRes, blueRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://dolarapi.com/v1/dolares/blue')
        ]);
        const oficialData = await oficialRes.json();
        const blueData = await blueRes.json();
        setDolarOficialVenta(oficialData.venta);
        setDolarBlue(blueData.venta);
      } catch (error) {
        console.error('Error fetching dolar:', error);
      }
    };
    fetchDolar();
  }, []);

  // Initialize usarCostoManual from config
  useEffect(() => {
    if (config) {
      setUsarCostoManual(config.usar_costo_manual || false);
    }
  }, [config]);

  // Equipment mutations
  const createEquipoMutation = useMutation(equiposService.createEquipo, {
    onSuccess: () => {
      queryClient.invalidateQueries('equipos');
      setShowEquipoForm(false);
      resetEquipoForm();
      toast.success('Equipo creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear equipo');
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
        toast.success('✅ Equipo actualizado correctamente');
      },
      onError: (error: any) => {
        console.error('Error updating equipo:', error);
        toast.error(`❌ Error: ${error?.response?.data?.detail || error?.message || 'Error al actualizar equipo'}`);
      }
    }
  );

  const deleteEquipoMutation = useMutation(equiposService.deleteEquipo, {
    onSuccess: () => {
      queryClient.invalidateQueries('equipos');
      toast.success('Equipo eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar equipo');
    }
  });

  // Expense mutations
  const createGastoMutation = useMutation(gastosService.createGasto, {
    onSuccess: () => {
      queryClient.invalidateQueries('gastos');
      setShowGastoForm(false);
      resetGastoForm();
      toast.success('Gasto creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear gasto');
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
        toast.success('Gasto actualizado correctamente');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Error al actualizar gasto');
      }
    }
  );

  const deleteGastoMutation = useMutation(gastosService.deleteGasto, {
    onSuccess: () => {
      queryClient.invalidateQueries('gastos');
      toast.success('Gasto eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar gasto');
    }
  });

  // Config mutation
  const updateConfigMutation = useMutation(configService.updateConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries('configuracion');
      queryClient.invalidateQueries('costos-analisis');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
      queryClient.invalidateQueries('punto-equilibrio');
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
      monto_mensual: 0,
      moneda: 'ARS'
    });
  };

  const handleEquipoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fix date timezone issue
    const dataToSubmit = {
      ...equipoForm,
      fecha_compra: dateInputToISO(equipoForm.fecha_compra) || equipoForm.fecha_compra
    };
    
    if (editingEquipo) {
      updateEquipoMutation.mutate({ id: editingEquipo.id, data: dataToSubmit });
    } else {
      createEquipoMutation.mutate(dataToSubmit);
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
      fecha_compra: isoToDateInput(equipo.fecha_compra),
      observaciones: equipo.observaciones || ''
    });
    setShowEquipoForm(true);
  };

  const handleEditGasto = (gasto: GastoFijo) => {
    setEditingGasto(gasto);
    setGastoForm({
      concepto: gasto.concepto,
      monto_mensual: gasto.monto_mensual,
      moneda: gasto.moneda
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

  // Show loading only if all are loading for the first time
  if (loadingEquipos && loadingGastos && loadingConfig) return <LoadingSpinner />;

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

      {/* Currency Toggle - Only show on equipos and gastos tabs */}
      {(activeTab === 'equipos' || activeTab === 'gastos') && (
        <AnimatedCard delay={0.05}>
          <div className="glass rounded-2xl p-4 shadow-soft border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Visualización de Montos</h3>
                <p className="text-sm text-gray-600">Los cálculos siempre se realizan en pesos (usando dólar oficial venta)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${verEnMoneda === 'ARS' ? 'text-dental-600' : 'text-gray-500'}`}>
                  🇦🇷 ARS
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setVerEnMoneda(verEnMoneda === 'ARS' ? 'USD' : 'ARS')}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    verEnMoneda === 'USD' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                    style={{
                      x: verEnMoneda === 'USD' ? 28 : 0
                    }}
                  />
                </motion.button>
                <span className={`text-sm font-medium ${verEnMoneda === 'USD' ? 'text-green-600' : 'text-gray-500'}`}>
                  💵 USD
                </span>
              </div>
            </div>
            {dolarOficialVenta && (
              <div className="mt-2 text-xs text-gray-500">
                Tipo de cambio: 1 USD = ${dolarOficialVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS (Oficial Venta)
              </div>
            )}
          </div>
        </AnimatedCard>
      )}

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold gradient-text flex items-center gap-2">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-dental-500" />
              Equipamiento del Consultorio
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEquipoForm(true)}
              className="btn-premium flex items-center gap-2 w-full sm:w-auto justify-center"
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
                      step="0.01"
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
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      lang="es-AR"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Formato: dd/mm/aaaa</p>
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
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold gradient-text mb-2">Equipos Registrados</h3>
              <p className="text-gray-600">Gestiona el equipamiento de tu consultorio ({equipos?.length || 0} equipos)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipos?.map((equipo, index) => (
                <AnimatedCard key={equipo.id} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-dental-400 transition-all duration-300"
                  >
                    {/* Header con gradiente */}
                    <div className="bg-gradient-dental p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <Wrench className="h-6 w-6 text-white" />
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            equipo.activo 
                              ? 'bg-green-400 text-green-900' 
                              : 'bg-gray-400 text-gray-900'
                          }`}>
                            {equipo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-white truncate">{equipo.nombre_equipo}</h4>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-5">
                      {/* Monto destacado */}
                      <div className="mb-4 text-center py-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        {verEnMoneda === 'USD' ? (
                          <>
                            <div className="text-3xl font-black text-green-600">
                              ${equipo.monto_compra_usd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-green-700 font-medium uppercase tracking-wide">💵 USD</div>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl font-black text-green-600">
                              ${(equipo.monto_compra_usd * (dolarOficialVenta || 1335)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-green-700 font-medium uppercase tracking-wide">🇦🇷 ARS</div>
                          </>
                        )}
                      </div>

                      {/* Información */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-dental-500" />
                          <span className="font-medium">{equipo.anios_vida_util} años</span>
                          <span className="text-gray-400">de vida útil</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Settings className="h-4 w-4 text-dental-500" />
                          <span>{formatDateToDDMMYYYY(equipo.fecha_compra)}</span>
                        </div>
                      </div>

                      {equipo.observaciones && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 line-clamp-2">{equipo.observaciones}</p>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditEquipo(equipo)}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          ✏️ Editar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteEquipo(equipo.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedCard>
              ))}
            </div>

            {/* Total de Equipos */}
            {equipos && equipos.length > 0 && (() => {
              // Calculate total by summing each equipment in the display currency
              const totalEnMoneda = equipos.reduce((sum, equipo) => {
                const montoEnMonedaSeleccionada = verEnMoneda === 'USD' 
                  ? equipo.monto_compra_usd 
                  : equipo.monto_compra_usd * (dolarOficialVenta || 1335);
                return sum + montoEnMonedaSeleccionada;
              }, 0);
              const monedaSimbolo = verEnMoneda === 'USD' ? '💵 USD' : '🇦🇷 ARS';
              
              return (
                <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-dental-400">
                  <div className="px-6 py-5 bg-gradient-dental">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-white flex items-center gap-2">
                        <Wrench className="h-6 w-6" />
                        Inversión Total en Equipamiento
                      </span>
                      <div className="text-right">
                        <div className="text-3xl font-black text-white">
                          ${totalEnMoneda.toLocaleString('es-AR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {monedaSimbolo}
                        </div>
                        <div className="text-sm text-white/80 mt-1">
                          {equipos.length} equipo{equipos.length !== 1 ? 's' : ''} registrado{equipos.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Gastos Fijos Mensuales</h2>
            <button
              onClick={() => setShowGastoForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center"
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
                      Moneda *
                    </label>
                    <select
                      value={gastoForm.moneda}
                      onChange={(e) => setGastoForm({ ...gastoForm, moneda: e.target.value as 'ARS' | 'USD' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="ARS">🇦🇷 Pesos Argentinos (ARS)</option>
                      <option value="USD">💵 Dólares (USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto mensual ({gastoForm.moneda}) *
                    </label>
                    <input
                      type="number"
                      value={gastoForm.monto_mensual}
                      onChange={(e) => setGastoForm({ ...gastoForm, monto_mensual: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
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
              {gastos?.map((gasto) => {
                // Calculate amount in desired display currency
                let montoEnMonedaSeleccionada: number;
                if (verEnMoneda === gasto.moneda) {
                  // Already in the desired currency
                  montoEnMonedaSeleccionada = gasto.monto_mensual;
                } else if (verEnMoneda === 'USD' && gasto.moneda === 'ARS') {
                  // Convert ARS to USD
                  montoEnMonedaSeleccionada = gasto.monto_mensual / (dolarOficialVenta || 1335);
                } else {
                  // Convert USD to ARS
                  montoEnMonedaSeleccionada = gasto.monto_mensual * (dolarOficialVenta || 1335);
                }
                const monedaSimbolo = verEnMoneda === 'USD' ? '💵 USD' : '🇦🇷 ARS';
                const monedaOriginal = gasto.moneda === 'USD' ? '💵' : '🇦🇷';
                
                return (
                  <div key={gasto.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {gasto.concepto} {monedaOriginal}
                        </h4>
                        <div className="mt-1 text-2xl font-bold text-blue-600">
                          ${montoEnMonedaSeleccionada.toLocaleString('es-AR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {monedaSimbolo}/mes
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Anual: ${(montoEnMonedaSeleccionada * 12).toLocaleString('es-AR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {monedaSimbolo}
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
                );
              })}
            </div>

            {gastos && gastos.length > 0 && (() => {
              // Calculate total by summing each expense in the display currency
              const totalEnMoneda = gastos.reduce((sum, gasto) => {
                let montoEnMonedaSeleccionada: number;
                if (verEnMoneda === gasto.moneda) {
                  // Already in the desired currency
                  montoEnMonedaSeleccionada = gasto.monto_mensual;
                } else if (verEnMoneda === 'USD' && gasto.moneda === 'ARS') {
                  // Convert ARS to USD
                  montoEnMonedaSeleccionada = gasto.monto_mensual / (dolarOficialVenta || 1335);
                } else {
                  // Convert USD to ARS
                  montoEnMonedaSeleccionada = gasto.monto_mensual * (dolarOficialVenta || 1335);
                }
                return sum + montoEnMonedaSeleccionada;
              }, 0);
              const monedaSimbolo = verEnMoneda === 'USD' ? '💵 USD' : '🇦🇷 ARS';
              
              return (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Gastos Fijos:</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ${totalEnMoneda.toLocaleString('es-AR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {monedaSimbolo}/mes
                      </div>
                      <div className="text-sm text-gray-500">
                        ${(totalEnMoneda * 12).toLocaleString('es-AR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {monedaSimbolo}/año
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

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
        <ParametrosTab
          config={config}
          costosAnalisis={costosAnalisis}
          dolarBlue={dolarBlue}
          usarCostoManual={usarCostoManual}
          setUsarCostoManual={setUsarCostoManual}
          updateConfigMutation={updateConfigMutation}
        />
      )}
    </div>
  );
};

export default ConfiguracionPage;