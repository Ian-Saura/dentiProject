import api from './api';
import {
  Turno,
  TurnoCreate,
  TurnoCreatePublic,
  TurnoUpdate,
  ConfiguracionTurnos,
  ConfiguracionTurnosUpdate,
  DisponibilidadResponse,
  LinkTurnoResponse,
  EstadisticasTurnos,
} from '../types/turnos';

// ==================== Gestión de Turnos (Profesional) ====================

export const getTurnos = async (params?: {
  limit?: number;
  offset?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  paciente_id?: number;
}): Promise<{ turnos: Turno[]; total: number }> => {
  const response = await api.get('/turnos', { params });
  const total = parseInt(response.headers['x-total-count'] || '0');
  return { turnos: response.data, total };
};

export const getTurno = async (id: number): Promise<Turno> => {
  const response = await api.get(`/turnos/${id}`);
  return response.data;
};

export const createTurno = async (turno: TurnoCreate): Promise<Turno> => {
  const response = await api.post('/turnos', turno);
  return response.data;
};

export const updateTurno = async (id: number, turno: TurnoUpdate): Promise<Turno> => {
  const response = await api.patch(`/turnos/${id}`, turno);
  return response.data;
};

export const deleteTurno = async (id: number): Promise<void> => {
  await api.delete(`/turnos/${id}`);
};

export const cancelarTurno = async (id: number, motivo?: string): Promise<Turno> => {
  const response = await api.post(`/turnos/${id}/cancelar`, { motivo });
  return response.data;
};

// ==================== Configuración ====================

export const getConfiguracion = async (): Promise<ConfiguracionTurnos> => {
  const response = await api.get('/turnos/config/mi-configuracion');
  return response.data;
};

export const updateConfiguracion = async (config: ConfiguracionTurnosUpdate): Promise<ConfiguracionTurnos> => {
  const response = await api.patch('/turnos/config/mi-configuracion', config);
  return response.data;
};

// ==================== Disponibilidad ====================

export const getSlotsDisponibles = async (
  fecha_desde: string,
  fecha_hasta: string,
  duracion_minutos: number
): Promise<DisponibilidadResponse> => {
  const response = await api.get('/turnos/disponibilidad/slots', {
    params: { fecha_desde, fecha_hasta, duracion_minutos },
  });
  return response.data;
};

export const generarLink = async (duracion_minutos: number): Promise<LinkTurnoResponse> => {
  const response = await api.post('/turnos/links/generar', { duracion_minutos });
  return response.data;
};

export const getEstadisticas = async (mes: number, anio: number): Promise<EstadisticasTurnos> => {
  const response = await api.get(`/turnos/estadisticas/${mes}/${anio}`);
  return response.data;
};

// ==================== Rutas Públicas ====================

export const getDisponibilidadPublica = async (
  usuario_id: number,
  fecha_desde: string,
  fecha_hasta: string,
  duracion_minutos: number
): Promise<DisponibilidadResponse> => {
  const response = await api.get(`/turnos/publico/${usuario_id}/disponibilidad`, {
    params: { fecha_desde, fecha_hasta, duracion_minutos },
  });
  return response.data;
};

export const reservarTurnoPublico = async (
  usuario_id: number,
  turno: TurnoCreatePublic
): Promise<Turno> => {
  const response = await api.post(`/turnos/publico/${usuario_id}/reservar`, turno);
  return response.data;
};

export const getTurnoPublico = async (token: string): Promise<Turno> => {
  const response = await api.get(`/turnos/publico/reserva/${token}`);
  return response.data;
};

export const confirmarTurnoPublico = async (token: string): Promise<Turno> => {
  const response = await api.post(`/turnos/publico/reserva/${token}/confirmar`, { confirmar: true });
  return response.data;
};

export const cancelarTurnoPublico = async (token: string, motivo?: string): Promise<Turno> => {
  const response = await api.post(`/turnos/publico/reserva/${token}/cancelar`, { motivo });
  return response.data;
};

// ==================== Rutas Públicas con Token (Nuevo Sistema) ====================

export const getLinkInfo = async (token: string): Promise<{
  duracion_minutos: number;
  mensaje_personalizado?: string;
  activo: boolean;
  nombre_profesional: string;
  especialidad: string;
}> => {
  const response = await api.get(`/turnos/publico/link/${token}/info`);
  return response.data;
};

export const getDisponibilidadPorToken = async (
  token: string,
  fecha_desde: string,
  fecha_hasta: string
): Promise<DisponibilidadResponse> => {
  const response = await api.get(`/turnos/publico/link/${token}/disponibilidad`, {
    params: { fecha_desde, fecha_hasta },
  });
  return response.data;
};

export const reservarTurnoConToken = async (
  token: string,
  turno: TurnoCreatePublic
): Promise<Turno> => {
  const response = await api.post(`/turnos/publico/link/${token}/reservar`, turno);
  return response.data;
};
