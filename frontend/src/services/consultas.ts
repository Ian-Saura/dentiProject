import api from './api';
import { Consulta, ConsultaCreate, FilterOptions } from '@/types';

export const consultasService = {
  async getConsultas(params?: {
    limit?: number;
    offset?: number;
    order_by?: string;
    from?: string;
    to?: string;
    medio_pago?: string;
    paciente_q?: string;
  }): Promise<{ data: Consulta[]; total: number }> {
    const response = await api.get<Consulta[]>('/consultas/', { params });
    const total = parseInt(response.headers['x-total-count'] || '0');
    return { data: response.data, total };
  },

  async getConsulta(id: number): Promise<Consulta> {
    const response = await api.get<Consulta>(`/consultas/${id}`);
    return response.data;
  },

  async createConsulta(consulta: ConsultaCreate): Promise<Consulta> {
    const response = await api.post<Consulta>('/consultas/', consulta);
    return response.data;
  },

  async updateConsulta(id: number, consulta: Partial<ConsultaCreate>): Promise<Consulta> {
    const response = await api.put<Consulta>(`/consultas/${id}`, consulta);
    return response.data;
  },

  async deleteConsulta(id: number): Promise<void> {
    await api.delete(`/consultas/${id}`);
  },

  // Search and filter functions matching app.py
  async busquedaConsultas(filters: {
    paciente?: string;
    tratamiento?: string;
    medio_pago?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    rango_montos?: number[];
  }): Promise<Consulta[]> {
    const response = await api.get<Consulta[]>('/consultas/busqueda', {
      params: filters,
    });
    return response.data;
  },

  async vistaConsultas(filters: {
    mostrar_desde: string;
    cantidad?: string;
    ordenar_por?: string;
  }): Promise<Consulta[]> {
    const response = await api.get<Consulta[]>('/consultas/vista', {
      params: filters,
    });
    return response.data;
  },

  async getConsultasByPaciente(pacienteNombre: string): Promise<Consulta[]> {
    const response = await api.get<{ data: Consulta[]; total: number }>('/consultas/', {
      params: { paciente_q: pacienteNombre, limit: 1000 }
    });
    return response.data.data || response.data;
  },
};
