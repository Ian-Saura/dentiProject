import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Settings, Link as LinkIcon, Clock, Sliders, X, Menu, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppMode } from '../contexts/AppModeContext';
import CalendarioTurnos from '../components/turnos/CalendarioTurnos';
import QuickTurnoModal from '../components/turnos/QuickTurnoModal';
import ConfiguracionAvanzada from '../components/turnos/ConfiguracionAvanzada';
import { Turno, ConfiguracionTurnos } from '../types/turnos';
import * as turnosService from '../services/turnos';

export default function TurnosPage() {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfiguracion, setShowConfiguracion] = useState(false);
  const [showConfigAvanzada, setShowConfigAvanzada] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionTurnos | null>(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [quickTurnoData, setQuickTurnoData] = useState<{ fecha: string; hora: string } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadTurnos();
    loadConfiguracion();
  }, [selectedDate]);

  const loadTurnos = async () => {
    try {
      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const { turnos: data } = await turnosService.getTurnos({
        fecha_desde: firstDay.toISOString().split('T')[0],
        fecha_hasta: lastDay.toISOString().split('T')[0],
        limit: 500,
      });
      setTurnos(data);
    } catch (error) {
      console.error('Error loading turnos:', error);
      toast.error('Error de red. Verifica tu conexión a internet.');
    }
  };

  const loadConfiguracion = async () => {
    try {
      const config = await turnosService.getConfiguracion();
      setConfiguracion(config);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleTurnoClick = (turno: Turno) => {
    setTurnoSeleccionado(turno);
  };

  const handleCancelarTurno = async (turnoId: number) => {
    if (!confirm('¿Está seguro de cancelar este turno?')) return;

    try {
      await turnosService.cancelarTurno(turnoId);
      toast.success('Turno cancelado');
      loadTurnos();
      setTurnoSeleccionado(null);
    } catch (error) {
      toast.error('Error al cancelar turno');
    }
  };

  const handleCompletarTurno = async (turnoId: number) => {
    try {
      await turnosService.updateTurno(turnoId, { estado: 'completado' });
      toast.success('Turno marcado como completado');
      loadTurnos();
      setTurnoSeleccionado(null);
    } catch (error) {
      toast.error('Error al actualizar turno');
    }
  };

  const handleQuickNewTurno = () => {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = `${String(now.getHours()).padStart(2, '0')}:00`;
    setQuickTurnoData({ fecha, hora });
    setShowMobileMenu(false);
  };

  const handleGoToPatientDashboard = () => {
    if (turnoSeleccionado) {
      const fullName = `${turnoSeleccionado.nombre_paciente} ${turnoSeleccionado.apellido_paciente}`;
      navigate(`/${mode}/pacientes/${encodeURIComponent(fullName)}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                Gestión de Turnos
              </h1>
              <p className="text-white/90 mt-1 text-xs sm:text-sm md:text-base hidden sm:block">
                Administra tus turnos y reservas de forma eficiente
              </p>
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => setShowLinks(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm text-sm font-medium"
              >
                <LinkIcon className="w-4 h-4" />
                Links
              </button>
              <button
                onClick={() => setShowConfiguracion(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Config
              </button>
              <button
                onClick={handleQuickNewTurno}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-bold shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo Turno
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2 md:hidden overflow-hidden"
              >
                <button
                  onClick={handleQuickNewTurno}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-bold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Turno
                </button>
                <button
                  onClick={() => {
                    setShowLinks(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm font-medium"
                >
                  <LinkIcon className="w-5 h-5" />
                  Links de Reserva
                </button>
                <button
                  onClick={() => {
                    setShowConfiguracion(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm font-medium"
                >
                  <Settings className="w-5 h-5" />
                  Configuración
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Alert si sistema inactivo */}
        {configuracion && !configuracion.activo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-3 sm:p-4 shadow-md"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm sm:text-base">
                  Sistema de turnos desactivado
                </p>
                <p className="text-yellow-800 text-xs sm:text-sm mt-1">
                  Configure sus horarios de atención y active el sistema para comenzar a recibir reservas.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendario principal */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarioTurnos
                turnos={turnos}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onTurnoClick={handleTurnoClick}
                onSlotClick={(fecha, hora) => setQuickTurnoData({ fecha, hora })}
                horaInicio={configuracion?.hora_inicio_dia || "08:00"}
                horaFin={configuracion?.hora_fin_dia || "20:00"}
              />
            </motion.div>
          </div>

          {/* Panel lateral - Hidden on mobile when no turno selected */}
          <div className={`space-y-4 sm:space-y-6 ${turnoSeleccionado ? 'block' : 'hidden lg:block'}`}>
            {/* Turno seleccionado */}
            <AnimatePresence>
              {turnoSeleccionado && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Detalles del Turno</h3>
                    <button
                      onClick={() => setTurnoSeleccionado(null)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase font-medium">Fecha y Hora</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {turnoSeleccionado.fecha} • {turnoSeleccionado.hora_inicio.substring(0, 5)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 uppercase font-medium">Paciente</label>
                          <p className="font-semibold text-gray-900 mt-1">
                            {turnoSeleccionado.nombre_paciente} {turnoSeleccionado.apellido_paciente}
                          </p>
                        </div>
                        <button
                          onClick={handleGoToPatientDashboard}
                          className="ml-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Ver dashboard del paciente"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ver Dashboard</span>
                        </button>
                      </div>
                    </div>

                    {turnoSeleccionado.telefono_paciente && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-xs text-gray-500 uppercase font-medium">Teléfono</label>
                        <p className="font-semibold text-gray-900 mt-1">{turnoSeleccionado.telefono_paciente}</p>
                      </div>
                    )}

                    {turnoSeleccionado.motivo_consulta && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-xs text-gray-500 uppercase font-medium">Motivo</label>
                        <p className="font-semibold text-gray-900 mt-1">{turnoSeleccionado.motivo_consulta}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase font-medium">Estado</label>
                      <p className="font-semibold text-gray-900 mt-1 capitalize">{turnoSeleccionado.estado}</p>
                    </div>

                    {turnoSeleccionado.creado_por_publico && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 font-medium">
                          📲 Reservado por el paciente
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    {turnoSeleccionado.estado === 'reservado' && (
                      <button
                        onClick={() => handleCompletarTurno(turnoSeleccionado.id)}
                        className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                      >
                        ✓ Completar
                      </button>
                    )}
                    {turnoSeleccionado.estado !== 'cancelado' && turnoSeleccionado.estado !== 'completado' && (
                      <button
                        onClick={() => handleCancelarTurno(turnoSeleccionado.id)}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
                      >
                        ✕ Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => setTurnoSeleccionado(null)}
                      className="hidden lg:block px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumen del día */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Resumen del Día
              </h3>
              {(() => {
                const turnosDelDia = turnos.filter(t => {
                  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  return t.fecha === dateStr;
                });

                const confirmados = turnosDelDia.filter(t => t.estado === 'confirmado').length;
                const reservados = turnosDelDia.filter(t => t.estado === 'reservado').length;
                const completados = turnosDelDia.filter(t => t.estado === 'completado').length;

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Total turnos</span>
                      <span className="text-2xl font-bold text-gray-900">{turnosDelDia.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Confirmados</p>
                        <p className="text-xl font-bold text-green-600">{confirmados}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Reservados</p>
                        <p className="text-xl font-bold text-blue-600">{reservados}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Completados</p>
                        <p className="text-xl font-bold text-purple-600">{completados}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal de configuración */}
      {showConfiguracion && (
        <ConfiguracionModal
          configuracion={configuracion}
          onClose={() => {
            setShowConfiguracion(false);
            loadConfiguracion();
          }}
          onOpenAvanzada={() => {
            setShowConfiguracion(false);
            setShowConfigAvanzada(true);
          }}
        />
      )}

      {/* Modal de configuración avanzada */}
      {showConfigAvanzada && (
        <ConfiguracionAvanzada
          configuracion={configuracion}
          onClose={() => setShowConfigAvanzada(false)}
          onSave={() => {
            loadConfiguracion();
            loadTurnos();
          }}
        />
      )}

      {/* Modal de links */}
      {showLinks && (
        <LinksModal
          configuracion={configuracion}
          onClose={() => setShowLinks(false)}
        />
      )}

      {/* Quick Turno Modal */}
      {quickTurnoData && (
        <QuickTurnoModal
          isOpen={true}
          onClose={() => setQuickTurnoData(null)}
          fecha={quickTurnoData.fecha}
          hora={quickTurnoData.hora}
          onSuccess={() => {
            loadTurnos();
            setQuickTurnoData(null);
          }}
        />
      )}
    </div>
  );
}

// Modal de configuración (simplificado y responsive)
function ConfiguracionModal({ configuracion, onClose, onOpenAvanzada }: { configuracion: ConfiguracionTurnos | null; onClose: () => void; onOpenAvanzada: () => void }) {
  const [activo, setActivo] = useState(configuracion?.activo || false);
  const [duraciones, setDuraciones] = useState<number[]>(configuracion?.duraciones_permitidas || [15, 30, 45, 60]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await turnosService.updateConfiguracion({
        activo,
        duraciones_permitidas: duraciones,
      });
      toast.success('✅ Configuración actualizada');
      onClose();
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configuración de Turnos
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <div>
                <span className="font-semibold text-gray-900">Sistema de turnos activo</span>
                <p className="text-xs text-gray-600 mt-1">Permite que los pacientes reserven turnos</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900">
              Duraciones permitidas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[15, 30, 45, 60].map(dur => (
                <label key={dur} className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={duraciones.includes(dur)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDuraciones([...duraciones, dur].sort((a, b) => a - b));
                      } else {
                        setDuraciones(duraciones.filter(d => d !== dur));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{dur} min</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Configuración Avanzada
                </p>
                <p className="text-xs text-gray-600">
                  Personaliza horarios por día, bloquea fechas específicas y más opciones
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAvanzada}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Sliders className="w-4 h-4" />
                Abrir
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Modal de links de reserva - Mejorado y responsive
function LinksModal({ configuracion, onClose }: { configuracion: ConfiguracionTurnos | null; onClose: () => void }) {
  const [links, setLinks] = useState<{ duracion: number; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateLinks();
  }, []);

  const generateLinks = async () => {
    if (!configuracion?.activo) {
      return;
    }

    try {
      setLoading(true);
      const generatedLinks = await Promise.all(
        (configuracion.duraciones_permitidas || []).map(async (duracion) => {
          const link = await turnosService.generarLink(duracion);
          return { duracion, url: link.url };
        })
      );
      setLinks(generatedLinks);
    } catch (error) {
      toast.error('Error al generar links');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('📋 Link copiado al portapapeles');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <LinkIcon className="w-6 h-6" />
              Links de Reserva
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!configuracion?.activo ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              <p className="font-semibold mb-2">⚠️ Sistema inactivo</p>
              <p className="text-sm">
                Debe activar el sistema de turnos y configurar horarios de atención antes de compartir links.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Generando links...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Comparta estos links con sus pacientes para que reserven turnos:
              </p>
              {links.map(({ duracion, url }) => (
                <div key={duracion} className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      Turnos de {duracion} minutos
                    </span>
                    <button
                      onClick={() => copyLink(url)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copiar
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg break-all font-mono text-xs">
                    {url}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
