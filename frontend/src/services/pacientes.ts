import api from './api';
import { Paciente, PacienteCreate } from '@/types';

export const pacientesService = {
  async getPacientes(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Paciente[]> {
    const response = await api.get<Paciente[]>('/pacientes/', { params });
    return response.data;
  },

  async getPaciente(id: number): Promise<Paciente> {
    const response = await api.get<Paciente>(`/pacientes/${id}`);
    return response.data;
  },

  async createPaciente(paciente: PacienteCreate): Promise<Paciente> {
    const response = await api.post<Paciente>('/pacientes/', paciente);
    return response.data;
  },

  async updatePaciente(id: number, paciente: Partial<PacienteCreate>): Promise<Paciente> {
    const response = await api.put<Paciente>(`/pacientes/${id}`, paciente);
    return response.data;
  },

  async deletePaciente(id: number): Promise<void> {
    await api.delete(`/pacientes/${id}`);
  },
};
