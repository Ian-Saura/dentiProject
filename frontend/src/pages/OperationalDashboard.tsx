import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Calendar, Users, FileText, Clock, Plus, Zap, TrendingUp } from 'lucide-react';
import { turnosService, consultasService, pacientesService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';

const OperationalDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch today's appointments
  const today = new Date().toISOString().split('T')[0];
  const { data: turnosToday, isLoading: loadingTurnos } = useQuery(
    ['turnos-today', today],
    () => turnosService.getTurnos({
      fecha_desde: today,
      fecha_hasta: today,
      limit: 50,
    })
  );

  // Fetch recent consultations (last 5)
  const { data: consultasRecent, isLoading: loadingConsultas } = useQuery(
    'consultas-recent',
    () => consultasService.getConsultas({ limit: 5 })
  );

  // Fetch total patients count
  const { data: pacientes, isLoading: loadingPacientes } = useQuery(
    'pacientes',
    pacientesService.getPacientes
  );

  const isLoading = loadingTurnos || loadingConsultas || loadingPacientes;

  const quickActions = [
    {
      name: 'Nuevo Turno',
      description: 'Agendar cita',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/operational/turnos'),
      emoji: '📅',
    },
    {
      name: 'Nueva Prestación',
      description: 'Registrar consulta',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/operational/prestaciones'),
      emoji: '📋',
    },
    {
      name: 'Nuevo Paciente',
      description: 'Agregar al sistema',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/operational/pacientes'),
      emoji: '👥',
    },
  ];

  const turnosHoy = turnosToday?.turnos || [];
  const proximosTurnos = turnosHoy
    .filter((t: any) => t.estado === 'confirmado')
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">Modo Operativo</h1>
              <p className="text-white/90 text-lg mt-1">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Large Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.action}
            className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${action.color} text-white shadow-2xl hover:shadow-3xl transition-all text-left`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl">{action.emoji}</span>
                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                  <Plus className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-1">{action.name}</h3>
              <p className="text-white/80 text-base font-medium">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Turnos Hoy</p>
              <p className="text-4xl font-black text-blue-600">{turnosHoy.length}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Prestaciones</p>
              <p className="text-4xl font-black text-green-600">
                {consultasRecent?.data?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">recientes</p>
            </div>
            <div className="bg-green-100 rounded-xl p-3">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Pacientes</p>
              <p className="text-4xl font-black text-purple-600">{pacientes?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">en sistema</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-3">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Próximos Turnos */}
      {proximosTurnos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Próximos Turnos Hoy
            </h2>
            <button
              onClick={() => navigate('/operational/turnos')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            {proximosTurnos.map((turno: any, index: number) => (
              <motion.div
                key={turno.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 text-white rounded-lg px-3 py-2 font-bold text-sm">
                    {turno.hora_inicio?.substring(0, 5)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {turno.paciente?.nombre} {turno.paciente?.apellido}
                    </p>
                    <p className="text-sm text-gray-600">{turno.motivo || 'Consulta'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {turno.estado === 'confirmado' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Confirmado
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State for Turnos */}
      {proximosTurnos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300"
        >
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-gray-600 text-lg font-semibold mb-2">No hay turnos agendados para hoy</p>
          <button
            onClick={() => navigate('/operational/turnos')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agendar Turno
          </button>
        </motion.div>
      )}

      {/* Quick Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl p-6 border border-cyan-200"
      >
        <div className="flex items-start gap-4">
          <div className="bg-cyan-500 rounded-xl p-3">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-cyan-900 text-lg mb-1">💡 Consejo Rápido</h3>
            <p className="text-cyan-800 text-sm">
              El modo operativo está diseñado para el uso diario. 
              Para ver análisis financieros, reportes y configuraciones avanzadas, 
              cambia al <strong>Modo Analítico</strong> desde el menú lateral.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OperationalDashboard;








