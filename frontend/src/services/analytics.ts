import api from './api';
import { AnalyticsResumen, AnalyticsKPIs, CostosAnalisis, PuntoEquilibrio } from '@/types';

export const analyticsService = {
  async getResumen(): Promise<AnalyticsResumen> {
    const response = await api.get<AnalyticsResumen>('/analytics/resumen');
    return response.data;
  },

  async getKPIs(): Promise<AnalyticsKPIs> {
    const response = await api.get<AnalyticsKPIs>('/analytics/kpis');
    return response.data;
  },

  async getCostosAnalisis(): Promise<CostosAnalisis> {
    const response = await api.get<CostosAnalisis>('/costos/analisis');
    return response.data;
  },

  async getPuntoEquilibrio(): Promise<PuntoEquilibrio> {
    const response = await api.get<PuntoEquilibrio>('/analytics/punto-equilibrio');
    return response.data;
  },
};
