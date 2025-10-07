import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, CreditCard, Building2, Save } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { pacientesService } from '../services';
import toast from 'react-hot-toast';

interface PacienteForm {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  obra_social: string;
}

interface AddPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paciente: any) => void;
  initialData?: Partial<PacienteForm>;
}

const AddPacienteModal: React.FC<AddPacienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData
}) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<PacienteForm>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    obra_social: ''
  });

  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    dni: false
  });

  // Set initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const createMutation = useMutation(pacientesService.createPaciente, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('pacientes');
      toast.success(`Paciente ${data.nombre} ${data.apellido} creado exitosamente`);
      if (onSuccess) {
        onSuccess(data);
      }
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear paciente');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      nombre: true,
      apellido: true,
      dni: true
    });
    
    // Validations with specific messages
    if (!formData.nombre || formData.nombre.trim() === '') {
      toast.error('❌ El nombre es obligatorio');
      return;
    }
    
    if (!formData.apellido || formData.apellido.trim() === '') {
      toast.error('❌ El apellido es obligatorio');
      return;
    }
    
    if (!formData.dni || formData.dni.trim() === '') {
      toast.error('❌ El DNI es obligatorio', {
        duration: 4000,
        icon: '🆔'
      });
      return;
    }
    
    if (formData.dni.length < 7) {
      toast.error('❌ El DNI debe tener al menos 7 caracteres', {
        duration: 4000
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      telefono: '',
      fecha_nacimiento: '',
      obra_social: ''
    });
    setTouched({
      nombre: false,
      apellido: false,
      dni: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-dental-500 to-dental-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nuevo Paciente</h2>
                <p className="text-sm opacity-90">Complete los datos del paciente</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="Juan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            {/* DNI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                DNI *
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => {
                  setFormData({ ...formData, dni: e.target.value });
                  if (touched.dni) setTouched({ ...touched, dni: true });
                }}
                onBlur={() => setTouched({ ...touched, dni: true })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  touched.dni && (!formData.dni || formData.dni.length < 7)
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-dental-500 focus:ring-dental-500'
                }`}
                placeholder="12345678"
                minLength={7}
                maxLength={20}
                required
              />
              {touched.dni && !formData.dni && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  ⚠️ El DNI es obligatorio
                </p>
              )}
              {touched.dni && formData.dni && formData.dni.length < 7 && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  ⚠️ El DNI debe tener al menos 7 caracteres
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 7 caracteres. Este será el identificador único del paciente.
              </p>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
            </div>

            {/* Fecha de Nacimiento y Obra Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Obra Social
                </label>
                <input
                  type="text"
                  value={formData.obra_social}
                  onChange={(e) => setFormData({ ...formData, obra_social: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="OSDE, Swiss Medical, etc."
                />
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Importante:</strong> El DNI será usado como identificador único. 
                Asegúrate de ingresarlo correctamente para evitar duplicados.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-dental-500 to-dental-600 text-white rounded-xl font-bold hover:from-dental-600 hover:to-dental-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createMutation.isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Paciente
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

export default AddPacienteModal;

