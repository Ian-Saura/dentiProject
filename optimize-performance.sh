#!/bin/bash

# Performance Optimization Script

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "⚡ Optimizing Performance..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "📊 Step 1: Adding database indexes for faster queries..."
docker exec -i denti_postgres psql -U denti_user -d consultorio_db << 'EOF'

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_consultas_usuario_id ON consultas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas(fecha_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_id ON gastos_fijos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_equipos_usuario_id ON costos_equipos(usuario_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consultas_usuario_fecha ON consultas(usuario_id, fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_activo ON pacientes(usuario_id, activo);

\di

EOF

echo ""
echo "✅ Database indexes created!"
echo ""

echo "⚙️  Step 2: Optimizing nginx configuration..."

# Create optimized nginx config
cat > /root/dentiProject/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression for faster delivery
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # Cache settings
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Buffer sizes
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 50M;
    large_client_header_buffers 4 16k;

    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 65;
    send_timeout 10;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    upstream backend {
        server backend:8000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Frontend (React app)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                proxy_pass http://frontend;
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Backend API
        location /api/ {
            rewrite ^/api/(.*) /v1/$1 break;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # No cache for API
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }

        # API Docs
        location /docs {
            proxy_pass http://backend/docs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /openapi.json {
            proxy_pass http://backend/openapi.json;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Health check
        location /health {
            proxy_pass http://backend/v1/health;
            proxy_http_version 1.1;
        }
    }
}
NGINX_EOF

echo "✅ Nginx config optimized!"
echo ""

echo "🔄 Step 3: Restarting services with new configuration..."
docker compose restart nginx

echo ""
echo "⏳ Waiting for services..."
sleep 5

echo ""
echo "📊 Checking service status..."
docker compose ps

echo ""
echo "✅ Performance optimization complete!"

ENDSSH

echo ""
echo "⚡ Performance improvements applied:"
echo "  ✅ Database indexes added (faster queries)"
echo "  ✅ Gzip compression enabled (smaller transfers)"
echo "  ✅ Asset caching enabled (faster page loads)"
echo "  ✅ Nginx optimized (better performance)"
echo ""
echo "🚀 Your app should be significantly faster now!"
echo "   Visit: http://66.97.44.23"
