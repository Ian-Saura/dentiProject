export type EstadoTurno = 'disponible' | 'reservado' | 'confirmado' | 'cancelado' | 'completado' | 'no_asistio';

export interface Turno {
  id: number;
  usuario_id: number;
  paciente_id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  estado: EstadoTurno;
  nombre_paciente?: string;
  apellido_paciente?: string;
  dni_paciente?: string;
  telefono_paciente?: string;
  email_paciente?: string;
  motivo_consulta?: string;
  observaciones?: string;
  notas_profesional?: string;
  token_reserva?: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  creado_por_publico: boolean;
  recordatorio_enviado: boolean;
  confirmado_por_paciente: boolean;
}

export interface TurnoCreate {
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  paciente_id?: number;
  nombre_paciente?: string;
  apellido_paciente?: string;
  dni_paciente?: string;
  telefono_paciente?: string;
  email_paciente?: string;
  motivo_consulta?: string;
  observaciones?: string;
}

export interface TurnoCreatePublic {
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  nombre_paciente: string;
  apellido_paciente: string;
  telefono_paciente: string;
  email_paciente?: string;
  motivo_consulta?: string;
}

export interface TurnoUpdate {
  fecha?: string;
  hora_inicio?: string;
  duracion_minutos?: number;
  estado?: EstadoTurno;
  paciente_id?: number;
  nombre_paciente?: string;
  apellido_paciente?: string;
  telefono_paciente?: string;
  email_paciente?: string;
  motivo_consulta?: string;
  observaciones?: string;
  notas_profesional?: string;
  confirmado_por_paciente?: boolean;
}

export interface HorarioAtencion {
  inicio: string;
  fin: string;
}

export interface ConfiguracionTurnos {
  id: number;
  usuario_id: number;
  activo: boolean;
  duraciones_permitidas: number[];
  dias_anticipacion_min: number;
  dias_anticipacion_max: number;
  hora_inicio_dia: string;
  hora_fin_dia: string;
  link_reserva_unico?: string;
  horarios_atencion: Record<string, HorarioAtencion[]>;
  dias_bloqueados: string[];
  intervalo_descanso_minutos: number;
  permitir_superposicion: boolean;
  mensaje_bienvenida?: string;
  mensaje_confirmacion?: string;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface ConfiguracionTurnosUpdate {
  activo?: boolean;
  duraciones_permitidas?: number[];
  dias_anticipacion_min?: number;
  dias_anticipacion_max?: number;
  hora_inicio_dia?: string;
  hora_fin_dia?: string;
  link_reserva_unico?: string;
  horarios_atencion?: Record<string, HorarioAtencion[]>;
  dias_bloqueados?: string[];
  intervalo_descanso_minutos?: number;
  permitir_superposicion?: boolean;
  mensaje_bienvenida?: string;
  mensaje_confirmacion?: string;
}

export interface SlotDisponible {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
}

export interface DisponibilidadResponse {
  slots: SlotDisponible[];
  total: number;
}

export interface LinkTurnoResponse {
  id: number;
  token: string;
  url: string;
  duracion_minutos: number;
  activo: boolean;
  mensaje_personalizado?: string;
  usos_totales: number;
  fecha_creacion: string;
}

export interface EstadisticasTurnos {
  mes: number;
  anio: number;
  total: number;
  confirmados: number;
  completados: number;
  cancelados: number;
  no_asistio: number;
  pendientes: number;
  tasa_asistencia: number;
  tasa_cancelacion: number;
}
