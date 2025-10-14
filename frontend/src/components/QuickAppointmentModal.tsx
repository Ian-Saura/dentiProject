import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Save } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { consultasService } from '../services';
import toast from 'react-hot-toast';

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onSuccess?: () => void;
}

const QuickAppointmentModal: React.FC<QuickAppointmentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    duracion: '30',
    notas: ''
  });

  const createMutation = useMutation(
    (data: any) => consultasService.createConsulta(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patient-consultas');
        queryClient.invalidateQueries('consultas');
        toast.success('🎉 Turno agendado exitosamente');
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al agendar turno');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha) {
      toast.error('❌ La fecha es obligatoria');
      return;
    }
    
    if (!formData.hora) {
      toast.error('❌ La hora es obligatoria');
      return;
    }

    // Combine date and time
    const fechaHora = `${formData.fecha}T${formData.hora}`;
    
    const dataToSend = {
      paciente_id: patientId,
      fecha_hora: fechaHora,
      estado: 'pendiente',
      tipo: 'turno',
      notas_clinicas: formData.notas || `Turno agendado para ${patientName}`,
      // Optional fields for minimal turno
      prestaciones: [],
      monto_total: 0,
      metodo_pago: 'pendiente'
    };

    createMutation.mutate(dataToSend);
  };

  const handleClose = () => {
    setFormData({
      fecha: '',
      hora: '',
      duracion: '30',
      notas: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  // Generate time slots (every 30 minutes from 8:00 to 20:00)
  const timeSlots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Agendar Turno</h2>
                <p className="text-sm opacity-90">Asignación rápida</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Patient Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <User className="w-5 h-5" />
                <div>
                  <p className="text-xs font-medium text-blue-600">Paciente</p>
                  <p className="font-bold text-lg">{patientName}</p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                min={today}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Hora *
                </label>
                <select
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Duración
                </label>
                <select
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hora</option>
                  <option value="90">1.5 horas</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notas <span className="text-gray-500 text-xs font-normal">(opcional)</span>
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Motivo de la consulta, observaciones..."
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>💡 Turno rápido:</strong> Podrás agregar las prestaciones y detalles después desde la gestión de consultas.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 text-base border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 px-6 py-3 text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {createMutation.isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Agendar Turno
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAppointmentModal;

