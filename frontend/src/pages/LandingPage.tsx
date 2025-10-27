import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  BarChart3,
  Target,
  Brain,
  ArrowRight,
  Check,
  Sparkles,
  Activity,
  Calculator,
  PieChart,
  AlertCircle,
  Instagram,
  Mail,
  ChevronRight,
  Play,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<'operational' | 'analytical'>('operational');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <img 
                src="/Gemini_Generated_Image_hffliphffliphffl.png" 
                alt="Manny" 
                className="h-10 w-auto"
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('demo')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Demo
              </button>
              <button onClick={() => scrollToSection('modulos')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Módulos
              </button>
              <button onClick={() => scrollToSection('beneficios')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Beneficios
              </button>
              <button onClick={() => scrollToSection('caracteristicas')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Características
              </button>
              <button onClick={() => scrollToSection('planes')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Planes
              </button>
              <button onClick={() => navigate('/faq')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                FAQ
              </button>
            </div>

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
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-100 to-blue-100 px-4 py-2 rounded-full mb-6">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-bold text-cyan-900">Sistema de Gestión Profesional</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
                Tu consultorio,
                <span className="block mt-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  más inteligente
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                El único sistema que combina la <strong>gestión diaria</strong> de tu consultorio con 
                <strong> inteligencia de negocio</strong> automática. Todo conectado, nada aislado.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Comenzar Gratis</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection('demo')}
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:border-gray-400 transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Ver Demo</span>
                </motion.button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Configuración en 5 minutos</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 rounded-3xl p-8 shadow-2xl border border-gray-200 flex items-center justify-center">
                <img 
                  src="/Gemini_Generated_Image_hffliphffliphffl.png" 
                  alt="Manny - Sistema de Gestión" 
                  className="w-80 h-auto"
                />
                
                {/* Floating stats cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rentabilidad</p>
                      <p className="text-lg font-bold text-gray-900">+34%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pacientes</p>
                      <p className="text-lg font-bold text-gray-900">250+</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full mb-4">
              <Play className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">Video Demo</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Mirá cómo funciona Manny
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Descubrí en 3 minutos cómo Manny puede transformar la gestión de tu consultorio
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/yqEvcj3KfW8?si=qKE3VjgxnxLLRViV"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all inline-flex items-center justify-center space-x-2"
              >
                <span>Comenzar Gratis Ahora</span>
                <ArrowRight className="h-6 w-6" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              ¿Te suena familiar?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Problemas comunes que enfrentan los profesionales de la salud
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AlertCircle,
                title: "No sabés si estás ganando o perdiendo",
                description: "Tenés muchas consultas pero no sabés si realmente estás generando ganancia o solo cubriendo gastos."
              },
              {
                icon: Clock,
                title: "Perdés tiempo en tareas administrativas",
                description: "Anotás todo en papel, Excel o diferentes apps que no se conectan entre sí."
              },
              {
                icon: BarChart3,
                title: "Tomás decisiones a ciegas",
                description: "No tenés datos claros sobre qué tratamientos son más rentables o cuánto te cuesta cada hora de trabajo."
              }
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
                <p className="text-gray-600">{problem.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-900">Dos Módulos, Un Sistema Completo</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4">
              No son dos sistemas separados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Es un <strong>círculo virtuoso</strong> donde tu día a día genera inteligencia de negocio automáticamente
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Operational Module */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onMouseEnter={() => setActiveModule('operational')}
              className={`relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 border-4 transition-all ${
                activeModule === 'operational' ? 'border-cyan-500 shadow-2xl scale-105' : 'border-cyan-200 shadow-lg'
              }`}
            >
              <div className="absolute top-4 right-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                OPERATIVO
              </div>

              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-3xl font-black text-gray-900 mb-2">
                🗓️ MÓDULO OPERATIVO
              </h3>
              <p className="text-lg text-gray-700 mb-6 font-semibold">
                Día a día del consultorio
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Clock,
                    title: "Gestión de Turnos",
                    description: "Agenda inteligente que se adapta a tu flujo de trabajo"
                  },
                  {
                    icon: Users,
                    title: "Pacientes",
                    description: "Historial completo y trazable de cada paciente"
                  },
                  {
                    icon: Zap,
                    title: "Registro rápido",
                    description: "Consultás en segundos, no minutos"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-white/60 rounded-xl p-4">
                    <div className="bg-cyan-100 p-2 rounded-lg flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analytical Module */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onMouseEnter={() => setActiveModule('analytical')}
              className={`relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-4 transition-all ${
                activeModule === 'analytical' ? 'border-purple-500 shadow-2xl scale-105' : 'border-purple-200 shadow-lg'
              }`}
            >
              <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                ANALÍTICO
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-3xl font-black text-gray-900 mb-2">
                📊 MÓDULO ANALÍTICO
              </h3>
              <p className="text-lg text-gray-700 mb-6 font-semibold">
                Decisiones con datos
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: TrendingUp,
                    title: "Métricas automáticas",
                    description: "Rentabilidad, punto de equilibrio y muchos más indicadores clave"
                  },
                  {
                    icon: DollarSign,
                    title: "Tu costo operativo real",
                    description: "Cuánto te cuesta cada hora de trabajo y cómo se compone"
                  },
                  {
                    icon: Calculator,
                    title: "Precios inteligentes",
                    description: "Sugerencias basadas en tus números reales"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-white/60 rounded-xl p-4">
                    <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Cuando operativo + analítico trabajan juntos
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Todo conectado, nada aislado. Un círculo virtuoso de eficiencia.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Registrás una consulta",
                description: "Automáticamente impacta en rentabilidad y en la historia del paciente atendido",
                color: "from-cyan-500 to-blue-500"
              },
              {
                icon: DollarSign,
                title: "Calculás precios",
                description: "Basados en tus costos reales, no en estimaciones",
                color: "from-blue-500 to-purple-500"
              },
              {
                icon: TrendingUp,
                title: "Ves tendencias",
                description: "Qué tratamientos son los más rentables y demandados",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: AlertCircle,
                title: "Detectás problemas",
                description: "Baja de pacientes, gastos elevados, antes de que sea tarde",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: Brain,
                title: "Tomás mejores decisiones",
                description: "Con datos precisos, no con intuición",
                color: "from-rose-500 to-orange-500"
              },
              {
                icon: Zap,
                title: "Ahorrás tiempo",
                description: "Todo automatizado, menos trabajo manual",
                color: "from-orange-500 to-yellow-500"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className={`bg-gradient-to-r ${benefit.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-blue-100">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="caracteristicas" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Todo lo que necesitás en un solo lugar
            </h2>
            <p className="text-xl text-gray-600">
              Características diseñadas para profesionales como vos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calculator, title: "Calculadora de Costos", description: "Precios y costos precisos" },
              { icon: TrendingUp, title: "Análisis Financiero", description: "Rentabilidad en tiempo real" },
              { icon: PieChart, title: "Control de Gastos", description: "Gestión total de egresos" },
              { icon: BarChart3, title: "Dashboard Analítico", description: "Métricas e insights" },
              { icon: Calendar, title: "Agenda Inteligente", description: "Gestión de turnos automatizada" },
              { icon: Users, title: "Gestión de Pacientes", description: "Historial completo con odontograma" },
              { icon: FileText, title: "Registro de Consultas", description: "Prestaciones rápidas y completas" },
              { icon: Zap, title: "Importación Masiva", description: "Cargá datos rápidamente" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planes" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-xl text-gray-600">
              Elegí el plan que mejor se adapte a tu consultorio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Premium",
                price: "$39.999",
                period: "/mes",
                description: "Para consultorios profesionales",
                features: [
                  "✨ 14 días de prueba gratis",
                  "Módulo Operativo completo",
                  "Módulo Analítico completo",
                  "Pacientes ilimitados",
                  "Soporte prioritario",
                  "Actualizaciones gratis",
                  "Importación de datos"
                ],
                cta: "Comenzar Ahora",
                popular: true,
                color: "from-cyan-500 to-blue-600"
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "Para múltiples consultorios",
                features: [
                  "✨ 14 días de prueba gratis",
                  "Todo de Premium",
                  "Múltiples sucursales",
                  "API personalizada",
                  "Soporte dedicado",
                  "Capacitación incluida",
                  "Integración con ERP"
                ],
                cta: "Contactar",
                popular: false,
                color: "from-purple-500 to-pink-600"
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl shadow-xl border-2 ${
                  plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
                } p-8 hover:shadow-2xl transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    ⭐ MÁS POPULAR
                  </div>
                )}

                <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${plan.color} shadow-lg hover:shadow-xl transition-all`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
              ¿Listo para transformar tu consultorio?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Comenzá gratis hoy. Sin tarjeta de crédito. Configuración en minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:shadow-3xl transition-all inline-flex items-center justify-center space-x-2"
              >
                <span>Probar Gratis 14 Días</span>
                <ChevronRight className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('demo')}
                className="px-10 py-5 bg-white/20 backdrop-blur-lg border-2 border-white text-white rounded-2xl font-bold text-lg hover:bg-white/30 transition-all inline-flex items-center justify-center space-x-2"
              >
                <Play className="h-6 w-6" />
                <span>Ver Video Demo</span>
              </motion.button>
              <motion.a
                href="https://instagram.com/manny.app"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white/20 backdrop-blur-lg border-2 border-white text-white rounded-2xl font-bold text-lg hover:bg-white/30 transition-all inline-flex items-center justify-center space-x-2"
              >
                <Instagram className="h-6 w-6" />
                <span>Seguinos en Instagram</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/Gemini_Generated_Image_hffliphffliphffl.png" 
                  alt="Manny" 
                  className="h-12 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm">
                Sistema de gestión integral para profesionales de la salud
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('caracteristicas')} className="hover:text-white transition-colors">Características</button></li>
                <li><button onClick={() => scrollToSection('modulos')} className="hover:text-white transition-colors">Módulos</button></li>
                <li><button onClick={() => scrollToSection('planes')} className="hover:text-white transition-colors">Precios</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <a 
                    href="mailto:soporte@manny.com.ar" 
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    soporte@manny.com.ar
                  </a>
                  <p className="text-xs text-gray-500 ml-6">Para asistencia técnica</p>
                </li>
                <li>
                  <a 
                    href="mailto:info@manny.com.ar" 
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    info@manny.com.ar
                  </a>
                  <p className="text-xs text-gray-500 ml-6">Para consultas generales</p>
                </li>
                <li className="pt-2">
                  <a
                    href="https://instagram.com/manny.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    @manny.app
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 Manny - www.manny.com.ar. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
















