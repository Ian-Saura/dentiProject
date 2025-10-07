import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, Sparkles } from 'lucide-react';
import { consultasService, pacientesService, prestacionesService } from '@/services';
import toast from 'react-hot-toast';
import AddPacienteModal from './AddPacienteModal';

interface AddConsultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: number; // If opened from patient dashboard
  preselectedPatientName?: string;
  editingConsulta?: any | null;
}

interface ConsultaForm {
  paciente_id: number | null;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  prestacion_usuario_id: number | null;
  tratamiento: string;
  monto_ars: number;
  medio_pago: string;
  fecha_consulta: string;
}

const AddConsultaModal: React.FC<AddConsultaModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId,
  preselectedPatientName,
  editingConsulta
}) => {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
  const [showAddPacienteModal, setShowAddPacienteModal] = useState(false);
  
  const [formData, setFormData] = useState<ConsultaForm>({
    paciente_id: preselectedPatientId || null,
    paciente_nombre: '',
    paciente_apellido: '',
    paciente_dni: '',
    prestacion_usuario_id: null,
    tratamiento: 'Consulta',
    monto_ars: 30000,
    medio_pago: 'Efectivo',
    fecha_consulta: new Date().toISOString().split('T')[0]
  });

  // Fetch patients for autocomplete
  const { data: pacientes } = useQuery('pacientes', () => pacientesService.getPacientes(), {
    enabled: isOpen
  });
  
  // Fetch prestaciones for user
  const { data: prestaciones } = useQuery('prestaciones-usuario', () => prestacionesService.getPrestacionesUsuario(), {
    enabled: isOpen
  });

  // Set preselected patient name on mount
  useEffect(() => {
    if (preselectedPatientName) {
      setPatientSearchTerm(preselectedPatientName);
    }
  }, [preselectedPatientName]);

  // Set editing data
  useEffect(() => {
    if (editingConsulta) {
      setFormData({
        paciente_id: editingConsulta.paciente.id,
        paciente_nombre: editingConsulta.paciente.nombre,
        paciente_apellido: editingConsulta.paciente.apellido,
        paciente_dni: editingConsulta.paciente.dni || '',
        prestacion_usuario_id: editingConsulta.prestacion_usuario.id,
        tratamiento: editingConsulta.prestacion_usuario.nombre_personalizado,
        monto_ars: editingConsulta.monto_ars,
        medio_pago: editingConsulta.medio_pago,
        fecha_consulta: editingConsulta.fecha_consulta.split('T')[0]
      });
      setPatientSearchTerm(`${editingConsulta.paciente.dni} - ${editingConsulta.paciente.nombre} ${editingConsulta.paciente.apellido}`);
    }
  }, [editingConsulta]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatientDropdown]);

  // Filter patients based on search (prioritize DNI)
  const filteredPatients = useMemo(() => {
    if (!pacientes || !patientSearchTerm || preselectedPatientId) return [];
    const term = patientSearchTerm.toLowerCase();
    
    // Exact DNI match first
    const dniMatches = pacientes.filter(p => 
      p.dni && p.dni.toLowerCase() === term
    );
    
    if (dniMatches.length > 0) return dniMatches;
    
    // Partial matches
    return pacientes.filter(p => 
      (p.dni && p.dni.toLowerCase().includes(term)) ||
      p.nombre.toLowerCase().includes(term) ||
      p.apellido.toLowerCase().includes(term) ||
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [pacientes, patientSearchTerm, preselectedPatientId]);

  // Create mutation
  const createMutation = useMutation(consultasService.createConsulta, {
    onSuccess: () => {
      toast.success('Prestación creada exitosamente');
      queryClient.invalidateQueries('consultas');
      queryClient.invalidateQueries('patient-consultas');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
      queryClient.invalidateQueries('costos-analisis');
      queryClient.invalidateQueries('punto-equilibrio');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear prestación');
    }
  });

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => consultasService.updateConsulta(id, data),
    {
      onSuccess: () => {
        toast.success('Prestación actualizada exitosamente');
        queryClient.invalidateQueries('consultas');
        queryClient.invalidateQueries('patient-consultas');
        queryClient.invalidateQueries('analytics-resumen');
        handleClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar prestación');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      paciente_id: preselectedPatientId || null,
      paciente_nombre: '',
      paciente_apellido: '',
      paciente_dni: '',
      prestacion_usuario_id: null,
      tratamiento: 'Consulta',
      monto_ars: 30000,
      medio_pago: 'Efectivo',
      fecha_consulta: new Date().toISOString().split('T')[0]
    });
    setPatientSearchTerm(preselectedPatientName || '');
    setShowPatientDropdown(false);
    setIsCreatingNewPatient(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectPatient = (patient: any) => {
    setFormData({
      ...formData,
      paciente_id: patient.id,
      paciente_nombre: patient.nombre,
      paciente_apellido: patient.apellido,
      paciente_dni: patient.dni || ''
    });
    setPatientSearchTerm(`${patient.dni} - ${patient.nombre} ${patient.apellido}`);
    setShowPatientDropdown(false);
    setIsCreatingNewPatient(false);
  };

  const handlePatientSearchChange = (value: string) => {
    if (preselectedPatientId) return; // Don't allow changing if preselected
    
    setPatientSearchTerm(value);
    setShowPatientDropdown(true);
    if (!value) {
      setFormData({ ...formData, paciente_id: null, paciente_nombre: '', paciente_apellido: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let pacienteId = formData.paciente_id;
      let prestacionUsuarioId = formData.prestacion_usuario_id;

      // Step 1: Find prestacion_usuario
      if (!prestacionUsuarioId && prestaciones) {
        const existingPrestacion = prestaciones.find(p => 
          p.nombre_personalizado === formData.tratamiento
        );
        if (existingPrestacion) {
          prestacionUsuarioId = existingPrestacion.id;
        }
      }

      if (!pacienteId) {
        toast.error('Por favor selecciona un paciente o crea uno nuevo');
        return;
      }

      if (!prestacionUsuarioId) {
        toast.error('No se encontró la prestación. Por favor contacta al soporte.');
        return;
      }

      // Step 2: Create or update consulta
      const consultaData = {
        paciente_id: pacienteId,
        prestacion_usuario_id: prestacionUsuarioId,
        fecha_consulta: formData.fecha_consulta,
        monto_ars: formData.monto_ars,
        medio_pago: formData.medio_pago
      };

      if (editingConsulta) {
        updateMutation.mutate({ id: editingConsulta.id, data: consultaData });
      } else {
        createMutation.mutate(consultaData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar. Por favor intenta nuevamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
      >
        <div className="glass rounded-3xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-dental-500" />
              {editingConsulta ? 'Editar Prestación' : 'Nueva Prestación'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
      
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Autocomplete - Only if not preselected */}
            {!preselectedPatientId ? (
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Paciente *
                </label>
                <input
                  type="text"
                  value={patientSearchTerm}
                  onChange={(e) => handlePatientSearchChange(e.target.value)}
                  onFocus={() => !preselectedPatientId && setShowPatientDropdown(true)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="Buscar por DNI, nombre o apellido..."
                  required={!formData.paciente_id}
                  disabled={!!preselectedPatientId}
                />
                
                {/* Dropdown */}
                {showPatientDropdown && !preselectedPatientId && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                      <>
                        <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">
                          Pacientes existentes
                        </div>
                        {filteredPatients.map(patient => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => selectPatient(patient)}
                            className="w-full text-left px-4 py-3 hover:bg-dental-50 flex items-center gap-3 border-b border-gray-100 transition-colors"
                          >
                            <Users className="w-4 h-4 text-dental-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {patient.nombre} {patient.apellido}
                              </div>
                              {patient.dni && (
                                <div className="text-xs text-gray-500">DNI: {patient.dni}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : patientSearchTerm && (
                      <div className="p-4 text-gray-500 text-sm">No se encontraron pacientes</div>
                    )}
                    
                    {/* Create new patient */}
                    {patientSearchTerm && !formData.paciente_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const parts = patientSearchTerm.trim().split(' ');
                          // Pre-fill initial data based on search
                          setFormData({
                            ...formData,
                            paciente_nombre: parts[0] || '',
                            paciente_apellido: parts.slice(1).join(' ') || parts[0] || ''
                          });
                          setShowPatientDropdown(false);
                          setShowAddPacienteModal(true);
                        }}
                        className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 flex items-center gap-3 border-t-2 border-green-200 transition-colors"
                      >
                        <UserPlus className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">Crear nuevo paciente</div>
                          <div className="text-xs text-green-700">"{patientSearchTerm}"</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Selected indicator */}
                {formData.paciente_id && (
                  <div className="mt-2 px-3 py-2 bg-dental-50 border border-dental-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-dental-600" />
                      <span className="text-sm font-medium text-dental-900">
                        {formData.paciente_nombre} {formData.paciente_apellido}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, paciente_id: null, paciente_nombre: '', paciente_apellido: '' });
                        setPatientSearchTerm('');
                        setIsCreatingNewPatient(false);
                      }}
                      className="text-dental-600 hover:text-dental-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="px-4 py-3 bg-dental-50 border border-dental-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-dental-600" />
                  <span className="font-medium text-dental-900">{preselectedPatientName}</span>
                </div>
              </div>
            )}

            {/* Treatment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tratamiento *
              </label>
              <select
                value={formData.tratamiento}
                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
              >
                <option value="Consulta">Consulta</option>
                <option value="Consulta de Urgencia">Consulta de Urgencia</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Operatoria Simple">Operatoria Simple</option>
                <option value="Operatoria Compleja">Operatoria Compleja</option>
                <option value="Endodoncia">Endodoncia</option>
                <option value="Corona">Corona</option>
                <option value="Extracción Simple">Extracción Simple</option>
                <option value="Extracción Compleja">Extracción Compleja</option>
                <option value="Blanqueamiento">Blanqueamiento</option>
                <option value="Implante">Implante</option>
                <option value="Placa estabilizadora oclusal">Placa estabilizadora oclusal</option>
                <option value="Obra social">Obra social</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto (ARS) *
              </label>
              <input
                type="number"
                value={formData.monto_ars}
                onChange={(e) => setFormData({ ...formData, monto_ars: Number(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                min="0"
                required
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medio de Pago *
              </label>
              <select
                value={formData.medio_pago}
                onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Obra Social">Obra Social</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de la Consulta *
              </label>
              <input
                type="date"
                value={formData.fecha_consulta}
                onChange={(e) => setFormData({ ...formData, fecha_consulta: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-dental-500 to-dental-600 text-white rounded-xl font-bold hover:from-dental-600 hover:to-dental-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Sub-modal for creating new patient */}
      <AddPacienteModal
        isOpen={showAddPacienteModal}
        onClose={() => setShowAddPacienteModal(false)}
        initialData={{
          nombre: formData.paciente_nombre,
          apellido: formData.paciente_apellido
        }}
        onSuccess={(newPatient) => {
          // When patient is created, select it in the consulta form
          setFormData({
            ...formData,
            paciente_id: newPatient.id,
            paciente_nombre: newPatient.nombre,
            paciente_apellido: newPatient.apellido,
            paciente_dni: newPatient.dni
          });
          setPatientSearchTerm(`${newPatient.dni} - ${newPatient.nombre} ${newPatient.apellido}`);
          setIsCreatingNewPatient(false);
          setShowAddPacienteModal(false);
        }}
      />
    </AnimatePresence>
  );
};

export default AddConsultaModal;

