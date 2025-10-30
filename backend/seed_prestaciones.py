#!/usr/bin/env python3
"""
Script para crear prestaciones base necesarias para el sistema
"""

from app.db.session import SessionLocal
from app.models import Prestacion, Usuario

def seed_prestaciones():
    db = SessionLocal()
    try:
        # Check if prestaciones already exist
        existing = db.query(Prestacion).count()
        if existing > 0:
            print(f"✓ Ya existen {existing} prestaciones en la base de datos")
            return
        
        # Create basic prestaciones
        prestaciones = [
            {"nombre": "Consulta General", "descripcion": "Consulta odontológica general"},
            {"nombre": "Limpieza Dental", "descripcion": "Limpieza y profilaxis dental"},
            {"nombre": "Extracción Simple", "descripcion": "Extracción de pieza dental simple"},
            {"nombre": "Endodoncia", "descripcion": "Tratamiento de conducto"},
            {"nombre": "Empaste", "descripcion": "Restauración dental con composite"},
            {"nombre": "Corona", "descripcion": "Colocación de corona dental"},
            {"nombre": "Blanqueamiento", "descripcion": "Blanqueamiento dental"},
            {"nombre": "Ortodoncia", "descripcion": "Tratamiento de ortodoncia"},
            {"nombre": "Prótesis Parcial Removible", "descripcion": "Prótesis parcial removible (PPR)"},
            {"nombre": "Prótesis Total Removible", "descripcion": "Prótesis completa removible"},
        ]
        
        for prest_data in prestaciones:
            prest = Prestacion(**prest_data)
            db.add(prest)
        
        db.commit()
        print(f"✅ Creadas {len(prestaciones)} prestaciones base")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_prestaciones()

















