#!/usr/bin/env python3
"""
Initialize database with proper schema from SQLAlchemy models
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.db.base import Base
from app.db.session import get_sync_engine
from app.models import *  # Import all models

def init_db():
    """Create all tables from SQLAlchemy models"""
    print("Creating database schema from SQLAlchemy models...")
    engine = get_sync_engine()
    Base.metadata.create_all(bind=engine)
    print("✅ Database schema created successfully!")
    print(f"\nTables created: {len(Base.metadata.tables)}")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")

if __name__ == "__main__":
    init_db()

