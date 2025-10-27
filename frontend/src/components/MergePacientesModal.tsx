import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X, Users, AlertTriangle, Check, Loader2, Phone, Mail, Hash, Search } from 'lucide-react';
import { pacientesService } from '@/services';
import { Paciente } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MergePacientesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MergePacientesModal({ isOpen, onClose }: MergePacientesModalProps) {
  const [selectedPrincipal, setSelectedPrincipal] = useState<Paciente | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Paciente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch all patients
  const { data: allPatients = [], isLoading: loadingPatients } = useQuery(
    'pacientes',
    () => pacientesService.getPacientes({ limit: 1000 }),
    { enabled: isOpen }
  );

  // Filter patients by search
  const filteredPatients = React.useMemo(() => {
    if (!Array.isArray(allPatients)) return [];
    if (!searchQuery.trim()) return allPatients;
    const query = searchQuery.toLowerCase();
    return allPatients.filter(p => {
      const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
      return fullName.includes(query) || 
             p.dni?.toLowerCase().includes(query) ||
             p.email?.toLowerCase().includes(query);
    });
  }, [allPatients, searchQuery]);

  // Merge mutation
  const mergeMutation = useMutation(
    ({ principalId, duplicateId }: { principalId: number; duplicateId: number }) =>
      pacientesService.mergePacientes(principalId, duplicateId),
    {
      onSuccess: () => {
        toast.success('¡Pacientes fusionados exitosamente!');
        queryClient.invalidateQueries('pacientes');
        queryClient.invalidateQueries('patient-duplicates');
        setSelectedPrincipal(null);
        setSelectedDuplicate(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al fusionar pacientes');
      },
    }
  );

  const handleMerge = () => {
    if (!selectedPrincipal || !selectedDuplicate) {
      toast.error('Debes seleccionar ambos pacientes');
      return;
    }

    if (selectedPrincipal.id === selectedDuplicate.id) {
      toast.error('No puedes fusionar un paciente consigo mismo');
      return;
    }

    mergeMutation.mutate({
      principalId: selectedPrincipal.id,
      duplicateId: selectedDuplicate.id,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Fusionar Pacientes</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Selecciona los pacientes que deseas fusionar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPatients ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Selected patients summary */}
                {(selectedPrincipal || selectedDuplicate) && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Pacientes Seleccionados:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-purple-600 mb-1">Principal (mantener):</p>
                        {selectedPrincipal ? (
                          <p className="font-medium text-purple-900">{selectedPrincipal.nombre} {selectedPrincipal.apellido}</p>
                        ) : (
                          <p className="text-gray-400 italic">Selecciona un paciente</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-red-600 mb-1">Duplicado (eliminar):</p>
                        {selectedDuplicate ? (
                          <p className="font-medium text-red-900">{selectedDuplicate.nombre} {selectedDuplicate.apellido}</p>
                        ) : (
                          <p className="text-gray-400 italic">Selecciona un paciente</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Modo Manual</h4>
                      <p className="text-sm text-blue-800">
                        Selecciona 2 pacientes: uno como principal (mantener) y otro como duplicado (eliminar). 
                        Todas las consultas del duplicado se moverán al principal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patients List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <PatientCardManual
                      key={patient.id}
                      patient={patient}
                      isPrincipal={selectedPrincipal?.id === patient.id}
                      isDuplicate={selectedDuplicate?.id === patient.id}
                      onSelectAsPrincipal={() => setSelectedPrincipal(patient)}
                      onSelectAsDuplicate={() => setSelectedDuplicate(patient)}
                    />
                  ))}
                </div>

                {filteredPatients.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No se encontraron pacientes
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(selectedPrincipal || selectedDuplicate) && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedPrincipal && selectedDuplicate ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      Listo para fusionar: <strong>{selectedPrincipal.nombre} {selectedPrincipal.apellido}</strong> ← <strong>{selectedDuplicate.nombre} {selectedDuplicate.apellido}</strong>
                    </span>
                  </div>
                ) : (
                  'Selecciona los pacientes para fusionar'
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMerge}
                  disabled={!selectedPrincipal || !selectedDuplicate || mergeMutation.isLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {mergeMutation.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fusionando...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Fusionar Pacientes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface PatientCardManualProps {
  patient: Paciente;
  isPrincipal: boolean;
  isDuplicate: boolean;
  onSelectAsPrincipal: () => void;
  onSelectAsDuplicate: () => void;
}

function PatientCardManual({
  patient,
  isPrincipal,
  isDuplicate,
  onSelectAsPrincipal,
  onSelectAsDuplicate,
}: PatientCardManualProps) {
  return (
    <div className={`border-2 rounded-lg p-3 transition-all ${
      isPrincipal 
        ? 'border-green-500 bg-green-50' 
        : isDuplicate 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h5 className="font-bold text-base text-gray-900 truncate">
            {patient.nombre} {patient.apellido}
          </h5>
          <p className="text-xs text-gray-500">ID: {patient.id}</p>
          {isPrincipal && (
            <span className="inline-block px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium mt-1">
              Principal ✓
            </span>
          )}
          {isDuplicate && (
            <span className="inline-block px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-medium mt-1">
              Duplicado ✗
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-3 text-xs text-gray-600">
        {patient.dni && (
          <div className="flex items-center gap-1 truncate">
            <Hash className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{patient.dni}</span>
          </div>
        )}
        {patient.telefono && (
          <div className="flex items-center gap-1 truncate">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{patient.telefono}</span>
          </div>
        )}
        {patient.email && (
          <div className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSelectAsPrincipal}
          disabled={isDuplicate}
          className={`px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            isPrincipal
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isPrincipal ? '✓ Principal' : 'Mantener'}
        </button>
        <button
          onClick={onSelectAsDuplicate}
          disabled={isPrincipal}
          className={`px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            isDuplicate
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isDuplicate ? '✓ Duplicado' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}
