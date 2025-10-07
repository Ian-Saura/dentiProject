import React, { useState } from 'react';
import { X, Save, FileText, Calendar, User, Stethoscope, Clipboard, HeartPulse, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Premium Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl"
                >
                  <FileText className="h-8 w-8" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black mb-2"
                  >
                    {existingNote ? 'Editar' : 'Nueva'} Historia Clínica
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-4 text-white/90"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{patientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Consulta #{consultationId}</span>
                    </div>
                  </motion.div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Diagnosis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <Stethoscope className="h-5 w-5 text-red-600" />
              </div>
              <span>Diagnóstico</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 text-gray-800 placeholder-gray-400"
              placeholder="Describe el diagnóstico clínico del paciente..."
              required
            />
          </motion.div>

          {/* Treatment Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clipboard className="h-5 w-5 text-blue-600" />
              </div>
              <span>Plan de Tratamiento</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 text-gray-800 placeholder-gray-400"
              placeholder="Detalla el plan de tratamiento propuesto..."
              required
            />
          </motion.div>

          {/* Clinical Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <HeartPulse className="h-5 w-5 text-purple-600" />
              </div>
              <span>Notas Clínicas</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 text-gray-800 placeholder-gray-400"
              placeholder="Observaciones adicionales, evolución del paciente, recomendaciones..."
            />
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-100"
          >
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span>Dr. Usuario</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <span>{new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="h-5 w-5" />
              <span>{existingNote ? 'Actualizar' : 'Guardar'} Historia Clínica</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl transition-all font-bold border-2 border-gray-200"
            >
              Cancelar
            </motion.button>
          </motion.div>
        </form>

        {/* Quick Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-6 border-t-2 border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span>Plantillas Rápidas</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Caries dental',
                treatment_plan: 'Operatoria dental con composite'
              })}
              className="text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <strong className="text-blue-900 text-sm block">Caries Dental</strong>
                  <span className="text-xs text-blue-700">Operatoria con composite</span>
                </div>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Gingivitis',
                treatment_plan: 'Profilaxis y educación en higiene oral'
              })}
              className="text-left p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border-2 border-green-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <strong className="text-green-900 text-sm block">Gingivitis</strong>
                  <span className="text-xs text-green-700">Profilaxis e higiene</span>
                </div>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Pulpitis irreversible',
                treatment_plan: 'Endodoncia + corona'
              })}
              className="text-left p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl border-2 border-red-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <strong className="text-red-900 text-sm block">Pulpitis Irreversible</strong>
                  <span className="text-xs text-red-700">Endodoncia + corona</span>
                </div>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFormData({
                ...formData,
                diagnosis: 'Consulta de rutina',
                treatment_plan: 'Control y mantenimiento'
              })}
              className="text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border-2 border-gray-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-500 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <strong className="text-gray-900 text-sm block">Consulta de Rutina</strong>
                  <span className="text-xs text-gray-700">Control y mantenimiento</span>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClinicalNotesModal;
