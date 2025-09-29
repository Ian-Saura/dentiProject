#!/usr/bin/env python3
"""
Simple database connection test
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root@localhost:3306/consultorio_db")

print(f"Testing database connection: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL, echo=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Test connection
    db = SessionLocal()
    result = db.execute("SELECT 1").fetchone()
    print(f"✅ Database connection successful: {result}")

    # Test if database exists
    result = db.execute("SHOW DATABASES").fetchall()
    print(f"📊 Available databases: {[r[0] for r in result]}")

    # Check if our database exists
    db_names = [r[0] for r in result]
    if 'consultorio_db' not in db_names:
        print("📝 Creating database 'consultorio_db'...")
        db.execute("CREATE DATABASE IF NOT EXISTS consultorio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print("✅ Database created")

    db.close()

except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Trying alternative connection string...")

    # Try without password
    alt_url = "mysql+pymysql://root:@localhost:3306/consultorio_db"
    print(f"Trying: {alt_url}")

    try:
        engine = create_engine(alt_url, echo=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        result = db.execute("SELECT 1").fetchone()
        print(f"✅ Alternative connection successful: {result}")
        db.close()
        print("💡 Use DATABASE_URL=mysql+pymysql://root:@localhost:3306/consultorio_db")
    except Exception as e2:
        print(f"❌ Alternative connection also failed: {e2}")
