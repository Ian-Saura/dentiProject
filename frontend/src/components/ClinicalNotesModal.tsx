import React, { useState } from 'react';
import { X, Save, FileText, Calendar, User } from 'lucide-react';

interface ClinicalNote {
  id?: number;
  consultation_id: number;
  diagnosis: string;
  treatment_plan: string;
  notes: string;
  created_at?: string;
}

interface ClinicalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: number;
  patientName: string;
  onSave: (note: ClinicalNote) => void;
  existingNote?: ClinicalNote;
}

const ClinicalNotesModal: React.FC<ClinicalNotesModalProps> = ({
  isOpen,
  onClose,
  consultationId,
  patientName,
  onSave,
  existingNote
}) => {
  const [formData, setFormData] = useState<ClinicalNote>({
    consultation_id: consultationId,
    diagnosis: existingNote?.diagnosis || '',
    treatment_plan: existingNote?.treatment_plan || '',
    notes: existingNote?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      consultation_id: consultationId,
      diagnosis: '',
      treatment_plan: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {existingNote ? 'Editar' : 'Nueva'} Historia Clínica
              </h2>
              <p className="text-sm text-gray-600">
                Paciente: {patientName} | Consulta #{consultationId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Diagnóstico
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el diagnóstico clínico del paciente..."
              required
            />
          </div>

          {/* Treatment Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 Plan de Tratamiento
            </label>
            <textarea
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalla el plan de tratamiento propuesto..."
              required
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notas Clínicas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales, evolución del paciente, recomendaciones..."
            />
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Dr. Usuario</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{existingNote ? 'Actualizar' : 'Guardar'} Historia Clínica</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Quick Templates */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🚀 Plantillas Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Caries dental',
                treatment_plan: 'Operatoria dental con composite'
              })}
              className="text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border"
            >
              <strong>Caries:</strong> Operatoria dental
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Gingivitis',
                treatment_plan: 'Profilaxis y educación en higiene oral'
              })}
              className="text-left p-2 text-sm bg-green-50 hover:bg-green-100 rounded border"
            >
              <strong>Gingivitis:</strong> Profilaxis
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Pulpitis irreversible',
                treatment_plan: 'Endodoncia + corona'
              })}
              className="text-left p-2 text-sm bg-red-50 hover:bg-red-100 rounded border"
            >
              <strong>Pulpitis:</strong> Endodoncia
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Consulta de rutina',
                treatment_plan: 'Control y mantenimiento'
              })}
              className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
            >
              <strong>Rutina:</strong> Control
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotesModal;
