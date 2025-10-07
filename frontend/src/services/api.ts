import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
// In Docker: Use /v1 directly (Nginx proxy handles it)
// In dev: Use /api (Vite proxy handles it)
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.PROD ? '/v1' : '/api',
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

// Track recent error toasts to prevent duplicates
const recentErrors = new Set<string>();
const ERROR_DEBOUNCE_TIME = 2000; // 2 seconds

function showErrorToast(message: string) {
  // Prevent duplicate error messages within debounce time
  if (recentErrors.has(message)) {
    return;
  }
  
  recentErrors.add(message);
  toast.error(message);
  
  // Clear the error from the set after debounce time
  setTimeout(() => {
    recentErrors.delete(message);
  }, ERROR_DEBOUNCE_TIME);
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Don't show toast for cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid - only show once and redirect
      if (!recentErrors.has('session_expired')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        recentErrors.add('session_expired');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    } else if (error.response?.status === 403) {
      // Forbidden - check if it's trial expired
      const detail = error.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.error === 'trial_expired') {
        // Redirect to trial expired page
        if (!recentErrors.has('trial_expired_redirect')) {
          recentErrors.add('trial_expired_redirect');
          setTimeout(() => {
            window.location.href = '/trial-expired';
          }, 500);
        }
      } else if (detail && typeof detail === 'object') {
        showErrorToast(detail.message || 'Acceso denegado');
      }
    } else if (error.response?.status >= 500) {
      showErrorToast('Error del servidor. Intenta nuevamente.');
    } else if (error.response?.status === 404) {
      // Don't show toast for 404s, let components handle them
      console.warn('Resource not found:', error.config?.url);
    } else if (error.response?.data?.detail) {
      // Only show detail if it's a string, not an object
      if (typeof error.response.data.detail === 'string') {
        showErrorToast(error.response.data.detail);
      }
    } else if (error.code === 'ECONNABORTED') {
      showErrorToast('Tiempo de espera agotado. Verifica tu conexión.');
    } else if (error.message === 'Network Error') {
      showErrorToast('Error de red. Verifica tu conexión a internet.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
