import api from './api';
import { AnalyticsResumen, AnalyticsKPIs, CostosAnalisis } from '@/types';

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
};
