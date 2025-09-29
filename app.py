#v6.0
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date
import json
import os
import re
import hashlib
from typing import Dict, List, Tuple
import numpy as np

# 2 - Configuración de la página
st.set_page_config(
    page_title="Manny App - Sistema de Gestión de Consultorios de Salud",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 3 - CSS personalizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1e3a8a;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);
        padding: 1rem;
        border-radius: 0.5rem;
        color: white;
        text-align: center;
        margin: 0.5rem 0;
    }
    .cost-analysis-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 1rem;
        color: white;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# 4 - UserManager
class UserManager:
    def __init__(self):
        self.users_file = "usuarios.json"
        self.data_folder = "data"
        self.init_system()
    
    def init_system(self):
        if not os.path.exists(self.data_folder):
            os.makedirs(self.data_folder)
        
        if not os.path.exists(self.users_file):
            usuarios_default = {
                "admin": {
                    "password_hash": self.hash_password("Homero123"),
                    "nombre": "Dr. Administrador",
                    "email": "admin@manny.com",
                    "especialidad": "odontologia",
                    "plan": "premium",
                    "fecha_registro": datetime.now().isoformat()
                }
            }
            self.save_users(usuarios_default)
            for user_id in usuarios_default.keys():
                self.create_user_folder(user_id)
    
    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    def load_users(self):
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    
    def save_users(self, users_data):
        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, ensure_ascii=False, indent=2)
    
    def validate_user(self, username, password):
        users = self.load_users()
        if username not in users:
            return False, "Usuario no encontrado"
        password_hash = self.hash_password(password)
        if users[username]["password_hash"] != password_hash:
            return False, "Contraseña incorrecta"
        return True, "Login exitoso"
    
    def get_user_info(self, username):
        users = self.load_users()
        return users.get(username, {})
    
    def create_user_folder(self, user_id):
        user_folder = os.path.join(self.data_folder, user_id)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)
            initial_data = {
                'consultas': [],
                'config': {
                    'costo_por_hora': 29000,
                    'margen_ganancia': 0.40,
                    'tipo_cambio_usd_ars': 1335.0,
                    'horas_anuales_trabajadas': 1100
                },
                'equipos': [],
                'gastos_fijos': []
            }
            data_file = os.path.join(user_folder, 'dental_data.json')
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, ensure_ascii=False, indent=2, default=str)

# 5 - DataManager expandido con análisis de costos
class DataManager:
    def __init__(self, user_id=None):
        if user_id:
            self.data_file = os.path.join("data", user_id, "dental_data.json")
        else:
            self.data_file = "dental_data.json"
        self.user_id = user_id
        self.load_data()
    
    def load_data(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.consultas = pd.DataFrame(data.get('consultas', []))
                    self.config = data.get('config', self.get_default_config())
                    self.equipos = data.get('equipos', [])
                    self.gastos_fijos = data.get('gastos_fijos', [])
            except Exception as e:
                st.error(f"Error cargando datos: {e}")
                self.init_default_data()
        else:
            self.init_default_data()
    
    def init_default_data(self):
        self.consultas = pd.DataFrame(columns=['fecha', 'paciente', 'tratamiento', 'monto_ars', 'medio_pago'])
        self.config = self.get_default_config()
        self.equipos = []
        self.gastos_fijos = []
    
    def get_default_config(self):
        return {
            'costo_por_hora': 29000,
            'margen_ganancia': 0.40,
            'tipo_cambio_usd_ars': 1335.0,
            'horas_anuales_trabajadas': 1100
        }
    
    def save_data(self):
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            data = {
                'consultas': self.consultas.to_dict('records'),
                'config': self.config,
                'equipos': self.equipos,
                'gastos_fijos': self.gastos_fijos
            }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            st.error(f"Error guardando datos: {e}")
            return False
    
    def add_consulta(self, paciente, tratamiento, monto_ars, medio_pago, fecha_consulta=None):
        if fecha_consulta:
            # Combinar fecha seleccionada con hora actual
            fecha_completa = datetime.combine(fecha_consulta, datetime.now().time())
            fecha_iso = fecha_completa.isoformat()
        else:
            fecha_iso = datetime.now().isoformat()
        
        nueva_consulta = {
            'fecha': fecha_iso,
            'paciente': paciente,
            'tratamiento': tratamiento,
            'monto_ars': monto_ars,
            'medio_pago': medio_pago
        }
        if self.consultas.empty:
            self.consultas = pd.DataFrame([nueva_consulta])
        else:
            self.consultas = pd.concat([self.consultas, pd.DataFrame([nueva_consulta])], ignore_index=True)
        
        self.save_data()
        return nueva_consulta
    
    def add_equipo(self, nombre, monto_usd, años_vida_util, fecha_compra, observaciones=""):
        nuevo_equipo = {
            'id': len(self.equipos) + 1,
            'nombre': nombre,
            'monto_compra_usd': float(monto_usd),
            'años_vida_util': int(años_vida_util),
            'fecha_compra': fecha_compra.isoformat() if isinstance(fecha_compra, date) else fecha_compra,
            'observaciones': observaciones,
            'activo': True,
            'fecha_creacion': datetime.now().isoformat()
        }
        self.equipos.append(nuevo_equipo)
        self.save_data()
        return nuevo_equipo
    
    def add_gasto_fijo(self, concepto, monto_mensual_ars):
        nuevo_gasto = {
            'id': len(self.gastos_fijos) + 1,
            'concepto': concepto,
            'monto_mensual_ars': float(monto_mensual_ars),
            'activo': True,
            'fecha_creacion': datetime.now().isoformat()
        }
        self.gastos_fijos.append(nuevo_gasto)
        self.save_data()
        return nuevo_gasto
    
    def delete_equipo(self, equipo_id):
        """Eliminar equipo por ID"""
        self.equipos = [e for e in self.equipos if e.get('id') != equipo_id]
        self.save_data()
        return True
    
    def delete_gasto_fijo(self, gasto_id):
        """Eliminar gasto fijo por ID"""
        self.gastos_fijos = [g for g in self.gastos_fijos if g.get('id') != gasto_id]
        self.save_data()
        return True
    
    def delete_consulta(self, index):
        """Eliminar consulta por índice"""
        if 0 <= index < len(self.consultas):
            self.consultas = self.consultas.drop(index).reset_index(drop=True)
            self.save_data()
            return True
        return False
    
    def delete_all_consultas(self):
        """Eliminar todas las consultas"""
        self.consultas = pd.DataFrame(columns=['fecha', 'paciente', 'tratamiento', 'monto_ars', 'medio_pago'])
        self.save_data()
        return True
    
    def calcular_costo_hora_real(self):
        """Cálculo integral del costo por hora basado en equipos y gastos fijos"""
        
        # 1. Costos de equipos (amortización con inflación 4% anual)
        costo_equipos_anual_usd = 0
        for equipo in self.equipos:
            if equipo.get('activo', True):
                # Amortización con inflación
                costo_reposicion = equipo['monto_compra_usd'] * (1.04 ** equipo['años_vida_util'])
                amortizacion_anual = costo_reposicion / equipo['años_vida_util']
                costo_equipos_anual_usd += amortizacion_anual
        
        # Convertir USD a ARS
        tipo_cambio = self.config.get('tipo_cambio_usd_ars', 1335)
        costo_equipos_anual_ars = costo_equipos_anual_usd * tipo_cambio
        
        # 2. Gastos fijos anuales (ARS)
        costo_gastos_anual_ars = sum([
            gasto['monto_mensual_ars'] * 12 
            for gasto in self.gastos_fijos 
            if gasto.get('activo', True)
        ])
        
        # 3. Cálculo final
        costo_total_anual = costo_equipos_anual_ars + costo_gastos_anual_ars
        horas_anuales = self.config.get('horas_anuales_trabajadas', 1100)
        
        costo_hora = costo_total_anual / horas_anuales if horas_anuales > 0 else 0
        
        return {
            'costo_hora_ars': costo_hora,
            'costo_equipos_anual': costo_equipos_anual_ars,
            'costo_gastos_anual': costo_gastos_anual_ars,
            'costo_total_anual': costo_total_anual,
            'horas_anuales': horas_anuales,
            'cantidad_equipos': len([e for e in self.equipos if e.get('activo', True)]),
            'cantidad_gastos': len([g for g in self.gastos_fijos if g.get('activo', True)])
        }
    
    def get_resumen(self):
        if self.consultas.empty:
            return {
                'total_consultas': 0,
                'ingreso_total': 0,
                'promedio_consulta': 0,
                'tratamiento_popular': 'N/A',
                'ingresos_mes': 0
            }
        
        if not self.consultas.empty:
            self.consultas['fecha'] = pd.to_datetime(self.consultas['fecha'], errors='coerce')
        
        total_consultas = len(self.consultas)
        ingreso_total = self.consultas['monto_ars'].sum()
        promedio_consulta = ingreso_total / total_consultas if total_consultas > 0 else 0
        
        tratamiento_popular = 'N/A'
        if not self.consultas.empty:
            tratamientos = self.consultas['tratamiento'].value_counts()
            if not tratamientos.empty:
                tratamiento_popular = tratamientos.index[0]
        
        fecha_actual = datetime.now()
        mes_actual = self.consultas[
            (self.consultas['fecha'].dt.month == fecha_actual.month) &
            (self.consultas['fecha'].dt.year == fecha_actual.year)
        ]
        ingresos_mes = mes_actual['monto_ars'].sum() if not mes_actual.empty else 0
        
        return {
            'total_consultas': total_consultas,
            'ingreso_total': round(ingreso_total, 0),
            'promedio_consulta': round(promedio_consulta, 0),
            'tratamiento_popular': tratamiento_popular,
            'ingresos_mes': round(ingresos_mes, 0)
        }

# 6 - Funciones de análisis de costos
def show_configuracion_costos(data_manager):
    """Página de configuración de costos"""
    st.title("⚙️ Configuración de Costos")
    
    tab1, tab2, tab3 = st.tabs(["🔧 Equipos", "🏢 Gastos Fijos", "⚙️ Parámetros"])
    
    with tab1:
        st.subheader("🔧 Equipamiento del Consultorio")
        
        # Mostrar equipos actuales con botones de eliminar
        if data_manager.equipos:
            st.markdown("**Equipos registrados:**")
            
            for equipo in data_manager.equipos:
                col1, col2, col3, col4, col5 = st.columns([3, 2, 2, 2, 1])
                
                with col1:
                    st.write(f"**{equipo['nombre']}**")
                with col2:
                    st.write(f"${equipo['monto_compra_usd']:,.0f} USD")
                with col3:
                    st.write(f"{equipo['años_vida_util']} años")
                with col4:
                    fecha_compra = pd.to_datetime(equipo['fecha_compra']).strftime('%d/%m/%Y')
                    st.write(fecha_compra)
                with col5:
                    if st.button("🗑️", key=f"del_equipo_{equipo['id']}", help="Eliminar equipo"):
                        data_manager.delete_equipo(equipo['id'])
                        st.success("Equipo eliminado")
                        st.rerun()
        else:
            st.info("No hay equipos registrados aún.")
        
        # Formulario para nuevo equipo
        with st.form("nuevo_equipo"):
            st.markdown("**Agregar Nuevo Equipo**")
            
            col1, col2 = st.columns(2)
            with col1:
                nombre_equipo = st.text_input("Nombre del Equipo *", placeholder="Ej: Sillón Dental")
                monto_usd = st.number_input("Precio pagado (USD) *", min_value=0.0, step=100.0, value=1000.0)
            
            with col2:
                años_vida = st.selectbox("Vida Útil (años)", [3, 5, 7, 8, 10], index=1)
                fecha_compra = st.date_input("Fecha de Compra", value=date.today())
            
            observaciones = st.text_area("Observaciones (opcional)")
            
            if st.form_submit_button("💾 Agregar Equipo", type="primary"):
                if nombre_equipo and monto_usd > 0:
                    data_manager.add_equipo(nombre_equipo, monto_usd, años_vida, fecha_compra, observaciones)
                    st.success("✅ Equipo agregado correctamente")
                    st.rerun()
                else:
                    st.error("❌ Complete los campos obligatorios")
    
    with tab2:
        st.subheader("🏢 Gastos Fijos Mensuales")
        
        # Mostrar gastos actuales con botones de eliminar
        if data_manager.gastos_fijos:
            st.markdown("**Gastos fijos registrados:**")
            
            for gasto in data_manager.gastos_fijos:
                col1, col2, col3 = st.columns([4, 3, 1])
                
                with col1:
                    st.write(f"**{gasto['concepto']}**")
                with col2:
                    st.write(f"${gasto['monto_mensual_ars']:,.0f} ARS/mes")
                with col3:
                    if st.button("🗑️", key=f"del_gasto_{gasto['id']}", help="Eliminar gasto"):
                        data_manager.delete_gasto_fijo(gasto['id'])
                        st.success("Gasto eliminado")
                        st.rerun()
            
            st.markdown("---")
            total_mensual = sum([g['monto_mensual_ars'] for g in data_manager.gastos_fijos if g.get('activo', True)])
            st.metric("💰 Total Gastos Fijos", f"${total_mensual:,.0f} ARS/mes")
        else:
            st.info("No hay gastos fijos registrados aún.")
        
        # Formulario para nuevo gasto
        with st.form("nuevo_gasto"):
            st.markdown("**Agregar Nuevo Gasto Fijo**")
            
            col1, col2 = st.columns(2)
            with col1:
                concepto = st.text_input("Concepto *", placeholder="Ej: Alquiler")
            with col2:
                monto_mensual = st.number_input("Monto mensual (ARS) *", min_value=0.0, step=1000.0, value=50000.0)
            
            if st.form_submit_button("💾 Agregar Gasto", type="primary"):
                if concepto and monto_mensual > 0:
                    data_manager.add_gasto_fijo(concepto, monto_mensual)
                    st.success("✅ Gasto agregado correctamente")
                    st.rerun()
                else:
                    st.error("❌ Complete los campos obligatorios")
    
    with tab3:
        st.subheader("⚙️ Parámetros de Trabajo")
        
        with st.form("parametros"):
            col1, col2 = st.columns(2)
            
            with col1:
                nuevas_horas = st.number_input(
                    "Horas anuales trabajadas",
                    min_value=500,
                    max_value=2000,
                    value=data_manager.config.get('horas_anuales_trabajadas', 1100),
                    step=50,
                    help="Horas productivas anuales (descontando vacaciones, días no trabajados, etc.)"
                )
                
                nuevo_margen = st.slider(
                    "Margen de ganancia objetivo (%)",
                    min_value=10,
                    max_value=200,
                    value=int(data_manager.config.get('margen_ganancia', 0.4) * 100),
                    step=5
                ) / 100
            
            with col2:
                nuevo_tc = st.number_input(
                    "Tipo de cambio USD/ARS",
                    min_value=100.0,
                    max_value=5000.0,
                    value=data_manager.config.get('tipo_cambio_usd_ars', 1335.0),
                    step=10.0,
                    help="Para convertir equipos en USD a ARS"
                )
            
            if st.form_submit_button("💾 Actualizar Parámetros", type="primary"):
                data_manager.config.update({
                    'horas_anuales_trabajadas': nuevas_horas,
                    'margen_ganancia': nuevo_margen,
                    'tipo_cambio_usd_ars': nuevo_tc
                })
                data_manager.save_data()
                st.success("✅ Parámetros actualizados exitosamente")
                st.rerun()

def show_analisis_costos(data_manager, user_info):
    """Página de análisis de costos integral"""
    st.title("💰 Análisis de Costos y Rentabilidad")
    
    especialidad = user_info.get('especialidad', 'odontologia')
    especialidad_emoji = {
        'odontologia': '🦷',
        'dermatologia': '🧴',
        'kinesiologia': '🏃‍♂️'
    }.get(especialidad, '🏥')
    
    st.markdown(f"### {especialidad_emoji} {especialidad.title()}")
    
    # Calcular métricas de costos
    costos_analysis = data_manager.calcular_costo_hora_real()
    
    # Verificar si tiene costos configurados
    if costos_analysis['costo_total_anual'] == 0:
        st.warning("⚠️ No tiene equipos ni gastos fijos configurados. Vaya a 'Configuración Costos' para comenzar.")
        st.info("💡 El análisis de costos le permitirá conocer su costo real por hora y optimizar sus precios.")
        return
    
    # Métricas principales
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("💰 Costo Real/Hora", f"${costos_analysis['costo_hora_ars']:,.0f} ARS")
    
    with col2:
        precio_minimo = costos_analysis['costo_hora_ars'] * 1.5  # 50% margen
        st.metric("📊 Precio Mín. (50%)", f"${precio_minimo:,.0f} ARS")
    
    with col3:
        precio_optimo = costos_analysis['costo_hora_ars'] * 2  # 100% margen
        st.metric("🎯 Precio Óptimo (100%)", f"${precio_optimo:,.0f} ARS")
    
    with col4:
        resumen = data_manager.get_resumen()
        if resumen['promedio_consulta'] > 0:
            consultas_breakeven = costos_analysis['costo_total_anual'] / resumen['promedio_consulta']
            st.metric("⚖️ Consultas Break-Even", f"{consultas_breakeven:,.0f} /año")
        else:
            st.metric("⚖️ Consultas Break-Even", "Sin datos")
    
    # Gráfico de composición de costos
    if costos_analysis['costo_total_anual'] > 0:
        st.subheader("📊 Composición de Costos Anuales")
        
        costos_data = pd.DataFrame([
            {"Categoría": "Equipos (Amortización)", "Monto": costos_analysis['costo_equipos_anual']},
            {"Categoría": "Gastos Fijos", "Monto": costos_analysis['costo_gastos_anual']}
        ])
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            fig_costos = px.pie(
                costos_data, 
                values='Monto', 
                names='Categoría',
                title=f"Total Anual: ${costos_analysis['costo_total_anual']:,.0f} ARS",
                color_discrete_sequence=['#3b82f6', '#ef4444']
            )
            st.plotly_chart(fig_costos, use_container_width=True)
        
        with col2:
            st.markdown("**📈 Resumen de Configuración**")
            st.metric("🔧 Equipos", costos_analysis['cantidad_equipos'])
            st.metric("🏢 Gastos Fijos", costos_analysis['cantidad_gastos'])
            st.metric("⏰ Horas Anuales", costos_analysis['horas_anuales'])
    
    # Análisis de rentabilidad actual
    if resumen['total_consultas'] > 0:
        st.subheader("📈 Análisis de Rentabilidad Actual")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**💵 Ingresos vs Costos**")
            ingresos_anuales = resumen['ingreso_total'] * 12  # Proyección anual
            margen_real = ((ingresos_anuales - costos_analysis['costo_total_anual']) / ingresos_anuales * 100) if ingresos_anuales > 0 else 0
            
            if margen_real > 50:
                st.success(f"✅ Margen excelente: {margen_real:.1f}%")
            elif margen_real > 25:
                st.warning(f"⚠️ Margen aceptable: {margen_real:.1f}%")
            else:
                st.error(f"🚨 Margen bajo: {margen_real:.1f}%")
        
        with col2:
            st.markdown("**⏰ Eficiencia Horaria**")
            consultas_mes = resumen['total_consultas'] / max(1, len(data_manager.consultas['fecha'].dt.month.unique()) if not data_manager.consultas.empty else 1)
            eficiencia = (consultas_mes * 12) / costos_analysis['horas_anuales'] if costos_analysis['horas_anuales'] > 0 else 0
            
            st.metric("Consultas por Hora Disponible", f"{eficiencia:.2f}")

# 7 - Funciones de interfaz (actualizadas)
# FUNCIÓN MEJORADA DE DASHBOARD - PEGAR ENCIMA DE LA FUNCIÓN show_dashboard ACTUAL

def show_dashboard(data_manager, user_info):
    especialidad = user_info.get('especialidad', 'odontologia')
    especialidad_emoji = {
        'odontologia': '🦷',
        'dermatologia': '🧴', 
        'kinesiologia': '🏃‍♂️'
    }.get(especialidad, '🏥')
    
    st.subheader(f"📊 Dashboard - {user_info.get('nombre', 'Usuario')} {especialidad_emoji}")
    
    # Análisis de costos en el dashboard
    costos_analysis = data_manager.calcular_costo_hora_real()
    
    # Mostrar alerta si tiene costos configurados
    if costos_analysis['costo_total_anual'] > 0:
        st.markdown(f"""
        <div class="cost-analysis-card">
            <h3>💰 Análisis de Costos Automático</h3>
            <p>Su costo real por hora: <strong>${costos_analysis['costo_hora_ars']:,.0f} ARS</strong></p>
            <p>Precio mínimo recomendado (50% margen): <strong>${costos_analysis['costo_hora_ars'] * 1.5:,.0f} ARS</strong></p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.info("💡 Configure sus equipos y gastos fijos para obtener análisis de costos automático.")
    
    # Dashboard con métricas principales
    resumen = data_manager.get_resumen()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("💰 Ingresos Totales", f"${resumen['ingreso_total']:,.0f} ARS")
    
    with col2:
        st.metric("👥 Total Consultas", resumen['total_consultas'])
    
    with col3:
        st.metric("📊 Promedio/Consulta", f"${resumen['promedio_consulta']:,.0f} ARS")
    
    with col4:
        st.metric("🔥 Más Popular", resumen['tratamiento_popular'])
    
    # Si no hay consultas, mostrar mensaje y terminar
    if data_manager.consultas.empty:
        st.info("No hay consultas registradas aún.")
        return
    
    # Preparar datos para gráficos
    df_consultas = data_manager.consultas.copy()
    df_consultas['fecha'] = pd.to_datetime(df_consultas['fecha'], errors='coerce')
    
    # =============================================================================
    # SECCIÓN 1: GRÁFICOS DE TIEMPO Y TENDENCIAS
    # =============================================================================
    st.markdown("---")
    st.subheader("📈 Tendencias Temporales")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # 1. Ingresos por mes (línea con marcadores)
        st.markdown("**💰 Evolución de Ingresos Mensuales**")
        df_monthly = df_consultas.copy()
        df_monthly['mes'] = df_monthly['fecha'].dt.to_period('M')
        monthly_data = df_monthly.groupby('mes').agg({
            'monto_ars': 'sum',
            'paciente': 'count'
        }).reset_index()
        monthly_data['mes'] = monthly_data['mes'].astype(str)
        
        fig_monthly_line = px.line(
            monthly_data, 
            x='mes', 
            y='monto_ars',
            markers=True,
            title="",
            labels={'monto_ars': 'Ingresos (ARS)', 'mes': 'Mes'}
        )
        fig_monthly_line.update_traces(line_color='#3b82f6', line_width=3)
        fig_monthly_line.update_layout(height=300)
        st.plotly_chart(fig_monthly_line, use_container_width=True)
    
    with col2:
        # 2. Consultas por día de la semana
        st.markdown("**📅 Consultas por Día de la Semana**")
        df_consultas['dia_semana'] = df_consultas['fecha'].dt.day_name()
        dias_orden = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dias_español = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        consultas_dia = df_consultas['dia_semana'].value_counts().reindex(dias_orden).fillna(0)
        consultas_dia.index = dias_español
        
        fig_dias = px.bar(
            x=consultas_dia.index, 
            y=consultas_dia.values,
            title="",
            labels={'x': 'Día', 'y': 'Cantidad de Consultas'},
            color=consultas_dia.values,
            color_continuous_scale='Blues'
        )
        fig_dias.update_layout(height=300, showlegend=False)
        st.plotly_chart(fig_dias, use_container_width=True)
    
    # =============================================================================
    # SECCIÓN 2: ANÁLISIS DE TRATAMIENTOS Y PACIENTES
    # =============================================================================
    st.markdown("---")
    st.subheader("🦷 Análisis de Tratamientos")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # 3. Top tratamientos por ingresos (barras horizontales)
        st.markdown("**💰 Top Tratamientos por Ingresos**")
        tratamientos_ingresos = df_consultas.groupby('tratamiento')['monto_ars'].sum().sort_values(ascending=True).tail(8)
        
        fig_tratamientos = px.bar(
            x=tratamientos_ingresos.values,
            y=tratamientos_ingresos.index,
            orientation='h',
            title="",
            labels={'x': 'Ingresos Totales (ARS)', 'y': 'Tratamiento'},
            color=tratamientos_ingresos.values,
            color_continuous_scale='Viridis'
        )
        fig_tratamientos.update_layout(height=350, showlegend=False)
        st.plotly_chart(fig_tratamientos, use_container_width=True)
    
    with col2:
        # 4. Distribución de precios (histograma)
        st.markdown("**📊 Distribución de Precios de Consultas**")
        fig_hist = px.histogram(
            df_consultas, 
            x='monto_ars', 
            nbins=15,
            title="",
            labels={'monto_ars': 'Monto (ARS)', 'count': 'Frecuencia'},
            color_discrete_sequence=['#ef4444']
        )
        fig_hist.update_layout(height=350)
        st.plotly_chart(fig_hist, use_container_width=True)
    
    # =============================================================================
    # SECCIÓN 3: MÉTRICAS AVANZADAS
    # =============================================================================
    st.markdown("---")
    st.subheader("📈 Métricas de Rendimiento")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # 5. Gauge de objetivo mensual
        st.markdown("**🎯 Objetivo Mensual**")
        objetivo_mensual = 500000  # Puedes hacer esto configurable
        ingresos_mes_actual = resumen['ingresos_mes']
        porcentaje_objetivo = (ingresos_mes_actual / objetivo_mensual) * 100 if objetivo_mensual > 0 else 0
        
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = porcentaje_objetivo,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "% Objetivo Mensual"},
            delta = {'reference': 100},
            gauge = {
                'axis': {'range': [None, 150]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 100], 'color': "gray"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 100
                }
            }
        ))
        fig_gauge.update_layout(height=250)
        st.plotly_chart(fig_gauge, use_container_width=True)
        st.caption(f"Objetivo: ${objetivo_mensual:,.0f} ARS/mes")
    
    with col2:
        # 6. Medios de pago (dona)
        st.markdown("**💳 Medios de Pago**")
        df_consultas['medio_pago_normalizado'] = df_consultas['medio_pago'].apply(normalizar_medio_pago)
        medios_pago = df_consultas['medio_pago_normalizado'].value_counts()
        
        fig_dona = px.pie(
            values=medios_pago.values, 
            names=medios_pago.index,
            hole=0.5,
            title=""
        )
        fig_dona.update_traces(textposition='inside', textinfo='percent+label')
        fig_dona.update_layout(height=300)
        st.plotly_chart(fig_dona, use_container_width=True)
    
    with col3:
        # 7. Pacientes más frecuentes
        st.markdown("**👥 Top Pacientes**")
        top_pacientes = df_consultas['paciente'].value_counts().head(5)
        
        for i, (paciente, cantidad) in enumerate(top_pacientes.items()):
            color = ['🥇', '🥈', '🥉', '🏅', '🏅'][i]
            st.write(f"{color} {paciente}: {cantidad} consultas")
    
    # =============================================================================
    # SECCIÓN 4: ANÁLISIS TEMPORAL DETALLADO
    # =============================================================================
    st.markdown("---")
    st.subheader("⏰ Análisis Temporal Detallado")
    
    col1, col2 = st.columns(2)
    
    with col1:
    # Comparación semanal simple - LADO IZQUIERDO
        st.markdown("**📊 Tratamientos esta Semana vs Anterior**")
        
        # Calcular semanas
        df_consultas['numero_semana'] = df_consultas['fecha'].dt.isocalendar().week
        df_consultas['año'] = df_consultas['fecha'].dt.year
        
        fecha_actual = date.today()
        numero_semana_actual = fecha_actual.isocalendar()[1]
        año_actual = fecha_actual.year
        
        # Contar consultas por semana
        semana_pasada = len(df_consultas[
            (df_consultas['numero_semana'] == numero_semana_actual - 1) & 
            (df_consultas['año'] == año_actual)
        ])

        semana_actual = len(df_consultas[
            (df_consultas['numero_semana'] == numero_semana_actual) & 
            (df_consultas['año'] == año_actual)
        ])
        # Mostrar métricas simples
        col_a, col_b = st.columns(2)
        with col_b:
            if semana_pasada > 0:
                delta = semana_actual - semana_pasada
                st.metric("Esta Semana", semana_actual, delta=f"{delta:+d}")
            else:
                st.metric("Esta Semana", semana_actual)
        with col_a:
            st.metric("Semana Pasada", semana_pasada)

    with col2:
        # 9. Tendencia de precios promedio - LADO DERECHO
        st.markdown("**💹 Evolución Precio Promedio**")
        precio_promedio_mes = df_consultas.groupby(df_consultas['fecha'].dt.to_period('M'))['monto_ars'].mean()
        precio_promedio_mes.index = precio_promedio_mes.index.astype(str)
        
        fig_precio_trend = px.line(
            x=precio_promedio_mes.index,
            y=precio_promedio_mes.values,
            markers=True,
            title="",
            labels={'x': 'Mes', 'y': 'Precio Promedio (ARS)'}
        )
        fig_precio_trend.update_traces(line_color='#10b981', line_width=3)
        fig_precio_trend.update_layout(height=300)
        st.plotly_chart(fig_precio_trend, use_container_width=True)
    
    # =============================================================================
    # SECCIÓN 5: KPIs Y ALERTAS
    # =============================================================================
    st.markdown("---")
    st.subheader("🚨 Alertas y KPIs")
    
    # Calcular KPIs
    dias_desde_ultima = (datetime.now() - df_consultas['fecha'].max()).days
    consultas_ultima_semana = len(df_consultas[df_consultas['fecha'] >= pd.Timestamp.now() - pd.Timedelta(days=7)])
    ingreso_promedio_diario = df_consultas['monto_ars'].sum() / len(df_consultas['fecha'].dt.date.unique())
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        color = "🟢" if dias_desde_ultima <= 2 else "🟡" if dias_desde_ultima <= 7 else "🔴"
        st.metric("📅 Última Consulta", f"{dias_desde_ultima} días", delta=color)
    
    with col2:
        st.metric("📊 Esta Semana", f"{consultas_ultima_semana} consultas")
    
    with col3:
        st.metric("💰 Promedio Diario", f"${ingreso_promedio_diario:,.0f} ARS")
    
    with col4:
        # Calcular crecimiento vs mes anterior
        mes_actual = datetime.now().month
        mes_anterior = mes_actual - 1 if mes_actual > 1 else 12
        
        ingresos_mes_actual = df_consultas[df_consultas['fecha'].dt.month == mes_actual]['monto_ars'].sum()
        ingresos_mes_anterior = df_consultas[df_consultas['fecha'].dt.month == mes_anterior]['monto_ars'].sum()
        
        if ingresos_mes_anterior > 0:
            crecimiento = ((ingresos_mes_actual - ingresos_mes_anterior) / ingresos_mes_anterior) * 100
            delta_color = "normal" if crecimiento >= 0 else "inverse"
            st.metric("📈 Crecimiento Mensual", f"{crecimiento:+.1f}%", delta=f"{crecimiento:+.1f}%")
        else:
            st.metric("📈 Crecimiento Mensual", "N/A")
    
    # VERSIÓN CORREGIDA - BARRA DE PROGRESO SIN HTML COMPLEJO

    # Selector de mes (mismo código)
    if not data_manager.consultas.empty:
        df_fechas = data_manager.consultas.copy()
        df_fechas['fecha'] = pd.to_datetime(df_fechas['fecha'], errors='coerce')
        
        # Obtener meses disponibles
        meses_disponibles = df_fechas['fecha'].dt.to_period('M').unique()
        meses_disponibles = sorted(meses_disponibles, reverse=True)
        
        # Crear opciones para el selectbox
        opciones_meses = []
        nombres_meses = {
            'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
            'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
            'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
            'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
        }
        
        for mes in meses_disponibles:
            try:
                fecha_mes = pd.to_datetime(str(mes))
                if pd.isna(fecha_mes):
                    continue
                nombre_mes = fecha_mes.strftime('%B %Y')
            except:
                continue
            for ingles, español in nombres_meses.items():
                nombre_mes = nombre_mes.replace(ingles, español)
            opciones_meses.append((str(mes), nombre_mes))
        
        # Agregar mes actual si no está
        mes_actual = pd.Timestamp.now().to_period('M')
        if str(mes_actual) not in [opcion[0] for opcion in opciones_meses]:
            fecha_actual = pd.to_datetime(str(mes_actual))
            nombre_actual = fecha_actual.strftime('%B %Y')
            for ingles, español in nombres_meses.items():
                nombre_actual = nombre_actual.replace(ingles, español)
            opciones_meses.insert(0, (str(mes_actual), f"{nombre_actual} (Actual)"))
        
        # Selector
        col1, col2 = st.columns([3, 1])
        with col1:
            st.subheader("📊 Cobertura de Costos Mensuales")
        with col2:
            mes_seleccionado = st.selectbox(
                "Mes:",
                options=[opcion[0] for opcion in opciones_meses],
                format_func=lambda x: next(nombre for periodo, nombre in opciones_meses if periodo == x),
                index=0
            )
    else:
        st.subheader("📊 Cobertura de Costos Mensuales")
        mes_seleccionado = str(pd.Timestamp.now().to_period('M'))

    # Calcular datos
    costos_analysis = data_manager.calcular_costo_hora_real()
    costo_mensual_total = costos_analysis['costo_total_anual'] / 12

    # Ingresos del mes seleccionado
    mes_periodo = pd.Period(mes_seleccionado)
    if not data_manager.consultas.empty:
        df_mes = data_manager.consultas[
            pd.to_datetime(data_manager.consultas['fecha']).dt.to_period('M') == mes_periodo
        ]
        ingresos_mes = df_mes['monto_ars'].sum()
        consultas_mes = len(df_mes)
    else:
        ingresos_mes = 0
        consultas_mes = 0

    # Calcular progreso
    if costo_mensual_total > 0:
        progreso = min(ingresos_mes / costo_mensual_total, 1.0)  # Máximo 1.0 para la barra
        porcentaje = (ingresos_mes / costo_mensual_total) * 100
    else:
        progreso = 1.0 if ingresos_mes > 0 else 0.0
        porcentaje = 100.0 if ingresos_mes > 0 else 0.0

    # Determinar estado y color
    if porcentaje >= 100:
        estado = "✅ META CUMPLIDA"
        color = "#10b981"
    elif porcentaje >= 75:
        estado = "🟡 CERCA DE LA META"
        color = "#f59e0b"
    elif porcentaje >= 50:
        estado = "🔵 PROGRESO MEDIO"
        color = "#3b82f6"
    else:
        estado = "🔴 NECESITA IMPULSO"
        color = "#ef4444"

    # Usar el progress bar nativo de Streamlit + métricas
    col1, col2 = st.columns([3, 1])

    with col1:
        st.progress(progreso, text=f"Progreso: {porcentaje:.1f}% de la meta mensual")
    with col2:
        st.markdown(f"""
        <div style="text-align: center; font-weight: bold; color: {color}; 
                    background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
        {estado}
        </div>
        """, unsafe_allow_html=True)

    # Información detallada
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("🎯 Meta Mensual", f"${costo_mensual_total:,.0f} ARS")

    with col2:
        st.metric("💰 Ingresos del Mes", f"${ingresos_mes:,.0f} ARS")

    with col3:
        diferencia = ingresos_mes - costo_mensual_total
        if diferencia >= 0:
            st.metric("📈 Resultado", f"+${diferencia:,.0f} ARS", delta="Ganancia")
        else:
            st.metric("📉 Faltante", f"${abs(diferencia):,.0f} ARS", delta="Para equilibrio")

    # Métricas adicionales
    st.markdown("---")
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("📊 Consultas", consultas_mes)

    with col2:
        if consultas_mes > 0:
            promedio = ingresos_mes / consultas_mes
            st.metric("📈 Promedio/Consulta", f"${promedio:,.0f}")
        else:
            st.metric("📈 Promedio/Consulta", "$0")

    with col3:
        if costo_mensual_total > 0:
            cobertura = min(porcentaje, 100)
            st.metric("📋 % Costos Cubiertos", f"{cobertura:.1f}%")
        else:
            st.metric("📋 % Costos Cubiertos", "N/A")

    with col4:
        if diferencia < 0 and consultas_mes > 0:
            consultas_necesarias = abs(diferencia) / (ingresos_mes / consultas_mes)
            st.metric("🎯 Consultas Faltantes", f"{consultas_necesarias:.0f}")
        elif porcentaje > 100:
            exceso = porcentaje - 100
            st.metric("🎉 Exceso sobre Meta", f"+{exceso:.1f}%")
        else:
            st.metric("✅ Estado", "Equilibrado")

    # Mensaje motivacional
    if porcentaje >= 120:
        st.success("🎉 ¡Excelente mes! Has superado ampliamente tus costos mensuales.")
    elif porcentaje >= 100:
        st.success("✅ ¡Felicitaciones! Has cubierto todos tus costos mensuales.")
    elif porcentaje >= 75:
        falta = costo_mensual_total - ingresos_mes
        st.warning(f"🔥 ¡Muy cerca! Solo faltan ${falta:,.0f} ARS para cubrir todos los costos.")
    elif porcentaje >= 50:
        st.info("💪 Progreso sólido. Mantén el ritmo para alcanzar la meta mensual.")
    elif consultas_mes == 0:
        st.error("📝 Aún no hay consultas registradas este mes. ¡Es hora de empezar!")
    else:
        st.warning("⚡ El mes necesita más impulso. Considera estrategias para aumentar las consultas.")

    # Alerta si no hay costos configurados
    if costos_analysis['costo_total_anual'] == 0:
        st.info("💡 Configure sus equipos y gastos fijos en 'Configuración Costos' para ver el análisis completo.")


    # Alertas personalizadas
    if dias_desde_ultima > 7:
        st.warning("⚠️ Han pasado más de 7 días desde su última consulta registrada")
    
    if consultas_ultima_semana < 5:
        st.info("💡 Esta semana ha tenido pocas consultas. ¿Considera agendar más citas?")
    
    if resumen['promedio_consulta'] > 0 and costos_analysis['costo_total_anual'] > 0:
        margen_actual = ((resumen['promedio_consulta'] - (costos_analysis['costo_hora_ars'] * 1.5)) / resumen['promedio_consulta']) * 100
        if margen_actual < 25:
            st.error("🚨 Sus márgenes están por debajo del 25%. Considere ajustar precios.")
        elif margen_actual > 60:
            st.success("✅ Excelentes márgenes de ganancia!")
    
    # Mostrar última actualización
    st.markdown("---")
    st.caption(f"📊 Dashboard actualizado: {datetime.now().strftime('%d/%m/%Y %H:%M')} - Total de gráficos: 9")

def show_calculadora_inteligente(data_manager):
    """Calculadora inteligente con análisis de costos automático"""
    st.title("🧮 Calculadora Inteligente de Precios")
    
    # Análisis de costos disponibles
    costos_analysis = data_manager.calcular_costo_hora_real()
    tiene_costos_configurados = costos_analysis['costo_total_anual'] > 0
    
    if tiene_costos_configurados:
        st.success(f"✅ Usando su costo real calculado: ${costos_analysis['costo_hora_ars']:,.0f} ARS/hora")
    else:
        st.warning("⚠️ Configure equipos y gastos fijos para cálculos más precisos")
    
    # Formulario principal
    with st.form("calculadora_inteligente"):
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("📋 Parámetros del Tratamiento")
            
            # Selección de tratamiento con opción personalizada
            lista_tratamientos = [
            "Consulta", "Consulta de Urgencia", "Limpieza", 
            "Operatoria Simple", "Operatoria Compleja", 
            "Endodoncia Unirradicular", "Endodoncia Multirradicular",
            "Placa Estabilizadora Oclusal", "Provisorio", 
            "Corona Metálica", "Corona de Porcelana",
            "Extracción Simple", "Extracción Compleja", 
            "Blanqueamiento", "Implante", "Otro"
            ]       
            
            tratamiento_base = st.selectbox("Tipo de Tratamiento", lista_tratamientos)
            
            if tratamiento_base == "Otro":
                tratamiento_seleccionado = st.text_input(
                    "Especificar tratamiento:",
                    placeholder="Ej: Blanqueamiento, Implante, etc."
                )
                if not tratamiento_seleccionado:
                    tratamiento_seleccionado = "Personalizado"
            else:
                tratamiento_seleccionado = tratamiento_base
            
            # Tiempos estimados por tratamiento
            tiempos_estandar = {
                "Consulta": 0.5,
                "Limpieza": 1.0,
                "Operatoria Simple": 1.5,
                "Operatoria Compleja": 2.5,
                "Endodoncia": 3.0,
                "Corona": 2.0,
                "Extracción Simple": 0.75,
                "Extracción Compleja": 2.0,
                "Personalizado": 1.0
            }
            
            tiempo_sugerido = tiempos_estandar.get(tratamiento_seleccionado, 1.0)
            
            time_hours = st.number_input(
                "Tiempo estimado (horas)",
                min_value=0.1,
                max_value=8.0,
                value=tiempo_sugerido,
                step=0.25,
                help="Tiempo que demora realizar el tratamiento"
            )
            
            materials_ars = st.number_input(
                "Costo de materiales (ARS)",
                min_value=0.0,
                value=5000.0,
                step=1000.0,
                help="Costo total de insumos para este tratamiento"
            )
        
        with col2:
            st.subheader("⚙️ Configuración de Costos")
            
            # Toggle para usar costo automático o manual
            if tiene_costos_configurados:
                usar_costo_real = st.checkbox(
                    "Usar costo real calculado",
                    value=True,
                    help="Basado en sus equipos y gastos fijos configurados"
                )
                
                if usar_costo_real:
                    costo_hora_usar = costos_analysis['costo_hora_ars']
                    st.metric("Costo/Hora Real", f"${costo_hora_usar:,.0f} ARS")
                else:
                    costo_hora_usar = st.number_input(
                        "Costo por hora manual (ARS)",
                        min_value=5000.0,
                        value=29000.0,
                        step=1000.0
                    )
                    st.warning("Usando costo manual en lugar del calculado")
            else:
                usar_costo_real = False
                costo_hora_usar = st.number_input(
                    "Costo por hora (ARS)",
                    min_value=5000.0,
                    value=29000.0,
                    step=1000.0,
                    help="Configure equipos y gastos para cálculo automático"
                )
        
        calcular = st.form_submit_button("🧮 Calcular Recomendaciones", type="primary")
        
        if calcular:
            # Cálculo base
            costo_mano_obra = time_hours * costo_hora_usar
            costo_total = costo_mano_obra + materials_ars
            
            # Recomendaciones con diferentes márgenes
            margenes = {
                "Supervivencia (25%)": 0.25,
                "Competitivo (50%)": 0.50,
                "Premium (75%)": 0.75,
                "Especialista (100%)": 1.00
            }
            
            st.markdown("---")
            st.subheader("💰 Análisis de Costos")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Mano de Obra", f"${costo_mano_obra:,.0f} ARS")
            with col2:
                st.metric("Materiales", f"${materials_ars:,.0f} ARS")
            with col3:
                st.metric("Costo Total", f"${costo_total:,.0f} ARS")
            
            st.subheader("📊 Recomendaciones de Precios")
            
            recomendaciones = []
            for nombre_margen, porcentaje_margen in margenes.items():
                precio_final = costo_total * (1 + porcentaje_margen)
                ganancia = precio_final - costo_total
                
                recomendaciones.append({
                    "Margen": nombre_margen,
                    "Precio": f"${precio_final:,.0f} ARS",
                    "Ganancia": f"${ganancia:,.0f} ARS",
                    "Valor": precio_final
                })
            
            # Mostrar recomendaciones en columnas
            col1, col2 = st.columns(2)
            
            for i, rec in enumerate(recomendaciones):
                col = col1 if i % 2 == 0 else col2
                
                with col:
                    # Color según el margen
                    if "Supervivencia" in rec["Margen"]:
                        color = "🟡"
                    elif "Competitivo" in rec["Margen"]:
                        color = "🟢"
                    elif "Premium" in rec["Margen"]:
                        color = "🔵"
                    else:  # Especialista
                        color = "🟣"
                    
                    recomendado = "← RECOMENDADO" if "Competitivo" in rec["Margen"] else ""
                    
                    st.markdown(f"""
                    **{color} {rec["Margen"]} {recomendado}**
                    - Precio: {rec["Precio"]}
                    - Ganancia: {rec["Ganancia"]}
                    """)
            
            # Búsqueda en registros históricos
            st.subheader("📋 Histórico de Este Tratamiento")
            
            if not data_manager.consultas.empty:
                # Buscar tratamientos exactos o similares
                tratamientos_exactos = data_manager.consultas[
                    data_manager.consultas['tratamiento'].str.lower() == tratamiento_seleccionado.lower()
                ]
                
                if not tratamientos_exactos.empty:
                    st.markdown("**Registros anteriores encontrados:**")
                    
                    # Mostrar últimos 5 registros
                    ultimos_registros = tratamientos_exactos.tail(5).sort_values('fecha', ascending=False)
                    
                    for _, registro in ultimos_registros.iterrows():
                        fecha_registro = pd.to_datetime(registro['fecha']).strftime('%d/%m/%Y')
                        
                        col1, col2, col3 = st.columns([2, 2, 2])
                        with col1:
                            st.write(f"**{registro['paciente']}**")
                        with col2:
                            st.write(f"${registro['monto_ars']:,.0f} ARS")
                        with col3:
                            st.write(fecha_registro)
                    
                    # Estadísticas del histórico
                    precio_promedio = tratamientos_exactos['monto_ars'].mean()
                    precio_ultimo = tratamientos_exactos.iloc[-1]['monto_ars']
                    
                    st.markdown("---")
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.metric("Precio Promedio Histórico", f"${precio_promedio:,.0f} ARS")
                    with col2:
                        st.metric("Último Precio Cobrado", f"${precio_ultimo:,.0f} ARS")
                    with col3:
                        total_realizados = len(tratamientos_exactos)
                        st.metric("Veces Realizadas", total_realizados)
                    
                    # Comparación con recomendaciones actuales
                    precio_competitivo = costo_total * 1.5
                    
                    if precio_ultimo < costo_total:
                        st.error(f"⚠️ Su último precio (${precio_ultimo:,.0f}) estaba por debajo del costo actual")
                    elif precio_ultimo < precio_competitivo:
                        diferencia = precio_competitivo - precio_ultimo
                        st.warning(f"💡 Puede aumentar ${diferencia:,.0f} respecto al último precio cobrado")
                    else:
                        st.success("✅ Su último precio estaba bien posicionado")
                        
                else:
                    st.info(f"No se encontraron registros anteriores de '{tratamiento_seleccionado}'")
                    st.info("Una vez que registre este tratamiento, aparecerá en el histórico para futuras consultas")
            else:
                st.info("No hay consultas registradas aún para mostrar histórico")

def extraer_monto_numerico(monto_str):
    """Extrae valor numérico de string de monto"""
    try:
        if pd.isna(monto_str):
            return 0
        
        monto_clean = str(monto_str).strip()
        
        # Remover símbolos comunes de moneda
        monto_clean = re.sub(r'[$€£¥₹₽₩¢]', '', monto_clean)
        monto_clean = re.sub(r'[^\d.,\-]', '', monto_clean)
        
        if not monto_clean:
            return 0
        
        # Manejar números negativos
        es_negativo = monto_clean.startswith('-')
        monto_clean = monto_clean.lstrip('-')
        
        # Determinar si el último punto/coma son decimales
        if ',' in monto_clean and '.' in monto_clean:
            if monto_clean.rfind(',') > monto_clean.rfind('.'):
                monto_clean = monto_clean.replace('.', '').replace(',', '.')
            else:
                monto_clean = monto_clean.replace(',', '')
        elif ',' in monto_clean:
            if monto_clean.count(',') == 1 and len(monto_clean.split(',')[1]) <= 2:
                monto_clean = monto_clean.replace(',', '.')
            else:
                monto_clean = monto_clean.replace(',', '')
        
        resultado = float(monto_clean)
        return -resultado if es_negativo else resultado
        
    except Exception as e:
        st.warning(f"No se pudo procesar monto '{monto_str}': {e}")
        return 0

def normalizar_fecha_flexible(fecha_valor):
    """Normaliza fechas de múltiples formatos"""
    try:
        if pd.isna(fecha_valor):
            return datetime.now().isoformat()
        
        fecha_str = str(fecha_valor).strip()
        
        formatos_fecha = [
            '%d/%m/%Y', '%d/%m/%y', '%d-%m-%Y', '%d-%m-%y', '%d.%m.%Y', '%d.%m.%y',
            '%m/%d/%Y', '%m/%d/%y', '%m-%d-%Y', '%m-%d-%y',
            '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d', '%Y_%m_%d',
            '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M',
            '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M',
            '%d de %B de %Y', '%d %B %Y', '%B %d, %Y', '%d %b %Y',
        ]
        
        for formato in formatos_fecha:
            try:
                fecha_parsed = datetime.strptime(fecha_str, formato)
                return fecha_parsed.isoformat()
            except ValueError:
                continue
        
        try:
            fecha_pandas = pd.to_datetime(fecha_str, dayfirst=True, errors='coerce')
            if not pd.isna(fecha_pandas):
                return fecha_pandas.isoformat()
        except:
            pass
        
        st.warning(f"No se pudo procesar fecha '{fecha_valor}', usando fecha actual")
        return datetime.now().isoformat()
        
    except Exception as e:
        st.warning(f"Error procesando fecha '{fecha_valor}': {e}")
        return datetime.now().isoformat()

def show_migration_tool(data_manager):
    """Herramienta de migración flexible para cualquier CSV"""
    st.title("📥 Migración de Datos desde CSV")
    
    st.markdown("""
    **Migración Universal de CSV**
    
    Esta herramienta puede trabajar con cualquier archivo CSV:
    - Mapea automáticamente las columnas de tu archivo
    - Convierte formatos de fecha y moneda
    - Todo en pesos argentinos
    - Vista previa antes de migrar
    """)
    
    uploaded_file = st.file_uploader(
        "Sube tu archivo CSV", 
        type=['csv'],
        help="Sube cualquier archivo CSV con datos de consultas"
    )
    
    if uploaded_file is not None:
        try:
            # Detectar encoding
            encoding_options = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
            df = None
            encoding_usado = None
            
            for encoding in encoding_options:
                try:
                    df = pd.read_csv(uploaded_file, encoding=encoding)
                    encoding_usado = encoding
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                st.error("No se pudo leer el archivo. Verifica el formato.")
                return
            
            st.success(f"Archivo cargado correctamente (encoding: {encoding_usado})")
            
            # Vista previa del archivo
            with st.expander("Vista Previa del Archivo", expanded=True):
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Registros", len(df))
                with col2:
                    st.metric("Columnas", len(df.columns))
                with col3:
                    st.metric("Tamaño", f"{uploaded_file.size / 1024:.1f} KB")
                
                st.markdown("**Primeras 5 filas:**")
                st.dataframe(df.head(), use_container_width=True)
                
                st.markdown("**Columnas disponibles:**")
                st.write(", ".join(df.columns.tolist()))
            
            # Mapeo de columnas
            st.subheader("Mapeo de Columnas")
            st.markdown("Indica qué columna de tu CSV corresponde a cada campo:")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Campos Obligatorios:**")
                
                col_paciente = st.selectbox(
                    "Columna de Pacientes *",
                    options=['-- Seleccionar --'] + df.columns.tolist()
                )
                
                col_tratamiento = st.selectbox(
                    "Columna de Tratamientos *",
                    options=['-- Seleccionar --'] + df.columns.tolist()
                )
                
                col_monto = st.selectbox(
                    "Columna de Montos (ARS) *",
                    options=['-- Seleccionar --'] + df.columns.tolist()
                )
            
            with col2:
                st.markdown("**Campos Opcionales:**")
                
                col_fecha = st.selectbox(
                    "Columna de Fechas",
                    options=['-- Usar fecha actual --'] + df.columns.tolist()
                )
                
                col_medio_pago = st.selectbox(
                    "Columna de Medio de Pago",
                    options=['-- Usar "No especificado" --'] + df.columns.tolist()
                )
            
            # Vista previa del mapeo
            if (col_paciente != '-- Seleccionar --' and 
                col_tratamiento != '-- Seleccionar --' and 
                col_monto != '-- Seleccionar --'):
                
                st.subheader("Vista Previa del Mapeo")
                
                muestra = df.head(5).copy()
                preview_data = []
                
                for _, row in muestra.iterrows():
                    if col_fecha == '-- Usar fecha actual --':
                        fecha_procesada = datetime.now().strftime('%d/%m/%Y')
                    else:
                        fecha_raw = row[col_fecha]
                        fecha_iso = normalizar_fecha_flexible(fecha_raw)
                        fecha_procesada = datetime.fromisoformat(fecha_iso).strftime('%d/%m/%Y')
                    
                    monto_raw = row[col_monto]
                    monto_procesado = extraer_monto_numerico(monto_raw)
                    
                    if col_medio_pago == '-- Usar "No especificado" --':
                        medio_pago = "No especificado"
                    else:
                        medio_pago = str(row[col_medio_pago]) if pd.notna(row[col_medio_pago]) else "No especificado"
                    
                    preview_data.append({
                        'Fecha': fecha_procesada,
                        'Paciente': str(row[col_paciente]),
                        'Tratamiento': str(row[col_tratamiento]),
                        'Monto Original': str(monto_raw),
                        'Monto ARS': f"${monto_procesado:,.0f}",
                        'Medio de Pago': medio_pago
                    })
                
                preview_df = pd.DataFrame(preview_data)
                st.dataframe(preview_df, use_container_width=True)
                
                # Estadísticas pre-migración
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    pacientes_unicos = df[col_paciente].nunique()
                    st.metric("Pacientes Únicos", pacientes_unicos)
                
                with col2:
                    tratamientos_unicos = df[col_tratamiento].nunique()
                    st.metric("Tipos de Tratamiento", tratamientos_unicos)
                
                with col3:
                    montos_procesados = df[col_monto].apply(extraer_monto_numerico)
                    total_estimado = montos_procesados.sum()
                    st.metric("Total Estimado", f"${total_estimado:,.0f} ARS")
                
                with col4:
                    registros_validos = len(df.dropna(subset=[col_paciente, col_tratamiento, col_monto]))
                    st.metric("Registros Válidos", registros_validos)
                
                # Botón de migración
                st.markdown("---")
                
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.markdown("### ¿Todo se ve correcto?")
                    st.markdown("Revisa la vista previa y las estadísticas antes de proceder.")
                
                with col2:
                    if st.button("Ejecutar Migración", type="primary", use_container_width=True):
                        with st.spinner("Migrando datos..."):
                            resultado = ejecutar_migracion_flexible(
                                df=df,
                                col_paciente=col_paciente,
                                col_tratamiento=col_tratamiento,
                                col_monto=col_monto,
                                col_fecha=col_fecha if col_fecha != '-- Usar fecha actual --' else None,
                                col_medio_pago=col_medio_pago if col_medio_pago != '-- Usar "No especificado" --' else None,
                                data_manager=data_manager
                            )
                        
                        if resultado['success']:
                            st.success("Migración completada exitosamente!")
                            
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.metric("Registros Migrados", resultado['migrados'])
                            with col2:
                                st.metric("Errores", resultado['errores'])
                            with col3:
                                st.metric("Total Migrado", f"${resultado['total_ars']:,.0f} ARS")
                            
                            if resultado['errores'] > 0:
                                st.warning(f"{resultado['errores']} registros tuvieron problemas y no se migraron")
                            
                            st.info("Recarga la página para ver los datos migrados en el Dashboard")
                            
                            if st.button("Recargar Aplicación"):
                                st.rerun()
                        
                        else:
                            st.error(f"Error en la migración: {resultado['error']}")
            
            else:
                st.info("Por favor selecciona al menos las columnas obligatorias para continuar")
        
        except Exception as e:
            st.error(f"Error procesando el archivo: {e}")
    
    else:
        st.info("Sube un archivo CSV para comenzar")

def ejecutar_migracion_flexible(df, col_paciente, col_tratamiento, col_monto, 
                               col_fecha=None, col_medio_pago=None, data_manager=None):
    """Ejecuta la migración flexible solo con pesos argentinos"""
    
    try:
        consultas_migradas = []
        errores = 0
        total_ars = 0
        
        for index, row in df.iterrows():
            try:
                if col_fecha:
                    fecha = normalizar_fecha_flexible(row[col_fecha])
                else:
                    fecha = datetime.now().isoformat()
                
                paciente = str(row[col_paciente]).strip() if pd.notna(row[col_paciente]) else f'Paciente_{index+1}'
                tratamiento = str(row[col_tratamiento]).strip() if pd.notna(row[col_tratamiento]) else 'Consulta'
                monto_numerico = extraer_monto_numerico(row[col_monto])
                
                if monto_numerico <= 0:
                    errores += 1
                    continue
                
                if col_medio_pago:
                    medio_pago = str(row[col_medio_pago]).strip() if pd.notna(row[col_medio_pago]) else 'No especificado'
                else:
                    medio_pago = 'No especificado'
                
                consulta = {
                    'fecha': fecha,
                    'paciente': paciente,
                    'tratamiento': tratamiento,
                    'monto_ars': round(monto_numerico, 0),
                    'medio_pago': medio_pago
                }
                
                consultas_migradas.append(consulta)
                total_ars += monto_numerico
                
            except Exception as e:
                errores += 1
                st.warning(f"Error en fila {index+1}: {e}")
                continue
        
        if consultas_migradas:
            for consulta in consultas_migradas:
                nueva_fila = {
                    'fecha': consulta['fecha'],
                    'paciente': consulta['paciente'], 
                    'tratamiento': consulta['tratamiento'],
                    'monto_ars': consulta['monto_ars'],
                    'medio_pago': consulta['medio_pago']
                }
                
                if data_manager.consultas.empty:
                    data_manager.consultas = pd.DataFrame([nueva_fila])
                else:
                    data_manager.consultas = pd.concat([data_manager.consultas, pd.DataFrame([nueva_fila])], ignore_index=True)
            
            data_manager.save_data()
        
        return {
            'success': True,
            'migrados': len(consultas_migradas),
            'errores': errores,
            'total_ars': round(total_ars, 0)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'migrados': 0,
            'errores': 0,
            'total_ars': 0
        }

def show_nueva_consulta(data_manager):
    st.subheader("➕ Registrar Nueva Consulta")
    
    with st.form("nueva_consulta"):
        col1, col2 = st.columns(2)
        
        with col1:
            paciente = st.text_input("Nombre del Paciente *", placeholder="Ej: Juan Pérez")
            
            tratamientos_base = [
                "Consulta", "Consulta de Urgencia", "Limpieza", 
                "Operatoria Simple", "Operatoria Compleja", 
                "Endodoncia Unirradicular", "Endodoncia Multirradicular",
                "Placa Estabilizadora Oclusal", "Provisorio", 
                "Corona Metálica", "Corona de Porcelana",
                "Extracción Simple", "Extracción Compleja", 
                "Blanqueamiento", "Implante", "Otro"
            ]
            
            # Obtener tratamientos personalizados del usuario
            tratamientos_personalizados = data_manager.config.get('tratamientos_personalizados', [])
            todos_tratamientos = tratamientos_base + tratamientos_personalizados
            
            tratamiento = st.selectbox("Tipo de Tratamiento *", todos_tratamientos)
            
            # Campo para nuevo tratamiento si selecciona "Otro"
            nuevo_tratamiento_input = ""
            agregar_permanente = False
            
            if tratamiento == "Otro":
                nuevo_tratamiento_input = st.text_input(
                    "Especificar nuevo tratamiento:",
                    placeholder="Ej: Rehabilitación completa"
                )
                if nuevo_tratamiento_input:
                    agregar_permanente = st.checkbox("Guardar este tratamiento para futuras consultas")
            
            fecha_consulta = st.date_input("📅 Fecha de la Consulta *", value=date.today())

        with col2:
            monto_ars = st.number_input("Monto en ARS *", min_value=0.0, step=1000.0, value=30000.0)
            medio_pago = st.selectbox("Medio de Pago *", 
                ["Efectivo", "Transferencia", "Débito", "Crédito", "Otros"])
        
        # BOTÓN DE SUBMIT DENTRO DEL FORM
        submitted = st.form_submit_button("✅ Registrar Consulta", type="primary")
        
        # LÓGICA DESPUÉS DEL SUBMIT
        if submitted:
            # Procesar tratamiento personalizado
            tratamiento_final = tratamiento
            if tratamiento == "Otro" and nuevo_tratamiento_input:
                tratamiento_final = nuevo_tratamiento_input
                
                # Guardar tratamiento personalizado si se marcó la opción
                if agregar_permanente and nuevo_tratamiento_input not in tratamientos_personalizados:
                    if 'tratamientos_personalizados' not in data_manager.config:
                        data_manager.config['tratamientos_personalizados'] = []
                    data_manager.config['tratamientos_personalizados'].append(nuevo_tratamiento_input)
                    data_manager.save_data()
                    st.success(f"Tratamiento '{nuevo_tratamiento_input}' agregado permanentemente")
            
            if paciente and tratamiento_final and monto_ars > 0:
                try:
                    data_manager.add_consulta(paciente, tratamiento_final, monto_ars, medio_pago, fecha_consulta)
                    st.success(f"✅ Consulta registrada: {paciente} - ${monto_ars:,.0f} ARS")
                    st.rerun()
                except Exception as e:
                    st.error(f"❌ Error: {e}")
            else:
                st.error("❌ Complete todos los campos obligatorios")

def show_login():
    st.title("🏥 Manny App - Sistema de Gestión de Consultorios")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        with st.form("login_form"):
            st.write("🔐 Ingresar al Sistema")
            
            username = st.text_input("Usuario", placeholder="Ingrese su usuario")
            password = st.text_input("Contraseña", type="password", placeholder="Ingrese su contraseña")
            
            show_demo = st.checkbox("Mostrar credenciales de prueba")
            if show_demo:
                st.info("**Usuario:** admin | **Contraseña:** Homero123")
            
            login_button = st.form_submit_button("🚀 Ingresar", use_container_width=True)
            
            if login_button:
                if username and password:
                    user_manager = UserManager()
                    is_valid, message = user_manager.validate_user(username, password)
                    
                    if is_valid:
                        st.session_state.authenticated = True
                        st.session_state.user_id = username
                        st.session_state.user_info = user_manager.get_user_info(username)
                        st.success(f"✅ {message}")
                        st.rerun()
                    else:
                        st.error(f"❌ {message}")
                else:
                    st.warning("⚠️ Complete todos los campos")

def main():
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        show_login()
        return
    
    user_id = st.session_state.user_id
    user_info = st.session_state.user_info
    
    # Header
    col1, col2, col3 = st.columns([3, 1, 1])
    
    with col1:
        especialidad = user_info.get('especialidad', 'odontologia')
        especialidad_emoji = {'odontologia': '🦷', 'dermatologia': '🧴', 'kinesiologia': '🏃‍♂️'}.get(especialidad, '🏥')
        st.markdown(f'<h1 class="main-header">Manny App - {especialidad.title()} {especialidad_emoji}</h1>', unsafe_allow_html=True)
    
    with col2:
        st.write(f"👤 {user_info.get('nombre', user_id)}")
    
    with col3:
        if st.button("🚪 Cerrar Sesión"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    
    # DataManager
    if 'data_manager' not in st.session_state:
        st.session_state.data_manager = DataManager(user_id=user_id)
    
    data_manager = st.session_state.data_manager
    
    # Sidebar
    with st.sidebar:
        st.markdown(f"""
        <div style='text-align: center; padding: 1rem; background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%); border-radius: 0.5rem; margin-bottom: 1rem; color: white;'>
        <h3>🏥 Manny App</h3>
        <p style='margin: 0; font-size: 0.9em;'>{especialidad.title()}</p>
        </div>
        """, unsafe_allow_html=True)
        
        menu = st.selectbox("📋 Menú Principal", 
                           ["🏠 Dashboard", "➕ Nueva Consulta", "📋 Gestionar Consultas", "🧮 Calculadora Inteligente", "💰 Análisis de Costos", "⚙️ Configuración Costos", "📥 Importar Datos"])
        
        st.markdown("---")
        resumen = data_manager.get_resumen()
        st.metric("💰 Ingresos", f"${resumen['ingreso_total']:,.0f} ARS")
        st.metric("📊 Consultas", resumen['total_consultas'])
        
        # Mostrar costo por hora si está configurado
        costos_analysis = data_manager.calcular_costo_hora_real()
        if costos_analysis['costo_total_anual'] > 0:
            st.markdown("---")
            st.metric("🔧 Costo/Hora Real", f"${costos_analysis['costo_hora_ars']:,.0f} ARS")
    
    # Router de páginas
    if menu == "🏠 Dashboard":
        show_dashboard(data_manager, user_info)
    elif menu == "➕ Nueva Consulta":
        show_nueva_consulta(data_manager)
    elif menu == "📋 Gestionar Consultas":
        show_gestionar_consultas(data_manager)
    elif menu == "🧮 Calculadora Inteligente":
        show_calculadora_inteligente(data_manager)
    elif menu == "💰 Análisis de Costos":
        show_analisis_costos(data_manager, user_info)
    elif menu == "⚙️ Configuración Costos":
        show_configuracion_costos(data_manager)
    elif menu == "📥 Importar Datos":
        show_migration_tool(data_manager)

# =============================================================================
# FUNCIONES DE GESTIÓN DE CONSULTAS - COPIAR EN TU MANNY APP
# =============================================================================

def show_gestionar_consultas(data_manager):
    """Módulo completo de gestión de consultas existentes"""
    st.title("📋 Gestión de Consultas")
    
    if data_manager.consultas.empty:
        st.info("No hay consultas registradas aún. Ve a 'Nueva Consulta' para agregar la primera.")
        return
    
    # Preparar datos para mostrar
    df_consultas = data_manager.consultas.copy()
    df_consultas['fecha'] = pd.to_datetime(df_consultas['fecha'])
    
    # Pestañas para organizar funcionalidades
    tab1, tab2, tab3, tab4 = st.tabs([
        "📋 Ver Todas", "🔍 Buscar/Filtrar", "✏️ Editar", "🗑️ Eliminar"
    ])
    
    with tab1:
        st.subheader("📋 Todas las Consultas")
        
        # Controles de visualización
        col1, col2, col3 = st.columns(3)
        
        with col1:
            mostrar_desde = st.selectbox(
                "📅 Mostrar desde:",
                ["Más recientes", "Más antiguas", "Este mes", "Último mes", "Este año"]
            )
        
        with col2:
            cantidad_mostrar = st.selectbox(
                "📊 Cantidad a mostrar:",
                [10, 25, 50, 100, "Todas"],
                index=1
            )
        
        with col3:
            ordenar_por = st.selectbox(
                "🔄 Ordenar por:",
                ["Fecha (desc)", "Fecha (asc)", "Monto (desc)", "Monto (asc)", "Paciente", "Tratamiento"]
            )
        
        # Aplicar filtros de visualización
        df_display = aplicar_filtros_visualizacion(df_consultas, mostrar_desde, cantidad_mostrar, ordenar_por)
        
        # Mostrar resumen de la vista actual
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("📊 Consultas Mostradas", len(df_display))
        with col2:
            total_vista = df_display['monto_ars'].sum()
            st.metric("💰 Total Vista", f"${total_vista:,.0f} ARS")
        with col3:
            if len(df_display) > 0:
                promedio_vista = df_display['monto_ars'].mean()
                st.metric("📈 Promedio Vista", f"${promedio_vista:,.0f} ARS")
            else:
                st.metric("📈 Promedio Vista", "$0 ARS")
        with col4:
            st.metric("📅 Total Consultas", len(df_consultas))
        
        # Tabla de consultas con formato mejorado
        if not df_display.empty:
            df_mostrar = formatear_tabla_consultas(df_display)
            
            # Agregar índice para selección
            df_mostrar.insert(0, 'ID', range(1, len(df_mostrar) + 1))
            
            st.dataframe(
                df_mostrar, 
                use_container_width=True,
                hide_index=True
            )
            
            # Botón de exportación
            if st.button("📥 Exportar Vista a CSV"):
                csv_data = df_mostrar.to_csv(index=False, encoding='utf-8-sig')
                st.download_button(
                    label="💾 Descargar CSV",
                    data=csv_data,
                    file_name=f"consultas_vista_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                    mime="text/csv"
                )
    
    with tab2:
        st.subheader("🔍 Buscar y Filtrar Consultas")
        
        # Formulario de búsqueda avanzada
        with st.form("busqueda_avanzada"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**🔍 Criterios de Búsqueda:**")
                
                buscar_paciente = st.text_input(
                    "👤 Buscar por paciente:",
                    placeholder="Nombre del paciente...",
                    help="Busca por nombre completo o parcial"
                )
                
                buscar_tratamiento = st.selectbox(
                    "🦷 Filtrar por tratamiento:",
                    ["Todos"] + sorted(df_consultas['tratamiento'].unique().tolist())
                )
                
                buscar_medio_pago = st.selectbox(
                    "💳 Filtrar por medio de pago:",
                    ["Todos"] + sorted(df_consultas['medio_pago'].unique().tolist())
                )
            
            with col2:
                st.markdown("**📅 Rango de Fechas:**")
                
                fecha_desde = st.date_input(
                    "Desde:",
                    value=df_consultas['fecha'].min().date(),
                    min_value=df_consultas['fecha'].min().date(),
                    max_value=df_consultas['fecha'].max().date()
                )
                
                fecha_hasta = st.date_input(
                    "Hasta:",
                    value=df_consultas['fecha'].max().date(),
                    min_value=df_consultas['fecha'].min().date(),
                    max_value=df_consultas['fecha'].max().date()
                )
                
                st.markdown("**💰 Rango de Montos (ARS):**")
                
                monto_min = df_consultas['monto_ars'].min()
                monto_max = df_consultas['monto_ars'].max()
                
                rango_montos = st.slider(
                    "Selecciona rango:",
                    min_value=float(monto_min),
                    max_value=float(monto_max),
                    value=(float(monto_min), float(monto_max)),
                    step=1000.0
                )
            
            buscar_btn = st.form_submit_button("🔍 Buscar", type="primary")
            
            if buscar_btn:
                # Aplicar filtros de búsqueda
                df_filtrado = aplicar_filtros_busqueda(
                    df_consultas, 
                    buscar_paciente, 
                    buscar_tratamiento, 
                    buscar_medio_pago,
                    fecha_desde, 
                    fecha_hasta, 
                    rango_montos
                )
                
                st.session_state.df_filtrado = df_filtrado
        
        # Mostrar resultados de búsqueda
        if hasattr(st.session_state, 'df_filtrado') and not st.session_state.df_filtrado.empty:
            st.success(f"✅ Se encontraron {len(st.session_state.df_filtrado)} consultas")
            
            # Resumen de resultados
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("📊 Resultados", len(st.session_state.df_filtrado))
            with col2:
                total_filtrado = st.session_state.df_filtrado['monto_ars'].sum()
                st.metric("💰 Total", f"${total_filtrado:,.0f} ARS")
            with col3:
                promedio_filtrado = st.session_state.df_filtrado['monto_ars'].mean()
                st.metric("📈 Promedio", f"${promedio_filtrado:,.0f} ARS")
            
            # Mostrar tabla de resultados
            df_resultados = formatear_tabla_consultas(st.session_state.df_filtrado)
            df_resultados.insert(0, 'ID', range(1, len(df_resultados) + 1))
            
            st.dataframe(df_resultados, use_container_width=True, hide_index=True)
            
            # Limpiar resultados
            if st.button("🗑️ Limpiar Búsqueda"):
                if hasattr(st.session_state, 'df_filtrado'):
                    del st.session_state.df_filtrado
                st.rerun()
        
        elif hasattr(st.session_state, 'df_filtrado'):
            st.warning("⚠️ No se encontraron consultas con los criterios especificados")
    
    with tab3:
        st.subheader("✏️ Editar Consultas")
        st.markdown("Selecciona una consulta para editar sus datos:")
        
        # Selección de consulta para editar
        df_para_editar = df_consultas.copy()
        df_para_editar['display'] = df_para_editar.apply(
            lambda row: f"{row['fecha'].strftime('%d/%m/%Y') if pd.notna(row['fecha']) else 'Fecha inválida'} - {row['paciente']} - {row['tratamiento']} - ${row['monto_ars']:,.0f}",
            axis=1
        )
        
        consulta_seleccionada = st.selectbox(
            "🔍 Seleccionar consulta:",
            options=range(len(df_para_editar)),
            format_func=lambda x: df_para_editar.iloc[x]['display'],
            key="consulta_editar"
        )
        
        if consulta_seleccionada is not None:
            consulta_datos = df_para_editar.iloc[consulta_seleccionada]
            
            st.markdown("---")
            st.markdown(f"**Editando consulta del {consulta_datos['fecha'].strftime('%d/%m/%Y %H:%M')}:**")
            
            # Formulario de edición
            with st.form("editar_consulta"):
                col1, col2 = st.columns(2)
                
                with col1:
                    nuevo_paciente = st.text_input(
                        "👤 Paciente *",
                        value=consulta_datos['paciente']
                    )
                    
                    tratamientos_disponibles = ["Consulta", "Limpieza", "Operatoria Simple", "Operatoria Compleja", 
                                               "Endodoncia", "Corona", "Extracción Simple", "Extracción Compleja", "Otro"]
                    
                    try:
                        indice_tratamiento = tratamientos_disponibles.index(consulta_datos['tratamiento'])
                    except ValueError:
                        indice_tratamiento = 0
                    
                    nuevo_tratamiento = st.selectbox(
                        "🦷 Tratamiento *",
                        tratamientos_disponibles,
                        index=indice_tratamiento
                    )
                
                with col2:
                    nuevo_monto = st.number_input(
                        "💰 Monto (ARS) *",
                        min_value=0.0,
                        value=float(consulta_datos['monto_ars']),
                        step=1000.0
                    )
                    
                    medios_pago_disponibles = ["Efectivo", "Transferencia", "Débito", "Crédito", "Mercado Pago", "Otros"]
                    
                    try:
                        indice_medio_pago = medios_pago_disponibles.index(consulta_datos['medio_pago'])
                    except ValueError:
                        indice_medio_pago = 0
                    
                    nuevo_medio_pago = st.selectbox(
                        "💳 Medio de Pago *",
                        medios_pago_disponibles,
                        index=indice_medio_pago
                    )
                
                nueva_fecha = st.date_input(
                    "📅 Fecha",
                    value=consulta_datos['fecha'].date()
                )
                
                nueva_hora = st.time_input(
                    "🕒 Hora",
                    value=consulta_datos['fecha'].time()
                )
                
                col1, col2 = st.columns(2)
                
                with col1:
                    guardar_cambios = st.form_submit_button("💾 Guardar Cambios", type="primary")
                
                with col2:
                    cancelar_edicion = st.form_submit_button("❌ Cancelar")
                
                if guardar_cambios:
                    if nuevo_paciente and nuevo_tratamiento and nuevo_monto > 0:
                        # Crear nueva fecha completa
                        nueva_fecha_completa = datetime.combine(nueva_fecha, nueva_hora)
                        
                        # Actualizar la consulta usando el índice real del DataFrame
                        data_manager.consultas.iloc[consulta_seleccionada, data_manager.consultas.columns.get_loc('fecha')] = nueva_fecha_completa.isoformat()
                        data_manager.consultas.iloc[consulta_seleccionada, data_manager.consultas.columns.get_loc('paciente')] = nuevo_paciente
                        data_manager.consultas.iloc[consulta_seleccionada, data_manager.consultas.columns.get_loc('tratamiento')] = nuevo_tratamiento
                        data_manager.consultas.iloc[consulta_seleccionada, data_manager.consultas.columns.get_loc('monto_ars')] = nuevo_monto
                        data_manager.consultas.iloc[consulta_seleccionada, data_manager.consultas.columns.get_loc('medio_pago')] = nuevo_medio_pago
                        
                        if data_manager.save_data():
                            st.success("✅ Consulta actualizada exitosamente")
                            st.rerun()
                        else:
                            st.error("❌ Error al guardar los cambios")
                    else:
                        st.error("❌ Por favor complete todos los campos obligatorios")
                
                if cancelar_edicion:
                    st.info("Edición cancelada")
    
    with tab4:
        st.subheader("🗑️ Eliminar Consultas")
        
        st.warning("⚠️ **Atención:** La eliminación de consultas es permanente y no se puede deshacer.")
        
        # Selección para eliminación individual
        df_para_eliminar = df_consultas.copy()
        df_para_eliminar['display'] = df_para_eliminar.apply(
            lambda row: f"{row['fecha'].strftime('%d/%m/%Y') if pd.notna(row['fecha']) else 'Fecha inválida'} - {row['paciente']} - {row['tratamiento']} - ${row['monto_ars']:,.0f}",
            axis=1
        )
        
        # Opción de eliminación individual
        st.markdown("#### 🎯 Eliminación Individual")
        
        consulta_eliminar = st.selectbox(
            "🔍 Seleccionar consulta a eliminar:",
            options=range(len(df_para_eliminar)),
            format_func=lambda x: df_para_eliminar.iloc[x]['display'],
            key="consulta_eliminar"
        )
        
        if consulta_eliminar is not None:
            consulta_datos = df_para_eliminar.iloc[consulta_eliminar]
            
            # Mostrar detalles de la consulta a eliminar
            with st.expander("👁️ Ver detalles de la consulta", expanded=True):
                col1, col2 = st.columns(2)
                with col1:
                    st.write(f"**📅 Fecha:** {consulta_datos['fecha'].strftime('%d/%m/%Y %H:%M')}")
                    st.write(f"**👤 Paciente:** {consulta_datos['paciente']}")
                    st.write(f"**🦷 Tratamiento:** {consulta_datos['tratamiento']}")
                with col2:
                    st.write(f"**💰 Monto:** ${consulta_datos['monto_ars']:,.0f} ARS")
                    st.write(f"**💳 Medio de Pago:** {consulta_datos['medio_pago']}")
            
            # Confirmación de eliminación
            confirmar = st.checkbox("✅ Confirmo que deseo eliminar esta consulta permanentemente")
            
            if confirmar:
                if st.button("🗑️ ELIMINAR CONSULTA", type="secondary"):
                    # Usar la función delete_consulta del DataManager
                    if data_manager.delete_consulta(consulta_eliminar):
                        st.success("✅ Consulta eliminada exitosamente")
                        st.rerun()
                    else:
                        st.error("❌ Error al eliminar la consulta")
        
        # Eliminación masiva
        st.markdown("---")
        st.markdown("#### 🧹 Eliminación Masiva")
        
        with st.expander("⚙️ Eliminar Todas las Consultas (PELIGROSO)"):
            st.error("🚨 **MUY PELIGROSO:** Esta acción eliminará TODAS sus consultas registradas.")
            
            confirmaciones = []
            confirmaciones.append(st.checkbox("☑️ Entiendo que se eliminarán TODAS mis consultas"))
            confirmaciones.append(st.checkbox("☑️ Confirmo que he hecho una copia de respaldo"))
            confirmaciones.append(st.checkbox("☑️ Realmente quiero eliminar todo"))
            
            if all(confirmaciones):
                codigo_confirmacion = st.text_input(
                    "🔐 Escriba 'ELIMINAR TODO' para confirmar:",
                    placeholder="Escriba exactamente: ELIMINAR TODO"
                )
                
                if codigo_confirmacion == "ELIMINAR TODO":
                    if st.button("🗑️ EJECUTAR ELIMINACIÓN MASIVA", type="secondary"):
                        if data_manager.delete_all_consultas():
                            st.success("✅ Todas las consultas han sido eliminadas")
                            st.rerun()
                        else:
                            st.error("❌ Error al realizar la eliminación masiva")


def aplicar_filtros_visualizacion(df, mostrar_desde, cantidad, ordenar_por):
    """Aplica filtros de visualización a las consultas"""
    df_resultado = df.copy()
    
    # Filtrar por período
    if mostrar_desde == "Este mes":
        fecha_actual = datetime.now()
        df_resultado = df_resultado[
            (df_resultado['fecha'].dt.month == fecha_actual.month) &
            (df_resultado['fecha'].dt.year == fecha_actual.year)
        ]
    elif mostrar_desde == "Último mes":
        fecha_mes_pasado = datetime.now().replace(day=1) - pd.DateOffset(months=1)
        df_resultado = df_resultado[
            (df_resultado['fecha'].dt.month == fecha_mes_pasado.month) &
            (df_resultado['fecha'].dt.year == fecha_mes_pasado.year)
        ]
    elif mostrar_desde == "Este año":
        fecha_actual = datetime.now()
        df_resultado = df_resultado[df_resultado['fecha'].dt.year == fecha_actual.year]
    
    # Ordenar
    if ordenar_por == "Fecha (desc)":
        df_resultado = df_resultado.sort_values('fecha', ascending=False)
    elif ordenar_por == "Fecha (asc)":
        df_resultado = df_resultado.sort_values('fecha', ascending=True)
    elif ordenar_por == "Monto (desc)":
        df_resultado = df_resultado.sort_values('monto_ars', ascending=False)
    elif ordenar_por == "Monto (asc)":
        df_resultado = df_resultado.sort_values('monto_ars', ascending=True)
    elif ordenar_por == "Paciente":
        df_resultado = df_resultado.sort_values('paciente')
    elif ordenar_por == "Tratamiento":
        df_resultado = df_resultado.sort_values('tratamiento')
    
    # Limitar cantidad
    if cantidad != "Todas":
        df_resultado = df_resultado.head(int(cantidad))
    
    return df_resultado


def aplicar_filtros_busqueda(df, paciente, tratamiento, medio_pago, fecha_desde, fecha_hasta, rango_montos):
    """Aplica filtros de búsqueda avanzada"""
    df_resultado = df.copy()
    df_resultado = df_resultado.dropna(subset=['fecha'])

    
    # Filtro por paciente
    if paciente:
        df_resultado = df_resultado[
            df_resultado['paciente'].str.contains(paciente, case=False, na=False)
        ]
    
    # Filtro por tratamiento
    if tratamiento != "Todos":
        df_resultado = df_resultado[df_resultado['tratamiento'] == tratamiento]
    
    # Filtro por medio de pago
    if medio_pago != "Todos":
        df_resultado = df_resultado[df_resultado['medio_pago'] == medio_pago]
    
    # Filtro por fechas
    df_resultado = df_resultado[
        (df_resultado['fecha'].notna()) & (df_resultado['fecha'].dt.date >= fecha_desde) & (df_resultado['fecha'].dt.date<=fecha_hasta)
    ]
    
    # Filtro por montos
    df_resultado = df_resultado[
        (df_resultado['monto_ars'] >= rango_montos[0]) &
        (df_resultado['monto_ars'] <= rango_montos[1])
    ]
    
    return df_resultado


def formatear_tabla_consultas(df):
    """Formatea la tabla de consultas para mejor visualización"""
    df_formato = df.copy()
    
    # Formatear fecha
    df_formato['Fecha'] = df_formato['fecha'].dt.strftime('%d/%m/%Y')
    df_formato['Hora'] = df_formato['fecha'].dt.strftime('%H:%M')
    
    # Formatear monto
    df_formato['Monto'] = df_formato['monto_ars'].apply(lambda x: f"${x:,.0f}")
    
    # Renombrar columnas
    df_formato = df_formato.rename(columns={
        'paciente': 'Paciente',
        'tratamiento': 'Tratamiento',
        'medio_pago': 'Medio de Pago'
    })
    
    # Seleccionar columnas finales
    return df_formato[['Fecha', 'Hora', 'Paciente', 'Tratamiento', 'Monto', 'Medio de Pago']]

def normalizar_medio_pago(medio_pago):
    """Normaliza medios de pago para evitar duplicados por mayúsculas/minúsculas"""
    if pd.isna(medio_pago):
        return "No especificado"
    
    medio_clean = str(medio_pago).strip().lower()
    
    # Mapeo de normalizaciones
    normalizaciones = {
        'efectivo': 'Efectivo',
        'cash': 'Efectivo',
        'transferencia': 'Transferencia',
        'transfer': 'Transferencia',
        'débito': 'Débito',
        'debito': 'Débito',
        'debit': 'Débito',
        'crédito': 'Crédito',
        'credito': 'Crédito',
        'credit': 'Crédito',
        'mercado pago': 'Mercado Pago',
        'mercadopago': 'Mercado Pago',
        'mp': 'Mercado Pago',
        'otros': 'Otros',
        'other': 'Otros'
    }
    
    return normalizaciones.get(medio_clean, medio_pago.strip().title())

if __name__ == "__main__":
    main()
