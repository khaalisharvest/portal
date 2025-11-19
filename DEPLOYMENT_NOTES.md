# 🚀 Production Deployment Notes

## Current Production Setup (Azure)

### Volumes (DO NOT CHANGE)
- **PostgreSQL**: `portal_postgres_data` - Contains all production data (48+ products, orders, etc.)
- **Redis**: `portal_redis_data` - Contains cache data

**IMPORTANT**: These volumes are marked as `external: true` in `docker-compose.yml` because they contain production data. Never delete or recreate these volumes.

### Database Password
- **Current Password**: Stored in `/home/azureuser/apps/khaalis-harvest/.env` as `DB_PASSWORD`
- **Location**: Azure VM at `/home/azureuser/apps/khaalis-harvest/.env`
- **CRITICAL**: The password in `.env` must match the password used when the PostgreSQL volume was first created.

### Container Names
- `khaalis-app` - Application container (Backend + Frontend)
- `khaalis-postgres` - PostgreSQL database
- `khaalis-redis` - Redis cache

### Deployment Location
- **Path**: `/home/azureuser/apps/khaalis-harvest`
- **IP**: `4.213.98.234`
- **Ports**: 
  - Frontend: `3001`
  - Backend: `3000`
  - PostgreSQL: `5432`
  - Redis: `6379`

## Deployment Process

1. **Pull latest code**:
   ```bash
   cd /home/azureuser/apps/khaalis-harvest
   git pull origin main
   ```

2. **Verify .env file**:
   ```bash
   # Ensure DB_PASSWORD matches the volume's password
   grep DB_PASSWORD .env
   ```

3. **Update docker-compose.yml if needed**:
   - Volumes section should use `external: true` with `name: portal_postgres_data` and `name: portal_redis_data`
   - Never change these volume names unless migrating data

4. **Deploy**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Verify**:
   ```bash
   docker-compose ps
   docker logs khaalis-app --tail 20
   ```

## Important Rules

1. **NEVER** run `docker-compose down -v` - This will delete volumes and all data
2. **NEVER** change volume names in `docker-compose.yml` without migrating data first
3. **ALWAYS** verify `.env` `DB_PASSWORD` matches the volume's password before deploying
4. **ALWAYS** backup before making major changes
5. **NEVER** delete `portal_postgres_data` or `portal_redis_data` volumes

## Cleanup (Already Done)

The following redundant resources have been removed:
- ✅ Old `portal-app` Docker image
- ✅ All dangling Docker images
- ✅ Unused `khaalis-harvest_postgres_data` volume (was empty)
- ✅ Unused `khaalis-harvest_redis_data` volume (was empty)

## Current State

- ✅ Only production volumes remain: `portal_postgres_data`, `portal_redis_data`
- ✅ Only current Docker image: `khaalis-harvest-app:latest`
- ✅ All containers healthy and running
- ✅ Single source of truth: `docker-compose.yml` uses external volumes

## Troubleshooting

### If password authentication fails:
1. Check `.env` file has correct `DB_PASSWORD`
2. Verify `DATABASE_URL` includes correct password
3. Restart containers: `docker-compose restart`

### If data appears missing:
1. Check which volume is mounted: `docker inspect khaalis-postgres | grep -A 3 Mounts`
2. Verify `docker-compose.yml` uses correct volume name
3. Check volume exists: `docker volume ls`

---

**Last Updated**: November 19, 2025
**Maintained By**: Khaalis Harvest Development Team

