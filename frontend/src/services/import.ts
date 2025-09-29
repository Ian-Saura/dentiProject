import api from './api';
import { ImportResult } from '@/types';

export const importService = {
  async importCSV(
    file: File,
    mapping: {
      col_paciente: string;
      col_tratamiento: string;
      col_monto: string;
      col_fecha?: string;
      col_medio_pago?: string;
    }
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('col_paciente', mapping.col_paciente);
    formData.append('col_tratamiento', mapping.col_tratamiento);
    formData.append('col_monto', mapping.col_monto);
    
    if (mapping.col_fecha) {
      formData.append('col_fecha', mapping.col_fecha);
    }
    if (mapping.col_medio_pago) {
      formData.append('col_medio_pago', mapping.col_medio_pago);
    }

    const response = await api.post<ImportResult>('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};
