import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesService, consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import Odontograma from '@/components/Odontograma';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Activity, TrendingUp, Clock, CreditCard, FileText, Plus, Sparkles, User, Edit, Phone, Mail, MessageCircle, MapPin, Hash, CalendarPlus, CalendarCheck, AlertTriangle } from 'lucide-react';
import ClinicalNotesModal from '@/components/ClinicalNotesModal';
import AddConsultaModal from '@/components/AddConsultaModal';
import AddPacienteModal from '@/components/AddPacienteModal';
import QuickAppointmentModal from '@/components/QuickAppointmentModal';
import toast from 'react-hot-toast';
import { formatDateToDDMMYYYY, calculateAge } from '@/utils/dateFormat';

const PatientDashboardPage: React.FC = () => {
  const { patientName: encodedPatientName } = useParams<{ patientName: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [showAddConsultaModal, setShowAddConsultaModal] = useState(false);
  const [showQuickAppointmentModal, setShowQuickAppointmentModal] = useState(false);
  const [showEditPacienteModal, setShowEditPacienteModal] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<any>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);

  // Decode the patient name from URL
  const patientName = encodedPatientName ? decodeURIComponent(encodedPatientName) : null;

  // Fetch patient consultations
  const { data: consultas = [], isLoading: loadingConsultas } = useQuery(
    ['patient-consultas', patientName],
    () => patientName ? consultasService.getConsultasByPaciente(patientName) : Promise.resolve([]),
    { 
      enabled: !!patientName,
      onSuccess: (data) => {
        // Get patient ID from first consultation
        if (data && data.length > 0 && data[0].paciente) {
          setPatientId(data[0].paciente.id);
        }
      }
    }
  );

  // Fetch patient details to get ID and full patient info
  const { data: pacientesData, refetch: refetchPatients, isLoading: loadingPatients } = useQuery(
    'pacientes',
    () => pacientesService.getPacientes(),
    {
      enabled: !!patientName,
      onSuccess: (data) => {
        if (data && patientName) {
          const patient = data.find(p => `${p.nombre} ${p.apellido}` === patientName);
          if (patient) {
            setPatientId(patient.id);
          }
        }
      }
    }
  );

  // Get full patient data - Try exact match first, then partial match
  const currentPatient = React.useMemo(() => {
    if (!pacientesData || !patientName) return undefined;
    
    // Try exact match first (nombre + apellido)
    let patient = pacientesData.find(p => `${p.nombre} ${p.apellido}` === patientName);
    
    // If not found, try matching just nombre or apellido
    if (!patient) {
      patient = pacientesData.find(p => 
        p.nombre === patientName || 
        p.apellido === patientName ||
        `${p.apellido} ${p.nombre}` === patientName
      );
    }
    
    // If still not found, try case-insensitive partial match
    if (!patient) {
      const lowerName = patientName.toLowerCase();
      patient = pacientesData.find(p => 
        p.nombre.toLowerCase().includes(lowerName) ||
        p.apellido.toLowerCase().includes(lowerName) ||
        `${p.nombre} ${p.apellido}`.toLowerCase() === lowerName
      );
    }
    
    return patient;
  }, [pacientesData, patientName]);
  
  // Update patientId when currentPatient is found
  React.useEffect(() => {
    if (currentPatient && currentPatient.id !== patientId) {
      setPatientId(currentPatient.id);
    }
  }, [currentPatient, patientId]);
  
  // Debug: Log para verificar el estado de carga
  React.useEffect(() => {
    console.log('Debug PatientDashboard:', {
      patientName,
      loadingPatients,
      loadingConsultas,
      hasPacientesData: !!pacientesData,
      pacientesCount: pacientesData?.length,
      currentPatient: currentPatient ? `${currentPatient.nombre} ${currentPatient.apellido}` : null,
      patientId,
      allPatientNames: pacientesData?.map(p => `${p.nombre} ${p.apellido}`).slice(0, 5)
    });
  }, [patientName, loadingPatients, loadingConsultas, pacientesData, currentPatient, patientId]);

  // Get next upcoming appointment
  const nextAppointment = consultas
    .filter(c => {
      const consultaDate = new Date(c.fecha_hora);
      return consultaDate > new Date() && (c.estado === 'pendiente' || c.estado === 'confirmada');
    })
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())[0];

  // Filter consultations by period (always calculate, even if loading)
  const filteredConsultas = consultas.filter(consulta => {
    if (selectedPeriod === 'all') return true;
    
    const consultaDate = new Date(consulta.fecha_consulta);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        return consultaDate.getMonth() === now.getMonth() && consultaDate.getFullYear() === now.getFullYear();
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return consultaDate >= quarterStart;
      case 'year':
        return consultaDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  // Calculate statistics (for charts)
  const totalConsultas = filteredConsultas.length;

  // Clinical notes handlers
  const handleAddClinicalNote = (consultationId: number) => {
    setSelectedConsultationId(consultationId);
    setShowClinicalModal(true);
  };

  const handleSaveClinicalNote = (note: any) => {
    // In a real app, this would save to the backend
    const newNote = {
      ...note,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    setClinicalNotes([...clinicalNotes, newNote]);
  };
  
  // Get treatment frequency
  const tratamientos = filteredConsultas.reduce((acc, consulta) => {
    const tratamiento = consulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar';
    acc[tratamiento] = (acc[tratamiento] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  // Get treated teeth from all consultations
  const treatedTeeth = React.useMemo(() => {
    const teeth = new Set<number>();
    filteredConsultas.forEach(consulta => {
      if (consulta.dientes_tratados && Array.isArray(consulta.dientes_tratados)) {
        consulta.dientes_tratados.forEach((tooth: number) => teeth.add(tooth));
      }
    });
    return Array.from(teeth);
  }, [filteredConsultas]);

  // Get payment methods
  const mediosPago = filteredConsultas.reduce((acc, consulta) => {
    acc[consulta.medio_pago] = (acc[consulta.medio_pago] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get first and last consultation dates
  const sortedConsultas = [...filteredConsultas].sort((a, b) => 
    new Date(a.fecha_consulta).getTime() - new Date(b.fecha_consulta).getTime()
  );
  const primeraConsulta = sortedConsultas[0];
  const ultimaConsulta = sortedConsultas[sortedConsultas.length - 1];

  // Early returns AFTER all hooks
  if (loadingConsultas) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!patientName) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Paciente no encontrado</h3>
        <button onClick={() => navigate('/pacientes')} className="btn-primary">
          Volver a Pacientes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-dental rounded-3xl p-8 text-white shadow-glow-dental"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/pacientes')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <User className="h-8 w-8" />
                {patientName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Dashboard del Paciente
              </motion.p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-input bg-white/20 border-white/30 text-white backdrop-blur-sm"
            >
              <option value="all" className="text-gray-900">Todos los períodos</option>
              <option value="month" className="text-gray-900">Este mes</option>
              <option value="quarter" className="text-gray-900">Este trimestre</option>
              <option value="year" className="text-gray-900">Este año</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* DNI Temporal Alert */}
      {currentPatient && currentPatient.dni && currentPatient.dni.startsWith('CSV-') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                DNI Temporal Detectado
              </h4>
              <p className="text-sm text-amber-800 mb-3">
                Este paciente fue importado desde un archivo CSV sin DNI. 
                Se generó un DNI temporal (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">{currentPatient.dni}</code>) para identificarlo.
              </p>
              <p className="text-sm text-amber-800 mb-3">
                <strong>Recomendación:</strong> Actualiza el DNI real del paciente para mantener registros precisos y evitar duplicados.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEditPacienteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Edit className="h-4 w-4" />
                Actualizar DNI Ahora
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Info & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient Quick Info */}
        <AnimatedCard delay={0.05}>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Información del Paciente
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!currentPatient) {
                    toast.error('Esperando datos del paciente...');
                    return;
                  }
                  setShowEditPacienteModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar información del paciente"
              >
                <Edit className="h-4 w-4" />
              </motion.button>
            </div>
            
            {currentPatient && (
              <div className="grid grid-cols-2 gap-2">
                {currentPatient.dni && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Hash className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">DNI</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{currentPatient.dni}</p>
                    </div>
                  </div>
                )}
                {currentPatient.fecha_nacimiento && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Nacimiento</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDateToDDMMYYYY(currentPatient.fecha_nacimiento)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateAge(currentPatient.fecha_nacimiento)} años
                      </p>
                    </div>
                  </div>
                )}
                {currentPatient.obra_social && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg col-span-2">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Obra Social</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {currentPatient.obra_social}
                        {currentPatient.numero_afiliado && (
                          <span className="text-xs text-gray-500 ml-2">
                            N° {currentPatient.numero_afiliado}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {currentPatient.telefono && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{currentPatient.telefono}</p>
                    </div>
                  </div>
                )}
                {currentPatient.email && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg col-span-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{currentPatient.email}</p>
                    </div>
                  </div>
                )}
                {currentPatient.direccion && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg col-span-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Dirección</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{currentPatient.direccion}</p>
                    </div>
                  </div>
                )}
                {currentPatient.contacto_emergencia && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg col-span-2">
                    <Phone className="h-4 w-4 text-red-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-red-500">Contacto de Emergencia</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{currentPatient.contacto_emergencia}</p>
                    </div>
                  </div>
                )}
                {currentPatient.alergias && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg col-span-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-red-600 font-semibold">Alergias</p>
                      <p className="text-sm font-bold text-red-900">{currentPatient.alergias}</p>
                    </div>
                  </div>
                )}
                {currentPatient.medicamentos_actuales && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg col-span-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-blue-600 font-semibold">Medicamentos Actuales</p>
                      <p className="text-sm font-bold text-blue-900">{currentPatient.medicamentos_actuales}</p>
                    </div>
                  </div>
                )}
                {currentPatient.observaciones_medicas && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg col-span-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-yellow-600 font-semibold">Observaciones Médicas</p>
                      <p className="text-sm text-yellow-900">{currentPatient.observaciones_medicas}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Quick Actions & Next Appointment */}
        <AnimatedCard delay={0.15}>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Acciones Rápidas
              </h3>
              {nextAppointment && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <CalendarCheck className="h-3 w-3" />
                  {new Date(nextAppointment.fecha_hora).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short'
                  })} {new Date(nextAppointment.fecha_hora).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQuickAppointmentModal(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/30"
              >
                <CalendarPlus className="h-5 w-5" />
                <p className="font-bold text-xs">Agendar</p>
              </motion.button>

              {currentPatient?.telefono && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`tel:${currentPatient.telefono}`)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/30"
                >
                  <Phone className="h-5 w-5" />
                  <p className="font-bold text-xs">Llamar</p>
                </motion.button>
              )}

              {currentPatient?.telefono && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://wa.me/${currentPatient.telefono.replace(/\D/g, '')}`)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/30"
                >
                  <MessageCircle className="h-5 w-5" />
                  <p className="font-bold text-xs">WhatsApp</p>
                </motion.button>
              )}

              {currentPatient?.email && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`mailto:${currentPatient.email}`)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/30"
                >
                  <Mail className="h-5 w-5" />
                  <p className="font-bold text-xs">Email</p>
                </motion.button>
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Medical Info Alert - Alergias y Medicamentos */}
      {currentPatient && (currentPatient.alergias || currentPatient.medicamentos_actuales) && (
        <AnimatedCard delay={0.15}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 rounded-xl p-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <div className="bg-red-500 p-1.5 rounded-lg flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                  🏥 Información Médica Importante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPatient.alergias && (
                    <div className="bg-white/60 rounded-lg p-2 border border-red-200">
                      <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                        🚨 Alergias
                      </p>
                      <p className="text-xs text-red-900">{currentPatient.alergias}</p>
                    </div>
                  )}
                  {currentPatient.medicamentos_actuales && (
                    <div className="bg-white/60 rounded-lg p-2 border border-orange-200">
                      <p className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                        💊 Medicamentos
                      </p>
                      <p className="text-xs text-orange-900">{currentPatient.medicamentos_actuales}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatedCard>
      )}

      {/* Odontograma Visual */}
      <AnimatedCard delay={0.3}>
        <div className="relative z-30 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-cyan-200 shadow-sm overflow-visible">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              Odontograma
            </h3>
          </div>
          <div className="overflow-visible">
            <Odontograma 
              treatedTeeth={treatedTeeth} 
              consultations={filteredConsultas}
            />
          </div>
        </div>
      </AnimatedCard>

      {/* Historia Clínica Visual */}
      {filteredConsultas.length > 0 && (
        <AnimatedCard delay={0.25}>
          <div className="glass rounded-xl shadow-sm p-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-pink-500" />
                <span className="gradient-text">Historia Clínica</span>
              </h3>
            </div>

            {/* Timeline de Tratamientos */}
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500"></div>
              
              <div className="space-y-3">
                {filteredConsultas
                  .sort((a, b) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())
                  .map((consulta, index) => (
                    <motion.div
                      key={consulta.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-12"
                    >
                      {/* Punto en la línea */}
                      <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-white shadow-md z-10"></div>
                      
                      {/* Card del tratamiento */}
                      <motion.div
                        whileHover={{ scale: 1.01, x: 3 }}
                        className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                              {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              consulta.estado === 'completada' ? 'bg-green-100 text-green-700' :
                              consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {consulta.estado}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {consulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {consulta.dientes_tratados && consulta.dientes_tratados.length > 0 && (
                              <span className="flex items-center gap-1">
                                🦷 {consulta.dientes_tratados.sort((a, b) => a - b).join(', ')}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-bold text-sm">
                              ${consulta.monto_ars.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs">
                              {consulta.medio_pago}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Treatment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard delay={0.35}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="gradient-text">Tratamientos Realizados</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(tratamientos)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tratamiento, cantidad], index) => (
                  <motion.div
                    key={tratamiento}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800 truncate flex-1 mr-3">{tratamiento}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{cantidad}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cantidad / Math.max(...Object.values(tratamientos))) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full"
                      ></motion.div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="gradient-text">Medios de Pago Utilizados</span>
            </h3>
            <div className="space-y-4">
              {Object.entries(mediosPago)
                .sort(([,a], [,b]) => b - a)
                .map(([medio, cantidad], index) => (
                  <motion.div
                    key={medio}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800 capitalize">{medio}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">{cantidad}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cantidad / totalConsultas) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full"
                      ></motion.div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Consultation History */}
      <AnimatedCard delay={0.45}>
        <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="gradient-text">Historial de Prestaciones</span>
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddConsultaModal(true)}
              className="btn-premium flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nueva Prestación</span>
            </motion.button>
          </div>
        
        {filteredConsultas.length > 0 ? (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tratamiento</th>
                  <th>Monto</th>
                  <th>Medio de Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultas
                  .sort((a, b) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())
                  .map((consulta) => (
                    <tr key={consulta.id}>
                      <td>
                        {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td>
                        {consulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                      </td>
                      <td className="font-medium">
                        ${consulta.monto_ars.toLocaleString('es-AR')} ARS
                      </td>
                      <td>
                        <span className="capitalize">{consulta.medio_pago}</span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {consulta.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingConsulta(consulta);
                              setShowAddConsultaModal(true);
                            }}
                            className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredConsultas
              .sort((a, b) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())
              .map((consulta) => (
                <motion.div
                  key={consulta.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <h4 className="font-bold text-gray-900">
                        {consulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                      </h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                      consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {consulta.estado}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-bold text-gray-900">${consulta.monto_ars.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pago:</span>
                      <span className="capitalize text-gray-900">{consulta.medio_pago}</span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingConsulta(consulta);
                      setShowAddConsultaModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </motion.button>
                </motion.div>
              ))}
          </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay prestaciones</h3>
            <p className="text-gray-600">
              {selectedPeriod === 'all' 
                ? 'Este paciente no tiene prestaciones registradas'
                : 'No hay prestaciones en el período seleccionado'
              }
            </p>
          </div>
        )}
        </div>
      </AnimatedCard>

      {/* Clinical Notes Modal */}
      {showClinicalModal && selectedConsultationId && (
        <ClinicalNotesModal
          isOpen={showClinicalModal}
          onClose={() => {
            setShowClinicalModal(false);
            setSelectedConsultationId(null);
          }}
          consultationId={selectedConsultationId}
          patientName={patientName || 'Paciente'}
          onSave={handleSaveClinicalNote}
        />
      )}

      {/* Add Consulta Modal */}
      <AddConsultaModal
        isOpen={showAddConsultaModal}
        onClose={() => {
          setShowAddConsultaModal(false);
          setEditingConsulta(null);
        }}
        editingConsulta={editingConsulta}
        preselectedPatientId={patientId || undefined}
        preselectedPatientName={patientName || undefined}
      />

      {/* Quick Appointment Modal */}
      {patientId && patientName ? (
        <QuickAppointmentModal
          isOpen={showQuickAppointmentModal}
          onClose={() => setShowQuickAppointmentModal(false)}
          patientId={patientId}
          patientName={patientName}
          onSuccess={() => {
            setShowQuickAppointmentModal(false);
          }}
        />
      ) : showQuickAppointmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-gray-600 mb-4">Cargando información del paciente...</p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      {/* Edit Paciente Modal */}
      <AddPacienteModal
        isOpen={showEditPacienteModal}
        onClose={() => setShowEditPacienteModal(false)}
        editingPatientId={patientId || undefined}
        initialData={currentPatient ? {
          nombre: currentPatient.nombre,
          apellido: currentPatient.apellido,
          dni: currentPatient.dni,
          email: currentPatient.email,
          telefono: currentPatient.telefono,
          fecha_nacimiento: currentPatient.fecha_nacimiento,
          obra_social: currentPatient.obra_social,
          alergias: currentPatient.alergias,
          medicamentos_actuales: currentPatient.medicamentos_actuales
        } : undefined}
        onSuccess={() => {
          refetchPatients();
          setShowEditPacienteModal(false);
        }}
      />
    </div>
  );
};

export default PatientDashboardPage;
