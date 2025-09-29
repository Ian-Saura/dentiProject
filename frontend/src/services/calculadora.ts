import api from './api';
import { CalculadoraRecomendacion, CalculadoraRequest } from '@/types';

export const calculadoraService = {
  async getRecomendaciones(request: CalculadoraRequest): Promise<CalculadoraRecomendacion[]> {
    const response = await api.post<CalculadoraRecomendacion[]>('/calculadora/recomendaciones', null, {
      params: request,
    });
    return response.data;
  },
};
