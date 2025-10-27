import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services';
import { toast } from 'react-hot-toast';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  especialidad: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get user info from localStorage first
          const storedUser = authService.getUserInfo();
          if (storedUser) {
            console.log('🔍 DEBUG Stored User on init:', {
              username: storedUser.username,
              role_name: storedUser.role_name,
              hasRoleName: !!storedUser.role_name
            });
            setUser(storedUser);
            // Check if user is active
            if (!storedUser.activo) {
              console.log('User is inactive, will redirect to suspended page');
            }
          } else {
            // If no stored user info, try to fetch from backend
            try {
              const currentUser = await authService.getCurrentUser();
              setUser(currentUser);
              // Check if user is active
              if (!currentUser.activo) {
                console.log('User is inactive, will redirect to suspended page');
              }
            } catch (error) {
              // If fetch fails, clear auth
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      
      setUser(response.user);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      toast.success('¡Bienvenido!');
      
      // Check if onboarding is required
      if (response.requires_onboarding) {
        toast('Por favor completa tu perfil', { icon: '👋' });
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      
      setUser(response.user);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      toast.success('¡Cuenta creada exitosamente!');
      
      // Always requires onboarding for new users
      if (response.requires_onboarding) {
        toast('Bienvenido! Completa tu perfil para comenzar', { icon: '🎉' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al registrar usuario';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    try {
      setIsLoading(true);
      const response = await authService.googleLogin(credential);
      
      setUser(response.user);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      toast.success('¡Autenticación exitosa con Google!');
      
      if (response.requires_onboarding) {
        toast('Completa tu perfil para continuar', { icon: '👋' });
      }
    } catch (error) {
      toast.error('Error al autenticar con Google');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Clear splash screen flag so it shows again on next login
    sessionStorage.removeItem('splash_shown');
    toast.success('Sesión cerrada');
  };

  // Check if user is admin based on username or role
  const isAdmin = user?.username === 'admin' || user?.role_name === 'admin';
  
  // DEBUG: Log user info for troubleshooting
  React.useEffect(() => {
    if (user) {
      console.log('🔍 DEBUG AuthContext:', {
        username: user.username,
        role_name: user.role_name,
        isAdmin,
        fullUser: user
      });
    }
  }, [user, isAdmin]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    register,
    googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
