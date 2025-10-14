import api from './api';
import { AuthResponse, User } from '@/types';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  especialidad: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  requires_onboarding: boolean;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    // Use URLSearchParams for proper x-www-form-urlencoded format
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await api.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    
    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    
    return response.data;
  },

  async googleLogin(credential: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/google/token', {
      credential: credential,
    });
    
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    localStorage.setItem('user_info', JSON.stringify(response.data));
    return response.data;
  },

  getUserInfo(): User | null {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },
};
