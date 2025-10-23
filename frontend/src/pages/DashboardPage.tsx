import React from 'react';
import { useQuery } from 'react-query';
import { analyticsService } from '@/services';
import { plansService } from '../services/plans';
import { useAuth } from '@/contexts/AuthContext';
import MetricCard from '@/components/MetricCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import UpgradeBanner from '../components/UpgradeBanner';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatNumber';
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

  // Fetch plan status
  const { data: planStatus } = useQuery('plan-status', plansService.getMyPlanStatus);

  const isLoading = resumenLoading || kpisLoading || costosLoading || equilibrioLoading;

  const handleUpgrade = () => {
    window.open('https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1', '_blank');
  };

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
      {/* Upgrade Banner - Only show if on trial */}
      {planStatus?.plan === 'trial' && planStatus?.dias_restantes !== undefined && planStatus.dias_restantes >= 0 && (
        <UpgradeBanner 
          diasRestantes={planStatus.dias_restantes} 
          onUpgrade={handleUpgrade}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-dental rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-glow-dental"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap"
            >
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
                Bienvenido, {user?.nombre}
              </h1>
              <span className="text-3xl sm:text-4xl">{getEspecialidadEmoji(user?.especialidad || 'odontologia')}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 mt-2 text-sm sm:text-base md:text-lg font-medium"
            >
              Dashboard Premium{user?.especialidad ? ` · ${user.especialidad.charAt(0).toUpperCase() + user.especialidad.slice(1)}` : ''}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-xl sm:rounded-2xl p-3 sm:p-4 text-right w-full sm:w-auto"
          >
            <p className="text-white/70 text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actualización en vivo
            </p>
            <p className="font-bold text-lg">{new Date().toLocaleTimeString('es-ES')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Instagram-Style Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Ingresos Totales</p>
              <p className="text-2xl font-black mb-1">
                ${(resumen?.ingreso_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span>+{kpis?.crecimiento_mensual || 0}% este mes</span>
              </div>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.15}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Prestaciones</p>
              <p className="text-4xl font-black mb-1">{resumen?.total_consultas || 0}</p>
              <p className="text-white/80 text-xs font-medium">prestaciones registradas</p>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Promedio/Prestación</p>
              <p className="text-2xl font-black mb-1">
                ${(resumen?.promedio_consulta || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-white/80 text-xs font-medium">valor promedio</p>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.25}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Más Popular</p>
              <p className="text-base font-black mb-1 leading-tight truncate">{resumen?.tratamiento_popular || 'N/A'}</p>
              <p className="text-white/80 text-xs font-medium">tratamiento top</p>
            </div>
          </motion.div>
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
            value={`${kpis?.consultas_ultima_semana || 0} prestaciones`}
            icon={Users}
            color="blue"
          />
        </AnimatedCard>
        <AnimatedCard delay={0.4} className="h-full">
          <MetricCard
            title="Promedio Diario"
            value={`$${formatCurrency(kpis?.ingreso_promedio_diario || 0, 0)} ARS`}
            icon={Activity}
            color="green"
          />
        </AnimatedCard>
      </div>

      {/* Cost Analysis Alert */}
      {costos && costos.costo_total_anual > 0 && (
        <AnimatedCard delay={0.45} className="h-full">
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-dental-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-glow">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  Análisis de Costos Automático
                </h3>
                <p className="mt-2 sm:mt-3 opacity-90 text-sm sm:text-base md:text-lg">
                  Su costo real por hora: <strong>${formatCurrency(costos.costo_hora_ars, 2)} ARS</strong>
                </p>
                <p className="opacity-90 text-sm sm:text-base md:text-lg">
                  Precio mínimo recomendado (50% margen): <strong>${formatCurrency(costos.costo_hora_ars * 1.5, 2)} ARS</strong>
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Break-Even Point (Punto de Equilibrio) */}
      {puntoEquilibrio && !puntoEquilibrio.error && (
        <AnimatedCard delay={0.5} className="h-full">
          <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-glow ${
            puntoEquilibrio.esta_en_equilibrio 
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600' 
              : 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <Target className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                  Punto de Equilibrio
                </h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm opacity-90">Horas Necesarias/Mes</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {Math.ceil(puntoEquilibrio.consultas_necesarias_mes)}
                  </p>
                  <p className="text-xs opacity-75 mt-1">para cubrir costos fijos</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm opacity-90">Horas del Último Mes</p>
                  <p className="text-xl sm:text-2xl font-bold">{puntoEquilibrio.consultas_ultimo_mes}</p>
                  <p className={`text-xs font-semibold mt-1 ${
                    (puntoEquilibrio.consultas_ultimo_mes - Math.ceil(puntoEquilibrio.consultas_necesarias_mes)) >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {(puntoEquilibrio.consultas_ultimo_mes - Math.ceil(puntoEquilibrio.consultas_necesarias_mes)) >= 0 ? '+' : ''}{(puntoEquilibrio.consultas_ultimo_mes - Math.ceil(puntoEquilibrio.consultas_necesarias_mes))} vs equilibrio
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm opacity-90">% Equilibrio Alcanzado</p>
                  <p className="text-xl sm:text-2xl font-bold">{((puntoEquilibrio.consultas_ultimo_mes / Math.ceil(puntoEquilibrio.consultas_necesarias_mes)) * 100).toFixed(1)}%</p>
                  <p className="text-xs opacity-75 mt-1">
                    {puntoEquilibrio.consultas_ultimo_mes >= Math.ceil(puntoEquilibrio.consultas_necesarias_mes) ? '✅ En equilibrio' : '⚠️ Por debajo'}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <p className="opacity-75">Ingreso necesario/mes:</p>
                  <p className="font-semibold">${formatCurrency(puntoEquilibrio.ingreso_necesario_mes, 0)} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Precio promedio/hora:</p>
                  <p className="font-semibold">${formatCurrency(puntoEquilibrio.precio_promedio, 0)} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Costos fijos mensuales:</p>
                  <p className="font-semibold">${formatCurrency(puntoEquilibrio.costos_fijos_mensuales, 0)} ARS</p>
                </div>
                <div>
                  <p className="opacity-75">Margen de contribución:</p>
                  <p className="font-semibold">${formatCurrency(puntoEquilibrio.margen_contribucion, 0)} ARS</p>
                </div>
              </div>
                {puntoEquilibrio.consultas_ultimo_mes < Math.ceil(puntoEquilibrio.consultas_necesarias_mes) && (
                  <div className="mt-4 bg-white/20 rounded-lg p-3">
                    <p className="text-xs sm:text-sm font-semibold">💡 Recomendación:</p>
                    <p className="text-xs sm:text-sm mt-1">
                      Necesitas {Math.ceil(puntoEquilibrio.consultas_necesarias_mes) - puntoEquilibrio.consultas_ultimo_mes} horas más 
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
                    ✨ Comienza agregando prestaciones para ver analytics detallados.
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
