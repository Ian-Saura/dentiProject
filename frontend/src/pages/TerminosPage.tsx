import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TerminosPage() {
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
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Términos de Servicio
            </h1>
          </div>

          <p className="text-gray-600 mb-6">
            Última actualización: Octubre 2025
          </p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. Aceptación de los Términos
              </h2>
              <p>
                Al acceder y usar Manny, aceptas cumplir con estos Términos de Servicio 
                y todas las leyes y regulaciones aplicables. Si no estás de acuerdo con 
                alguno de estos términos, no debes usar este servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. Descripción del Servicio
              </h2>
              <p>
                Manny es una plataforma de gestión para consultorios médicos que proporciona 
                herramientas para administrar pacientes, consultas, presupuestos y análisis 
                financiero. Ofrecemos un período de prueba gratuito de 14 días, después del 
                cual se requiere una suscripción activa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Cuenta de Usuario
              </h2>
              <p>
                Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. 
                Aceptas la responsabilidad de todas las actividades que ocurran bajo tu cuenta. 
                Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. Suscripción y Pagos
              </h2>
              <p>
                - El período de prueba gratuito es de 14 días
                <br />
                - Después del período de prueba, se requiere una suscripción mensual
                <br />
                - Los pagos se procesan a través de MercadoPago
                <br />
                - Puedes cancelar tu suscripción en cualquier momento
                <br />
                - No se realizan reembolsos por períodos parciales
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. Uso Aceptable
              </h2>
              <p>
                Te comprometes a usar Manny únicamente con fines legales y profesionales. 
                No debes:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Usar el servicio para actividades ilegales</li>
                <li>Compartir tu cuenta con terceros no autorizados</li>
                <li>Intentar acceder a datos de otros usuarios</li>
                <li>Realizar ingeniería inversa del software</li>
                <li>Sobrecargar o interrumpir el servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. Propiedad Intelectual
              </h2>
              <p>
                Todo el contenido, diseño y software de Manny son propiedad exclusiva 
                y están protegidos por derechos de autor. Los datos que ingreses en 
                la plataforma siguen siendo de tu propiedad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                7. Limitación de Responsabilidad
              </h2>
              <p>
                Manny se proporciona "tal cual" sin garantías de ningún tipo. No nos 
                hacemos responsables por daños indirectos, incidentales o consecuentes 
                que resulten del uso o la imposibilidad de usar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                8. Terminación
              </h2>
              <p>
                Podemos terminar o suspender tu acceso a Manny inmediatamente, sin 
                previo aviso o responsabilidad, si incumples estos Términos de Servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                9. Modificaciones
              </h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Te notificaremos sobre cambios significativos por email. El uso continuado 
                del servicio después de dichos cambios constituye tu aceptación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                10. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre estos Términos de Servicio, contáctanos en:
                <br />
                <a href="mailto:soporte@manny.com.ar" className="text-blue-600 hover:underline">
                  soporte@manny.com.ar
                </a>
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






