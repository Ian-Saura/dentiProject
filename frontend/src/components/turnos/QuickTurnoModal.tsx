import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Clock, Save, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
}

interface QuickTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fecha: string;
  hora: string;
  onSuccess: () => void;
}

export default function QuickTurnoModal({
  isOpen,
  onClose,
  fecha,
  hora,
  onSuccess,
}: QuickTurnoModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [duracion, setDuracion] = useState(30);
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar pacientes mientras escribe
  useEffect(() => {
    const searchPacientes = async () => {
      if (searchTerm.length < 1) {
        setPacientes([]);
        setShowDropdown(false);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(`/v1/pacientes/?q=${encodeURIComponent(searchTerm)}&limit=5`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Pacientes encontrados:', data); // Debug
          setPacientes(data);
          setShowDropdown(true); // Mostrar siempre para indicar "sin resultados"
        } else {
          console.error('Error en respuesta:', response.status);
          setPacientes([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Error buscando pacientes:', error);
        setPacientes([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchPacientes, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setPacienteId(paciente.id);
    setSearchTerm(`${paciente.nombre} ${paciente.apellido} - DNI: ${paciente.dni}`);
    setNombre(paciente.nombre);
    setApellido(paciente.apellido);
    setDni(paciente.dni);
    setTelefono(paciente.telefono || '');
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      toast.error('Nombre, apellido y DNI son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/v1/turnos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          fecha,
          hora_inicio: hora,
          duracion_minutos: duracion,
          paciente_id: pacienteId, // Si seleccionó un paciente existente
          nombre_paciente: nombre,
          apellido_paciente: apellido,
          dni_paciente: dni, // DNI obligatorio
          telefono_paciente: telefono || undefined,
        }),
      });

      if (!response.ok) throw new Error('Error al crear turno');

      toast.success('✅ Turno creado exitosamente');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNombre('');
    setApellido('');
    setTelefono('');
    setDuracion(30);
    onClose();
  };

  if (!isOpen) return null;

  // Format fecha para mostrar
  const fechaObj = new Date(fecha + 'T00:00:00');
  const fechaFormateada = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Nuevo Turno Rápido
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">
                {fechaFormateada}
              </p>
              <p className="text-sm font-medium text-blue-600">
                Hora: {hora}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Búsqueda de paciente */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Paciente Existente
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length >= 1 && setShowDropdown(true)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan, JP, 12345678..."
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Puedes buscar por iniciales (ej: "JP" para Juan Pérez)
              </p>
              
              {/* Dropdown de resultados */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="px-3 py-4 text-center text-gray-500">
                      <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Buscando...</span>
                    </div>
                  ) : pacientes.length > 0 ? (
                    pacientes.map((paciente) => (
                      <button
                        key={paciente.id}
                        type="button"
                        onClick={() => handleSelectPaciente(paciente)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {paciente.nombre} {paciente.apellido}
                        </div>
                        {paciente.dni && (
                          <div className="text-xs text-gray-500">DNI: {paciente.dni}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500">
                      <p className="text-sm">No se encontraron pacientes</p>
                      <p className="text-xs mt-1">Completa los campos para crear uno nuevo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Separador */}
            {!selectedPaciente && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">o crear nuevo</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan"
                    required
                    disabled={!!selectedPaciente}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pérez"
                    required
                    disabled={!!selectedPaciente}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678"
                  required
                  disabled={!!selectedPaciente}
                  minLength={7}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPaciente 
                    ? '✓ Paciente existente - se vinculará automáticamente' 
                    : 'Se buscará o creará el paciente con este DNI'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración
              </label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>💡 Tip:</strong> Solo necesitas nombre y apellido para crear el turno rápidamente. Puedes agregar más detalles después.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Crear Turno</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
