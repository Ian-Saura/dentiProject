# Denti Project - Dental Practice Management System

## 🎉 Status: Production Ready

A comprehensive management system for dental practices with financial tracking, patient management, and treatment analysis.

---

## 🚀 Quick Start

### Access the Application
```
URL: http://localhost
Login: admin / Homero123
```

⚠️ **IMPORTANT**: Always use `http://localhost` (NOT `localhost:3000`)

### Start the Application
```bash
docker-compose up -d
```

### Stop the Application
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

---

## 📊 Features

### 1. **Dashboard**
- Real-time financial KPIs
- Monthly revenue trends
- Top patients and treatments
- Recent activity tracking

### 2. **Consultas (Consultations)**
- Complete consultation history
- Filter by date, payment method, patient
- Edit and delete consultations
- Export functionality

### 3. **Pacientes (Patients)**
- Patient database with full profiles
- Search and filter capabilities
- Individual patient dashboards
- Treatment history per patient

### 4. **Reportes (Reports)**
- Monthly P&L (Profit & Loss) statements
- Cash flow analysis
- Treatment profitability analysis
- CSV export for all reports

### 5. **Calculadora (Calculator)**
- Price recommendations based on costs
- Margin calculations
- Break-even analysis

### 6. **Configuración (Settings)**
- Cost configuration
- Equipment depreciation tracking
- Fixed expenses management
- Annual working hours setup

### 7. **Importar Datos (Data Import)**
- CSV import functionality
- Automatic data normalization
- Bulk patient and consultation import

---

## 🏗️ Architecture

### Services
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React + TypeScript + Vite
- **Database**: MySQL 8.0
- **Proxy**: Nginx

### Ports
- `80`: Nginx reverse proxy (main access point)
- `8000`: Backend API (direct access)
- `3306`: MySQL database
- `3000`: Frontend (internal, accessed via Nginx)

---

## 📁 Project Structure

```
dentiProject/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API routes
│   │   ├── core/            # Config, security, logging
│   │   ├── db/              # Database setup
│   │   ├── deps/            # Dependencies (auth, tenant)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── repositories/    # Data access layer
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/env.docker`):
```env
DATABASE_URL=mysql+pymysql://denti_user:denti_pass@mysql:3306/consultorio_db
JWT_SECRET_KEY=super-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,http://localhost
```

### Database
- **Host**: mysql (Docker service name)
- **Port**: 3306
- **Database**: consultorio_db
- **User**: denti_user
- **Password**: denti_pass

---

## 📊 Current Data

- **Consultations**: 109
- **Patients**: 130
- **Treatment Types**: 10
- **Date Range**: March 2025 - September 2025
- **Total Revenue**: ~$5.8M ARS

---

## 🛠️ Development

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 18+ for local frontend development
- (Optional) Python 3.11+ for local backend development

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Database Management
```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u denti_user -pdenti_pass consultorio_db

# Run migrations
docker-compose exec backend alembic upgrade head

# Create migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

---

## 🔐 Security

### Authentication
- JWT-based authentication
- Token expiration: 60 minutes
- Passwords hashed with bcrypt

### Multi-tenancy
- Data isolation per user
- Tenant context in all API calls
- Role-based access control

---

## 🐛 Troubleshooting

### Pages Are Blank
**Issue**: Accessing `http://localhost:3000` instead of `http://localhost`
**Solution**: Always use `http://localhost` (port 80 through Nginx)

### Backend Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Database Connection Issues
```bash
# Check MySQL is running
docker-compose ps mysql

# Check database connectivity
docker-compose exec backend python -c "from app.db.session import get_db; db = next(get_db()); print('✅ Connected')"
```

### Frontend Not Loading
```bash
# Check Nginx logs
docker-compose logs nginx

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

---

## 📝 API Documentation

Once the application is running, access the interactive API documentation:

```
http://localhost:8000/v1/docs
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Change `JWT_SECRET_KEY` in production
- [ ] Use strong database passwords
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring

### Recommended Server Specs
- **CPU**: 2 vCPU minimum
- **Memory**: 2GB RAM minimum
- **Storage**: 20GB minimum
- **Network**: Stable internet connection

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 🆘 Support

For issues or questions:
1. Check application logs: `docker-compose logs`
2. Verify all services are running: `docker-compose ps`
3. Restart services: `docker-compose restart`

---

**Made with ❤️ for dental professionals**

