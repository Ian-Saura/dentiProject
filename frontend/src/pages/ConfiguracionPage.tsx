import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { equiposService, gastosService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

interface Equipo {
  id: number;
  nombre: string;
  monto_compra_usd: number;
  anios_vida_util: number;
  fecha_compra: string;
  observaciones: string;
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
      nombre_equipo: equipo.nombre,
      monto_compra_usd: equipo.monto_compra_usd,
      anios_vida_util: equipo.anios_vida_util,
      fecha_compra: equipo.fecha_compra,
      observaciones: equipo.observaciones
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

  if (loadingEquipos || loadingGastos) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración de Costos</h1>
        <p className="text-gray-600 mt-2">Gestiona equipos y gastos fijos para el análisis de costos</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('equipos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'equipos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔧 Equipos
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gastos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Gastos Fijos
          </button>
          <button
            onClick={() => setActiveTab('parametros')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'parametros'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚙️ Parámetros
          </button>
        </nav>
      </div>

      {/* Equipment Tab */}
      {activeTab === 'equipos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Equipamiento del Consultorio</h2>
            <button
              onClick={() => setShowEquipoForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              ➕ Nuevo Equipo
            </button>
          </div>

          {/* Equipment Form Modal */}
          {showEquipoForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold mb-4">
                  {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
                </h3>
                
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
                      step="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vida Útil (años) *
                    </label>
                    <select
                      value={equipoForm.anios_vida_util}
                      onChange={(e) => setEquipoForm({ ...equipoForm, anios_vida_util: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={3}>3 años</option>
                      <option value={5}>5 años</option>
                      <option value={7}>7 años</option>
                      <option value={8}>8 años</option>
                      <option value={10}>10 años</option>
                    </select>
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
                    <button
                      type="submit"
                      disabled={createEquipoMutation.isLoading || updateEquipoMutation.isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    >
                      {createEquipoMutation.isLoading || updateEquipoMutation.isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEquipoForm(false);
                        setEditingEquipo(null);
                        resetEquipoForm();
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
                      <h4 className="text-lg font-medium text-gray-900">{equipo.nombre}</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>💰 ${equipo.monto_compra_usd.toLocaleString()} USD</div>
                        <div>⏱️ {equipo.anios_vida_util} años de vida útil</div>
                        <div>📅 Comprado: {equipo.fecha_compra}</div>
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
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">🔧</div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay equipos registrados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Agrega equipos para calcular los costos de amortización.
                </p>
              </div>
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
                      step="1000"
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
                        ${gasto.monto_mensual_ars.toLocaleString()} ARS/mes
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Anual: ${(gasto.monto_mensual_ars * 12).toLocaleString()} ARS
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
                      ${gastos.reduce((sum, gasto) => sum + gasto.monto_mensual_ars, 0).toLocaleString()} ARS/mes
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(gastos.reduce((sum, gasto) => sum + gasto.monto_mensual_ars, 0) * 12).toLocaleString()} ARS/año
                    </div>
                  </div>
                </div>
              </div>
            )}

            {gastos?.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">🏢</div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos fijos registrados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Agrega gastos fijos para calcular los costos operativos.
                </p>
              </div>
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
              // TODO: Implement parameter update
              alert('Funcionalidad de actualización de parámetros próximamente');
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas anuales trabajadas
                  </label>
                  <input
                    type="number"
                    defaultValue={1100}
                    min={500}
                    max={2000}
                    step={50}
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
                    defaultValue={1335}
                    min={100}
                    max={5000}
                    step={10}
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
                    defaultValue={40}
                    min={10}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10%</span>
                    <span>40% (actual)</span>
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
                    defaultValue={29000}
                    min={5000}
                    max={100000}
                    step={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Usado cuando no se calcula automáticamente desde equipos y gastos
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  💾 Actualizar Parámetros
                </button>
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