import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesService, consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import Odontograma from '@/components/Odontograma';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Activity, TrendingUp, Clock, CreditCard, FileText, Plus, Sparkles, User, Edit } from 'lucide-react';
import ClinicalNotesModal from '@/components/ClinicalNotesModal';
import AddConsultaModal from '@/components/AddConsultaModal';

const PatientDashboardPage: React.FC = () => {
  const { patientName: encodedPatientName } = useParams<{ patientName: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [showAddConsultaModal, setShowAddConsultaModal] = useState(false);
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

  // Fetch patient details to get ID even if no consultations
  const { data: pacientesData } = useQuery(
    'pacientes',
    () => pacientesService.getPacientes(),
    {
      enabled: !!patientName && !patientId,
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

  // Calculate statistics
  const totalConsultas = filteredConsultas.length;
  const totalGastado = filteredConsultas.reduce((sum, c) => sum + c.monto_ars, 0);
  const promedioConsulta = totalConsultas > 0 ? totalGastado / totalConsultas : 0;

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

  const tratamientoMasFrecuente = Object.entries(tratamientos)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

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

      {/* Instagram-Style Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard delay={0.1}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Prestaciones</p>
              <p className="text-4xl font-black mb-1">{totalConsultas}</p>
              <p className="text-white/80 text-xs font-medium">visitas totales</p>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.15}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Inversión Total</p>
              <p className="text-3xl font-black mb-1">${(totalGastado / 1000).toFixed(1)}K</p>
              <p className="text-white/80 text-xs font-medium">en salud dental</p>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Promedio/Visita</p>
              <p className="text-3xl font-black mb-1">${(promedioConsulta / 1000).toFixed(1)}K</p>
              <p className="text-white/80 text-xs font-medium">inversión media</p>
            </div>
          </motion.div>
        </AnimatedCard>

        <AnimatedCard delay={0.25}>
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative overflow-hidden rounded-2xl p-5 h-full bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white shadow-xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-white/90 text-xs font-medium mb-1">Tratamiento Top</p>
              <p className="text-base font-black mb-1 leading-tight truncate">{tratamientoMasFrecuente}</p>
              <p className="text-white/80 text-xs font-medium">más realizado</p>
            </div>
          </motion.div>
        </AnimatedCard>
      </div>

      {/* Odontograma Visual */}
      <AnimatedCard delay={0.3}>
        <div className="relative z-30 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-cyan-200 shadow-xl overflow-visible">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Odontograma
              </h3>
              <p className="text-gray-600 mt-1">Mapa dental visual</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
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
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="gradient-text">Historia Clínica Visual</span>
              </h3>
            </div>

            {/* Timeline de Tratamientos */}
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500"></div>
              
              <div className="space-y-6">
                {filteredConsultas
                  .sort((a, b) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())
                  .map((consulta, index) => (
                    <motion.div
                      key={consulta.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-20"
                    >
                      {/* Punto en la línea */}
                      <div className="absolute left-6 top-4 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white shadow-lg z-10"></div>
                      
                      {/* Card del tratamiento */}
                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-gray-500">
                                {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                                consulta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {consulta.estado}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                              {consulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                            </h4>
                            {consulta.dientes_tratados && consulta.dientes_tratados.length > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-600">🦷 Dientes:</span>
                                <div className="flex gap-1">
                                  {consulta.dientes_tratados.sort((a, b) => a - b).map(tooth => (
                                    <span key={tooth} className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-lg text-xs font-bold">
                                      {tooth}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${consulta.monto_ars.toLocaleString('es-AR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                {consulta.medio_pago}
                              </span>
                            </div>
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

      {/* Patient Timeline */}
      {primeraConsulta && ultimaConsulta && (
        <AnimatedCard delay={0.3}>
          <div className="glass rounded-2xl shadow-soft p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="gradient-text">Línea de Tiempo del Paciente</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 p-3 rounded-xl shadow-md">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700 mb-1">Primera Prestación</p>
                    <p className="text-2xl font-black text-green-900">
                      {new Date(primeraConsulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <div className="mt-2 bg-white/60 px-3 py-1 rounded-lg inline-block">
                      <p className="text-sm font-medium text-green-800">
                        {primeraConsulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Última Prestación</p>
                    <p className="text-2xl font-black text-blue-900">
                      {new Date(ultimaConsulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <div className="mt-2 bg-white/60 px-3 py-1 rounded-lg inline-block">
                      <p className="text-sm font-medium text-blue-800">
                        {ultimaConsulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
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
    </div>
  );
};

export default PatientDashboardPage;
