#!/usr/bin/env python3
"""
Full Stack Testing Script
Tests functionality parity between app.py, backend API, and frontend
"""

import os
import sys
import time
import subprocess
import requests
import json
from datetime import datetime
from pathlib import Path

class FullStackTester:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.test_results = {
            'app_py': {},
            'backend': {},
            'frontend': {},
            'comparison': {}
        }
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
    
    def print_section(self, title):
        print(f"\n{'─'*40}")
        print(f"📋 {title}")
        print(f"{'─'*40}")
    
    def test_app_py_functionality(self):
        """Test original Streamlit app functionality"""
        self.print_section("Testing app.py (Streamlit) Functionality")
        
        try:
            # Check if app.py exists and can be imported
            app_py_path = self.project_root / "app.py"
            if app_py_path.exists():
                print("✅ app.py file exists")
                
                # Try to import key classes
                sys.path.insert(0, str(self.project_root))
                try:
                    # Import without running Streamlit
                    with open(app_py_path, 'r') as f:
                        content = f.read()
                    
                    # Check for key classes and functions
                    key_components = [
                        'class UserManager',
                        'class DataManager', 
                        'def calcular_costo_hora_real',
                        'def get_resumen',
                        'def show_calculadora_inteligente',
                        'def ejecutar_migracion_flexible',
                        'def aplicar_filtros_busqueda',
                        'def aplicar_filtros_visualizacion'
                    ]
                    
                    for component in key_components:
                        if component in content:
                            print(f"✅ Found: {component}")
                            self.test_results['app_py'][component] = True
                        else:
                            print(f"❌ Missing: {component}")
                            self.test_results['app_py'][component] = False
                            
                except Exception as e:
                    print(f"❌ Error importing app.py: {e}")
                    self.test_results['app_py']['import_error'] = str(e)
            else:
                print("❌ app.py file not found")
                self.test_results['app_py']['file_exists'] = False
                
        except Exception as e:
            print(f"❌ Error testing app.py: {e}")
            self.test_results['app_py']['error'] = str(e)
    
    def test_backend_api(self):
        """Test FastAPI backend functionality"""
        self.print_section("Testing Backend API Functionality")
        
        try:
            # Test if backend is running
            try:
                response = requests.get(f"{self.backend_url}/v1/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Backend API is running")
                    self.test_results['backend']['running'] = True
                else:
                    print(f"❌ Backend health check failed: {response.status_code}")
                    self.test_results['backend']['running'] = False
                    return
            except requests.exceptions.RequestException as e:
                print(f"❌ Backend not accessible: {e}")
                print("💡 Try starting the backend with: cd backend && python start_backend.py")
                self.test_results['backend']['running'] = False
                return
            
            # Test authentication endpoint
            try:
                auth_data = {
                    'username': 'admin',
                    'password': 'Homero123'
                }
                response = requests.post(
                    f"{self.backend_url}/v1/auth/login", 
                    data=auth_data,
                    timeout=5
                )
                if response.status_code == 200:
                    token_data = response.json()
                    if 'access_token' in token_data:
                        print("✅ Authentication endpoint working")
                        self.test_results['backend']['auth'] = True
                        self.auth_token = token_data['access_token']
                    else:
                        print("❌ Authentication response missing token")
                        self.test_results['backend']['auth'] = False
                        return
                else:
                    print(f"❌ Authentication failed: {response.status_code}")
                    self.test_results['backend']['auth'] = False
                    return
            except Exception as e:
                print(f"❌ Authentication error: {e}")
                self.test_results['backend']['auth'] = False
                return
            
            # Test API endpoints with authentication
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            api_endpoints = [
                ('/v1/analytics/resumen', 'Analytics Summary'),
                ('/v1/analytics/kpis', 'Analytics KPIs'),
                ('/v1/costos/analisis', 'Cost Analysis'),
                ('/v1/consultas', 'Consultations'),
                ('/v1/pacientes', 'Patients'),
                ('/v1/equipos', 'Equipment'),
                ('/v1/gastos', 'Fixed Expenses'),
                ('/v1/prestaciones', 'Services Catalog'),
                ('/v1/prestaciones-usuario', 'User Services')
            ]
            
            for endpoint, name in api_endpoints:
                try:
                    response = requests.get(f"{self.backend_url}{endpoint}", headers=headers, timeout=5)
                    if response.status_code == 200:
                        print(f"✅ {name}: {endpoint}")
                        self.test_results['backend'][endpoint] = True
                    else:
                        print(f"❌ {name}: {endpoint} - Status: {response.status_code}")
                        self.test_results['backend'][endpoint] = False
                except Exception as e:
                    print(f"❌ {name}: {endpoint} - Error: {e}")
                    self.test_results['backend'][endpoint] = False
            
            # Test calculator endpoint
            try:
                calc_data = {
                    'tiempo_horas': 1.5,
                    'costo_materiales_ars': 5000,
                    'usar_costo_real': False
                }
                response = requests.post(
                    f"{self.backend_url}/v1/calculadora/recomendaciones",
                    headers=headers,
                    params=calc_data,
                    timeout=5
                )
                if response.status_code == 200:
                    recommendations = response.json()
                    if isinstance(recommendations, list) and len(recommendations) > 0:
                        print("✅ Calculator endpoint working")
                        print(f"   📊 Generated {len(recommendations)} price recommendations")
                        self.test_results['backend']['calculator'] = True
                    else:
                        print("❌ Calculator returned invalid data")
                        self.test_results['backend']['calculator'] = False
                else:
                    print(f"❌ Calculator endpoint failed: {response.status_code}")
                    self.test_results['backend']['calculator'] = False
            except Exception as e:
                print(f"❌ Calculator endpoint error: {e}")
                self.test_results['backend']['calculator'] = False
                
        except Exception as e:
            print(f"❌ Error testing backend: {e}")
            self.test_results['backend']['error'] = str(e)
    
    def test_frontend_app(self):
        """Test React frontend functionality"""
        self.print_section("Testing Frontend React App")
        
        try:
            # Check if frontend is running
            try:
                response = requests.get(self.frontend_url, timeout=5)
                if response.status_code == 200:
                    print("✅ Frontend is accessible")
                    self.test_results['frontend']['running'] = True
                else:
                    print(f"❌ Frontend not accessible: {response.status_code}")
                    self.test_results['frontend']['running'] = False
                    return
            except requests.exceptions.RequestException as e:
                print(f"❌ Frontend not accessible: {e}")
                print("💡 Try starting the frontend with: cd frontend && npm run dev")
                self.test_results['frontend']['running'] = False
                return
            
            # Check if frontend files exist
            frontend_files = [
                'package.json',
                'src/App.tsx',
                'src/main.tsx',
                'src/pages/DashboardPage.tsx',
                'src/pages/LoginPage.tsx',
                'src/pages/CalculadoraPage.tsx',
                'src/services/api.ts',
                'src/services/auth.ts',
                'src/services/analytics.ts'
            ]
            
            for file_path in frontend_files:
                full_path = self.project_root / 'frontend' / file_path
                if full_path.exists():
                    print(f"✅ {file_path}")
                    self.test_results['frontend'][file_path] = True
                else:
                    print(f"❌ Missing: {file_path}")
                    self.test_results['frontend'][file_path] = False
            
            # Check package.json dependencies
            package_json_path = self.project_root / 'frontend' / 'package.json'
            if package_json_path.exists():
                with open(package_json_path, 'r') as f:
                    package_data = json.load(f)
                
                required_deps = [
                    'react', 'react-dom', 'react-router-dom', 
                    'axios', 'react-query', 'recharts', 'tailwindcss'
                ]
                
                dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                
                for dep in required_deps:
                    if dep in dependencies:
                        print(f"✅ Dependency: {dep}")
                        self.test_results['frontend'][f'dep_{dep}'] = True
                    else:
                        print(f"❌ Missing dependency: {dep}")
                        self.test_results['frontend'][f'dep_{dep}'] = False
                        
        except Exception as e:
            print(f"❌ Error testing frontend: {e}")
            self.test_results['frontend']['error'] = str(e)
    
    def compare_functionality(self):
        """Compare functionality between all three systems"""
        self.print_section("Functionality Comparison")
        
        # Define core functionalities that should exist in all systems
        core_functions = {
            'Authentication': {
                'app_py': 'UserManager.validate_user',
                'backend': '/v1/auth/login',
                'frontend': 'authService.login'
            },
            'Dashboard Analytics': {
                'app_py': 'DataManager.get_resumen',
                'backend': '/v1/analytics/resumen',
                'frontend': 'analyticsService.getResumen'
            },
            'Cost Analysis': {
                'app_py': 'DataManager.calcular_costo_hora_real',
                'backend': '/v1/costos/analisis',
                'frontend': 'analyticsService.getCostosAnalisis'
            },
            'Price Calculator': {
                'app_py': 'show_calculadora_inteligente',
                'backend': '/v1/calculadora/recomendaciones',
                'frontend': 'calculadoraService.getRecomendaciones'
            },
            'Data Import': {
                'app_py': 'ejecutar_migracion_flexible',
                'backend': '/v1/import',
                'frontend': 'importService.importCSV'
            },
            'Search/Filter': {
                'app_py': 'aplicar_filtros_busqueda',
                'backend': '/v1/consultas/busqueda',
                'frontend': 'consultasService.busquedaConsultas'
            }
        }
        
        print("\n📊 Functionality Matrix:")
        print(f"{'Function':<20} {'app.py':<10} {'Backend':<10} {'Frontend':<10}")
        print("-" * 60)
        
        for func_name, implementations in core_functions.items():
            app_status = "✅" if any(implementations['app_py'] in str(result) for result in self.test_results['app_py'].values()) else "❌"
            backend_status = "✅" if self.test_results['backend'].get(implementations['backend'].split('/')[-1], False) else "❌"
            frontend_status = "✅" if self.test_results['frontend'].get('running', False) else "❌"
            
            print(f"{func_name:<20} {app_status:<10} {backend_status:<10} {frontend_status:<10}")
            
            self.test_results['comparison'][func_name] = {
                'app_py': app_status == "✅",
                'backend': backend_status == "✅", 
                'frontend': frontend_status == "✅"
            }
    
    def generate_report(self):
        """Generate comprehensive test report"""
        self.print_section("Test Report Summary")
        
        # Calculate scores
        app_py_score = sum(1 for v in self.test_results['app_py'].values() if v is True)
        backend_score = sum(1 for v in self.test_results['backend'].values() if v is True)
        frontend_score = sum(1 for v in self.test_results['frontend'].values() if v is True)
        
        total_app_py = len(self.test_results['app_py'])
        total_backend = len(self.test_results['backend'])
        total_frontend = len(self.test_results['frontend'])
        
        print(f"\n📈 Test Scores:")
        print(f"app.py:    {app_py_score}/{total_app_py} ({app_py_score/max(total_app_py,1)*100:.1f}%)")
        print(f"Backend:   {backend_score}/{total_backend} ({backend_score/max(total_backend,1)*100:.1f}%)")
        print(f"Frontend:  {frontend_score}/{total_frontend} ({frontend_score/max(total_frontend,1)*100:.1f}%)")
        
        # Overall assessment
        print(f"\n🎯 Overall Assessment:")
        if app_py_score > 0 and backend_score > 0 and frontend_score > 0:
            print("✅ All three systems have basic functionality")
        else:
            print("❌ Some systems are not working properly")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        if not self.test_results['backend'].get('running', False):
            print("🔧 Start the backend: cd backend && python start_backend.py")
        if not self.test_results['frontend'].get('running', False):
            print("🔧 Start the frontend: cd frontend && npm install && npm run dev")
        if not self.test_results['backend'].get('auth', False):
            print("🔧 Check backend database connection and user credentials")
        
        # Save detailed report
        report_path = self.project_root / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        print(f"\n📄 Detailed report saved: {report_path}")
    
    def run_all_tests(self):
        """Run all tests"""
        self.print_header("Full Stack Testing - app.py vs Backend vs Frontend")
        
        print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📁 Project root: {self.project_root}")
        
        # Run tests
        self.test_app_py_functionality()
        self.test_backend_api()
        self.test_frontend_app()
        self.compare_functionality()
        self.generate_report()
        
        self.print_header("Testing Complete!")

if __name__ == "__main__":
    tester = FullStackTester()
    tester.run_all_tests()
