import logging
import uuid
from typing import Optional

import loguru
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

settings = get_settings()


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Try to get user_id from auth (will be set later if authenticated)
        user_id = getattr(request.state, 'user_id', None)

        # Add to loguru context
        with loguru.logger.contextualize(request_id=request_id, user_id=user_id or "anonymous"):
            response = await call_next(request)
            return response


# Configure loguru
loguru.logger.remove()  # Remove default handler
loguru.logger.add(
    lambda msg: print(msg, end=""),  # JSON to stdout
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {extra[request_id]} | {extra[user_id]} | {message}",
    level=settings.log_level,
    serialize=True,  # JSON
)
