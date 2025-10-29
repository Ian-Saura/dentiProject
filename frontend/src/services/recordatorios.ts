import api from './api';

export interface EnviarRecordatorioRequest {
  turno_id: number;
  metodo?: 'whatsapp' | 'sms' | 'auto';
  doctor_name?: string;
  location?: string;
}

export interface RecordatoriosAutomaticosRequest {
  dias_anticipacion?: number;
  metodo?: 'whatsapp' | 'sms' | 'auto';
}

export interface EnviarConfirmacionRequest {
  turno_id: number;
  metodo?: 'whatsapp' | 'sms';
}

export interface TurnosPendientes {
  total: number;
  dias_anticipacion: number;
  turnos: Array<{
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    recordatorio_enviado: boolean;
    paciente: {
      id?: number;
      nombre: string;
      apellido?: string;
      telefono?: string;
    };
  }>;
}

export const recordatoriosService = {
  // Send reminder for specific appointment
  async enviarRecordatorio(data: EnviarRecordatorioRequest): Promise<any> {
    const response = await api.post('/recordatorios/enviar-recordatorio', data);
    return response.data;
  },

  // Send automatic reminders for all upcoming appointments
  async enviarAutomaticos(data?: RecordatoriosAutomaticosRequest): Promise<any> {
    const response = await api.post('/recordatorios/enviar-automaticos', data || {});
    return response.data;
  },

  // Send confirmation after booking
  async enviarConfirmacion(data: EnviarConfirmacionRequest): Promise<any> {
    const response = await api.post('/recordatorios/enviar-confirmacion', data);
    return response.data;
  },

  // Get appointments that need reminders
  async getTurnosPendientes(dias_anticipacion: number = 1): Promise<TurnosPendientes> {
    const response = await api.get(`/recordatorios/pendientes?dias_anticipacion=${dias_anticipacion}`);
    return response.data;
  },
};

