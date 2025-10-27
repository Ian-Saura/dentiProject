import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Clock, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ParametrosTabProps {
  config: any;
  costosAnalisis: any;
  dolarBlue: number | null;
  usarCostoManual: boolean;
  setUsarCostoManual: (value: boolean) => void;
  updateConfigMutation: any;
}

const ParametrosTab: React.FC<ParametrosTabProps> = ({
  config,
  costosAnalisis,
  dolarBlue,
  usarCostoManual,
  setUsarCostoManual,
  updateConfigMutation
}) => {
  const [diasTrabajo, setDiasTrabajo] = useState(220);
  const [horasPorDia, setHorasPorDia] = useState(5);
  const horasCalculadas = diasTrabajo * horasPorDia;
  
  // Estado para el dólar oficial venta (único tipo usado)
  const [dolarOficialVenta, setDolarOficialVenta] = useState<number | null>(null);
  const [loadingDolar, setLoadingDolar] = useState(true);
  const [verCostoEnDolares, setVerCostoEnDolares] = useState(false);

  const safeConfig = config || {
    horas_anuales_trabajadas: 1100,
    tipo_cambio_usd_ars: 1335,
    margen_ganancia_porcentaje: 40,
    costo_hora_manual_ars: 29000,
    usar_costo_manual: false
  };

  // Load saved work hours when config is available
  useEffect(() => {
    if (config?.horas_anuales_trabajadas) {
      // Reverse calculate days and hours from saved annual hours
      // Default to 5 hours per day, calculate days
      const savedHoras = config.horas_anuales_trabajadas;
      const calculatedDays = Math.round(savedHoras / 5);
      setDiasTrabajo(calculatedDays);
      setHorasPorDia(5);
    }
  }, [config]);

  // Fetch dólar oficial venta from API
  useEffect(() => {
    const fetchDolarOficial = async () => {
      setLoadingDolar(true);
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        setDolarOficialVenta(data.venta);
      } catch (error) {
        console.error('Error fetching dólar oficial:', error);
      } finally {
        setLoadingDolar(false);
      }
    };
    fetchDolarOficial();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateConfigMutation.mutate({
      horas_anuales_trabajadas: Number(formData.get('horas_anuales')) || horasCalculadas,
      tipo_cambio_usd_ars: dolarOficialVenta || Number(formData.get('tipo_cambio')) || 1335,
      margen_ganancia_porcentaje: Number(formData.get('margen_ganancia')) || 40,
      costo_hora_manual_ars: Number(formData.get('costo_hora_manual')) || 29000,
      usar_costo_manual: usarCostoManual,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Parámetros del Negocio
        </h2>
        <p className="text-dental-gray mt-1">
          Configura los parámetros clave para tus análisis financieros
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Horas de Trabajo */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-dental-600" />
              Horas de Trabajo Anuales
          </h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Trabajo (año)
              </label>
              <input
                type="number"
                value={diasTrabajo}
                onChange={(e) => setDiasTrabajo(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dental-600 focus:border-transparent"
                  min={100}
                  max={365}
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas por Día
              </label>
              <input
                type="number"
                value={horasPorDia}
                onChange={(e) => setHorasPorDia(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dental-600 focus:border-transparent"
                min={1}
                  max={24}
                step={0.5}
              />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-dental-50 to-dental-100 rounded-xl border-2 border-dental-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-dental-800">Total Horas Anuales:</span>
                <span className="text-2xl font-bold text-dental-600">{horasCalculadas.toLocaleString('es-AR')}h</span>
            </div>
          </div>

            <input
              type="hidden"
              name="horas_anuales"
              value={horasCalculadas}
            />
          </div>
        </div>

        {/* Tipo de Cambio - Hidden (fetched automatically) */}
              <input
                type="hidden"
                name="tipo_cambio"
          value={dolarOficialVenta || safeConfig.tipo_cambio_usd_ars}
        />

        {/* Margen de Ganancia */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <h3 className="text-lg font-bold mb-4">
            Margen de Ganancia Objetivo
          </h3>
          
          <div>
            <input
              type="range"
              name="margen_ganancia"
              defaultValue={safeConfig.margen_ganancia_porcentaje}
              min={10}
              max={200}
              step={5}
              className="w-full h-3 bg-gradient-to-r from-yellow-200 via-green-200 to-blue-200 rounded-lg appearance-none cursor-pointer"
              id="margen-range"
              onChange={(e) => {
                const display = document.getElementById('margen-display');
                if (display) display.textContent = e.target.value + '%';
              }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>10% (Supervivencia)</span>
              <span id="margen-display" className="font-bold text-dental-600 text-2xl">
                {safeConfig.margen_ganancia_porcentaje}%
              </span>
              <span>200% (Crecimiento Agresivo)</span>
            </div>
          </div>
        </div>

        {/* Costo Hora Manual */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <h3 className="text-lg font-bold mb-4">
            <Sparkles className="inline h-5 w-5 mr-2 text-dental-600" />
            Costo por Hora Manual
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={usarCostoManual}
                onChange={(e) => setUsarCostoManual(e.target.checked)}
                className="w-5 h-5 text-dental-600 rounded focus:ring-dental-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Usar costo manual en lugar del calculado
              </label>
            </div>

            {usarCostoManual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo Manual (ARS/hora)
                </label>
                <input
                  type="number"
                  name="costo_hora_manual"
                  defaultValue={safeConfig.costo_hora_manual_ars}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dental-600 focus:border-transparent"
                  min={1000}
                  step={100}
                />
              </div>
            )}

            {costosAnalisis && (
              <div className="mt-4 space-y-3">
                {/* Currency Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${!verCostoEnDolares ? 'text-dental-600' : 'text-gray-500'}`}>
                      🇦🇷 ARS
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setVerCostoEnDolares(!verCostoEnDolares)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        verCostoEnDolares ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                        style={{
                          x: verCostoEnDolares ? 28 : 0
                        }}
                      />
                    </motion.button>
                    <span className={`text-sm font-medium ${verCostoEnDolares ? 'text-green-600' : 'text-gray-500'}`}>
                      💵 USD
                    </span>
                  </div>
                  {dolarOficialVenta && verCostoEnDolares && (
                    <div className="text-xs text-gray-500">
                      1 USD = ${dolarOficialVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* Cost Display */}
                <div className="p-4 bg-gradient-to-r from-dental-50 to-dental-100 rounded-xl border-2 border-dental-200">
                  <div className="text-sm font-medium text-dental-800 mb-2">
                    Costo Calculado Automáticamente:
                  </div>
                  <div className="text-2xl font-bold text-dental-600">
                    {verCostoEnDolares ? (
                      <>
                        ${((costosAnalisis.costo_hora_ars || 0) / (dolarOficialVenta || 1335)).toLocaleString('es-AR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} USD
                      </>
                    ) : (
                      <>
                        ${costosAnalisis.costo_hora_ars?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || 'N/A'} ARS
                      </>
                    )}
                  </div>
                  {verCostoEnDolares && (
                    <div className="text-xs text-gray-500 mt-1">
                      ≈ ${costosAnalisis.costo_hora_ars?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || 'N/A'} ARS
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={updateConfigMutation.isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-gradient-to-r from-dental-600 to-dental-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateConfigMutation.isLoading ? 'Guardando...' : 'Guardar Parámetros'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ParametrosTab;

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción 1: Cálculo Automático */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setUsarCostoManual(false)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                !usarCostoManual
                  ? 'border-dental-500 bg-dental-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-dental-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={!usarCostoManual}
                  onChange={() => setUsarCostoManual(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-dental-500" />
                    Cálculo Automático
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Calcula el costo basándose en tus equipos y gastos fijos registrados
                  </p>
                  {costosAnalisis && (
                    <div className="bg-white rounded-lg p-3 border border-dental-200">
                      <div className="text-2xl font-bold text-dental-600">
                        ${costosAnalisis.costo_hora_ars?.toLocaleString('es-AR')} ARS/h
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Basado en {costosAnalisis.cantidad_equipos} equipos y {costosAnalisis.cantidad_gastos} gastos
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-dental-600 font-medium">
                    ✅ Recomendado - Se actualiza automáticamente
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Opción 2: Costo Manual */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setUsarCostoManual(true)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                usarCostoManual
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={usarCostoManual}
                  onChange={() => setUsarCostoManual(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    Costo Manual
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Define manualmente tu costo por hora
                  </p>
                  <div>
                    <input
                      type="number"
                      name="costo_hora_manual"
                      defaultValue={safeConfig.costo_hora_manual_ars}
                      min={5000}
                      max={500000}
                      step={1000}
                      disabled={!usarCostoManual}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        usarCostoManual
                          ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500/20'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    💡 Útil si tienes un costo estimado propio
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Calculadora de Horas Anuales */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Calculadora de Horas Anuales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de trabajo al año
              </label>
              <input
                type="number"
                value={diasTrabajo}
                onChange={(e) => setDiasTrabajo(Number(e.target.value))}
                min={150}
                max={300}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ej: 365 días - 104 fines de semana - 20 vacaciones - 21 feriados = 220 días
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas por día
              </label>
              <input
                type="number"
                value={horasPorDia}
                onChange={(e) => setHorasPorDia(Number(e.target.value))}
                min={1}
                max={12}
                step={0.5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Horas productivas por día de trabajo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Horas Anuales
              </label>
              <div className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">
                  {horasCalculadas}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {diasTrabajo} días × {horasPorDia} horas
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="hidden"
              name="horas_anuales"
              value={horasCalculadas}
            />
            <p className="text-sm text-blue-600 font-medium">
              💡 Este valor se usará automáticamente en el cálculo del costo por hora
            </p>
          </div>
        </div>

        {/* Tipo de Cambio con API Mejorado */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Tipo de Cambio USD/ARS
            </h3>
            {dolarData && (
              <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                <RefreshCw className="h-3 w-3" />
                Actualizado en tiempo real
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selector de Tipo de Dólar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Dólar
              </label>
              <div className="space-y-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTipoDolar('oficial')}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    tipoDolar === 'oficial'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">🏦 Oficial</div>
                      {dolarData && (
                        <div className="text-xs text-gray-600 mt-1">
                          ${dolarData.oficial.venta.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                    {tipoDolar === 'oficial' && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTipoDolar('blue')}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    tipoDolar === 'blue'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">💵 Blue</div>
                      {dolarData && (
                        <div className="text-xs text-gray-600 mt-1">
                          ${dolarData.blue.venta.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                    {tipoDolar === 'blue' && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Selector de Compra/Venta/Promedio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a Usar
              </label>
              <div className="space-y-2">
                {(['compra', 'venta', 'promedio'] as const).map((tipo) => (
                  <motion.button
                    key={tipo}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTipoValor(tipo)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      tipoValor === tipo
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">
                          {tipo === 'compra' && '📉 Compra'}
                          {tipo === 'venta' && '📈 Venta'}
                          {tipo === 'promedio' && '📊 Promedio'}
                        </div>
                        {dolarData && (
                          <div className="text-xs text-gray-600 mt-1">
                            ${dolarData[tipoDolar][tipo].toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                      {tipoValor === tipo && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Valor Seleccionado y Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Seleccionado
              </label>
              {loadingDolar ? (
                <div className="w-full px-4 py-8 bg-gray-50 border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="mt-2 text-sm text-gray-600">Cargando cotizaciones...</span>
                </div>
              ) : dolarSeleccionado ? (
                <div className="w-full px-4 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                  <div className="text-4xl font-black text-green-600 mb-2">
                    ${dolarSeleccionado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-green-800 font-medium mb-3">
                    Dólar {tipoDolar === 'oficial' ? 'Oficial' : 'Blue'} - {tipoValor.charAt(0).toUpperCase() + tipoValor.slice(1)}
                  </div>
                  <div className="text-xs text-green-700 bg-white/50 rounded-lg p-2">
                    <strong>📊 Para qué se usa:</strong>
                    <ul className="mt-1 space-y-0.5">
                      <li>• Convertir equipos USD → ARS</li>
                      <li>• Calcular amortización</li>
                      <li>• Análisis de costos</li>
                    </ul>
                  </div>
                  <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Fuente: DolarAPI.com
                  </div>
                </div>
              ) : (
                <div className="w-full px-4 py-8 bg-red-50 border-2 border-red-300 rounded-xl text-center">
                  <div className="text-sm text-red-600">Error al cargar cotización</div>
                </div>
              )}
              <input
                type="hidden"
                name="tipo_cambio"
                value={dolarSeleccionado || safeConfig.tipo_cambio_usd_ars}
              />
            </div>
          </div>

          {/* Tabla comparativa */}
          {dolarData && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Tipo</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Compra</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Venta</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="py-2 px-3 font-medium">🏦 Oficial</td>
                    <td className="text-right py-2 px-3">${dolarData.oficial.compra.toLocaleString('es-AR')}</td>
                    <td className="text-right py-2 px-3">${dolarData.oficial.venta.toLocaleString('es-AR')}</td>
                    <td className="text-right py-2 px-3 font-semibold">${dolarData.oficial.promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-green-50">
                    <td className="py-2 px-3 font-medium">💵 Blue</td>
                    <td className="text-right py-2 px-3">${dolarData.blue.compra.toLocaleString('es-AR')}</td>
                    <td className="text-right py-2 px-3">${dolarData.blue.venta.toLocaleString('es-AR')}</td>
                    <td className="text-right py-2 px-3 font-semibold">${dolarData.blue.promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Margen de Ganancia */}
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <h3 className="text-lg font-bold mb-4">
            Margen de Ganancia Objetivo
          </h3>
          
          <div>
            <input
              type="range"
              name="margen_ganancia"
              defaultValue={safeConfig.margen_ganancia_porcentaje}
              min={10}
              max={200}
              step={5}
              className="w-full h-3 bg-gradient-to-r from-yellow-200 via-green-200 to-blue-200 rounded-lg appearance-none cursor-pointer"
              id="margen-range"
              onChange={(e) => {
                const display = document.getElementById('margen-display');
                if (display) display.textContent = e.target.value + '%';
              }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>10% (Supervivencia)</span>
              <span id="margen-display" className="font-bold text-dental-600 text-2xl">
                {safeConfig.margen_ganancia_porcentaje}%
              </span>
              <span>200% (Premium)</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Este margen se usa en la calculadora de precios como referencia
            </p>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={updateConfigMutation.isLoading}
            className="btn-premium disabled:opacity-50 flex items-center gap-2 text-lg px-8 py-4"
          >
            {updateConfigMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Guardar Configuración
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Resumen de Cálculo */}
      {costosAnalisis && (
        <div className="glass rounded-2xl p-6 shadow-soft border border-dental-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-dental-500" />
            Resumen del Cálculo Actual
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-dental-50 to-dental-100 rounded-xl">
              <div className="text-3xl font-bold text-dental-600">
                ${costosAnalisis.costo_hora_ars?.toLocaleString('es-AR')}
              </div>
              <div className="text-sm text-dental-700 mt-1">Costo/Hora</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {costosAnalisis.cantidad_equipos}
              </div>
              <div className="text-sm text-blue-700 mt-1">Equipos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-3xl font-bold text-green-600">
                {costosAnalisis.cantidad_gastos}
              </div>
              <div className="text-sm text-green-700 mt-1">Gastos Fijos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {costosAnalisis.horas_anuales || safeConfig.horas_anuales_trabajadas}
              </div>
              <div className="text-sm text-purple-700 mt-1">Horas/Año</div>
              <div className="text-xs text-purple-600 mt-1">
                (Guardadas en config)
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <strong>📝 Fórmula:</strong> (Costo Anual Equipos + Gastos Fijos Anuales) ÷ Horas Anuales
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Los equipos se amortizan considerando su vida útil. Los gastos fijos se multiplican por 12 meses.
            </p>
            <p className="text-xs text-purple-700 mt-2 font-medium">
              💡 Guarda los cambios para ver el cálculo actualizado
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametrosTab;
