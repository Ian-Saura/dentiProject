import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  ArrowLeft,
  Home,
} from 'lucide-react';

// FAQ Data
const faqData = [
  {
    icon: '💡',
    title: 'Sobre la importancia de las finanzas',
    questions: [
      {
        question: '¿Por qué debería preocuparme por las finanzas si soy bueno clínicamente?',
        answer: 'Porque podés ser excelente técnicamente pero si no entendés tus números, vas a trabajar mucho sin que te quede nada. Las finanzas te dicen si estás ganando o trabajando gratis. Sin números claros, manejás tu consultorio a ciegas.'
      },
      {
        question: '¿No es suficiente con "sentir" que me está yendo bien?',
        answer: 'No. Muchos odontólogos tienen agenda llena pero cuando hacen números descubren que están perdiendo plata. Los sentimientos engañan, los números no. Podés estar trabajando a pérdida con la agenda completa.'
      },
      {
        question: '¿Es complicado llevar un control financiero?',
        answer: 'No. Solo necesitás entender tres cosas: cuánto te cuesta trabajar, cuánto estás cobrando, y si te queda ganancia. Con herramientas adecuadas, esto toma 5-10 minutos por día.'
      }
    ]
  },
  {
    icon: '📋',
    title: 'Sobre el registro y control',
    questions: [
      {
        question: '¿Qué información necesito registrar?',
        answer: 'Cuatro categorías básicas:\n1) Ingresos (fecha, paciente, tratamiento, monto, medio de pago)\n2) Costos fijos mensuales (alquiler, servicios, seguros)\n3) Equipamiento (valor, vida útil)\n4) Materiales (precio, cantidad por tratamiento)'
      },
      {
        question: '¿Cuánto tiempo me lleva esto?',
        answer: 'Configuración inicial: 2-3 horas.\nMantenimiento diario con una herramienta digital: 5-10 minutos.\nCon Excel: 30-60 minutos. La diferencia es enorme.'
      },
      {
        question: '¿Necesito ser perfecto desde el principio?',
        answer: 'No. Es mejor empezar imperfecto que no empezar. Comenzá con lo básico y después vas agregando detalle. La precisión viene con el tiempo.'
      },
      {
        question: '¿Qué pasa si tengo meses sin registrar nada?',
        answer: 'Empezá desde hoy. Es mejor tener datos de ahora en adelante que seguir sin nada. No dejes que la falta de datos del pasado te paralice.'
      }
    ]
  },
  {
    icon: '⏱️',
    title: 'Sobre el costo por hora',
    questions: [
      {
        question: '¿Qué es el costo por hora y por qué es importante?',
        answer: 'Es cuánto te cuesta cada hora que trabajás, incluyendo TODO: alquiler, servicios, equipos, seguros. Es el número más importante porque te dice tu costo base antes de cualquier ganancia.'
      },
      {
        question: '¿Cómo lo calculo?',
        answer: 'Sumás todos tus costos fijos anuales más amortización de equipos, y lo dividís por las horas que trabajás al año. Ejemplo: $3.632.000 ÷ 1.320 horas = $2.752/hora.'
      },
      {
        question: '¿Qué es "amortización de equipos"?',
        answer: 'Es distribuir el costo de un equipo a lo largo de su vida útil. Un sillón de $12.000 USD que dura 10 años te cuesta $1.200 por año. Ese costo debe estar incluido porque eventualmente vas a tener que reponerlo.'
      },
      {
        question: 'Mi costo por hora me parece muy alto, ¿es normal?',
        answer: 'Probablemente sí. Un costo de $2.500-$3.500 es típico. Incluye TODO lo que necesitás para estar ahí trabajando. La pregunta no es si es alto, sino si tus precios lo están cubriendo.'
      }
    ]
  },
  {
    icon: '💰',
    title: 'Sobre precios y cobros',
    questions: [
      {
        question: '¿Cómo pongo precios que tengan sentido?',
        answer: 'Precio = (Costo por Hora × Tiempo) + Materiales + Ganancia deseada.\nEjemplo operatoria 2 horas: ($2.752 × 2) + $3.100 materiales + 40% ganancia = $12.046.'
      },
      {
        question: '¿Cuánto margen de ganancia debería aplicar?',
        answer: 'Tratamientos simples 30-40%, estándar 40-50%, complejos 50-70%, alta especialización 70-80%. Pero debe ser consistente con tu experiencia y el valor que aportás.'
      },
      {
        question: '¿Y si mis precios quedan más caros que la competencia?',
        answer: 'Si están bien calculados, el precio es justo. Quizás tu competencia trabaja a pérdida o no calculó bien. No podés basar tus precios en los errores de otros.'
      },
      {
        question: '¿Cómo justifico precios más altos?',
        answer: 'Con confianza: explicá tu experiencia, calidad de materiales, tiempo dedicado, seguimiento. La gente entiende que calidad cuesta. Tu trabajo vale lo que cuesta.'
      },
      {
        question: '¿Qué hago con pacientes de obra social que pagan menos?',
        answer: 'Decidí conscientemente cuántos podés atender sin afectar rentabilidad. Algunos limitan obras sociales a 30-40% de la agenda. Lo importante es que sea una decisión informada.'
      },
      {
        question: '¿Cada cuánto reviso mis precios?',
        answer: 'Mínimo cada 6 meses, idealmente cada 3-4 meses. Si tus costos suben pero tus precios no, trabajás cada vez por menos.'
      }
    ]
  },
  {
    icon: '⚖️',
    title: 'Sobre el punto de equilibrio',
    questions: [
      {
        question: '¿Qué es el punto de equilibrio?',
        answer: 'Es la cantidad mínima de horas que necesitás trabajar al mes para cubrir tus costos fijos. Es tu "piso" mensual: por debajo perdés, en el punto no ganás ni perdés, por encima ganás.'
      },
      {
        question: '¿Cómo se calcula?',
        answer: 'Costos fijos mensuales ÷ Costo por hora.\nEjemplo: $220.000 ÷ $2.752 = 80 horas/mes.\nSi trabajás 20 días al mes, son 4 horas por día mínimo.'
      },
      {
        question: '¿Todo lo que trabajo de más es ganancia?',
        answer: 'Sí, una vez que descontás los materiales de cada tratamiento. Si tu punto es 80 horas/mes y trabajás 100, esas 20 horas extra son para vos después de pagar insumos.'
      },
      {
        question: '¿Qué pasa si estoy por debajo del punto de equilibrio?',
        answer: 'Estás perdiendo plata cada mes. Necesitás acción urgente: aumentar precios, reducir costos fijos, o atender más pacientes. No podés seguir así.'
      },
      {
        question: '¿El punto de equilibrio cambia?',
        answer: 'Sí, cada vez que cambian tus costos fijos o tu costo por hora. Recalculalo cada 3-6 meses o cuando haya cambios importantes.'
      }
    ]
  },
  {
    icon: '💊',
    title: 'Sobre costos variables (materiales e insumos)',
    questions: [
      {
        question: '¿Qué son los costos variables?',
        answer: 'Los insumos que usás específicamente para cada tratamiento: guantes, anestesia, composite, gasas, etc. Se llaman "variables" porque cambian según cuántos pacientes atiendas.'
      },
      {
        question: '¿Por qué es importante calcularlos bien?',
        answer: 'Porque salen directamente de lo que cobrás. Si no los calculás bien, podés pensar que ganás cuando en realidad perdés. Los materiales "chicos" (guantes, gasas) suman muchísimo.'
      },
      {
        question: '¿Cómo calculo cuánto me cuesta cada uso de un material?',
        answer: 'Costo por uso = Precio del paquete ÷ Cantidad de usos.\n\nEjemplos:\n• Guantes: caja $8.000 ÷ 50 pares = $160 por paciente\n• Anestesia: caja $15.000 ÷ 50 tubos = $300 por tubo\n• Composite: jeringa $12.000 ÷ 8 usos = $1.500 por restauración\n• Gasas: paquete $3.000 ÷ 200 gasas = $15 c/u × 5 usadas = $75 por tratamiento'
      },
      {
        question: '¿Y si no sé exactamente cuántos usos me da un material?',
        answer: 'Estimá conservadoramente. Es mejor sobrestimar un poco que subestimar. Por ejemplo, si una jeringa te da entre 6-10 usos, usá 7-8 como promedio. Con el tiempo vas ajustando.'
      },
      {
        question: '¿Cómo saco el costo total de materiales de un tratamiento?',
        answer: 'Listá todos los insumos que usás, calculá el costo de cada uno, y sumá.\n\nEjemplo operatoria simple:\nGuantes $160 + Barbijo $50 + Anestesia $300 + Composite $1.500 + Adhesivo $200 + Gasas $75 + otros = $3.100 total'
      },
      {
        question: '¿Qué hago si descubro que mis costos variables son muy altos?',
        answer: 'Opciones:\n1) Buscar proveedores más económicos\n2) Comprar en cantidad para mejor precio\n3) Optimizar el uso de materiales\n4) Ajustar precios para reflejar costos reales'
      },
      {
        question: '¿Es normal que materiales sean 30-40% del precio del tratamiento?',
        answer: 'Sí, es normal en odontología. Algunos tratamientos son más "materiales intensivos" (operatorias) y otros más "tiempo intensivos" (limpiezas).'
      },
      {
        question: '¿Cada cuánto actualizo estos costos?',
        answer: 'Cada vez que te aumentan significativamente los precios. En inflación alta, cada 2-3 meses. Lo ideal es actualizar el precio cuando comprás algo nuevo.'
      }
    ]
  },
  {
    icon: '🛠️',
    title: 'Sobre herramientas y tecnología',
    questions: [
      {
        question: '¿Puedo hacer todo en Excel?',
        answer: 'Sí, pero gastás muchísimo tiempo en fórmulas, cálculos y reportes manuales. Una herramienta especializada hace todo automáticamente: costo por hora, punto de equilibrio, precios sugeridos, gráficos, todo en tiempo real.'
      },
      {
        question: '¿Necesito ser experto para usar herramientas como Manny?',
        answer: 'No. Está diseñada para profesionales de salud que NO son contadores. La herramienta hace el trabajo pesado. Si sabés usar WhatsApp, podés usar Manny.'
      },
      {
        question: '¿Los datos están seguros?',
        answer: 'En herramientas profesionales como Manny, tus datos son privados y encriptados. Solo vos tenés acceso. No se comparten, no se usan para estadísticas, no se venden.'
      }
    ]
  },
  {
    icon: '❌',
    title: 'Sobre errores comunes',
    questions: [
      {
        question: '¿Cuál es el error más común?',
        answer: 'No incluir tu propio sueldo. Muchos piensan "todo lo que sobra es para mí" pero terminan sin nada. El margen de ganancia es tu pago por tu trabajo profesional. No trabajes gratis.'
      },
      {
        question: '¿Por qué no puedo copiar precios de otro colega?',
        answer: 'Porque cada consultorio tiene costos únicos. Un colega en CABA tiene alquiler de $300.000, vos quizás $80.000. Sus costos son distintos, sus precios también. Copiar precios sin entender costos es peligroso.'
      },
      {
        question: '¿Qué otros errores debería evitar?',
        answer: '1) Olvidar amortización de equipos\n2) No registrar algunos días\n3) Mezclar plata personal con la del consultorio\n4) Dejar todo para "después"\n5) Complicarse demasiado\n6) No revisar números regularmente'
      },
      {
        question: '¿Qué pasa si llevo años sin controlar nada?',
        answer: 'Nunca es tarde. Mejor empezar hoy que seguir otro año sin datos. Muchos descubren después de años que cobraban mal, y cuando ajustan, su vida mejora enormemente.'
      }
    ]
  },
  {
    icon: '🔄',
    title: 'Sobre cambios y ajustes',
    questions: [
      {
        question: '¿Qué hago si descubro que cobro menos de lo que debería?',
        answer: 'Ajustá estratégicamente:\n1) Empezá con pacientes nuevos\n2) Aplicá nuevos precios a ciertos tratamientos primero\n3) Comunicá el cambio con 30-60 días de anticipación a pacientes habituales, explicando profesionalmente'
      },
      {
        question: '¿Cómo comunico un aumento sin perder pacientes?',
        answer: 'Con honestidad: explicá que los costos aumentaron (materiales, servicios, alquiler) y que para mantener la calidad necesitás ajustar. La mayoría entiende. Los que solo buscan lo más barato probablemente no eran rentables.'
      },
      {
        question: '¿Qué indicadores debería vigilar mes a mes?',
        answer: '1) Facturación total vs. mes anterior\n2) Cantidad de consultas\n3) Ticket promedio\n4) Horas trabajadas vs. punto de equilibrio\n5) Gastos vs. presupuesto\n6) Tratamiento más realizado\n7) Tratamiento más rentable'
      }
    ]
  },
  {
    icon: '📈',
    title: 'Sobre sustentabilidad',
    questions: [
      {
        question: '¿Cómo sé si mi consultorio es sustentable?',
        answer: 'Tres señales:\n1) Trabajás consistentemente por encima del punto de equilibrio\n2) Te queda dinero después de pagar todo\n3) Podés proyectar inversiones sin crisis\n\nSi tenés estas tres cosas, sos sustentable.'
      },
      {
        question: '¿Es normal tener meses malos?',
        answer: 'Un mes malo ocasional es normal (vacaciones, feriados). Dos meses seguidos es señal de atención. Tres o más bajo el punto de equilibrio es alarma roja que requiere acción inmediata.'
      },
      {
        question: '¿Tiene sentido tomar créditos para invertir?',
        answer: 'Solo si ya sos rentable y la inversión aumentará tus ingresos. Si no llegás al punto de equilibrio, primero arreglá eso. Un crédito suma costos fijos (cuota mensual), subiendo tu punto de equilibrio.'
      }
    ]
  }
];

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver al inicio</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Iniciar Sesión
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-sm"
              >
                Probar Gratis
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              <span className="text-purple-600 font-bold text-sm">Preguntas Frecuentes</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-4">
              Finanzas para Odontólogos
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitás saber para gestionar tu consultorio con éxito financiero
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <div className="space-y-4">
            {faqData.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                  <span className="text-4xl">{category.icon}</span>
                  <span>{category.title}</span>
                </h2>
                <div className="space-y-3 mb-8">
                  {category.questions.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex;
                    const isOpen = openFaqIndex === globalIndex;
                    
                    return (
                      <motion.div
                        key={globalIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : globalIndex)}
                          className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-bold text-gray-900 pr-4 text-lg">{faq.question}</span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0 mt-1"
                          >
                            <ChevronDown className="h-6 w-6 text-gray-600" />
                          </motion.div>
                        </button>
                        <motion.div
                          initial={false}
                          animate={{ height: isOpen ? 'auto' : 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 text-gray-700 leading-relaxed whitespace-pre-line text-base">
                            {faq.answer}
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-center shadow-2xl"
          >
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
              ¿Listo para tomar control de tus finanzas?
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Comenzá gratis hoy. Sin tarjeta de crédito. Configuración en minutos.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:shadow-3xl transition-all inline-flex items-center justify-center space-x-2"
            >
              <span>Probar Gratis 30 Días</span>
              <ArrowLeft className="h-6 w-6 rotate-180" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="container mx-auto text-center">
          <div className="mb-4">
            <img 
              src="/Gemini_Generated_Image_hffliphffliphffl.png" 
              alt="Manny" 
              className="h-10 w-auto brightness-0 invert mx-auto"
            />
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Sistema de gestión integral para profesionales de la salud
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
              Inicio
            </button>
            <span className="text-gray-600">•</span>
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">
              Iniciar Sesión
            </button>
            <span className="text-gray-600">•</span>
            <a href="https://instagram.com/manny.app" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              Instagram
            </a>
          </div>
          <div className="mt-6 text-gray-500 text-xs">
            © 2025 Manny. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage;

