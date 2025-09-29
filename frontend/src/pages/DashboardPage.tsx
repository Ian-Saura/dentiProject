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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

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

  // Mock data for charts (in real app, this would come from API)
  const monthlyData = [
    { month: 'Ene', ingresos: 450000, consultas: 15 },
    { month: 'Feb', ingresos: 520000, consultas: 18 },
    { month: 'Mar', ingresos: 480000, consultas: 16 },
    { month: 'Abr', ingresos: 600000, consultas: 20 },
    { month: 'May', ingresos: 550000, consultas: 19 },
    { month: 'Jun', ingresos: 650000, consultas: 22 },
  ];

  const treatmentData = [
    { name: 'Consultas', value: 35, color: '#3b82f6' },
    { name: 'Operatorias', value: 25, color: '#10b981' },
    { name: 'Endodoncias', value: 20, color: '#f59e0b' },
    { name: 'Limpiezas', value: 15, color: '#ef4444' },
    { name: 'Otros', value: 5, color: '#8b5cf6' },
  ];

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="dental-card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">📈 Evolución de Ingresos</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treatment Distribution */}
        <div className="dental-card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">🦷 Distribución de Tratamientos</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={treatmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {treatmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Porcentaje']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {treatmentData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Consultations Chart */}
      <div className="dental-card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">📊 Consultas por Mes</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="consultas" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
