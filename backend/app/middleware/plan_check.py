from __future__ import annotations

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.plan_service import PlanService


class PlanCheckMiddleware(BaseHTTPMiddleware):
    """
    Middleware para verificar el estado del plan del usuario
    
    Este middleware se ejecuta en cada request y verifica si el usuario
    tiene un plan activo. Si el trial ha expirado, retorna un error 403.
    """
    
    # Rutas que no requieren verificación de plan
    EXCLUDED_PATHS = [
        "/v1/auth/login",
        "/v1/auth/register",
        "/v1/auth/google",
        "/v1/auth/google/token",
        "/v1/auth/me/plan-status",  # Permitir verificar estado del plan
        "/v1/health",
        "/v1/docs",
        "/v1/openapi.json",
        "/docs",
        "/openapi.json",
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip verification for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Skip verification for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if user is authenticated (user_id set by auth middleware)
        if hasattr(request.state, "user") and request.state.user:
            user = request.state.user
            
            # Admin and moderators always have access
            if user.role and user.role.name in ["admin", "moderator"]:
                return await call_next(request)
            
            # Check plan status
            if not PlanService.check_plan_access(user):
                status_info = PlanService.get_plan_status(user)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "trial_expired",
                        "message": status_info["mensaje"],
                        "plan_status": status_info
                    }
                )
        
        return await call_next(request)



