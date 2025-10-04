from __future__ import annotations

from typing import Optional

from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.schemas.auth import GoogleUserInfo


class GoogleAuthService:
    """Servicio para autenticación con Google OAuth"""
    
    @staticmethod
    async def verify_token(token: str) -> Optional[GoogleUserInfo]:
        """
        Verificar token de Google y extraer información del usuario
        
        Args:
            token: Google ID token
            
        Returns:
            GoogleUserInfo si el token es válido, None si no
        """
        try:
            # Verificar el token con Google
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.google_client_id
            )
            
            # Verificar que el token es de nuestra app
            if idinfo['aud'] != settings.google_client_id:
                raise ValueError('Invalid audience')
            
            # Verificar que el issuer es Google
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
            
            # Extraer información del usuario
            google_id = idinfo['sub']
            email = idinfo.get('email')
            email_verified = idinfo.get('email_verified', False)
            nombre = idinfo.get('given_name', '')
            apellido = idinfo.get('family_name', '')
            avatar_url = idinfo.get('picture')
            
            return GoogleUserInfo(
                google_id=google_id,
                email=email,
                nombre=nombre,
                apellido=apellido,
                avatar_url=avatar_url,
                email_verified=email_verified
            )
            
        except ValueError as e:
            print(f"❌ Token verification failed: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error verifying token: {e}")
            return None
    
    @staticmethod
    def get_authorization_url() -> str:
        """
        Generar URL de autorización de Google
        
        Returns:
            URL para redirigir al usuario a Google OAuth
        """
        from urllib.parse import urlencode
        
        params = {
            'client_id': settings.google_client_id,
            'redirect_uri': settings.google_redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',
            'prompt': 'consent',
        }
        
        base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        return f"{base_url}?{urlencode(params)}"

