"""
Unit tests for authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db, Base


# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Setup test database before tests"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestAuthentication:
    """Test suite for authentication"""
    
    def test_register_user(self):
        """Test user registration"""
        response = client.post("/v1/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test123456!",
            "nombre": "Test",
            "apellido": "User",
            "telefono": "+54123456789",
            "especialidad": "odontologia"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "access_token" in data
    
    def test_register_duplicate_username(self):
        """Test registration with duplicate username"""
        response = client.post("/v1/auth/register", json={
            "username": "testuser",
            "email": "test2@example.com",
            "password": "Test123456!",
            "nombre": "Test",
            "apellido": "User",
            "telefono": "+54123456789",
            "especialidad": "odontologia"
        })
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_login_success(self):
        """Test successful login"""
        response = client.post("/v1/auth/login", json={
            "username": "testuser",
            "password": "Test123456!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/v1/auth/login", json={
            "username": "testuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_google_auth_missing_token(self):
        """Test Google auth without token"""
        response = client.post("/v1/auth/google/token", json={})
        assert response.status_code == 422  # Validation error
    
    def test_health_check(self):
        """Test health endpoint"""
        response = client.get("/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}



