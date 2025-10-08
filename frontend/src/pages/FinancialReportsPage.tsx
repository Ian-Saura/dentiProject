import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { TrendingUp, DollarSign, Calendar, PieChart, BarChart3, Download, Sparkles, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion } from 'framer-motion';
import { consultasService, configService } from '@/services';
import { gastosService } from '@/services/gastos';

interface MonthlyPL {
  month: string;
  monthKey?: string; // For proper chronological sorting
  ingresos: number;
  gastos_fijos: number;
  gastos_equipos: number;
  utilidad_bruta: number;
  margen_porcentaje: number;
  consultas_count: number;
}

interface CashFlowData {
  month: string;
  ingresos: number;
  gastos: number;
  flujo_neto: number;
  acumulado: number;
}

const FinancialReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState<'pl' | 'cashflow' | 'profitability'>('pl');
  const [sortBy, setSortBy] = useState<'month' | 'ingresos' | 'utilidad' | 'margen'>('month');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch consultations for financial analysis
  const { data: consultasData, isLoading: loadingConsultas } = useQuery(
    ['consultas-financial', selectedPeriod],
    () => consultasService.getConsultas({ limit: 1000 }),
    { keepPreviousData: true }
  );

  // Fetch cost analysis
  const { data: costAnalysis, isLoading: loadingCosts } = useQuery(
    'cost-analysis',
    configService.getCostAnalysis
  );

  // Fetch gastos fijos for real monthly costs
  const { data: gastosData, isLoading: loadingGastos } = useQuery(
    'gastos-fijos',
    gastosService.getGastos
  );

  const isLoading = loadingConsultas || loadingCosts || loadingGastos;

  // Calculate monthly P&L
  const calculateMonthlyPL = (): MonthlyPL[] => {
    if (!consultasData?.data || !costAnalysis || !gastosData) return [];

    // Calculate date filter based on selected period
    const now = new Date();
    let startDate: Date | null = null;
    
    if (selectedPeriod === '3months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (selectedPeriod === '6months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    } else if (selectedPeriod === '12months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    }
    // 'all' = no filter

    const monthlyData: { [key: string]: MonthlyPL } = {};
    // Calculate real monthly fixed costs from gastos fijos
    const monthlyFixedCost = gastosData
      .filter(g => g.activo)
      .reduce((sum, g) => sum + g.monto_mensual_ars, 0);
    const hourlyEquipmentCost = costAnalysis.costo_hora_ars || 0;

    consultasData.data.forEach(consulta => {
      const date = new Date(consulta.fecha_consulta);
      
      // Apply date filter
      if (startDate && date < startDate) {
        return; // Skip consultas outside the selected period
      }
      
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          monthKey: monthKey, // Add monthKey for proper sorting
          ingresos: 0,
          gastos_fijos: monthlyFixedCost,
          gastos_equipos: 0,
          utilidad_bruta: 0,
          margen_porcentaje: 0,
          consultas_count: 0
        };
      }

      monthlyData[monthKey].ingresos += consulta.monto_ars;
      monthlyData[monthKey].gastos_equipos += hourlyEquipmentCost * 1; // Assume 1 hour per consultation
      monthlyData[monthKey].consultas_count += 1;
    });

    // Calculate final metrics
    Object.values(monthlyData).forEach(month => {
      const totalGastos = month.gastos_fijos + month.gastos_equipos;
      month.utilidad_bruta = month.ingresos - totalGastos;
      month.margen_porcentaje = month.ingresos > 0 ? (month.utilidad_bruta / month.ingresos) * 100 : 0;
    });

    // Sort by year-month key (chronological order) - DESCENDING (newest first)
    return Object.entries(monthlyData)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([_, data]) => data);
  };

  // Calculate cash flow
  const calculateCashFlow = (): CashFlowData[] => {
    const monthlyPL = calculateMonthlyPL();
    let acumulado = 0;

    return monthlyPL.map(month => {
      const flujo_neto = month.utilidad_bruta;
      acumulado += flujo_neto;
      
      return {
        month: month.month,
        ingresos: month.ingresos,
        gastos: month.gastos_fijos + month.gastos_equipos,
        flujo_neto,
        acumulado
      };
    });
  };

  // Calculate treatment profitability
  const calculateTreatmentProfitability = () => {
    if (!consultasData?.data || !costAnalysis) return [];

    const treatmentData: { [key: string]: any } = {};
    const hourlyRate = costAnalysis.costo_hora_ars || 28500;

    consultasData.data.forEach(consulta => {
      const treatment = consulta.prestacion_usuario?.nombre_personalizado || 'Consulta';
      
      if (!treatmentData[treatment]) {
        treatmentData[treatment] = {
          tratamiento: treatment,
          total_revenue: 0,
          total_cost: 0,
          sessions_count: 0,
          avg_revenue: 0,
          profit_margin: 0
        };
      }

      treatmentData[treatment].total_revenue += consulta.monto_ars;
      treatmentData[treatment].total_cost += hourlyRate * 1; // Assume 1 hour per session
      treatmentData[treatment].sessions_count += 1;
    });

    return Object.values(treatmentData).map((treatment: any) => {
      treatment.avg_revenue = treatment.total_revenue / treatment.sessions_count;
      treatment.profit_margin = ((treatment.total_revenue - treatment.total_cost) / treatment.total_revenue) * 100;
      return treatment;
    }).sort((a: any, b: any) => b.profit_margin - a.profit_margin);
  };

  const monthlyPL = calculateMonthlyPL();
  const cashFlowData = calculateCashFlow();
  const treatmentProfitability = calculateTreatmentProfitability();

  // Sort monthly P&L data
  const sortedMonthlyPL = useMemo(() => {
    if (!monthlyPL.length) return [];
    
    return [...monthlyPL].sort((a, b) => {
      let compareA, compareB;
      
      if (sortBy === 'month') {
        // Use monthKey (YYYY-MM format) for proper chronological sorting
        compareA = a.monthKey || a.month;
        compareB = b.monthKey || b.month;
      } else if (sortBy === 'ingresos') {
        compareA = a.ingresos;
        compareB = b.ingresos;
      } else if (sortBy === 'utilidad') {
        compareA = a.utilidad_bruta;
        compareB = b.utilidad_bruta;
      } else { // margen
        compareA = a.margen_porcentaje;
        compareB = b.margen_porcentaje;
      }
      
      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [monthlyPL, sortBy, sortOrder]);

  const downloadReport = () => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'pl') {
      csvContent = 'Mes,Ingresos,Gastos Fijos,Gastos Equipos,Utilidad Bruta,Margen %,Prestaciones\n';
      monthlyPL.forEach(row => {
        csvContent += `${row.month},${row.ingresos},${row.gastos_fijos},${row.gastos_equipos},${row.utilidad_bruta},${row.margen_porcentaje.toFixed(2)},${row.consultas_count}\n`;
      });
      filename = 'reporte_pyg.csv';
    } else if (reportType === 'cashflow') {
      csvContent = 'Mes,Ingresos,Gastos,Flujo Neto,Acumulado\n';
      cashFlowData.forEach(row => {
        csvContent += `${row.month},${row.ingresos},${row.gastos},${row.flujo_neto},${row.acumulado}\n`;
      });
      filename = 'flujo_caja.csv';
    } else {
      csvContent = 'Tratamiento,Ingresos Totales,Costos Totales,Sesiones,Ingreso Promedio,Margen %\n';
      treatmentProfitability.forEach((row: any) => {
        csvContent += `${row.tratamiento},${row.total_revenue},${row.total_cost},${row.sessions_count},${row.avg_revenue.toFixed(0)},${row.profit_margin.toFixed(2)}\n`;
      });
      filename = 'rentabilidad_tratamientos.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <Sparkles className="h-8 w-8 animate-pulse" />
                Reportes Financieros
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Análisis detallado de ingresos, gastos y rentabilidad
              </motion.p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadReport}
            className="btn-premium flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Descargar Reporte</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Controls */}
      <AnimatedCard delay={0.1}>
        <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-dental-500" />
              Tipo de Reporte
            </label>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReportType('pl')}
                className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  reportType === 'pl' 
                    ? 'bg-gradient-dental text-white shadow-lg shadow-dental-500/30' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                📈 P&L Mensual
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReportType('cashflow')}
                className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  reportType === 'cashflow' 
                    ? 'bg-gradient-dental text-white shadow-lg shadow-dental-500/30' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                💵 Flujo de Caja
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReportType('profitability')}
                className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  reportType === 'profitability' 
                    ? 'bg-gradient-dental text-white shadow-lg shadow-dental-500/30' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                🎯 Rentabilidad
              </motion.button>
            </div>
          </div>
          <div className="sm:w-64">
            <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-dental-500" />
              Período
            </label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="form-input w-full pl-4 pr-10 py-3 text-base font-medium bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 focus:border-dental-500 focus:ring-2 focus:ring-dental-500/20 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <option value="3months">📅 Últimos 3 meses</option>
                <option value="6months">📅 Últimos 6 meses</option>
                <option value="12months">📅 Último año</option>
                <option value="all">📅 Todo el período</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-dental-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        </div>
      </AnimatedCard>

      {/* P&L Report */}
      {reportType === 'pl' && (
        <AnimatedCard delay={0.2}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Estado de Resultados Mensual</h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'month' | 'ingresos' | 'utilidad' | 'margen')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
              >
                <option value="month">Mes</option>
                <option value="ingresos">Ingresos</option>
                <option value="utilidad">Utilidad</option>
                <option value="margen">Margen %</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ingresos</th>
                  <th>Gastos Fijos</th>
                  <th>Gastos Equipos</th>
                  <th>Utilidad Bruta</th>
                  <th>Margen %</th>
                  <th>Prestaciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonthlyPL.map((month, index) => (
                  <tr key={index}>
                    <td className="font-medium">{month.month}</td>
                    <td className="text-green-600 font-medium">
                      ${month.ingresos.toLocaleString('es-AR')}
                    </td>
                    <td className="text-red-600">
                      ${month.gastos_fijos.toLocaleString('es-AR')}
                    </td>
                    <td className="text-red-600">
                      ${month.gastos_equipos.toLocaleString('es-AR')}
                    </td>
                    <td className={`font-bold ${month.utilidad_bruta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.utilidad_bruta.toLocaleString('es-AR')}
                    </td>
                    <td className={`font-medium ${month.margen_porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.margen_porcentaje.toFixed(1)}%
                    </td>
                    <td>{month.consultas_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instagram-Style Summary */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Ingresos Totales</div>
                <div className="text-3xl font-black">
                  ${(monthlyPL.reduce((sum, m) => sum + m.ingresos, 0) / 1000).toFixed(1)}K
                </div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-rose-500 via-red-600 to-pink-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Gastos Totales</div>
                <div className="text-3xl font-black">
                  ${(monthlyPL.reduce((sum, m) => sum + m.gastos_fijos + m.gastos_equipos, 0) / 1000).toFixed(1)}K
                </div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Utilidad Total</div>
                <div className="text-3xl font-black">
                  ${(monthlyPL.reduce((sum, m) => sum + m.utilidad_bruta, 0) / 1000).toFixed(1)}K
                </div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
              <div className="relative z-10">
                <div className="text-xs font-medium text-white/80 mb-1">Margen Promedio</div>
                <div className="text-3xl font-black">
                  {monthlyPL.length > 0 ? 
                    (monthlyPL.reduce((sum, m) => sum + m.margen_porcentaje, 0) / monthlyPL.length).toFixed(1) : 0
                  }%
                </div>
              </div>
            </motion.div>
          </div>
          </div>
        </AnimatedCard>
      )}

      {/* Cash Flow Report */}
      {reportType === 'cashflow' && (
        <AnimatedCard delay={0.2}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Flujo de Caja Mensual</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ingresos</th>
                  <th>Gastos</th>
                  <th>Flujo Neto</th>
                  <th>Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.map((month, index) => (
                  <tr key={index}>
                    <td className="font-medium">{month.month}</td>
                    <td className="text-green-600 font-medium">
                      ${month.ingresos.toLocaleString('es-AR')}
                    </td>
                    <td className="text-red-600">
                      ${month.gastos.toLocaleString('es-AR')}
                    </td>
                    <td className={`font-bold ${month.flujo_neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.flujo_neto.toLocaleString('es-AR')}
                    </td>
                    <td className={`font-bold ${month.acumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.acumulado.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </AnimatedCard>
      )}

      {/* Treatment Profitability Report */}
      {reportType === 'profitability' && (
        <AnimatedCard delay={0.2}>
          <div className="glass rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PieChart className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold">Rentabilidad por Tratamiento</h3>
            </div>
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              💡 <strong>Nota:</strong> Los costos se calculan usando el costo por hora configurado en <strong>Configuración → Parámetros</strong>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tratamiento</th>
                  <th>Ingresos Totales</th>
                  <th>Costos Totales</th>
                  <th>Sesiones</th>
                  <th>Ingreso Promedio</th>
                  <th>Margen %</th>
                </tr>
              </thead>
              <tbody>
                {treatmentProfitability.map((treatment: any, index) => (
                  <tr key={index}>
                    <td className="font-medium">{treatment.tratamiento}</td>
                    <td className="text-green-600 font-medium">
                      ${treatment.total_revenue.toLocaleString('es-AR')}
                    </td>
                    <td className="text-red-600">
                      ${treatment.total_cost.toLocaleString('es-AR')}
                    </td>
                    <td>{treatment.sessions_count}</td>
                    <td className="font-medium">
                      ${treatment.avg_revenue.toLocaleString('es-AR')}
                    </td>
                    <td className={`font-bold ${treatment.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {treatment.profit_margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Performers */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3">🏆 Tratamientos Más Rentables</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {treatmentProfitability.slice(0, 3).map((treatment: any, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{treatment.tratamiento}</div>
                  <div className="text-2xl font-bold text-green-600">{treatment.profit_margin.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">
                    ${treatment.avg_revenue.toLocaleString('es-AR')} promedio
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default FinancialReportsPage;
