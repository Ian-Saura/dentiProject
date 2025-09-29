import pytest
from sqlalchemy.orm import Session

from app.models import Usuario
from app.services import AnalyticsService, CostosService, CalculadoraService, ImportCsvService


@pytest.fixture
def test_user(db: Session) -> Usuario:
    user = Usuario(
        username="testuser2",
        password_hash="hash",
        nombre="Test",
        apellido="User",
        email="test2@example.com",
        especialidad="odontologia",
        plan="trial",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_analytics_resumen(db: Session, test_user: Usuario):
    resumen = AnalyticsService.get_resumen(db, test_user.id)
    assert "total_consultas" in resumen
    assert "ingreso_total" in resumen
    assert "promedio_consulta" in resumen
    assert "tratamiento_popular" in resumen
    assert "ingresos_mes" in resumen


def test_costos_analisis(db: Session, test_user: Usuario):
    analisis = CostosService.analisis_costos(db, test_user.id)
    assert "costo_hora_ars" in analisis
    assert "costo_equipos_anual" in analisis
    assert "costo_gastos_anual" in analisis
    assert "costo_total_anual" in analisis
    assert "horas_anuales" in analisis


def test_calculadora_recomendaciones(db: Session, test_user: Usuario):
    recomendaciones = CalculadoraService.recomendaciones(db, test_user.id, 2.0, 5000.0, False)
    assert len(recomendaciones) == 4
    for rec in recomendaciones:
        assert "margen" in rec
        assert "precio" in rec
        assert "ganancia" in rec


def test_import_csv(db: Session, test_user: Usuario):
    csv_content = b"paciente,tratamiento,monto\nJuan Perez,Consulta,1000\nAna Lopez,Operatoria,2000"
    result = ImportCsvService.importar_csv(
        db, test_user.id, csv_content, "paciente", "tratamiento", "monto"
    )
    assert result["migrados"] >= 0
    assert result["errores"] >= 0
    assert "total_ars" in result
