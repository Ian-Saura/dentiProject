from __future__ import annotations

from app.deps.auth import get_current_user
from app.models import Usuario


class TenantContext:
    def __init__(self, user: Usuario):
        self.user = user
        self.user_id = user.id
