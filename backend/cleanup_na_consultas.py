"""
Script to delete all consultas with NA values for paciente or tratamiento
"""
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker
from app.models import Consulta, Paciente, PrestacionUsuario
import os

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/denti_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def cleanup_na_consultas():
    """Delete all consultas with NA pacientes or tratamientos"""
    db = SessionLocal()
    try:
        # Find all consultas with NA in paciente or tratamiento
        consultas_to_delete = db.query(Consulta).join(
            Paciente, Consulta.paciente_id == Paciente.id
        ).join(
            PrestacionUsuario, Consulta.prestacion_usuario_id == PrestacionUsuario.id
        ).filter(
            or_(
                Paciente.nombre.in_(['NA', 'N/A', 'na', 'n/a']),
                Paciente.apellido.in_(['NA', 'N/A', 'na', 'n/a']),
                PrestacionUsuario.nombre_personalizado.in_(['NA', 'N/A', 'na', 'n/a'])
            )
        ).all()
        
        count = len(consultas_to_delete)
        
        if count == 0:
            print("✅ No se encontraron consultas con valores NA")
            return
        
        print(f"\n{'='*80}")
        print(f"🗑️  LIMPIEZA DE CONSULTAS CON VALORES NA")
        print(f"{'='*80}")
        print(f"\nConsultas a eliminar: {count}\n")
        
        for consulta in consultas_to_delete:
            paciente = consulta.paciente
            prestacion = consulta.prestacion_usuario
            print(f"  ❌ Consulta ID {consulta.id}: {paciente.nombre} {paciente.apellido} | {prestacion.nombre_personalizado} | ${consulta.monto_ars}")
        
        # Confirm deletion
        confirm = input(f"\n¿Desea eliminar estas {count} consultas? (s/n): ")
        
        if confirm.lower() == 's':
            for consulta in consultas_to_delete:
                db.delete(consulta)
            
            db.commit()
            print(f"\n✅ Se eliminaron {count} consultas con valores NA exitosamente\n")
        else:
            print("\n⏹️  Operación cancelada\n")
            
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {str(e)}\n")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_na_consultas()
