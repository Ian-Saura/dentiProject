import React from 'react';
import { useQuery } from 'react-query';
import { analyticsService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import MetricCard from '@/components/MetricCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Users,
  Activity,
  AlertCircle,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch analytics data
  const { data: resumen, isLoading: resumenLoading } = useQuery(
    'analytics-resumen',
    analyticsService.getResumen,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: kpis, isLoading: kpisLoading } = useQuery(
    'analytics-kpis',
    analyticsService.getKPIs,
    { refetchInterval: 30000 }
  );

  const { data: costos, isLoading: costosLoading } = useQuery(
    'costos-analisis',
    analyticsService.getCostosAnalisis,
    { refetchInterval: 60000 } // Refresh every minute
  );

  const { data: puntoEquilibrio, isLoading: equilibrioLoading } = useQuery(
    'punto-equilibrio',
    analyticsService.getPuntoEquilibrio,
    { refetchInterval: 60000 }
  );

  const isLoading = resumenLoading || kpisLoading || costosLoading || equilibrioLoading;

  const getEspecialidadEmoji = (especialidad: string) => {
    const emojis = {
      odontologia: '🦷',
      dermatologia: '🧴',
      kinesiologia: '🏃‍♂️',
    };
    return emojis[especialidad as keyof typeof emojis] || '🏥';
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-dental rounded-3xl p-8 text-white shadow-glow-dental"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-2"
            >
              <Sparkles className="h-8 w-8 animate-pulse" />
              <h1 className="text-3xl sm:text-4xl font-black">
                Bienvenido, {user?.nombre}
              </h1>
              <span className="text-4xl">{getEspecialidadEmoji(user?.especialidad || 'odontologia')}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 mt-2 text-lg font-medium"
            >
              Dashboard Premium · {user?.especialidad?.charAt(0).toUpperCase() + user?.especialidad?.slice(1)}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl p-4 text-right"
          >
            <p className="text-white/70 text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actualización en vivo
            </p>
            <p className="font-bold text-lg">{new Date().toLocaleTimeString('es-ES')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AnimatedCard delay={0.1} className="h-full">
          <MetricCard
            title="Ingresos Totales"
            value={`$${resumen?.ingreso_total?.toLocaleString('es-AR') || 0} ARS`}
            icon={DollarSign}
            color="green"
            change={{ value: kpis?.crecimiento_mensual || 0, type: 'increase' }}
          />
        </AnimatedCard>
        <AnimatedCard delay={0.15} className="h-full">
          <MetricCard
            title="Total Consultas"
            value={resumen?.total_consultas || 0}
            icon={Calendar}
            color="blue"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.2} className="h-full">
          <MetricCard
            title="Promedio/Consulta"
            value={`$${resumen?.promedio_consulta?.toLocaleString('es-AR') || 0} ARS`}
            icon={TrendingUp}
            color="purple"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.25} className="h-full">
          <MetricCard
            title="Más Popular"
            value={resumen?.tratamiento_popular || 'N/A'}
            icon={Award}
            color="yellow"
          />
        </AnimatedCard>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <AnimatedCard delay={0.3} className="h-full">
          <MetricCard
            title="Última Consulta"
            value={kpis?.dias_desde_ultima_consulta ? `${kpis.dias_desde_ultima_consulta} días` : 'Hoy'}
            icon={Clock}
            color={kpis?.dias_desde_ultima_consulta && kpis.dias_desde_ultima_consulta > 7 ? 'red' : 'green'}
          />
        </AnimatedCard>
        <AnimatedCard delay={0.35} className="h-full">
          <MetricCard
            title="Esta Semana"
            value={`${kpis?.consultas_ultima_semana || 0} consultas`}
            icon={Users}
            color="blue"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.4} className="h-full">
          <MetricCard
            title="Promedio Diario"
            value={`$${kpis?.ingreso_promedio_diario?.toLocaleString('es-AR') || 0} ARS`}
            icon={Activity}
            color="green"
          />
        </AnimatedCard>
      </div>

      {/* Cost Analysis Alert */}
      {costos && costos.costo_total_anual > 0 && (
        <AnimatedCard delay={0.45} className="h-full">
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-dental-600 rounded-2xl p-6 sm:p-8 text-white shadow-glow">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-start space-x-4">
              <div className="flex-shrink-0 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Análisis de Costos Automático
                </h3>
                <p className="mt-3 opacity-90 text-lg">
                  Su costo real por hora: <strong>${costos.costo_hora_ars.toLocaleString('es-AR')} ARS</strong>
                </p>
                <p className="opacity-90 text-lg">
                  Precio mínimo recomendado (50% margen): <strong>${(costos.costo_hora_ars * 1.5).toLocaleString('es-AR')} ARS</strong>
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Break-Even Point (Punto de Equilibrio) */}
      {puntoEquilibrio && !puntoEquilibrio.error && (
        <AnimatedCard delay={0.5} className="h-full">
          <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-glow ${
            puntoEquilibrio.esta_en_equilibrio 
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600' 
              : 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative flex items-start space-x-4">
              <div className="flex-shrink-0 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <Target className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                  Punto de Equilibrio
                </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90">Consultas Necesarias/Mes</p>
                  <p className="text-2xl font-bold">{puntoEquilibrio.consultas_necesarias_mes}</p>
                  <p className="text-xs opacity-75 mt-1">para cubrir costos fijos</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90">Consultas del Último Mes</p>
                  <p className="text-2xl font-bold">{puntoEquilibrio.consultas_ultimo_mes}</p>
                  <p className={`text-xs font-semibold mt-1 ${
                    puntoEquilibrio.diferencia_consultas >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {puntoEquilibrio.diferencia_consultas >= 0 ? '+' : ''}{puntoEquilibrio.diferencia_consultas.toFixed(1)} vs equilibrio
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm opacity-90">% Equilibrio Alcanzado</p>
                  <p className="text-2xl font-bold">{puntoEquilibrio.porcentaje_equilibrio.toFixed(1)}%</p>
                  <p className="text-xs opacity-75 mt-1">
                    {puntoEquilibrio.esta_en_equilibrio ? '✅ En equilibrio' : '⚠️ Por debajo'}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-75">Ingreso necesario/mes:</p>
                  <p className="font-semibold">${puntoEquilibrio.ingreso_necesario_mes.toLocaleString('es-AR')} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Precio promedio/consulta:</p>
                  <p className="font-semibold">${puntoEquilibrio.precio_promedio.toLocaleString('es-AR')} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Costos fijos mensuales:</p>
                  <p className="font-semibold">${puntoEquilibrio.costos_fijos_mensuales.toLocaleString('es-AR')} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Margen de contribución:</p>
                  <p className="font-semibold">${puntoEquilibrio.margen_contribucion.toLocaleString('es-AR')} ARS</p>
                </div>
              </div>
                {!puntoEquilibrio.esta_en_equilibrio && (
                  <div className="mt-4 bg-white/20 rounded-lg p-3">
                    <p className="text-sm font-semibold">💡 Recomendación:</p>
                    <p className="text-sm mt-1">
                      Necesitas {(puntoEquilibrio.consultas_necesarias_mes - puntoEquilibrio.consultas_ultimo_mes).toFixed(0)} consultas más 
                      este mes para alcanzar el punto de equilibrio.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Info Message */}
      <AnimatedCard delay={0.55}>
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-dental-50 border border-blue-200/50 rounded-2xl shadow-soft">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-4 p-6">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-dental-500 rounded-xl p-3 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg">Dashboard en Tiempo Real</h3>
              <p className="text-sm text-blue-700 mt-1">
                Los datos se actualizan automáticamente desde la base de datos. 
                {resumen?.total_consultas === 0 && (
                  <span className="block mt-2 font-semibold text-dental-600">
                    ✨ Comienza agregando consultas para ver analytics detallados.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-gray-500 py-4 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4 text-dental-500" />
        <span className="font-medium">Dashboard actualizado: {new Date().toLocaleString('es-ES')}</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Conectado a API
        </span>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
