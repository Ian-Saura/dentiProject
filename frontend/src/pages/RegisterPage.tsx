import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, Mail, Lock, User, Phone, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
  telefono: string;
  especialidad: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        especialidad: data.especialidad,
      });

      toast.success('¡Registro exitoso! Bienvenido a Manny 🎉');
      
      // Redirect to onboarding or dashboard
      navigate('/');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al registrar usuario';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('¡Registro con Google exitoso! 🎉');
      navigate('/');
    } catch (error: any) {
      toast.error('Error al registrar con Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Branding */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
            <div className="mb-8">
              <UserPlus className="w-16 h-16 mb-4" />
              <h2 className="text-4xl font-bold mb-2">Únete a Manny</h2>
              <p className="text-blue-100">
                La plataforma profesional para gestión de consultorios médicos
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Gestión Completa</h3>
                  <p className="text-sm text-blue-100">Pacientes, consultas, presupuestos y más</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Analytics Avanzado</h3>
                  <p className="text-sm text-blue-100">Insights y reportes en tiempo real</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Seguro y Confiable</h3>
                  <p className="text-sm text-blue-100">Tus datos protegidos con encriptación</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h2>
            <p className="text-gray-600 mb-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Inicia sesión
              </Link>
            </p>

            {/* Google Sign In */}
            <div className="mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Error al autenticar con Google')}
                useOneTap
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O regístrate con email</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('nombre', { required: 'Nombre es requerido' })}
                      type="text"
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan"
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('apellido')}
                      type="text"
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('username', {
                      required: 'Username es requerido',
                      minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    })}
                    type="text"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juanperez"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email', {
                      required: 'Email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                    type="email"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad *
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      {...register('especialidad', { required: 'Especialidad es requerida' })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      <option value="odontologia">Odontología</option>
                      <option value="dermatologia">Dermatología</option>
                      <option value="kinesiologia">Kinesiología</option>
                    </select>
                  </div>
                  {errors.especialidad && (
                    <p className="mt-1 text-sm text-red-600">{errors.especialidad.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('telefono')}
                      type="tel"
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Contraseña es requerida',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Debe contener mayúscula, minúscula y número',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Confirmar contraseña es requerido',
                      validate: (value) =>
                        value === password || 'Las contraseñas no coinciden',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="mt-6 text-xs text-gray-500 text-center">
              Al registrarte, aceptas nuestros{' '}
              <Link to="/terminos" className="text-blue-600 hover:underline">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link to="/privacidad" className="text-blue-600 hover:underline">
                Política de Privacidad
              </Link>
            </p>
            
            {/* MercadoPago Subscription */}
            <div className="mt-6 text-center">
              <a 
                href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3cbe4338d4d424abb2b4b3da6d229e1" 
                className="inline-block bg-[#3483FA] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2a68c8] transition-colors shadow-md"
              >
                Comenzar Trial de 14 días
              </a>
              <p className="mt-2 text-xs text-gray-500">
                Prueba gratis por 14 días, sin compromiso
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

