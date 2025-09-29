import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { consultasService } from '@/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, Plus, Search, Filter } from 'lucide-react';

interface ConsultaForm {
  paciente_nombre: string;
  paciente_apellido: string;
  tratamiento: string;
  monto_ars: number;
  medio_pago: string;
  fecha_consulta: string;
}

const ConsultasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [formData, setFormData] = useState<ConsultaForm>({
    paciente_nombre: '',
    paciente_apellido: '',
    tratamiento: 'Consulta',
    monto_ars: 30000,
    medio_pago: 'Efectivo',
    fecha_consulta: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    mostrar_desde: 'Más recientes',
    cantidad: '25',
    ordenar_por: 'Fecha (desc)',
  });

  const queryClient = useQueryClient();

  const { data: consultasData, isLoading } = useQuery(
    ['consultas', filters],
    () => consultasService.getConsultas({
      limit: filters.cantidad === 'Todas' ? 100 : parseInt(filters.cantidad),
      order_by: filters.ordenar_por,
    }),
    { keepPreviousData: true }
  );

  // Create consultation mutation
  const createMutation = useMutation(consultasService.createConsulta, {
    onSuccess: () => {
      queryClient.invalidateQueries('consultas');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
      setShowForm(false);
      resetForm();
    }
  });

  // Update consultation mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: ConsultaForm }) => 
      consultasService.updateConsulta(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('consultas');
        queryClient.invalidateQueries('analytics-resumen');
        queryClient.invalidateQueries('analytics-kpis');
        setEditingConsulta(null);
        setShowForm(false);
        resetForm();
      }
    }
  );

  // Delete consultation mutation
  const deleteMutation = useMutation(consultasService.deleteConsulta, {
    onSuccess: () => {
      queryClient.invalidateQueries('consultas');
      queryClient.invalidateQueries('analytics-resumen');
      queryClient.invalidateQueries('analytics-kpis');
    }
  });

  const resetForm = () => {
    setFormData({
      paciente_nombre: '',
      paciente_apellido: '',
      tratamiento: 'Consulta',
      monto_ars: 30000,
      medio_pago: 'Efectivo',
      fecha_consulta: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingConsulta) {
      updateMutation.mutate({ id: editingConsulta.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConsulta(null);
    resetForm();
  };

  const handleEdit = (consulta: Consulta) => {
    setEditingConsulta(consulta);
    setFormData({
      paciente_nombre: consulta.paciente.nombre,
      paciente_apellido: consulta.paciente.apellido,
      tratamiento: consulta.prestacion_usuario.nombre_personalizado,
      monto_ars: consulta.monto_ars,
      medio_pago: consulta.medio_pago,
      fecha_consulta: consulta.fecha_consulta.split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta consulta?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Consultas</h1>
            <p className="text-gray-600">Administra todas las consultas de tu consultorio</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Consulta</span>
        </button>
      </div>

      {/* Filters */}
      <div className="dental-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por paciente..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="form-input"
              value={filters.mostrar_desde}
              onChange={(e) => setFilters({ ...filters, mostrar_desde: e.target.value })}
            >
              <option>Más recientes</option>
              <option>Este mes</option>
              <option>Último mes</option>
              <option>Este año</option>
            </select>
            <select
              className="form-input"
              value={filters.cantidad}
              onChange={(e) => setFilters({ ...filters, cantidad: e.target.value })}
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingConsulta ? 'Editar Consulta' : 'Nueva Consulta'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    value={formData.paciente_nombre}
                    onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.paciente_apellido}
                    onChange={(e) => setFormData({ ...formData, paciente_apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratamiento *
                </label>
                <select
                  value={formData.tratamiento}
                  onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (ARS) *
                </label>
                <input
                  type="number"
                  value={formData.monto_ars}
                  onChange={(e) => setFormData({ ...formData, monto_ars: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medio de Pago *
                </label>
                <select
                  value={formData.medio_pago}
                  onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de la Consulta *
                </label>
                <input
                  type="date"
                  value={formData.fecha_consulta}
                  onChange={(e) => setFormData({ ...formData, fecha_consulta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="dental-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Consultas ({consultasData?.total || 0})
          </h3>
          <Filter className="h-5 w-5 text-gray-400" />
        </div>

        {consultasData?.data && consultasData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Tratamiento</th>
                  <th>Monto</th>
                  <th>Medio de Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultasData.data.map((consulta) => (
                  <tr key={consulta.id}>
                    <td>
                      {new Date(consulta.fecha_consulta).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      {consulta.paciente ? 
                        `${consulta.paciente.nombre} ${consulta.paciente.apellido}` : 
                        'N/A'
                      }
                    </td>
                    <td>
                      {consulta.prestacion_usuario?.nombre_personalizado || 
                       consulta.prestacion_usuario?.prestacion?.nombre || 
                       'N/A'}
                    </td>
                    <td className="font-medium">
                      ${consulta.monto_ars.toLocaleString()} ARS
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
                        <button 
                          onClick={() => handleEdit(consulta)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(consulta.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay consultas</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No se encontraron consultas con ese criterio' : 'Aún no hay consultas registradas'}
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Registrar Primera Consulta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultasPage;
