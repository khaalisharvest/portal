# 🚀 Khaalis Harvest - Azure Deployment Guide

Complete step-by-step guide for deploying and updating the Khaalis Harvest platform on Azure.

---

## 📋 Prerequisites

- Azure VM with Docker and Docker Compose installed
- SSH access to the Azure VM (IP: `4.213.98.234`)
- SSH key file: `~/Downloads/khaalis-harvest-prod_key.pem`
- Git repository access

---

## 🏗️ Current Production Setup

### Server Information
- **VM IP**: `4.213.98.234`
- **Deployment Path**: `/home/azureuser/apps/khaalis-harvest`
- **SSH User**: `azureuser`

### Container Names
- `khaalis-app` - Application (Backend + Frontend)
- `khaalis-postgres` - PostgreSQL Database
- `khaalis-redis` - Redis Cache

### Ports
- **Frontend**: `3001` → http://4.213.98.234:3001
- **Backend API**: `3000` → http://4.213.98.234:3000
- **PostgreSQL**: `5432`
- **Redis**: `6379`

### Volumes (CRITICAL - DO NOT DELETE)
- `portal_postgres_data` - Contains all production data (products, orders, users, etc.)
- `portal_redis_data` - Contains cache data

**⚠️ WARNING**: These volumes contain all production data. Never delete or recreate them!

---

## 🔄 Standard Deployment Process

### Step 1: Connect to Azure VM

```bash
ssh -i ~/Downloads/khaalis-harvest-prod_key.pem azureuser@4.213.98.234
```

### Step 2: Navigate to Project Directory

```bash
cd /home/azureuser/apps/khaalis-harvest
```

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

### Step 4: Verify Environment File

```bash
# Check that .env file exists and has correct password
cat .env | grep DB_PASSWORD

# Verify DATABASE_URL matches
cat .env | grep DATABASE_URL
```

**Important**: The `DB_PASSWORD` in `.env` must match the password used when the PostgreSQL volume was first created. If you're unsure, check the password in the existing `.env` file.

### Step 5: Verify Docker Compose Configuration

```bash
# Check that volumes are correctly configured
grep -A 5 "postgres_data:" docker-compose.yml

# Should show:
# postgres_data:
#   external: true
#   name: portal_postgres_data
```

### Step 6: Stop Existing Containers

```bash
docker-compose down
```

**⚠️ NEVER run `docker-compose down -v`** - This will delete volumes and all data!

### Step 7: Rebuild and Start Containers

```bash
# If code changed, rebuild:
docker-compose up -d --build

# If only config changed, just restart:
docker-compose restart
```

### Step 8: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check application logs
docker logs khaalis-app --tail 50

# Verify all containers are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Step 9: Test Application

- **Frontend**: http://4.213.98.234:3001
- **Backend API**: http://4.213.98.234:3000/api/v1/health
- **API Docs**: http://4.213.98.234:3000/api/docs

---

## 🔧 Initial Setup (First Time Only)

### Step 1: Clone Repository

```bash
cd /home/azureuser/apps
git clone <repository-url> khaalis-harvest
cd khaalis-harvest
```

### Step 2: Create Environment File

```bash
# Copy template
cp env.template .env

# Edit .env file with your values
nano .env
```

**Required Variables in `.env`**:
- `DB_PASSWORD` - Database password (must match volume's original password)
- `DATABASE_URL` - Full database connection string
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `NEXT_PUBLIC_API_URL` - Frontend API URL (http://4.213.98.234:3000/api/v1)
- `NEXT_PUBLIC_APP_URL` - Frontend URL (http://4.213.98.234:3001)
- `BACKEND_URL` - Backend URL (http://4.213.98.234:3000)
- `ALLOWED_ORIGINS` - CORS origins (http://4.213.98.234:3000,http://4.213.98.234:3001)

See `env.template` for all available variables.

### Step 3: Verify Docker Compose Volumes

Ensure `docker-compose.yml` uses the correct volumes:

```yaml
volumes:
  postgres_data:
    external: true
    name: portal_postgres_data
  redis_data:
    external: true
    name: portal_redis_data
```

### Step 4: Start Services

```bash
docker-compose up -d --build
```

### Step 5: Wait for Services to Start

```bash
# Wait 30-60 seconds for containers to start
sleep 30

# Check status
docker-compose ps
```

---

## 🛠️ Common Operations

### View Logs

```bash
# Application logs
docker logs khaalis-app --tail 100 -f

# Database logs
docker logs khaalis-postgres --tail 50

# Redis logs
docker logs khaalis-redis --tail 50
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart postgres
docker-compose restart redis
```

### Check Container Health

```bash
# All containers
docker ps

# Specific container
docker inspect khaalis-app | grep -A 10 Health
```

### Check Volume Usage

```bash
# List all volumes
docker volume ls

# Inspect volume
docker volume inspect portal_postgres_data

# Check which volume is mounted
docker inspect khaalis-postgres | grep -A 5 Mounts
```

### Access Database (Emergency Only)

```bash
# Connect to PostgreSQL
docker exec -it khaalis-postgres psql -U postgres -d khaalis_harvest

# Run a query (example)
docker exec khaalis-postgres psql -U postgres -d khaalis_harvest -c "SELECT COUNT(*) FROM products;"
```

**⚠️ Note**: Only use database access for emergency troubleshooting. Never modify data directly.

---

## 🚨 Troubleshooting

### Issue: Password Authentication Failed

**Symptoms**: 
```
error: password authentication failed for user "postgres"
```

**Solution**:
1. Check `.env` file has correct `DB_PASSWORD`:
   ```bash
   grep DB_PASSWORD .env
   ```

2. Verify `DATABASE_URL` includes correct password:
   ```bash
   grep DATABASE_URL .env
   ```

3. Restart containers:
   ```bash
   docker-compose restart
   ```

### Issue: Data Appears Missing

**Symptoms**: Products, orders, or users are missing

**Solution**:
1. Check which volume is mounted:
   ```bash
   docker inspect khaalis-postgres | grep -A 3 Mounts
   ```

2. Verify `docker-compose.yml` uses correct volume:
   ```bash
   grep -A 3 "postgres_data:" docker-compose.yml
   ```

3. Check volume exists:
   ```bash
   docker volume ls | grep postgres
   ```

### Issue: Container Won't Start

**Symptoms**: Container exits immediately or shows unhealthy status

**Solution**:
1. Check logs:
   ```bash
   docker logs khaalis-app --tail 100
   ```

2. Verify environment variables:
   ```bash
   docker-compose config
   ```

3. Check for port conflicts:
   ```bash
   netstat -tulpn | grep -E '3000|3001|5432|6379'
   ```

### Issue: Build Fails

**Symptoms**: `docker-compose up --build` fails during build

**Solution**:
1. Check Docker has enough resources:
   ```bash
   docker system df
   ```

2. Clean up unused resources:
   ```bash
   docker system prune -a
   ```

3. Rebuild from scratch:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong passwords** (32+ characters for JWT_SECRET)
3. **Keep SSH keys secure** and never share them
4. **Regular backups** of database volumes
5. **Monitor logs** for suspicious activity
6. **Update regularly** - Pull latest security patches

---

## 📦 Backup and Recovery

### Backup Database

```bash
# Create backup
docker exec khaalis-postgres pg_dump -U postgres khaalis_harvest > backup_$(date +%Y%m%d_%H%M%S).sql

# Or backup entire volume (requires root)
docker run --rm -v portal_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

### Restore Database

```bash
# Restore from SQL dump
docker exec -i khaalis-postgres psql -U postgres khaalis_harvest < backup_file.sql
```

---

## 📝 Important Rules

1. **NEVER** run `docker-compose down -v` - This deletes volumes and all data
2. **NEVER** change volume names in `docker-compose.yml` without migrating data first
3. **ALWAYS** verify `.env` `DB_PASSWORD` matches volume's password before deploying
4. **ALWAYS** backup before making major changes
5. **NEVER** delete `portal_postgres_data` or `portal_redis_data` volumes
6. **ALWAYS** test changes in a safe environment first

---

## 🔄 Quick Reference Commands

```bash
# Full deployment cycle
cd /home/azureuser/apps/khaalis-harvest
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose ps

# Check logs
docker logs khaalis-app --tail 50

# Restart services
docker-compose restart

# View container status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Health check
curl http://4.213.98.234:3000/api/v1/health
```

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check application logs: `docker logs khaalis-app --tail 100`
2. Verify environment variables: `cat .env`
3. Check container health: `docker-compose ps`
4. Review this guide's troubleshooting section
5. Contact the development team

---

**Last Updated**: November 19, 2025  
**Maintained By**: Khaalis Harvest Development Team

