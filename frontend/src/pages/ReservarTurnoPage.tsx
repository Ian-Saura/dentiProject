import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SlotDisponible } from '../types/turnos';
import * as turnosService from '../services/turnos';

export default function ReservarTurnoPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  const [duracion, setDuracion] = useState<number>(30);
  const [profesionalNombre, setProfesionalNombre] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponible | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'fecha' | 'hora' | 'datos' | 'confirmacion'>('fecha');
  const [reservaToken, setReservaToken] = useState<string | null>(null);

  // Datos del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');

  // Cargar información del link al montar el componente
  useEffect(() => {
    if (token) {
      loadLinkInfo();
    }
  }, [token]);

  useEffect(() => {
    if (step === 'hora' && selectedDate) {
      loadSlots();
    }
  }, [selectedDate, duracion, step]);

  const loadLinkInfo = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const linkInfo = await turnosService.getLinkInfo(token);
      setDuracion(linkInfo.duracion_minutos);
      setProfesionalNombre(linkInfo.nombre_profesional);
      
      if (linkInfo.mensaje_personalizado) {
        toast.success(linkInfo.mensaje_personalizado);
      }
    } catch (error: any) {
      console.error('Error loading link info:', error);
      toast.error(error.response?.data?.detail || 'Link inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const response = await turnosService.getDisponibilidadPorToken(
        token,
        dateStr,
        dateStr
      );
      
      setSlots(response.slots || []);
    } catch (error: any) {
      console.error('Error loading slots:', error);
      toast.error(error.response?.data?.detail || 'Error al cargar horarios disponibles');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = async () => {
    if (!selectedSlot || !token) return;

    try {
      setLoading(true);
      
      const turno = await turnosService.reservarTurnoConToken(token, {
        fecha: selectedSlot.fecha,
        hora_inicio: selectedSlot.hora_inicio,
        duracion_minutos: duracion,
        nombre_paciente: nombre,
        apellido_paciente: apellido,
        dni_paciente: dni,
        telefono_paciente: telefono,
        email_paciente: email,
        motivo_consulta: motivo,
      });

      setReservaToken(turno.token_reserva || null);
      setStep('confirmacion');
      toast.success('¡Turno reservado exitosamente!');
    } catch (error: any) {
      console.error('Error al reservar:', error);
      toast.error(error.response?.data?.detail || 'Error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  const renderStepFecha = () => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Seleccione una fecha</h2>
          <p className="text-gray-600">Elija el día en que desea agendar su turno</p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Mostrar duración (solo informativo, no editable) */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Duración del turno</p>
                <p className="text-lg font-bold">{duracion} minutos</p>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium mb-2">Fecha</label>
          <input
            type="date"
            min={today.toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            className="w-full border rounded-lg px-4 py-3"
          />

          <button
            onClick={() => setStep('hora')}
            disabled={!selectedDate}
            className="w-full mt-6 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  };

  const renderStepHora = () => {
    const slotsDelDia = slots.filter(s => s.fecha === selectedDate.toISOString().split('T')[0]);

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Seleccione un horario</h2>
          <p className="text-gray-600">
            {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando horarios disponibles...</p>
          </div>
        ) : slotsDelDia.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No hay horarios disponibles para este día</p>
            <button
              onClick={() => setStep('fecha')}
              className="mt-4 text-blue-500 hover:text-blue-600"
            >
              Elegir otra fecha
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {slotsDelDia.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep('datos');
                  }}
                  className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                >
                  <Clock className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">{slot.hora_inicio.substring(0, 5)}</div>
                  <div className="text-xs text-gray-500">
                    {duracion} min
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setStep('fecha')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Volver a selección de fecha
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStepDatos = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Complete sus datos</h2>
          <p className="text-gray-600">
            Turno: {selectedSlot?.fecha} a las {selectedSlot?.hora_inicio.substring(0, 5)}
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleReservar(); }} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Apellido *
            </label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <User className="w-4 h-4 inline mr-1" />
              DNI / Documento *
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Ej: 12345678"
              minLength={7}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Teléfono *
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo de la consulta (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('hora')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Reservando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderStepConfirmacion = () => {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">¡Turno Reservado!</h2>
          <p className="text-gray-600">Su turno ha sido reservado exitosamente</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <h3 className="font-semibold mb-3">Detalles de su turno:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">{selectedSlot?.fecha}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{selectedSlot?.hora_inicio.substring(0, 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duración:</span>
              <span className="font-medium">{duracion} minutos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium">{nombre} {apellido}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>
            <strong>Importante:</strong> Recibirá un recordatorio antes de su turno. 
            Por favor llegue 5 minutos antes de la hora agendada.
          </p>
        </div>

        {reservaToken && (
          <div className="text-xs text-gray-500">
            <p>Código de reserva: {reservaToken.substring(0, 8)}...</p>
            <p>Guarde este código para consultas futuras</p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="text-blue-500 hover:text-blue-600"
        >
          Reservar otro turno
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <h1 className="text-3xl font-bold mb-2">Reservar Turno</h1>
          {profesionalNombre && (
            <p className="text-lg font-medium text-blue-600 mb-1">{profesionalNombre}</p>
          )}
          <p className="text-gray-600">Complete los siguientes pasos para agendar su turno</p>
        </div>

        {/* Progress indicator */}
        {step !== 'confirmacion' && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'fecha' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'hora' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'datos' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                3
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'fecha' && renderStepFecha()}
          {step === 'hora' && renderStepHora()}
          {step === 'datos' && renderStepDatos()}
          {step === 'confirmacion' && renderStepConfirmacion()}
        </div>
      </div>
    </div>
  );
}
