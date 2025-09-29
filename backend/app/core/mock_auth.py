"""
Mock authentication for testing without database
"""
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from .config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock users database
MOCK_USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "password_hash": pwd_context.hash("Homero123"),
        "nombre": "Dr. Administrador",
        "apellido": "",
        "email": "admin@manny.com",
        "especialidad": "odontologia",
        "plan": "premium",
        "fecha_registro": datetime.now().isoformat(),
        "activo": True
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def authenticate_user(username: str, password: str):
    user = MOCK_USERS.get(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

def get_current_user_mock(username: str):
    return MOCK_USERS.get(username)
