import api from './api';
import { GastoFijo, GastoFijoCreate } from '@/types';

export const gastosService = {
  async getGastos(): Promise<GastoFijo[]> {
    const response = await api.get<GastoFijo[]>('/gastos/');
    return response.data;
  },

  async getGasto(id: number): Promise<GastoFijo> {
    const response = await api.get<GastoFijo>(`/gastos/${id}`);
    return response.data;
  },

  async createGasto(gasto: GastoFijoCreate): Promise<GastoFijo> {
    const response = await api.post<GastoFijo>('/gastos/', gasto);
    return response.data;
  },

  async updateGasto(id: number, gasto: Partial<GastoFijoCreate>): Promise<GastoFijo> {
    const response = await api.patch<GastoFijo>(`/gastos/${id}`, gasto);
    return response.data;
  },

  async deleteGasto(id: number): Promise<void> {
    await api.delete(`/gastos/${id}`);
  },
};
