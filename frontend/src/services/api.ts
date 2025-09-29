import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Proxied to http://localhost:8000/v1
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente.');
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else if (error.message) {
      toast.error(error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
