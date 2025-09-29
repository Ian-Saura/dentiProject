#!/usr/bin/env python3
"""
Simple backend test
"""
import sys
import os
sys.path.append('backend')

try:
    from backend.app.main_simple import app
    print("✅ Backend app imported successfully")
    
    # Test the mock authentication
    from backend.app.core.mock_auth import authenticate_user, create_access_token
    
    # Test user authentication
    user = authenticate_user("admin", "Homero123")
    if user:
        print("✅ Mock authentication works")
        print(f"   User: {user['nombre']} ({user['username']})")
        
        # Test token creation
        token = create_access_token(user['username'])
        print("✅ JWT token creation works")
        print(f"   Token: {token[:50]}...")
        
    else:
        print("❌ Authentication failed")
        
    # Test FastAPI app
    from fastapi.testclient import TestClient
    
    try:
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/v1/health")
        if response.status_code == 200:
            print("✅ Health endpoint works")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
        
        # Test login endpoint
        response = client.post("/v1/auth/login", data={
            "username": "admin",
            "password": "Homero123"
        })
        
        if response.status_code == 200:
            print("✅ Login endpoint works")
            data = response.json()
            print(f"   User: {data['user']['nombre']}")
            print(f"   Token: {data['access_token'][:50]}...")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except ImportError:
        print("⚠️  TestClient not available, but app structure is correct")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
