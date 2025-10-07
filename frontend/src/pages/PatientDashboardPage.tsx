import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesService, consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedCard from '@/components/AnimatedCard';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Activity, TrendingUp, Clock, CreditCard, FileText, Plus, Sparkles, User } from 'lucide-react';
import ClinicalNotesModal from '@/components/ClinicalNotesModal';

const PatientDashboardPage: React.FC = () => {
  const { patientName: encodedPatientName } = useParams<{ patientName: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showClinicalModal, setShowClinicalModal] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);

  // Decode the patient name from URL
  const patientName = encodedPatientName ? decodeURIComponent(encodedPatientName) : null;

  // Fetch patient consultations
  const { data: consultas, isLoading: loadingConsultas } = useQuery(
    ['patient-consultas', patientName],
    () => patientName ? consultasService.getConsultasByPaciente(patientName) : Promise.resolve([]),
    { enabled: !!patientName }
  );

  if (loadingConsultas) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!patientName || !consultas) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Paciente no encontrado</h3>
        <button onClick={() => navigate('/pacientes')} className="btn-primary">
          Volver a Pacientes
        </button>
      </div>
    );
  }

  // Filter consultations by period
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

      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard delay={0.1}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consultas</p>
                <p className="text-3xl font-bold gradient-text">{totalConsultas}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.15}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                <p className="text-3xl font-bold gradient-text">${totalGastado.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio</p>
                <p className="text-3xl font-bold gradient-text">${promedioConsulta.toLocaleString('es-AR')}</p>
              </div>
              <div className="bg-purple-100 rounded-xl p-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.25}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tratamiento Frecuente</p>
                <p className="text-sm font-bold gradient-text truncate">{tratamientoMasFrecuente}</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-3">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Patient Timeline */}
      {primeraConsulta && ultimaConsulta && (
        <AnimatedCard delay={0.3}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Línea de Tiempo del Paciente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Primera Consulta</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(primeraConsulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500">
                {primeraConsulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Última Consulta</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(ultimaConsulta.fecha_consulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500">
                {ultimaConsulta.prestacion_usuario?.nombre_personalizado || 'Sin especificar'}
              </p>
            </div>
          </div>
          </div>
        </AnimatedCard>
      )}

      {/* Treatment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard delay={0.35}>
          <div className="glass rounded-2xl shadow-soft p-6 border border-white/20 h-full">
          <h3 className="text-lg font-semibold mb-4">📊 Tratamientos Realizados</h3>
          <div className="space-y-3">
            {Object.entries(tratamientos)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([tratamiento, cantidad]) => (
                <div key={tratamiento} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-3">{tratamiento}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{cantidad}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(cantidad / Math.max(...Object.values(tratamientos))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="dental-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
            Medios de Pago Utilizados
          </h3>
          <div className="space-y-3">
            {Object.entries(mediosPago)
              .sort(([,a], [,b]) => b - a)
              .map(([medio, cantidad]) => (
                <div key={medio} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{medio}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{cantidad}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(cantidad / totalConsultas) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Consultation History */}
      <AnimatedCard delay={0.45}>
        <div className="glass rounded-2xl shadow-soft p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">📋 Historial de Consultas</h3>
        
        {filteredConsultas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tratamiento</th>
                  <th>Monto</th>
                  <th>Medio de Pago</th>
                  <th>Estado</th>
                  <th>Historia Clínica</th>
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
                        <button
                          onClick={() => handleAddClinicalNote(consulta.id)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Ver/Agregar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay consultas</h3>
            <p className="text-gray-600">
              {selectedPeriod === 'all' 
                ? 'Este paciente no tiene consultas registradas'
                : 'No hay consultas en el período seleccionado'
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
    </div>
  );
};

export default PatientDashboardPage;
