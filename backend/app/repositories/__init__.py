from .pacientes import (
    list_pacientes,
    count_pacientes,
    get_paciente,
    create_paciente,
    update_paciente,
    delete_paciente,
)
from .consultas import (
    list_consultas,
    count_consultas,
    get_consulta,
    create_consulta,
    update_consulta,
    delete_consulta,
)
from .gastos_fijos import (
    list_gastos_fijos,
    count_gastos_fijos,
    get_gasto_fijo,
    create_gasto_fijo,
    update_gasto_fijo,
    delete_gasto_fijo,
)
from .costos_equipos import (
    list_costos_equipos,
    count_costos_equipos,
    get_costo_equipo,
    create_costo_equipo,
    update_costo_equipo,
    delete_costo_equipo,
)
from .compras import (
    list_compras,
    count_compras,
    get_compra,
    create_compra,
    update_compra,
    delete_compra,
)
from .prestaciones_usuario import (
    list_prestaciones_usuario,
    count_prestaciones_usuario,
    get_prestacion_usuario,
    create_prestacion_usuario,
    update_prestacion_usuario,
    delete_prestacion_usuario,
)
from .configuracion_usuario import (
    list_configuraciones_usuario,
    count_configuraciones_usuario,
    get_configuracion_usuario,
    get_config_by_usuario,
    create_configuracion_usuario,
    update_configuracion_usuario,
    delete_configuracion_usuario,
)
from .prestaciones import list_prestaciones, count_prestaciones, get_prestacion
from .insumos import list_insumos_basicos, count_insumos_basicos, get_insumo_basico

__all__ = [
    # pacientes
    "list_pacientes",
    "count_pacientes",
    "get_paciente",
    "create_paciente",
    "update_paciente",
    "delete_paciente",
    # consultas
    "list_consultas",
    "count_consultas",
    "get_consulta",
    "create_consulta",
    "update_consulta",
    "delete_consulta",
    # gastos_fijos
    "list_gastos_fijos",
    "count_gastos_fijos",
    "get_gasto_fijo",
    "create_gasto_fijo",
    "update_gasto_fijo",
    "delete_gasto_fijo",
    # costos_equipos
    "list_costos_equipos",
    "count_costos_equipos",
    "get_costo_equipo",
    "create_costo_equipo",
    "update_costo_equipo",
    "delete_costo_equipo",
    # compras
    "list_compras",
    "count_compras",
    "get_compra",
    "create_compra",
    "update_compra",
    "delete_compra",
    # prestaciones_usuario
    "list_prestaciones_usuario",
    "count_prestaciones_usuario",
    "get_prestacion_usuario",
    "create_prestacion_usuario",
    "update_prestacion_usuario",
    "delete_prestacion_usuario",
    # configuracion_usuario
    "list_configuraciones_usuario",
    "count_configuraciones_usuario",
    "get_configuracion_usuario",
    "get_config_by_usuario",
    "create_configuracion_usuario",
    "update_configuracion_usuario",
    "delete_configuracion_usuario",
    # prestaciones
    "list_prestaciones",
    "count_prestaciones",
    "get_prestacion",
    # insumos
    "list_insumos_basicos",
    "count_insumos_basicos",
    "get_insumo_basico",
]
