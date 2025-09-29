import pytest
from sqlalchemy.orm import Session

from app.models import Usuario
from app.services import PreciosService


@pytest.fixture
def test_user(db: Session) -> Usuario:
    user = Usuario(
        username="testuser3",
        password_hash="hash",
        nombre="Test",
        apellido="User",
        email="test3@example.com",
        especialidad="odontologia",
        plan="trial",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_precios_list(db: Session, test_user: Usuario):
    precios, total = PreciosService.list_precios(db, test_user.id)
    assert isinstance(precios, list)
    assert isinstance(total, int)
