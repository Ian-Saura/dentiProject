import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { pacientesService, consultasService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Edit, Trash2, Users, Sparkles, X, BarChart3, ArrowUpDown, Plus, AlertCircle, CheckSquare, Square, UserX, GitMerge } from 'lucide-react';
import MergePacientesModal from '../components/MergePacientesModal';
import AddPacienteModal from '../components/AddPacienteModal';
import { toast } from 'react-hot-toast';
import { formatDateToDDMMYYYY, calculateAge } from '../utils/dateFormat';
import { useAppMode } from '../contexts/AppModeContext';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  obra_social?: string;
  activo: boolean;
  alergias?: string;
  medicamentos_actuales?: string;
  observaciones_medicas?: string;
}

const PacientesPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const [showForm, setShowForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'apellido' | 'fecha_registro'>('apellido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Fetch patients
  const { data: pacientes, isLoading, error} = useQuery<Paciente[]>(
    'pacientes',
    () => pacientesService.getPacientes()
  );

  // Fetch all consultas to get prestaciones count per patient
  const { data: consultasData } = useQuery(
    'consultas',
    () => consultasService.getConsultas({ limit: 5000 }),
    { enabled: !!pacientes }
  );

  // Create a map of patient ID to consultas count
  const consultasPorPaciente = React.useMemo(() => {
    if (!consultasData?.data) return {};
    const map: Record<number, number> = {};
    consultasData.data.forEach((consulta: any) => {
      if (consulta.paciente?.id) {
        map[consulta.paciente.id] = (map[consulta.paciente.id] || 0) + 1;
      }
    });
    return map;
  }, [consultasData]);

  // Filter and sort patients
  const filteredAndSortedPacientes = React.useMemo(() => {
    if (!pacientes) return [];
    
    // First, filter by search query
    let filtered = pacientes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = pacientes.filter(p => {
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const dni = p.dni?.toLowerCase() || '';
        const email = p.email?.toLowerCase() || '';
        const telefono = p.telefono?.toLowerCase() || '';
        
        return (
          nombreCompleto.includes(query) ||
          p.nombre.toLowerCase().includes(query) ||
          p.apellido.toLowerCase().includes(query) ||
          dni.includes(query) ||
          email.includes(query) ||
          telefono.includes(query)
        );
      });
    }
    
    // Then, sort
    return [...filtered].sort((a, b) => {
      let compareA, compareB;
      
      if (sortBy === 'nombre') {
        compareA = a.nombre.toLowerCase();
        compareB = b.nombre.toLowerCase();
      } else if (sortBy === 'apellido') {
        compareA = a.apellido.toLowerCase();
        compareB = b.apellido.toLowerCase();
      } else {
        // fecha_registro - assuming it exists or using id as proxy
        compareA = a.id;
        compareB = b.id;
      }
      
      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pacientes, sortBy, sortOrder, searchQuery]);

  // Delete patient mutation
  const deleteMutation = useMutation(pacientesService.deletePaciente, {
    onSuccess: () => {
      queryClient.invalidateQueries('pacientes');
    }
  });

  // Bulk delete patients mutation
  const bulkDeleteMutation = useMutation(
    async (ids: number[]) => {
      await Promise.all(ids.map(id => pacientesService.deletePaciente(id)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pacientes');
        setSelectedIds(new Set());
        toast.success('Pacientes eliminados correctamente');
      },
      onError: () => {
        toast.error('Error al eliminar pacientes');
      }
    }
  );

  // Bulk mark as inactive mutation
  const bulkInactivateMutation = useMutation(
    async (ids: number[]) => {
      await Promise.all(ids.map(id => 
        pacientesService.updatePaciente(id, { activo: false } as any)
      ));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pacientes');
        setSelectedIds(new Set());
        toast.success('Pacientes marcados como inactivos');
      },
      onError: () => {
        toast.error('Error al marcar pacientes como inactivos');
      }
    }
  );

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedPacientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedPacientes.map(p => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    
    const confirmed = window.confirm(
      `⚠️ ADVERTENCIA: Vas a ELIMINAR PERMANENTEMENTE ${count} paciente(s).\n\n` +
      `Esto eliminará:\n` +
      `• Todos los datos del paciente\n` +
      `• Todas sus consultas\n` +
      `• Todo el historial clínico\n` +
      `• Todos los turnos asociados\n\n` +
      `❌ Esta acción NO SE PUEDE DESHACER.\n\n` +
      `¿Estás completamente seguro de que quieres continuar?`
    );
    
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkInactivate = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    
    const confirmed = window.confirm(
      `¿Marcar ${count} paciente(s) como inactivos?\n\n` +
      `Los pacientes inactivos no aparecerán en las búsquedas pero podrás reactivarlos después.`
    );
    
    if (confirmed) {
      bulkInactivateMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este paciente?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error al cargar pacientes</div>;

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
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-black flex items-center gap-2"
              >
                <Sparkles className="h-8 w-8 animate-pulse" />
                Gestión de Pacientes
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-1 text-lg"
              >
                Administra la información de tus pacientes
              </motion.p>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMergeModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center space-x-2 text-base shadow-lg"
            >
              <GitMerge className="h-5 w-5" />
              <span>Fusionar Pacientes</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="btn-premium flex items-center space-x-2 text-base"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Paciente</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="glass rounded-2xl p-4 shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, DNI, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dental-500 text-gray-700"
              >
                <option value="apellido">Apellido</option>
                <option value="nombre">Nombre</option>
                <option value="fecha_registro">Más recientes</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2.5 bg-white/80 border-2 border-gray-200 rounded-xl hover:bg-dental-50 transition-colors"
                title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
              >
                <ArrowUpDown className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredAndSortedPacientes.length} {filteredAndSortedPacientes.length === 1 ? 'resultado' : 'resultados'} encontrados
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Paciente Modal */}
      <AddPacienteModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPaciente(null);
        }}
        editingPatientId={editingPaciente?.id}
        initialData={editingPaciente ? {
          nombre: editingPaciente.nombre,
          apellido: editingPaciente.apellido,
          dni: editingPaciente.dni,
          email: editingPaciente.email,
          telefono: editingPaciente.telefono,
          fecha_nacimiento: editingPaciente.fecha_nacimiento,
          obra_social: editingPaciente.obra_social,
          alergias: editingPaciente.alergias,
          medicamentos_actuales: editingPaciente.medicamentos_actuales,
          observaciones_medicas: editingPaciente.observaciones_medicas
        } : undefined}
        onSuccess={() => {
          setShowForm(false);
          setEditingPaciente(null);
          queryClient.invalidateQueries('pacientes');
        }}
      />

      {/* Premium Patients Grid */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold gradient-text mb-1">Pacientes Registrados</h3>
            <p className="text-gray-600">Gestiona tu cartera de pacientes ({filteredAndSortedPacientes?.length || 0} pacientes)</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'nombre' | 'apellido' | 'fecha_registro')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dental-500 bg-white"
            >
              <option value="apellido">Apellido</option>
              <option value="nombre">Nombre</option>
              <option value="fecha_registro">Fecha</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {filteredAndSortedPacientes && filteredAndSortedPacientes.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              {selectedIds.size === filteredAndSortedPacientes.length ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span>Deseleccionar Todos</span>
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  <span>Seleccionar Todos ({filteredAndSortedPacientes.length})</span>
                </>
              )}
            </button>
            
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600 font-medium">
                  {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
                </span>
                
                <button
                  onClick={handleBulkInactivate}
                  disabled={bulkInactivateMutation.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  <span>Marcar como Inactivos</span>
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar Permanentemente</span>
                </button>
              </>
            )}
          </div>
        )}

        {filteredAndSortedPacientes?.length === 0 ? (
          <AnimatedCard delay={0.2}>
            <div className="text-center py-16 px-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-dental rounded-3xl flex items-center justify-center shadow-glow-dental">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text mb-3">No hay pacientes</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Comienza agregando tu primer paciente para gestionar su historial y tratamientos
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="btn-premium inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Primer Paciente
                </motion.button>
              </motion.div>
            </div>
          </AnimatedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPacientes?.map((paciente: Paciente, index) => (
              <AnimatedCard key={paciente.id} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-dental-400 transition-all duration-300"
                >
                  {/* Header with Avatar */}
                  <div className="bg-gradient-dental p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    
                    {/* Checkbox for selection */}
                    <div className="absolute top-3 left-3 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(paciente.id);
                        }}
                        className="w-6 h-6 rounded bg-white/20 backdrop-blur-sm border-2 border-white/50 hover:bg-white/30 flex items-center justify-center transition-all"
                      >
                        {selectedIds.has(paciente.id) ? (
                          <CheckSquare className="h-4 w-4 text-white fill-white" />
                        ) : (
                          <Square className="h-4 w-4 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                          <span className="text-2xl font-bold text-white">
                            {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {paciente.nombre} {paciente.apellido}
                          </h4>
                          <p className="text-xs text-white/80">ID: {paciente.id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        paciente.activo 
                          ? 'bg-green-400 text-green-900' 
                          : 'bg-gray-400 text-gray-900'
                      }`}>
                        {paciente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* DNI Temporal Warning */}
                    {paciente.dni && paciente.dni.startsWith('CSV-') && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-900">DNI Temporal</p>
                          <p className="text-xs text-amber-700 truncate">{paciente.dni}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {paciente.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span className="truncate">{paciente.email}</span>
                        </div>
                      )}
                      {paciente.telefono && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span>{paciente.telefono}</span>
                        </div>
                      )}
                      {paciente.obra_social && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-dental-500"></div>
                          <span>{paciente.obra_social}</span>
                        </div>
                      )}
                    </div>

                    {/* Birth Date & Age */}
                    {paciente.fecha_nacimiento && (
                      <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium mb-1">Nacimiento</div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-blue-900">
                            {formatDateToDDMMYYYY(paciente.fecha_nacimiento)}
                          </div>
                          {calculateAge(paciente.fecha_nacimiento) && (
                            <div className="text-xl font-black text-blue-600">
                              {calculateAge(paciente.fecha_nacimiento)} años
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prestaciones Count */}
                    <div className="mb-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-green-700 font-medium">Prestaciones</div>
                        <div className="text-2xl font-black text-green-600">
                          {consultasPorPaciente[paciente.id] || 0}
                        </div>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {consultasPorPaciente[paciente.id] === 1 ? 'tratamiento realizado' : 'tratamientos realizados'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const fullName = `${paciente.nombre}${paciente.apellido ? ' ' + paciente.apellido : ''}`.trim();
                          navigate(`/${mode}/pacientes/${encodeURIComponent(fullName)}/dashboard`);
                        }}
                        className="flex flex-col items-center gap-1 p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Ver</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(paciente)}
                        className="flex flex-col items-center gap-1 p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(paciente.id)}
                        disabled={deleteMutation.isLoading}
                        className="flex flex-col items-center gap-1 p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>

      {/* Merge Patients Modal */}
      <MergePacientesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
      />
    </div>
  );
};

export default PacientesPage;