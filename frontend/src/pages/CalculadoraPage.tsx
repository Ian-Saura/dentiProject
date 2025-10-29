import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { calculadoraService, analyticsService } from '@/services';
import { Calculator, DollarSign, Clock, Package, Sparkles, TrendingUp, Target, HelpCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatNumber';

const CalculadoraPage: React.FC = () => {
  const [formData, setFormData] = useState({
    tiempo_horas: 1.0,
    costo_materiales_ars: 5000,
    usar_costo_real: true,  // Always true - always use cost from parameters
  });
  const [showPersonalizado, setShowPersonalizado] = useState(false);
  const [tratamientoPersonalizado, setTratamientoPersonalizado] = useState('');
  const [showMaterialesHelp, setShowMaterialesHelp] = useState(false);

  // Get cost analysis for real-time cost
  const { data: costos } = useQuery(
    'costos-analisis',
    analyticsService.getCostosAnalisis
  );

  // Calculate recommendations mutation
  const calculateMutation = useMutation(calculadoraService.getRecomendaciones, {
    onError: (error) => {
      toast.error('Error al calcular recomendaciones');
      console.error(error);
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate(formData);
  };

  const tratamientos = [
    { name: 'Consulta', tiempo: 0.5 },
    { name: 'Limpieza', tiempo: 1.0 },
    { name: 'Operatoria Simple', tiempo: 1.5 },
    { name: 'Operatoria Compleja', tiempo: 2.5 },
    { name: 'Endodoncia', tiempo: 3.0 },
    { name: 'Corona', tiempo: 2.0 },
    { name: 'Extracción Simple', tiempo: 0.75 },
    { name: 'Extracción Compleja', tiempo: 2.0 },
  ];

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
            <Calculator className="h-8 w-8" />
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-black flex items-center gap-2"
            >
              <Sparkles className="h-8 w-8 animate-pulse" />
              Calculadora Inteligente de Precios
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 mt-1 text-lg"
            >
              Calcula precios óptimos basados en tus costos reales
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Cost Analysis Alert */}
      {costos && costos.costo_total_anual > 0 && (
        <AnimatedCard delay={0.1}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass rounded-2xl p-6 border border-green-200/50 shadow-soft"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-xl p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-green-900 font-semibold text-lg">
                  ✅ Usando el costo configurado en Parámetros
                </p>
                <p className="text-green-700 text-2xl font-bold">
                  ${formatCurrency(costos.costo_hora_ars, 2)} ARS/hora
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatedCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <AnimatedCard delay={0.2}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
            <h3 className="text-xl font-bold gradient-text mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-dental-500" />
              Parámetros del Tratamiento
            </h3>
          
          <div className="space-y-5">
            {/* Treatment Selection */}
            <div>
              <label className="form-label flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-dental-500" />
                Tipo de Tratamiento
              </label>
              <div className="relative">
                <select 
                  className="form-input pl-4 pr-10 py-3 text-base font-medium bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 focus:border-dental-500 focus:ring-2 focus:ring-dental-500/20 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onChange={(e) => {
                    const selected = tratamientos.find(t => t.name === e.target.value);
                    if (selected) {
                      setFormData({ ...formData, tiempo_horas: selected.tiempo });
                      setShowPersonalizado(false);
                      setTratamientoPersonalizado('');
                    } else if (e.target.value === 'personalizado') {
                      setShowPersonalizado(true);
                      setTratamientoPersonalizado('');
                    } else {
                      setShowPersonalizado(false);
                    }
                  }}
                >
                  <option value="" className="text-gray-500">✨ Selecciona un tratamiento...</option>
                  {tratamientos.map((tratamiento) => (
                    <option key={tratamiento.name} value={tratamiento.name} className="py-2">
                      🦷 {tratamiento.name}
                    </option>
                  ))}
                  <option value="personalizado" className="font-semibold">⚙️ Personalizado</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-dental-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Campo de tratamiento personalizado */}
            {showPersonalizado && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="form-label flex items-center gap-2 text-base font-semibold">
                  ⚙️ Nombre del Tratamiento Personalizado
                </label>
                <input
                  type="text"
                  value={tratamientoPersonalizado}
                  onChange={(e) => setTratamientoPersonalizado(e.target.value)}
                  className="form-input pl-4 py-3 text-base font-medium bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 focus:border-dental-500 focus:ring-2 focus:ring-dental-500/20 rounded-xl shadow-sm hover:shadow-md transition-all"
                  placeholder="Ej: Implante dental, Ortodoncia..."
                  autoFocus
                />
              </motion.div>
            )}

            {/* Time Input */}
            <div>
              <label className="form-label flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Tiempo estimado (horas)</span>
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                max="8"
                className="form-input"
                value={formData.tiempo_horas}
                onChange={(e) => setFormData({ ...formData, tiempo_horas: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Materials Cost */}
            <div>
              <label className="form-label flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Costo de materiales (ARS)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaterialesHelp(!showMaterialesHelp)}
                  className="ml-2 p-1.5 rounded-full hover:bg-blue-100 transition-colors group"
                  title="¿Cómo calcular el costo de materiales?"
                >
                  <HelpCircle className="h-5 w-5 text-blue-500 group-hover:text-blue-600" />
                </button>
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.costo_materiales_ars}
                onChange={(e) => setFormData({ ...formData, costo_materiales_ars: parseFloat(e.target.value) || 0 })}
              />
              
              {/* Help Tooltip */}
              <AnimatePresence>
                {showMaterialesHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-lg overflow-hidden"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 text-base mb-1">
                          💡 ¿Cómo calcular el costo de materiales?
                        </h4>
                        <p className="text-sm text-blue-800 mb-2">
                          Los costos variables son los insumos específicos de cada tratamiento: guantes, anestesia, composite, gasas, etc.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm text-blue-900">
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                        <p className="font-semibold mb-2">📊 Fórmula base:</p>
                        <code className="block bg-blue-900 text-blue-50 px-3 py-2 rounded font-mono text-xs">
                          Costo por uso = Precio del paquete ÷ Cantidad de usos
                        </code>
                      </div>
                      
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                        <p className="font-semibold mb-2">✏️ Ejemplos prácticos:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• <strong>Guantes:</strong> caja $8.000 ÷ 50 pares = <strong>$160/paciente</strong></li>
                          <li>• <strong>Anestesia:</strong> caja $15.000 ÷ 50 tubos = <strong>$300/tubo</strong></li>
                          <li>• <strong>Composite:</strong> jeringa $12.000 ÷ 8 usos = <strong>$1.500/restauración</strong></li>
                          <li>• <strong>Gasas:</strong> paquete $3.000 ÷ 200 = $15 c/u × 5 = <strong>$75/tratamiento</strong></li>
                        </ul>
                      </div>
                      
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                        <p className="font-semibold mb-2">📝 Ejemplo completo - Operatoria Simple:</p>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Guantes</span>
                            <span className="font-mono">$160</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Barbijo</span>
                            <span className="font-mono">$50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Anestesia</span>
                            <span className="font-mono">$300</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Composite</span>
                            <span className="font-mono">$1.500</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Adhesivo</span>
                            <span className="font-mono">$200</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gasas y otros</span>
                            <span className="font-mono">$75</span>
                          </div>
                          <div className="flex justify-between border-t border-blue-300 pt-1 mt-1 font-bold">
                            <span>TOTAL</span>
                            <span className="font-mono text-blue-600">$2.285</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-xs text-yellow-900">
                          <strong>💡 Tip:</strong> Si no sabés exactamente cuántos usos da un material, estimá conservadoramente. 
                          Es mejor sobrestimar un poco que subestimar y perder plata.
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowMaterialesHelp(false)}
                      className="mt-3 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Entendido ✓
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* FAQ Reference Tip */}
              <div className="mt-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-purple-500 rounded-full p-1.5 flex-shrink-0">
                    <HelpCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-purple-900">
                      <strong>💡 Recordatorio:</strong> Para calcular el costo de materiales de cada tratamiento, 
                      consultá la guía detallada en <Link to="/faqs" className="underline font-semibold hover:text-purple-700 transition-colors">Ayuda / FAQs</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note: Always uses the cost from parameters (either calculated or manual) */}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCalculate}
              disabled={calculateMutation.isLoading}
              className="btn-premium w-full flex items-center justify-center space-x-2 text-base"
            >
              {calculateMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  <span>Calcular Recomendaciones</span>
                </>
              )}
            </motion.button>
          </div>
          </div>
        </AnimatedCard>

        {/* Results */}
        <AnimatedCard delay={0.3}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
            <h3 className="text-xl font-bold gradient-text mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-dental-500" />
              Recomendaciones de Precios
            </h3>
          
          {calculateMutation.data ? (
            <div className="space-y-4">
              {/* Cost breakdown summary */}
              <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-2">📊 Desglose de Costos Base:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-blue-800">
                    <span className="font-medium">Mano de obra:</span> ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000))).toLocaleString('es-AR')}
                  </div>
                  <div className="text-blue-800">
                    <span className="font-medium">Materiales:</span> ${formData.costo_materiales_ars.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <span className="font-bold text-blue-900">Costo Total: ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000)) + formData.costo_materiales_ars).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                💡 Los precios incluyen el margen de ganancia sobre el costo total (mano de obra + materiales)
              </p>

              {calculateMutation.data.map((recomendacion, index) => {
                const emojis = ['🟡', '🟢', '🔵', '🟣'];
                const isRecommended = recomendacion.margen.includes('Competitivo');
                const costoBase = (formData.tiempo_horas * (costos?.costo_hora_ars || 29000)) + formData.costo_materiales_ars;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-5 rounded-xl border-2 ${
                      isRecommended 
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg' 
                        : 'border-gray-200 bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{emojis[index]}</span>
                        <span className="font-semibold text-lg">
                          {recomendacion.margen}
                          {isRecommended && <span className="text-green-600 ml-2 flex items-center gap-1"><Sparkles className="h-4 w-4" /> RECOMENDADO</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold gradient-text">
                          ${recomendacion.precio.toLocaleString('es-AR')}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Precio Final
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1 pl-11">
                      <div className="flex justify-between">
                        <span>Costo base:</span>
                        <span className="font-medium">${costoBase.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-semibold">
                        <span>+ Ganancia:</span>
                        <span>${recomendacion.ganancia.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-dental rounded-full flex items-center justify-center shadow-glow-dental">
                <Calculator className="h-10 w-10 text-white" />
              </div>
              <p className="text-gray-600 text-lg">
                Complete los parámetros y haga clic en "Calcular" para ver las recomendaciones
              </p>
            </motion.div>
          )}
          </div>
        </AnimatedCard>
      </div>

      {/* Cost Breakdown */}
      {calculateMutation.data && (
        <AnimatedCard delay={0.4}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
            <h3 className="text-xl font-bold gradient-text mb-4 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-dental-500" />
              Análisis Detallado de Costos
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              📝 Fórmula: <span className="font-mono font-semibold text-gray-800">(Costo Materiales + Costo Mano de Obra) × (1 + Margen)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-xl"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">Costo Mano de Obra</div>
                  <div className="text-3xl font-black">
                    ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000))).toLocaleString('es-AR')}
                  </div>
                  <div className="text-xs text-white/70 mt-2">
                    {formData.tiempo_horas}h × ${(costos?.costo_hora_ars || 29000).toLocaleString('es-AR')}/h
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white rounded-2xl shadow-xl"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">Costo Materiales</div>
                  <div className="text-3xl font-black">
                    ${formData.costo_materiales_ars.toLocaleString('es-AR')}
                  </div>
                  <div className="text-xs text-white/70 mt-2">
                    Insumos y materiales
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-purple-500 via-fuchsia-600 to-pink-600 text-white rounded-2xl shadow-xl"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-xs font-medium text-white/80 mb-1">💰 Costo Total Base</div>
                  <div className="text-3xl font-black">
                    ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000)) + formData.costo_materiales_ars).toLocaleString('es-AR')}
                  </div>
                  <div className="text-xs text-white/70 mt-2">
                    Sin margen de ganancia
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-900">
                <span className="font-bold">⚠️ Importante:</span> El costo total base es lo mínimo que necesitas cobrar para cubrir tus gastos. 
                Los precios recomendados arriba incluyen el margen de ganancia sobre este costo base.
              </p>
            </div>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default CalculadoraPage;
