import React from 'react';
import { AlertTriangle, Mail, Phone } from 'lucide-react';

interface TrialExpiredModalProps {
  diasRestantes?: number;
  mensaje?: string;
  onClose?: () => void;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ 
  diasRestantes, 
  mensaje,
  onClose 
}) => {
  const isExpired = diasRestantes !== undefined && diasRestantes < 0;
  const isAboutToExpire = diasRestantes !== undefined && diasRestantes >= 0 && diasRestantes <= 3;

  if (!isExpired && !isAboutToExpire && !mensaje) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-white ${isExpired ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-yellow-500 to-orange-600'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {isExpired ? '🚫 Período de Prueba Expirado' : '⏰ Tu Trial Está Por Expirar'}
              </h2>
              {diasRestantes !== undefined && diasRestantes >= 0 && (
                <p className="text-sm opacity-90 mt-1">
                  Te quedan {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-lg">
            {mensaje || (isExpired 
              ? 'Tu período de prueba gratuito ha terminado. Para seguir usando todas las funcionalidades de la aplicación, actualiza a Premium.'
              : 'Tu período de prueba está por terminar. Actualiza ahora para no perder acceso a todas las funcionalidades.'
            )}
          </p>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">✨ Plan Premium incluye:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Acceso ilimitado a todas las funcionalidades
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Reportes y analytics avanzados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Soporte prioritario
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Sin límites de consultas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Calculadora de precios inteligente
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">📞 Contáctanos para actualizar:</h3>
            <div className="space-y-2">
              <a
                href="mailto:contacto@dentiapp.com"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Email</p>
                  <p className="text-sm text-blue-700">contacto@dentiapp.com</p>
                </div>
              </a>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">WhatsApp</p>
                  <p className="text-sm text-green-700">+1 (234) 567-8900</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex gap-3">
          {!isExpired && onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Recordar más tarde
            </button>
          )}
          <a
            href="mailto:contacto@dentiapp.com?subject=Actualizar a Premium"
            className={`${isExpired ? 'flex-1' : 'flex-1'} px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-center`}
          >
            Actualizar Ahora
          </a>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;

