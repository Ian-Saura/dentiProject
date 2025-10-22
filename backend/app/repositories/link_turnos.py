"""
Repository for LinkTurno operations
Handles unique booking links per dentist
"""
import secrets
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.link_turnos import LinkTurno
from app.schemas.turnos import LinkTurnoCreate, LinkTurnoUpdate


def generate_unique_token() -> str:
    """Generate a cryptographically secure unique token"""
    return secrets.token_urlsafe(32)


def create_link_turno(db: Session, usuario_id: int, data: LinkTurnoCreate) -> LinkTurno:
    """Create a new booking link with unique token"""
    # Generate unique token
    token = generate_unique_token()
    
    # Check if token already exists (extremely unlikely but good practice)
    while db.execute(select(LinkTurno).where(LinkTurno.token == token)).scalar_one_or_none():
        token = generate_unique_token()
    
    link = LinkTurno(
        usuario_id=usuario_id,
        token=token,
        duracion_minutos=data.duracion_minutos,
        mensaje_personalizado=data.mensaje_personalizado,
        activo=True,
    )
    
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_link_by_token(db: Session, token: str) -> Optional[LinkTurno]:
    """Get a booking link by its unique token"""
    stmt = select(LinkTurno).where(LinkTurno.token == token)
    return db.execute(stmt).scalar_one_or_none()


def get_links_by_usuario(db: Session, usuario_id: int) -> list[LinkTurno]:
    """Get all booking links for a user"""
    stmt = select(LinkTurno).where(LinkTurno.usuario_id == usuario_id).order_by(LinkTurno.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def update_link_turno(db: Session, link_id: int, usuario_id: int, data: LinkTurnoUpdate) -> Optional[LinkTurno]:
    """Update a booking link"""
    stmt = select(LinkTurno).where(LinkTurno.id == link_id, LinkTurno.usuario_id == usuario_id)
    link = db.execute(stmt).scalar_one_or_none()
    
    if not link:
        return None
    
    if data.activo is not None:
        link.activo = data.activo
    if data.mensaje_personalizado is not None:
        link.mensaje_personalizado = data.mensaje_personalizado
    
    db.commit()
    db.refresh(link)
    return link


def delete_link_turno(db: Session, link_id: int, usuario_id: int) -> bool:
    """Delete a booking link"""
    stmt = select(LinkTurno).where(LinkTurno.id == link_id, LinkTurno.usuario_id == usuario_id)
    link = db.execute(stmt).scalar_one_or_none()
    
    if not link:
        return False
    
    db.delete(link)
    db.commit()
    return True


def increment_usage(db: Session, link_id: int) -> None:
    """Increment the usage counter for a booking link"""
    stmt = select(LinkTurno).where(LinkTurno.id == link_id)
    link = db.execute(stmt).scalar_one_or_none()
    
    if link:
        link.usos_totales += 1
        db.commit()





