import api from './api';
import { CostoEquipo, CostoEquipoCreate } from '@/types';

export const equiposService = {
  async getEquipos(): Promise<CostoEquipo[]> {
    const response = await api.get<CostoEquipo[]>('/equipos');
    return response.data;
  },

  async getEquipo(id: number): Promise<CostoEquipo> {
    const response = await api.get<CostoEquipo>(`/equipos/${id}`);
    return response.data;
  },

  async createEquipo(equipo: CostoEquipoCreate): Promise<CostoEquipo> {
    const response = await api.post<CostoEquipo>('/equipos', equipo);
    return response.data;
  },

  async updateEquipo(id: number, equipo: Partial<CostoEquipoCreate>): Promise<CostoEquipo> {
    const response = await api.put<CostoEquipo>(`/equipos/${id}`, equipo);
    return response.data;
  },

  async deleteEquipo(id: number): Promise<void> {
    await api.delete(`/equipos/${id}`);
  },
};
