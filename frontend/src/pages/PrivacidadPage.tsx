import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al registro
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Política de Privacidad
            </h1>
          </div>

          <p className="text-gray-600 mb-6">
            Última actualización: Octubre 2025
          </p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. Información que Recopilamos
              </h2>
              <p className="mb-3">
                En Manny recopilamos diferentes tipos de información para proporcionar 
                y mejorar nuestro servicio:
              </p>
              <ul className="list-disc pl-6">
                <li><strong>Información de cuenta:</strong> nombre, apellido, email, teléfono, especialidad</li>
                <li><strong>Datos de pacientes:</strong> información que ingreses sobre tus pacientes</li>
                <li><strong>Datos de consultas:</strong> registros de prestaciones y consultas médicas</li>
                <li><strong>Información financiera:</strong> datos de facturación y análisis (procesados por MercadoPago)</li>
                <li><strong>Datos de uso:</strong> cómo interactúas con la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. Cómo Usamos tu Información
              </h2>
              <p>
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Proporcionar y mantener nuestro servicio</li>
                <li>Procesar pagos y suscripciones</li>
                <li>Enviar notificaciones importantes sobre tu cuenta</li>
                <li>Mejorar la experiencia del usuario</li>
                <li>Detectar y prevenir fraudes o abusos</li>
                <li>Cumplir con requisitos legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Protección de Datos Médicos
              </h2>
              <p>
                Entendemos la sensibilidad de los datos médicos. Implementamos medidas 
                de seguridad robustas:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso restringido basado en roles</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Backups automáticos y seguros</li>
                <li>Cumplimiento con regulaciones de protección de datos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. Compartir Información
              </h2>
              <p>
                No vendemos ni compartimos tu información personal con terceros, excepto:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Proveedores de servicios:</strong> MercadoPago para procesamiento de pagos</li>
                <li><strong>Requerimientos legales:</strong> cuando sea obligatorio por ley</li>
                <li><strong>Con tu consentimiento:</strong> en casos específicos que autorices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. Cookies y Tecnologías Similares
              </h2>
              <p>
                Usamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso del servicio</li>
                <li>Mejorar la seguridad</li>
              </ul>
              <p className="mt-2">
                Puedes configurar tu navegador para rechazar cookies, pero esto puede 
                afectar la funcionalidad del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. Tus Derechos
              </h2>
              <p>
                Tienes derecho a:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Acceder a tu información personal</li>
                <li>Corregir datos inexactos</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Exportar tus datos</li>
                <li>Oponerte al procesamiento de tus datos</li>
                <li>Cancelar tu suscripción en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                7. Retención de Datos
              </h2>
              <p>
                Conservamos tu información mientras tu cuenta esté activa o según sea 
                necesario para proporcionar el servicio. Si cancelas tu cuenta, 
                conservaremos cierta información según lo requieran las leyes aplicables 
                (generalmente entre 3-10 años para registros médicos en Argentina).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                8. Seguridad
              </h2>
              <p>
                Implementamos medidas técnicas y organizativas apropiadas para proteger 
                tu información contra acceso no autorizado, alteración, divulgación o 
                destrucción. Sin embargo, ningún método de transmisión por Internet es 
                100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                9. Menores de Edad
              </h2>
              <p>
                Manny no está dirigido a menores de 18 años. No recopilamos 
                intencionalmente información de menores. Si descubrimos que un menor 
                nos ha proporcionado información personal, la eliminaremos de nuestros 
                sistemas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                10. Cambios a esta Política
              </h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Te 
                notificaremos sobre cambios significativos por email o mediante un 
                aviso destacado en el servicio. Te recomendamos revisar esta página 
                regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                11. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre esta Política de Privacidad o sobre cómo 
                manejamos tus datos, contáctanos en:
              </p>
              <div className="mt-2">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacidad@manny.com.ar" className="text-blue-600 hover:underline">
                    privacidad@manny.com.ar
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Soporte:</strong>{' '}
                  <a href="mailto:soporte@manny.com.ar" className="text-blue-600 hover:underline">
                    soporte@manny.com.ar
                  </a>
                </p>
              </div>
            </section>

            <section className="bg-blue-50 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Cumplimiento con Ley de Protección de Datos Personales (Argentina)
              </h3>
              <p className="text-blue-800">
                Manny cumple con la Ley 25.326 de Protección de Datos Personales de 
                Argentina y las disposiciones de la Agencia de Acceso a la Información 
                Pública (AAIP). Tus datos están protegidos según la legislación vigente.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



