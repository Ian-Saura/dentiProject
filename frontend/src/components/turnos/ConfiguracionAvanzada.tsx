import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfiguracionTurnos } from '../../types/turnos';

interface ConfiguracionAvanzadaProps {
  configuracion: ConfiguracionTurnos | null;
  onClose: () => void;
  onSave: () => void;
}

interface HorarioAtencion {
  inicio: string;
  fin: string;
}

const DIAS_SEMANA = [
  { id: '0', nombre: 'Lunes' },
  { id: '1', nombre: 'Martes' },
  { id: '2', nombre: 'Miércoles' },
  { id: '3', nombre: 'Jueves' },
  { id: '4', nombre: 'Viernes' },
  { id: '5', nombre: 'Sábado' },
  { id: '6', nombre: 'Domingo' },
];

export default function ConfiguracionAvanzada({
  configuracion,
  onClose,
  onSave,
}: ConfiguracionAvanzadaProps) {
  const [horaInicioDia, setHoraInicioDia] = useState(configuracion?.hora_inicio_dia || '08:00');
  const [horaFinDia, setHoraFinDia] = useState(configuracion?.hora_fin_dia || '20:00');
  const [horariosAtencion, setHorariosAtencion] = useState<Record<string, HorarioAtencion[]>>(
    configuracion?.horarios_atencion || {}
  );
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>(
    configuracion?.dias_bloqueados || []
  );
  const [nuevoDiaBloqueado, setNuevoDiaBloqueado] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabActiva, setTabActiva] = useState<'rango' | 'horarios' | 'bloqueados'>('rango');

  const agregarHorario = (diaId: string) => {
    setHorariosAtencion({
      ...horariosAtencion,
      [diaId]: [
        ...(horariosAtencion[diaId] || []),
        { inicio: '09:00', fin: '13:00' },
      ],
    });
  };

  const eliminarHorario = (diaId: string, index: number) => {
    const nuevosHorarios = [...(horariosAtencion[diaId] || [])];
    nuevosHorarios.splice(index, 1);
    setHorariosAtencion({
      ...horariosAtencion,
      [diaId]: nuevosHorarios,
    });
  };

  const actualizarHorario = (
    diaId: string,
    index: number,
    campo: 'inicio' | 'fin',
    valor: string
  ) => {
    const nuevosHorarios = [...(horariosAtencion[diaId] || [])];
    nuevosHorarios[index][campo] = valor;
    setHorariosAtencion({
      ...horariosAtencion,
      [diaId]: nuevosHorarios,
    });
  };

  const agregarDiaBloqueado = () => {
    if (nuevoDiaBloqueado && !diasBloqueados.includes(nuevoDiaBloqueado)) {
      setDiasBloqueados([...diasBloqueados, nuevoDiaBloqueado]);
      setNuevoDiaBloqueado('');
    }
  };

  const eliminarDiaBloqueado = (fecha: string) => {
    setDiasBloqueados(diasBloqueados.filter((d) => d !== fecha));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/v1/turnos/config/mi-configuracion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          hora_inicio_dia: horaInicioDia,
          hora_fin_dia: horaFinDia,
          horarios_atencion: horariosAtencion,
          dias_bloqueados: diasBloqueados,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      toast.success('✅ Configuración guardada exitosamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-7 h-7" />
                Configuración Avanzada de Horarios
              </h2>
              <p className="text-purple-100 mt-1">
                Personaliza tus horarios de atención por día
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setTabActiva('rango')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                tabActiva === 'rango'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Rango General
            </button>
            <button
              onClick={() => setTabActiva('horarios')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                tabActiva === 'horarios'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Por Día
            </button>
            <button
              onClick={() => setTabActiva('bloqueados')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                tabActiva === 'bloqueados'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <X className="w-4 h-4 inline mr-2" />
              Días Bloqueados
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Tab: Rango General */}
          {tabActiva === 'rango' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Rango General:</strong> Define el horario base que se mostrará en el
                  calendario. Puedes personalizar horarios específicos por día en la pestaña "Por
                  Día".
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌅 Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicioDia}
                    onChange={(e) => setHoraInicioDia(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌆 Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={horaFinDia}
                    onChange={(e) => setHoraFinDia(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    required
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Vista previa:</strong> El calendario mostrará slots desde las{' '}
                  <span className="font-bold text-purple-600">{horaInicioDia}</span> hasta las{' '}
                  <span className="font-bold text-purple-600">{horaFinDia}</span>
                </p>
              </div>
            </div>
          )}

          {/* Tab: Horarios por Día */}
          {tabActiva === 'horarios' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Horarios por Día:</strong> Define horarios específicos para cada día
                  de la semana. Puedes agregar múltiples bloques horarios (ej: mañana y tarde).
                </p>
              </div>

              {DIAS_SEMANA.map((dia) => (
                <div key={dia.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{dia.nombre}</h3>
                    <button
                      type="button"
                      onClick={() => agregarHorario(dia.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Horario
                    </button>
                  </div>

                  {horariosAtencion[dia.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {horariosAtencion[dia.id].map((horario, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                          <input
                            type="time"
                            value={horario.inicio}
                            onChange={(e) =>
                              actualizarHorario(dia.id, index, 'inicio', e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={horario.fin}
                            onChange={(e) =>
                              actualizarHorario(dia.id, index, 'fin', e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarHorario(dia.id, index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Sin horarios específicos (usa rango general)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab: Días Bloqueados */}
          {tabActiva === 'bloqueados' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Días Bloqueados:</strong> Agrega fechas específicas donde no habrá
                  atención (feriados, vacaciones, etc.)
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={nuevoDiaBloqueado}
                  onChange={(e) => setNuevoDiaBloqueado(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min={new Date().toISOString().split('T')[0]}
                />
                <button
                  type="button"
                  onClick={agregarDiaBloqueado}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                >
                  <Plus className="w-5 h-5 inline mr-1" />
                  Agregar
                </button>
              </div>

              {diasBloqueados.length > 0 ? (
                <div className="space-y-2">
                  {diasBloqueados.sort().map((fecha) => (
                    <div
                      key={fecha}
                      className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarDiaBloqueado(fecha)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay días bloqueados</p>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
