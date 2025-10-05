import React from 'react';
import { useQuery } from 'react-query';
import { analyticsService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import MetricCard from '@/components/MetricCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Users,
  Activity,
  AlertCircle,
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

  const isLoading = resumenLoading || kpisLoading || costosLoading;

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
      <div className="bg-gradient-to-r from-primary-600 to-dental-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Bienvenido, {user?.nombre} {getEspecialidadEmoji(user?.especialidad || 'odontologia')}
            </h1>
            <p className="text-primary-100 mt-1">
              Dashboard - {user?.especialidad?.charAt(0).toUpperCase() + user?.especialidad?.slice(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Última actualización</p>
            <p className="font-medium">{new Date().toLocaleTimeString('es-ES')}</p>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ingresos Totales"
          value={`$${resumen?.ingreso_total?.toLocaleString() || 0} ARS`}
          icon={DollarSign}
          color="green"
          change={{ value: kpis?.crecimiento_mensual || 0, type: 'increase' }}
        />
        <MetricCard
          title="Total Consultas"
          value={resumen?.total_consultas || 0}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Promedio/Consulta"
          value={`$${resumen?.promedio_consulta?.toLocaleString() || 0} ARS`}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Más Popular"
          value={resumen?.tratamiento_popular || 'N/A'}
          icon={Award}
          color="yellow"
        />
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Última Consulta"
          value={kpis?.dias_desde_ultima_consulta ? `${kpis.dias_desde_ultima_consulta} días` : 'Hoy'}
          icon={Clock}
          color={kpis?.dias_desde_ultima_consulta && kpis.dias_desde_ultima_consulta > 7 ? 'red' : 'green'}
        />
        <MetricCard
          title="Esta Semana"
          value={`${kpis?.consultas_ultima_semana || 0} consultas`}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Promedio Diario"
          value={`$${kpis?.ingreso_promedio_diario?.toLocaleString() || 0} ARS`}
          icon={Activity}
          color="green"
        />
      </div>

      {/* Cost Analysis Alert */}
      {costos && costos.costo_total_anual > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">💰 Análisis de Costos Automático</h3>
              <p className="mt-1 opacity-90">
                Su costo real por hora: <strong>${costos.costo_hora_ars.toLocaleString()} ARS</strong>
              </p>
              <p className="opacity-90">
                Precio mínimo recomendado (50% margen): <strong>${(costos.costo_hora_ars * 1.5).toLocaleString()} ARS</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="dental-card bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3 p-4">
          <Activity className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Dashboard en Tiempo Real</h3>
            <p className="text-sm text-blue-700 mt-1">
              Los datos se actualizan automáticamente desde la base de datos. 
              {resumen?.total_consultas === 0 && (
                <span className="block mt-1 font-medium">
                  Comienza agregando consultas para ver analytics detallados.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        📊 Dashboard actualizado: {new Date().toLocaleString('es-ES')} - Conectado a API Backend
      </div>
    </div>
  );
};

export default DashboardPage;
