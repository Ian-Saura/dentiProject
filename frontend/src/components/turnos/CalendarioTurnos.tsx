import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, AlertCircle, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Turno } from '../../types/turnos';

interface CalendarioTurnosProps {
  turnos: Turno[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTurnoClick?: (turno: Turno) => void;
  onSlotClick?: (date: string, hora: string) => void;
  horaInicio?: string;
  horaFin?: string;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type EstadoTurno = 'disponible' | 'reservado' | 'confirmado' | 'cancelado' | 'completado' | 'no_asistio';

const estadoConfig: Record<EstadoTurno, { color: string; icon: React.ReactNode; label: string }> = {
  disponible: { color: 'bg-gray-100 border-gray-300 text-gray-700', icon: <Calendar className="w-3 h-3" />, label: 'Disponible' },
  reservado: { color: 'bg-blue-100 border-blue-300 text-blue-700', icon: <Clock className="w-3 h-3" />, label: 'Reservado' },
  confirmado: { color: 'bg-green-100 border-green-300 text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Confirmado' },
  cancelado: { color: 'bg-red-100 border-red-300 text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Cancelado' },
  completado: { color: 'bg-purple-100 border-purple-300 text-purple-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Completado' },
  no_asistio: { color: 'bg-orange-100 border-orange-300 text-orange-700', icon: <AlertCircle className="w-3 h-3" />, label: 'No Asistió' },
};

export default function CalendarioTurnos({
  turnos,
  onTurnoClick,
  onSlotClick,
  selectedDate,
  onDateChange,
  horaInicio = "08:00",
  horaFin = "20:00",
}: CalendarioTurnosProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('agenda');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);

  const prevMonth = () => {
    onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const prevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    onDateChange(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const getTurnosForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return turnos.filter(t => t.fecha === dateStr);
  };

  const getTurnosForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return turnos.filter(t => t.fecha === dateStr);
  };

  const renderCalendarView = () => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const turnosDay = getTurnosForDay(day);
      const isCurrentDay = isToday(day);

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
            isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
          }`}
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(day);
            onDateChange(newDate);
            setViewMode('agenda');
          }}
        >
          <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : ''}`}>
            {day}
          </div>
          <div className="mt-1 space-y-0.5">
            {turnosDay.slice(0, 3).map(turno => (
              <div
                key={turno.id}
                className={`text-xs px-1 py-0.5 rounded border ${estadoConfig[turno.estado].color}`}
              >
                {turno.hora_inicio.substring(0, 5)}
              </div>
            ))}
            {turnosDay.length > 3 && (
              <div className="text-xs text-gray-500">+{turnosDay.length - 3}</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderAgendaView = () => {
    const turnosDelDia = getTurnosForDate(selectedDate).sort((a, b) => 
      a.hora_inicio.localeCompare(b.hora_inicio)
    );

    // Generar slots de tiempo cada 30 minutos usando el rango configurado
    const timeSlots = [];
    const [startHour, startMinute] = horaInicio.split(':').map(Number);
    const [endHour, endMinute] = horaFin.split(':').map(Number);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const startMin = (hour === startHour) ? startMinute : 0;
      const endMin = (hour === endHour) ? endMinute : 60;
      
      for (let minute = startMin; minute < endMin; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        timeSlots.push(timeStr);
      }
    }

    return (
      <div className="space-y-1">
        {timeSlots.map((timeSlot) => {
          // Buscar si hay un turno en este slot
          const turnoEnSlot = turnosDelDia.find(t => t.hora_inicio.substring(0, 5) === timeSlot);
          
          if (turnoEnSlot) {
            const config = estadoConfig[turnoEnSlot.estado];
            return (
              <div
                key={timeSlot}
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${config.color}`}
                onClick={() => onTurnoClick?.(turnoEnSlot)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold text-sm sm:text-base">
                        {turnoEnSlot.hora_inicio.substring(0, 5)} - {turnoEnSlot.hora_fin.substring(0, 5)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/50">
                        {turnoEnSlot.duracion_minutos} min
                      </span>
                    </div>

                    {(turnoEnSlot.nombre_paciente || turnoEnSlot.apellido_paciente) && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{turnoEnSlot.nombre_paciente} {turnoEnSlot.apellido_paciente}</span>
                      </div>
                    )}

                    {turnoEnSlot.telefono_paciente && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
                        <Phone className="w-3 h-3" />
                        <span>{turnoEnSlot.telefono_paciente}</span>
                      </div>
                    )}

                    {turnoEnSlot.motivo_consulta && (
                      <div className="text-xs sm:text-sm mt-2 italic text-gray-600">
                        {turnoEnSlot.motivo_consulta}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-2">
                    <div className="flex items-center gap-1">
                      {config.icon}
                      <span className="text-xs">{config.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Slot vacío - clickeable para crear turno
          return (
            <button
              key={timeSlot}
              onClick={() => {
                const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                onSlotClick?.(dateStr, timeSlot);
              }}
              className="w-full p-2 sm:p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 group-hover:text-blue-600">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-sm sm:text-base font-medium">{timeSlot}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={viewMode === 'agenda' ? prevDay : prevMonth}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={viewMode === 'agenda' ? 'Día anterior' : 'Mes anterior'}
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {viewMode === 'agenda' 
              ? `${DIAS_SEMANA[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
              : `${MESES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
            }
          </h2>
          <button
            onClick={viewMode === 'agenda' ? nextDay : nextMonth}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={viewMode === 'agenda' ? 'Día siguiente' : 'Mes siguiente'}
          >
            →
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${
              viewMode === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-4 py-2 rounded ${
              viewMode === 'agenda'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'calendar' ? (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                  {dia}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarView()}
            </div>
          </>
        ) : (
          renderAgendaView()
        )}
      </div>
    </div>
  );
}
