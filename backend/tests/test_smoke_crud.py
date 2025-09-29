import pytest
from datetime import date
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Usuario, Prestacion, InsumoBasico
from app.schemas import (
    PacienteCreate,
    ConsultaCreate,
    GastoCreate,
    EquipoCreate,
    CompraCreate,
    PrestacionUsuarioCreate,
    ConfigUsuarioCreate,
    PacienteUpdate,
    ConsultaUpdate,
    GastoUpdate,
    EquipoUpdate,
    CompraUpdate,
    PrestacionUsuarioUpdate,
    ConfigUsuarioUpdate,
)
from app.services import (
    PacientesService,
    ConsultasService,
    GastosFijosService,
    CostosEquiposService,
    ComprasService,
    PrestacionesUsuarioService,
    ConfiguracionUsuarioService,
)


@pytest.fixture
def test_user(db: Session) -> Usuario:
    user = Usuario(
        username="testuser",
        password_hash="hash",
        nombre="Test",
        apellido="User",
        email="test@example.com",
        especialidad="odontologia",
        plan="trial",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_prestacion(db: Session) -> Prestacion:
    prestacion = Prestacion(
        codigo="TEST001",
        nombre="Test Prestacion",
        categoria="diagnostico",
        tiempo_estimado_min=30,
        complejidad="baja",
    )
    db.add(prestacion)
    db.commit()
    db.refresh(prestacion)
    return prestacion


@pytest.fixture
def test_insumo(db: Session) -> InsumoBasico:
    insumo = InsumoBasico(
        codigo="INS001",
        nombre="Test Insumo",
        categoria="descartable",
        unidad_medida="unidad",
    )
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return insumo


def test_pacientes_crud(db: Session, test_user: Usuario):
    # Create
    paciente_data = PacienteCreate(nombre="Juan", apellido="Perez")
    paciente = PacientesService.create_paciente(db, paciente_data, test_user.id)
    assert paciente.nombre == "Juan"

    # Get
    retrieved = PacientesService.get_paciente(db, paciente.id, test_user.id)
    assert retrieved.id == paciente.id

    # Update
    from app.schemas import PacienteUpdate
    update_data = PacienteUpdate(nombre="Juan Carlos")
    updated = PacientesService.update_paciente(db, paciente.id, update_data, test_user.id)
    assert updated.nombre == "Juan Carlos"

    # Delete
    assert PacientesService.delete_paciente(db, paciente.id, test_user.id)

    # Verify deleted
    assert PacientesService.get_paciente(db, paciente.id, test_user.id) is None


def test_consultas_crud(db: Session, test_user: Usuario, test_prestacion: Prestacion):
    # Create paciente first
    paciente = PacientesService.create_paciente(db, PacienteCreate(nombre="Ana", apellido="Lopez"), test_user.id)

    # Create prestacion_usuario
    prestacion_data = PrestacionUsuarioCreate(prestacion_id=test_prestacion.id)
    prestacion = PrestacionesUsuarioService.create_prestacion_usuario(db, prestacion_data, test_user.id)

    # Create consulta
    consulta_data = ConsultaCreate(
        paciente_id=paciente.id,
        prestacion_usuario_id=prestacion.id,
        fecha_consulta=date(2025, 1, 1),
        monto_ars=1000.0,
        medio_pago="efectivo",
    )
    consulta = ConsultasService.create_consulta(db, consulta_data, test_user.id)
    assert consulta.monto_ars == 1000.0

    # Get
    retrieved = ConsultasService.get_consulta(db, consulta.id, test_user.id)
    assert retrieved.id == consulta.id

    # Update
    update_data = ConsultaUpdate(monto_ars=1200.0)
    updated = ConsultasService.update_consulta(db, consulta.id, update_data, test_user.id)
    assert updated.monto_ars == 1200.0

    # Delete
    assert ConsultasService.delete_consulta(db, consulta.id, test_user.id)


def test_gastos_fijos_crud(db: Session, test_user: Usuario):
    gasto_data = GastoCreate(concepto="Alquiler", monto_mensual_ars=50000.0)
    gasto = GastosFijosService.create_gasto_fijo(db, gasto_data, test_user.id)
    assert gasto.concepto == "Alquiler"

    retrieved = GastosFijosService.get_gasto_fijo(db, gasto.id, test_user.id)
    assert retrieved.id == gasto.id

    update_data = GastoUpdate(concepto="Alquiler oficina")
    updated = GastosFijosService.update_gasto_fijo(db, gasto.id, update_data, test_user.id)
    assert updated.concepto == "Alquiler oficina"

    assert GastosFijosService.delete_gasto_fijo(db, gasto.id, test_user.id)


def test_costos_equipos_crud(db: Session, test_user: Usuario):
    equipo_data = EquipoCreate(
        nombre_equipo="Sillon",
        monto_compra_usd=5000.0,
        fecha_compra=date(2020, 1, 1),
        anios_vida_util=10,
    )
    equipo = CostosEquiposService.create_costo_equipo(db, equipo_data, test_user.id)
    assert equipo.nombre_equipo == "Sillon"

    retrieved = CostosEquiposService.get_costo_equipo(db, equipo.id, test_user.id)
    assert retrieved.id == equipo.id

    update_data = EquipoUpdate(nombre_equipo="Sillon Dental")
    updated = CostosEquiposService.update_costo_equipo(db, equipo.id, update_data, test_user.id)
    assert updated.nombre_equipo == "Sillon Dental"

    assert CostosEquiposService.delete_costo_equipo(db, equipo.id, test_user.id)


def test_compras_crud(db: Session, test_user: Usuario, test_insumo: InsumoBasico):
    compra_data = CompraCreate(
        insumo_basico_id=test_insumo.id,
        cantidad=10.0,
        precio_total_ars=1000.0,
        fecha_compra=date(2025, 1, 1),
    )
    compra = ComprasService.create_compra(db, compra_data, test_user.id)
    assert compra.cantidad == 10.0

    retrieved = ComprasService.get_compra(db, compra.id, test_user.id)
    assert retrieved.id == compra.id

    update_data = CompraUpdate(cantidad=15.0)
    updated = ComprasService.update_compra(db, compra.id, update_data, test_user.id)
    assert updated.cantidad == 15.0

    assert ComprasService.delete_compra(db, compra.id, test_user.id)


def test_prestaciones_usuario_crud(db: Session, test_user: Usuario, test_prestacion: Prestacion):
    prestacion_data = PrestacionUsuarioCreate(prestacion_id=test_prestacion.id)
    prestacion = PrestacionesUsuarioService.create_prestacion_usuario(db, prestacion_data, test_user.id)
    assert prestacion.prestacion_id == test_prestacion.id

    retrieved = PrestacionesUsuarioService.get_prestacion_usuario(db, prestacion.id, test_user.id)
    assert retrieved.id == prestacion.id

    update_data = PrestacionUsuarioUpdate(margen_ganancia_porcentaje=50.0)
    updated = PrestacionesUsuarioService.update_prestacion_usuario(db, prestacion.id, update_data, test_user.id)
    assert updated.margen_ganancia_porcentaje == 50.0

    assert PrestacionesUsuarioService.delete_prestacion_usuario(db, prestacion.id, test_user.id)


def test_configuracion_usuario_crud(db: Session, test_user: Usuario):
    config_data = ConfigUsuarioCreate(horas_anuales_trabajadas=1200)
    config = ConfiguracionUsuarioService.create_configuracion_usuario(db, config_data, test_user.id)
    assert config.horas_anuales_trabajadas == 1200

    retrieved = ConfiguracionUsuarioService.get_configuracion_usuario(db, config.id, test_user.id)
    assert retrieved.id == config.id

    update_data = ConfigUsuarioUpdate(horas_anuales_trabajadas=1300)
    updated = ConfiguracionUsuarioService.update_configuracion_usuario(db, config.id, update_data, test_user.id)
    assert updated.horas_anuales_trabajadas == 1300

    assert ConfiguracionUsuarioService.delete_configuracion_usuario(db, config.id, test_user.id)
