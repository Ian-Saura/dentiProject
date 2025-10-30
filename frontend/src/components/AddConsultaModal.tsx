import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, Sparkles } from 'lucide-react';
import { consultasService, pacientesService, prestacionesService } from '@/services';
import toast from 'react-hot-toast';
import AddPacienteModal from './AddPacienteModal';
import Odontograma from './Odontograma';
import { dateInputToISO } from '../utils/dateUtils';

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
  medio_pago: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago' | 'otro';
  fecha_consulta: string;
  observaciones?: string;
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
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showAddPacienteModal, setShowAddPacienteModal] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [selectedPatientAlergias, setSelectedPatientAlergias] = useState<string>('');
  
  const [formData, setFormData] = useState<ConsultaForm>({
    paciente_id: preselectedPatientId || null,
    paciente_nombre: '',
    paciente_apellido: '',
    paciente_dni: '',
    prestacion_usuario_id: null,
    tratamiento: 'Consulta',
    monto_ars: 30000,
    medio_pago: 'efectivo',
    fecha_consulta: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const handleToothClick = (toothNumber: number) => {
    setSelectedTeeth(prev => 
      prev.includes(toothNumber) 
        ? prev.filter(t => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  // Fetch patients for autocomplete
  const { data: pacientes } = useQuery('pacientes', () => pacientesService.getPacientes(), {
    enabled: isOpen
  });
  
  // Fetch prestaciones for user
  const { data: prestaciones } = useQuery('prestaciones-usuario', () => prestacionesService.getPrestacionesUsuario(), {
    enabled: isOpen
  });

  // Set preselected patient name and ID on mount
  useEffect(() => {
    if (preselectedPatientId && preselectedPatientName) {
      setPatientSearchTerm(preselectedPatientName);
      setFormData(prev => ({
        ...prev,
        paciente_id: preselectedPatientId
      }));
    }
  }, [preselectedPatientId, preselectedPatientName]);

  // Set editing data
  useEffect(() => {
    if (editingConsulta && isOpen) {
      console.log('📝 Loading editing data for consulta ID:', editingConsulta.id);
      setFormData({
        paciente_id: editingConsulta.paciente.id,
        paciente_nombre: editingConsulta.paciente.nombre,
        paciente_apellido: editingConsulta.paciente.apellido,
        paciente_dni: editingConsulta.paciente.dni || '',
        prestacion_usuario_id: editingConsulta.prestacion_usuario.id,
        tratamiento: editingConsulta.prestacion_usuario.nombre_personalizado,
        monto_ars: editingConsulta.monto_ars,
        medio_pago: editingConsulta.medio_pago,
        fecha_consulta: editingConsulta.fecha_consulta.split('T')[0],
        observaciones: editingConsulta.observaciones || ''
      });
      setPatientSearchTerm(`${editingConsulta.paciente.dni} - ${editingConsulta.paciente.nombre} ${editingConsulta.paciente.apellido}`);
      // Load selected teeth if available
      if (editingConsulta.dientes_tratados && editingConsulta.dientes_tratados.length > 0) {
        setSelectedTeeth(editingConsulta.dientes_tratados);
      }
    }
  }, [editingConsulta, isOpen]);

  // Reset scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      // Immediate scroll reset
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }
      
      // Additional resets to ensure it stays at top
      const timer1 = setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
      }, 0);
      
      const timer2 = setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
      }, 100);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

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
      medio_pago: 'efectivo',
      fecha_consulta: new Date().toISOString().split('T')[0]
    });
    setPatientSearchTerm(preselectedPatientName || '');
    setShowPatientDropdown(false);
    setSelectedPatientAlergias('');
    setSelectedTeeth([]); // Limpiar dientes seleccionados
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
    setSelectedPatientAlergias(patient.alergias || '');
    setPatientSearchTerm(`${patient.dni} - ${patient.nombre} ${patient.apellido}`);
    setShowPatientDropdown(false);
    setSelectedTeeth([]); // Limpiar dientes seleccionados al cambiar de paciente
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

      if (!pacienteId) {
        toast.error('Por favor selecciona un paciente o crea uno nuevo');
        return;
      }

      // Step 1: Find or create prestacion_usuario
      if (!prestacionUsuarioId && prestaciones) {
        const existingPrestacion = prestaciones.find(p => 
          p.nombre_personalizado === formData.tratamiento
        );
        if (existingPrestacion) {
          prestacionUsuarioId = existingPrestacion.id;
          console.log('✅ Prestación existente encontrada:', prestacionUsuarioId);
        } else {
          // Create new prestacion_usuario if not found
          try {
            console.log('🔍 Buscando prestación base para:', formData.tratamiento);
            // Find the base prestacion from catalog by name
            const basePrestacionesResponse = await prestacionesService.getPrestaciones();
            console.log('📋 Prestaciones del catálogo:', basePrestacionesResponse.length);
            
            const basePrestacion = basePrestacionesResponse.find(p => 
              p.nombre.toLowerCase() === formData.tratamiento.toLowerCase()
            );
            
            if (basePrestacion) {
              console.log('✅ Prestación base encontrada:', basePrestacion.id);
              // Create user's custom prestacion
              const newPrestacion = await prestacionesService.createPrestacionUsuario({
                prestacion_id: basePrestacion.id,
                nombre_personalizado: formData.tratamiento,
                margen_ganancia_porcentaje: 50 // Default margin
              });
              prestacionUsuarioId = newPrestacion.id;
              console.log('✅ Nueva prestación de usuario creada:', prestacionUsuarioId);
              // Invalidate cache to refresh prestaciones list
              queryClient.invalidateQueries('prestaciones-usuario');
            } else {
              console.log('⚠️ Prestación no encontrada en catálogo, usando genérica');
              // If not in catalog, create a generic one (use first available)
              const genericPrestacion = basePrestacionesResponse[0];
              if (genericPrestacion) {
                const newPrestacion = await prestacionesService.createPrestacionUsuario({
                  prestacion_id: genericPrestacion.id,
                  nombre_personalizado: formData.tratamiento,
                  margen_ganancia_porcentaje: 50
                });
                prestacionUsuarioId = newPrestacion.id;
                console.log('✅ Nueva prestación genérica creada:', prestacionUsuarioId);
                queryClient.invalidateQueries('prestaciones-usuario');
              } else {
                console.error('❌ No hay prestaciones en el catálogo');
                toast.error('Error: No hay prestaciones en el catálogo. Contacta al soporte.');
                return;
              }
            }
          } catch (error: any) {
            console.error('❌ Error creating prestacion:', error);
            console.error('Error details:', error.response?.data);
            toast.error(`Error al crear la prestación: ${error.response?.data?.detail || error.message}`);
            return;
          }
        }
      }

      if (!prestacionUsuarioId) {
        console.error('❌ No se pudo obtener prestacion_usuario_id');
        toast.error('No se pudo crear la prestación. Por favor contacta al soporte.');
        return;
      }

      console.log('📝 Creando consulta con prestacion_usuario_id:', prestacionUsuarioId);

      // Step 2: Create or update consulta
      const consultaData = {
        paciente_id: pacienteId,
        prestacion_usuario_id: prestacionUsuarioId,
        fecha_consulta: dateInputToISO(formData.fecha_consulta) || formData.fecha_consulta,
        monto_ars: formData.monto_ars,
        medio_pago: formData.medio_pago,
        dientes_tratados: selectedTeeth,
        observaciones: formData.observaciones || undefined
      };

      if (editingConsulta) {
        console.log('🔄 Updating consulta with ID:', editingConsulta.id, 'Data:', consultaData);
        updateMutation.mutate({ id: editingConsulta.id, data: consultaData });
      } else {
        console.log('➕ Creating new consulta. Data:', consultaData);
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
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none overflow-y-auto p-4 sm:pt-16"
      >
        <div ref={modalContentRef} className="glass rounded-2xl sm:rounded-3xl p-0 w-full sm:max-w-4xl sm:my-4 overflow-y-auto overscroll-contain shadow-2xl border border-white/20 pointer-events-auto" style={{ scrollBehavior: 'auto', maxHeight: 'calc(100vh - 8rem)' }}>
          <div className="flex items-center justify-between mb-0 sticky top-0 bg-white/95 backdrop-blur-sm px-4 sm:px-6 md:px-8 py-4 z-30 rounded-t-2xl sm:rounded-t-3xl border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold gradient-text flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-dental-500" />
              <span className="hidden xs:inline">{editingConsulta ? 'Editar Prestación' : 'Nueva Prestación'}</span>
              <span className="xs:hidden">{editingConsulta ? 'Editar' : 'Nueva'}</span>
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              type="button"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
      
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 py-6">
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
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                  placeholder="Buscar por DNI, nombre..."
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
                  <>
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
                          setSelectedPatientAlergias('');
                        }}
                        className="text-dental-600 hover:text-dental-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Alergias Alert */}
                    {selectedPatientAlergias && (
                      <div className="mt-3 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold text-lg">⚠️</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-red-900 mb-1">ALERGIAS DEL PACIENTE</h4>
                            <p className="text-sm text-red-700 whitespace-pre-line">{selectedPatientAlergias}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
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
                onChange={(e) => {
                  const selectedTratamiento = e.target.value;
                  // Find if this prestacion exists and has a configured price
                  const existingPrestacion = prestaciones?.find(p => p.nombre_personalizado === selectedTratamiento);
                  
                  setFormData({ 
                    ...formData, 
                    tratamiento: selectedTratamiento,
                    prestacion_usuario_id: existingPrestacion?.id || null,
                    // Update amount if prestacion has a configured price
                    ...(existingPrestacion?.prestacion?.tiempo_estimado_min && {
                      // You can add price calculation logic here if needed
                    })
                  });
                }}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
              >
                {/* User's custom prestaciones first */}
                {prestaciones && prestaciones.length > 0 ? (
                  <>
                    <optgroup label="Tus Prestaciones">
                      {prestaciones
                        .filter(p => p.activo)
                        .sort((a, b) => (a.nombre_personalizado || '').localeCompare(b.nombre_personalizado || ''))
                        .map(p => (
                          <option key={p.id} value={p.nombre_personalizado}>
                            {p.nombre_personalizado}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Prestaciones Comunes">
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
                    </optgroup>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </select>
              {prestaciones && prestaciones.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Si seleccionas una prestación que no tienes configurada, se creará automáticamente
                </p>
              )}
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
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
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
                onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value as any })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="otro">Otro</option>
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
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent"
                required
              />
            </div>

            {/* Tooth Selection */}
            <div className="col-span-1 md:col-span-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                🦷 Dientes Tratados (Opcional)
              </label>
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-cyan-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-3 text-center">
                  Click en los dientes para seleccionar cuáles fueron tratados
                </p>
              <div className="relative overflow-x-auto overflow-y-visible pb-2" style={{ minHeight: '320px' }}>
                <div className="min-w-[800px] scale-75 sm:scale-90 md:scale-100 origin-top">
                  <Odontograma
                    selectedTeeth={selectedTeeth}
                    onToothClick={handleToothClick}
                    selectable={true}
                    showTooltip={true}
                  />
                </div>
              </div>
                {selectedTeeth.length > 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs sm:text-sm font-semibold text-blue-900">
                      ✓ Dientes seleccionados: {selectedTeeth.sort((a, b) => a - b).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Observaciones del Tratamiento (Opcional)
              </label>
              <textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Ej: Material utilizado, procedimiento específico, indicaciones al paciente..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Describe características específicas del tratamiento por diente
              </p>
            </div>

            {/* Buttons */}
            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pb-4 -mb-6 rounded-b-2xl sm:rounded-b-3xl border-t-2 border-gray-300 shadow-xl z-30">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-dental-500 to-dental-600 text-white rounded-lg sm:rounded-xl font-bold hover:from-dental-600 hover:to-dental-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          setShowAddPacienteModal(false);
        }}
      />
    </AnimatePresence>
  );
};

export default AddConsultaModal;
















