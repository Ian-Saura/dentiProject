import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { calculadoraService, analyticsService } from '@/services';
import { Calculator, DollarSign, Clock, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CalculadoraPage: React.FC = () => {
  const [formData, setFormData] = useState({
    tiempo_horas: 1.0,
    costo_materiales_ars: 5000,
    usar_costo_real: true,
  });

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
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora Inteligente de Precios</h1>
          <p className="text-gray-600">Calcula precios óptimos basados en tus costos reales</p>
        </div>
      </div>

      {/* Cost Analysis Alert */}
      {costos && costos.costo_total_anual > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-green-800">
              <strong>✅ Usando su costo real calculado:</strong> ${costos.costo_hora_ars.toLocaleString()} ARS/hora
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="dental-card">
          <h3 className="text-lg font-semibold mb-4">📋 Parámetros del Tratamiento</h3>
          
          <div className="space-y-4">
            {/* Treatment Selection */}
            <div>
              <label className="form-label">Tipo de Tratamiento</label>
              <select 
                className="form-input"
                onChange={(e) => {
                  const selected = tratamientos.find(t => t.name === e.target.value);
                  if (selected) {
                    setFormData({ ...formData, tiempo_horas: selected.tiempo });
                  }
                }}
              >
                <option value="">Seleccionar tratamiento...</option>
                {tratamientos.map((tratamiento) => (
                  <option key={tratamiento.name} value={tratamiento.name}>
                    {tratamiento.name}
                  </option>
                ))}
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

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
              <label className="form-label flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Costo de materiales (ARS)</span>
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                className="form-input"
                value={formData.costo_materiales_ars}
                onChange={(e) => setFormData({ ...formData, costo_materiales_ars: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Use Real Cost Toggle */}
            {costos && costos.costo_total_anual > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usar_costo_real"
                  checked={formData.usar_costo_real}
                  onChange={(e) => setFormData({ ...formData, usar_costo_real: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="usar_costo_real" className="text-sm text-gray-700">
                  Usar costo real calculado (${costos.costo_hora_ars.toLocaleString()} ARS/hora)
                </label>
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={calculateMutation.isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {calculateMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  <span>🧮 Calcular Recomendaciones</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="dental-card">
          <h3 className="text-lg font-semibold mb-4">📊 Recomendaciones de Precios</h3>
          
          {calculateMutation.data ? (
            <div className="space-y-4">
              {calculateMutation.data.map((recomendacion, index) => {
                const colors = ['yellow', 'green', 'blue', 'purple'];
                const emojis = ['🟡', '🟢', '🔵', '🟣'];
                const isRecommended = recomendacion.margen.includes('Competitivo');
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isRecommended 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{emojis[index]}</span>
                        <span className="font-medium">
                          {recomendacion.margen}
                          {isRecommended && <span className="text-green-600 ml-2">← RECOMENDADO</span>}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${recomendacion.precio.toLocaleString()} ARS
                        </div>
                        <div className="text-sm text-gray-600">
                          Ganancia: ${recomendacion.ganancia.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Complete los parámetros y haga clic en "Calcular" para ver las recomendaciones
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      {calculateMutation.data && (
        <div className="dental-card">
          <h3 className="text-lg font-semibold mb-4">💰 Análisis de Costos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000))).toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">Mano de Obra</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${formData.costo_materiales_ars.toLocaleString()}
              </div>
              <div className="text-sm text-green-800">Materiales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${((formData.tiempo_horas * (costos?.costo_hora_ars || 29000)) + formData.costo_materiales_ars).toLocaleString()}
              </div>
              <div className="text-sm text-purple-800">Costo Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculadoraPage;
