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

