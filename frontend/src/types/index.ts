// API Types matching backend schemas
export interface User {
  id: number;
  username: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  especialidad: 'odontologia' | 'dermatologia' | 'kinesiologia';
  plan: 'trial' | 'premium' | 'enterprise';
  fecha_registro: string;
  activo: boolean;
  role_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  obra_social?: string;
  numero_afiliado?: string;
  contacto_emergencia?: string;
  alergias?: string;
  medicamentos_actuales?: string;
  observaciones_medicas?: string;
  fecha_registro: string;
  activo: boolean;
}

export interface PacienteCreate {
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  obra_social?: string;
  numero_afiliado?: string;
  contacto_emergencia?: string;
  alergias?: string;
  medicamentos_actuales?: string;
  observaciones_medicas?: string;
}

export interface Consulta {
  id: number;
  paciente_id: number;
  prestacion_usuario_id: number;
  fecha_consulta: string;
  monto_ars: number;
  medio_pago: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago' | 'otro';
  pieza_dental?: string;
  dientes_tratados?: number[];
  tiempo_real_minutos?: number;
  estado: 'completada' | 'pendiente' | 'cancelada' | 'no_asistio';
  proxima_cita?: string;
  observaciones?: string;
  notas_privadas?: string;
  descuento_aplicado: number;
  fecha_creacion: string;
  paciente?: Paciente;
  prestacion_usuario?: PrestacionUsuario;
}

export interface ConsultaCreate {
  paciente_id: number;
  prestacion_usuario_id: number;
  fecha_consulta: string;
  monto_ars: number;
  medio_pago: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago' | 'otro';
  pieza_dental?: string;
  dientes_tratados?: number[];
  tiempo_real_minutos?: number;
  estado?: 'completada' | 'pendiente' | 'cancelada' | 'no_asistio';
  proxima_cita?: string;
  observaciones?: string;
  notas_privadas?: string;
  descuento_aplicado?: number;
}

export interface PrestacionUsuario {
  id: number;
  prestacion_id: number;
  nombre_personalizado?: string;
  tiempo_personal_min?: number;
  margen_ganancia_porcentaje: number;
  activo: boolean;
  notas_personales?: string;
  fecha_creacion: string;
  prestacion?: Prestacion;
}

export interface Prestacion {
  id: number;
  codigo: string;
  nombre: string;
  categoria: 'diagnostico' | 'prevencion' | 'operatoria' | 'endodoncia' | 'cirugia' | 'protesis' | 'ortodoncia' | 'estetica';
  subcategoria?: string;
  tiempo_estimado_min: number;
  complejidad: 'baja' | 'media' | 'alta' | 'muy_alta';
  requiere_anestesia: boolean;
  requiere_radiografia: boolean;
  es_multisesion: boolean;
  activo: boolean;
}

export interface CostoEquipo {
  id: number;
  nombre_equipo: string;
  monto_compra_usd: number;
  fecha_compra: string;
  anios_vida_util: number;
  marca?: string;
  modelo?: string;
  observaciones?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface CostoEquipoCreate {
  nombre_equipo: string;
  monto_compra_usd: number;
  fecha_compra: string;
  anios_vida_util: number;
  marca?: string;
  modelo?: string;
  observaciones?: string;
}

export interface GastoFijo {
  id: number;
  concepto: string;
  monto_mensual: number;
  moneda: 'ARS' | 'USD';
  monto_mensual_ars?: number;  // Calculated field
  observaciones?: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface GastoFijoCreate {
  concepto: string;
  monto_mensual: number;
  moneda: 'ARS' | 'USD';
  observaciones?: string;
}

export interface ConfiguracionUsuario {
  id: number;
  costo_hora_calculado_ars?: number;
  costo_hora_manual_ars?: number;
  usar_costo_manual: boolean;
  horas_anuales_trabajadas: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// Analytics Types
export interface AnalyticsResumen {
  total_consultas: number;
  ingreso_total: number;
  promedio_consulta: number;
  tratamiento_popular: string;
  ingresos_mes: number;
}

export interface AnalyticsKPIs {
  dias_desde_ultima_consulta?: number;
  consultas_ultima_semana: number;
  ingreso_promedio_diario: number;
  crecimiento_mensual: number;
}

export interface CostosAnalisis {
  costo_hora_ars: number;
  costo_equipos_anual: number;
  costo_gastos_anual: number;
  costo_total_anual: number;
  horas_anuales: number;
  cantidad_equipos: number;
  cantidad_gastos: number;
}

export interface PuntoEquilibrio {
  consultas_necesarias_mes: number;
  consultas_necesarias_anual: number;
  ingreso_necesario_mes: number;
  ingreso_necesario_anual: number;
  precio_promedio: number;
  costo_variable_promedio: number;
  margen_contribucion: number;
  costos_fijos_mensuales: number;
  costos_fijos_anuales: number;
  consultas_ultimo_mes: number;
  diferencia_consultas: number;
  porcentaje_equilibrio: number;
  esta_en_equilibrio: boolean;
  error?: string;
}

// Calculator Types
export interface CalculadoraRecomendacion {
  margen: string;
  precio: number;
  ganancia: number;
  valor: number;
}

export interface CalculadoraRequest {
  tiempo_horas: number;
  costo_materiales_ars: number;
  usar_costo_real?: boolean;
}

// Import Types
export interface ImportResult {
  migrados: number;
  errores: number;
  total_ars: number;
}

// UI Types
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description?: string;
}

export interface FilterOptions {
  mostrar_desde?: string;
  cantidad?: string;
  ordenar_por?: string;
  paciente?: string;
  tratamiento?: string;
  medio_pago?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  rango_montos?: [number, number];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
