# Oracle Cloud Always Free — Deployment Guide

## One-time Setup (run once on the VM)

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone the repository
```bash
git clone <your-repo-url> khaalis-harvest
cd khaalis-harvest
```

### 4. Create required Docker volumes (CRITICAL — must do before first run)
```bash
docker volume create portal_postgres_data
docker volume create portal_redis_data
```

### 5. Configure environment
```bash
cp env.template .env
# Edit .env with your actual values:
nano .env
```

**Required changes in .env for Oracle Cloud:**
- `JWT_SECRET` — use a strong random string (generate: `openssl rand -hex 32`)
- `DB_PASSWORD` — use a strong password
- `NEXT_PUBLIC_API_URL` — set to `http://YOUR_ORACLE_IP/api/v1`
- `NEXT_PUBLIC_APP_URL` — set to `http://YOUR_ORACLE_IP`
- `BACKEND_URL` — set to `http://YOUR_ORACLE_IP`
- `ALLOWED_ORIGINS` — set to `http://YOUR_ORACLE_IP`
- `NODE_OPTIONS_BACKEND=2048` — set this (already in template)
- `NODE_OPTIONS_FRONTEND=3072` — set this for frontend

### 6. Open Oracle Cloud firewall ports
In Oracle Cloud console → Networking → Virtual Cloud Networks → Security Lists → Add Ingress Rules:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Backend — optional, close in production)
- Port 3001 (Frontend — optional, close in production)

Also open ports in the OS firewall (iptables/firewalld on Oracle Linux):
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 7. Deploy
```bash
docker-compose up -d --build
```

### 8. Verify
```bash
# Check all containers running
docker ps

# Check backend health
curl http://localhost:3000/api/v1/health

# Check frontend
curl http://localhost:3001
```

## Updates & Redeployment
```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Logs
```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f app

# Database
docker-compose logs -f postgres
```

## Backup Database
```bash
docker exec khaalis-postgres pg_dump -U postgres khaalis_harvest > backup_$(date +%Y%m%d).sql
```

## SSL with Let's Encrypt (after DNS is configured)
Once your domain points to the Oracle Cloud IP:
```bash
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com
```
Then reload nginx: `docker-compose exec nginx nginx -s reload`
