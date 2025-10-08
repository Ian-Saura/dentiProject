import api from './api';
import { Prestacion, PrestacionUsuario } from '@/types';

export const prestacionesService = {
  // Catalog prestaciones (read-only)
  async getPrestaciones(): Promise<Prestacion[]> {
    const response = await api.get<Prestacion[]>('/prestaciones/');
    return response.data;
  },

  // User prestaciones (tenanted)
  async getPrestacionesUsuario(): Promise<PrestacionUsuario[]> {
    const response = await api.get<PrestacionUsuario[]>('/prestaciones-usuario/');
    return response.data;
  },

  async getPrestacionUsuario(id: number): Promise<PrestacionUsuario> {
    const response = await api.get<PrestacionUsuario>(`/prestaciones-usuario/${id}`);
    return response.data;
  },

  async createPrestacionUsuario(prestacion: {
    prestacion_id: number;
    nombre_personalizado?: string;
    tiempo_personal_min?: number;
    margen_ganancia_porcentaje?: number;
    notas_personales?: string;
  }): Promise<PrestacionUsuario> {
    const response = await api.post<PrestacionUsuario>('/prestaciones-usuario/', prestacion);
    return response.data;
  },

  async updatePrestacionUsuario(id: number, prestacion: {
    nombre_personalizado?: string;
    tiempo_personal_min?: number;
    margen_ganancia_porcentaje?: number;
    notas_personales?: string;
    activo?: boolean;
  }): Promise<PrestacionUsuario> {
    const response = await api.put<PrestacionUsuario>(`/prestaciones-usuario/${id}`, prestacion);
    return response.data;
  },

  async deletePrestacionUsuario(id: number): Promise<void> {
    await api.delete(`/prestaciones-usuario/${id}`);
  },
};
