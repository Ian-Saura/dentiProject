import api from './api';

export interface ConfiguracionUsuario {
  id?: number;
  usuario_id?: number;
  costo_hora_calculado_ars?: number;
  costo_hora_manual_ars?: number;
  usar_costo_manual: boolean;
  horas_anuales_trabajadas: number;
  tipo_cambio_usd_ars?: number;
  margen_ganancia_porcentaje?: number;
}

export interface CostAnalysis {
  costo_hora_ars: number;
  costo_hora_usd?: number;
  depreciation_monthly_ars?: number;
  fixed_expenses_monthly_ars?: number;
  recommended_price?: number;
}

export const configService = {
  async getConfig(): Promise<ConfiguracionUsuario> {
    const response = await api.get<ConfiguracionUsuario>('/configuracion');
    return response.data;
  },

  async updateConfig(config: Partial<ConfiguracionUsuario>): Promise<ConfiguracionUsuario> {
    const response = await api.put<ConfiguracionUsuario>('/configuracion', config);
    return response.data;
  },

  async getCostAnalysis(): Promise<CostAnalysis> {
    const response = await api.get<CostAnalysis>('/costos/analisis');
    return response.data;
  },
};



