import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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
            setUser(storedUser);
          } else {
            // If no stored user info, try to fetch from backend
            try {
              const currentUser = await authService.getCurrentUser();
              setUser(currentUser);
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
      const authResponse = await authService.login(username, password);
      
      // For now, create a mock user object since we don't have user info endpoint
      // In a real app, you'd fetch user info after login
      const mockUser: User = {
        id: 1,
        username,
        nombre: username === 'admin' ? 'Dr. Administrador' : 'Usuario',
        apellido: '',
        email: `${username}@manny.com`,
        especialidad: 'odontologia',
        plan: 'premium',
        fecha_registro: new Date().toISOString(),
        activo: true,
      };
      
      setUser(mockUser);
      localStorage.setItem('user_info', JSON.stringify(mockUser));
      toast.success('¡Bienvenido!');
    } catch (error) {
      toast.error('Error al iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Sesión cerrada');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
