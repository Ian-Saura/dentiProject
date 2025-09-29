#!/usr/bin/env python3
"""
Backend Structure Validation Script
Validates that all imports and structure are correct without running the server
"""

import os
import sys
from pathlib import Path

def validate_file_structure():
    """Validate that all required files exist"""
    required_files = [
        'app/main.py',
        'app/core/config.py',
        'app/core/security.py',
        'app/db/session.py',
        'app/models/usuarios.py',
        'app/models/consultas.py',
        'app/api/v1/routes_auth.py',
        'app/api/v1/routes_analytics.py',
        'requirements.txt'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    else:
        print("✅ All required files present")
        return True

def validate_imports():
    """Check if imports can be resolved (syntax check)"""
    try:
        # Test basic Python syntax of key files
        import ast
        
        key_files = [
            'app/main.py',
            'app/core/config.py',
            'app/models/usuarios.py',
            'app/api/v1/routes_auth.py'
        ]
        
        for file_path in key_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                ast.parse(content)
                print(f"✅ {file_path} - syntax OK")
            except SyntaxError as e:
                print(f"❌ {file_path} - syntax error: {e}")
                return False
            except Exception as e:
                print(f"⚠️  {file_path} - could not validate: {e}")
        
        return True
    except Exception as e:
        print(f"❌ Import validation failed: {e}")
        return False

def check_database_schema():
    """Check if database schema file exists and is valid"""
    schema_file = "../tablas_app.sql"
    if Path(schema_file).exists():
        print("✅ Database schema file found")
        
        # Basic validation of SQL file
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check for key tables
            required_tables = [
                'usuarios', 'consultas', 'pacientes', 
                'prestaciones', 'gastos_fijos', 'costos_equipos'
            ]
            
            missing_tables = []
            for table in required_tables:
                if f"CREATE TABLE {table}" not in content:
                    missing_tables.append(table)
            
            if missing_tables:
                print("❌ Missing tables in schema:")
                for table in missing_tables:
                    print(f"   - {table}")
                return False
            else:
                print("✅ All required tables found in schema")
                return True
                
        except Exception as e:
            print(f"❌ Could not validate schema file: {e}")
            return False
    else:
        print("❌ Database schema file not found")
        return False

def main():
    """Main validation function"""
    print("🔍 Validating Backend Structure...")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir(Path(__file__).parent)
    
    results = []
    
    # File structure validation
    print("\n📁 File Structure Validation:")
    results.append(validate_file_structure())
    
    # Import/syntax validation
    print("\n🐍 Python Syntax Validation:")
    results.append(validate_imports())
    
    # Database schema validation
    print("\n🗄️  Database Schema Validation:")
    results.append(check_database_schema())
    
    # Summary
    print("\n" + "=" * 50)
    if all(results):
        print("✅ Backend structure validation PASSED")
        print("\n📋 Next steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Set up database connection in .env file")
        print("   3. Run migrations: alembic upgrade head")
        print("   4. Start server: uvicorn app.main:app --reload")
        return 0
    else:
        print("❌ Backend structure validation FAILED")
        print("   Fix the issues above before proceeding")
        return 1

if __name__ == "__main__":
    sys.exit(main())
