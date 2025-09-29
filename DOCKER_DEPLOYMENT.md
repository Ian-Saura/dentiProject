# 🦷 DentiProject Docker Deployment Guide

## 🏗️ Architecture Overview

```
🌐 Internet
    ↓
📦 Nginx Reverse Proxy (Port 80/443)
    ├── 🎨 React Frontend (Port 3000)
    └── 🔧 FastAPI Backend BFF (Port 8000)
            ↓
        🗄️ MySQL Database (Port 3306)
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- 2GB+ RAM available
- 10GB+ disk space

### One-Command Deployment
```bash
./start-docker.sh
```

## 📋 Services

| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | 80 | Reverse proxy & load balancer |
| **Frontend** | 3000 | React app (Vite + TypeScript) |
| **Backend** | 8000 | FastAPI BFF with all endpoints |
| **MySQL** | 3306 | Database with persistent storage |

## 🔧 BFF (Backend for Frontend) Endpoints

### Authentication
- `POST /v1/auth/login` - User login
- `POST /v1/auth/register` - User registration

### Analytics & Reports
- `GET /v1/analytics/kpis` - Key performance indicators
- `GET /v1/analytics/monthly` - Monthly financial reports

### Patient Management
- `GET /v1/pacientes` - List patients
- `POST /v1/pacientes` - Create patient
- `PUT /v1/pacientes/{id}` - Update patient
- `DELETE /v1/pacientes/{id}` - Delete patient

### Consultation Management
- `GET /v1/consultas` - List consultations
- `POST /v1/consultas` - Create consultation
- `PUT /v1/consultas/{id}` - Update consultation
- `DELETE /v1/consultas/{id}` - Delete consultation

### Cost Calculator
- `GET /v1/calculadora/recomendaciones` - Price recommendations
- `GET /v1/costos/analisis` - Cost analysis

### Data Import
- `POST /v1/import` - CSV data import with normalization

### Configuration
- `GET /v1/config` - User configuration
- `PUT /v1/config` - Update configuration

## 🔒 Security Features

- JWT authentication with secure tokens
- Rate limiting on API endpoints
- CORS protection
- SQL injection prevention
- Input validation and sanitization
- Non-root container users
- Security headers via Nginx

## 📊 Data Persistence

- **MySQL Data**: Stored in Docker volume `mysql_data`
- **File Uploads**: Stored in `./uploads` directory
- **Configuration**: Environment-based configuration

## 🛠️ Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Access database
docker-compose exec mysql mysql -u denti_user -p consultorio_db

# Access backend shell
docker-compose exec backend bash
```

## 🌐 Production Deployment

### 1. Server Requirements
- **CPU**: 2+ vCPUs
- **RAM**: 4GB+ recommended
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or similar

### 2. Domain Setup
```bash
# Update nginx.conf with your domain
server_name your-domain.com;

# Add SSL certificates
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### 3. Environment Configuration
```bash
# Copy and modify environment file
cp env.docker .env
# Edit .env with production values
```

### 4. Deploy
```bash
# On your server
git clone <your-repo>
cd dentiProject
./start-docker.sh
```

## 🔍 Monitoring & Health Checks

- **Health Endpoint**: `http://localhost/health`
- **API Documentation**: `http://localhost:8000/docs`
- **Container Status**: `docker-compose ps`
- **Resource Usage**: `docker stats`

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :3000
   sudo lsof -i :8000
   ```

2. **Database Connection Issues**
   ```bash
   docker-compose logs mysql
   docker-compose exec mysql mysql -u root -p
   ```

3. **Backend Not Starting**
   ```bash
   docker-compose logs backend
   docker-compose exec backend python -c "import pymysql; print('OK')"
   ```

4. **Frontend Build Issues**
   ```bash
   docker-compose logs frontend
   docker-compose exec frontend npm run build
   ```

## 📈 Scaling

### Horizontal Scaling
```yaml
# In docker-compose.yml
backend:
  deploy:
    replicas: 3
  
frontend:
  deploy:
    replicas: 2
```

### Load Balancing
Nginx automatically load balances between multiple backend instances.

## 🔄 Updates & Maintenance

```bash
# Update application
git pull
docker-compose up --build -d

# Database backup
docker-compose exec mysql mysqldump -u denti_user -p consultorio_db > backup.sql

# Database restore
docker-compose exec -T mysql mysql -u denti_user -p consultorio_db < backup.sql
```

## 📞 Support

- **API Documentation**: http://localhost:8000/docs
- **Container Logs**: `docker-compose logs -f`
- **Health Checks**: Built-in health endpoints for all services

---

🦷 **DentiProject** - Professional Dental Practice Management System
