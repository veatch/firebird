# Docker Development Environment

This directory contains the Docker configuration for the Firebird Songs project development environment.

## Services

### PostgreSQL 17.4
- **Container**: `firebird-postgres`
- **Port**: `5432`
- **Database**: `firebird_dev`
- **Username**: `postgres`
- **Password**: `postgres`

### Redis 7 (Optional)
- **Container**: `firebird-redis`
- **Port**: `6379`
- Used for caching and session storage

## Quick Start

1. **Start the services**:
   ```bash
   npm run docker:up
   # or
   docker-compose up -d
   ```

2. **Check service status**:
   ```bash
   npm run docker:ps
   # or
   docker-compose ps
   ```

3. **View logs**:
   ```bash
   npm run docker:logs
   # or
   docker-compose logs -f
   ```

4. **Stop the services**:
   ```bash
   npm run docker:down
   # or
   docker-compose down
   ```

## Database Management

### Connect to PostgreSQL
```bash
npm run db:connect
# or
docker exec -it firebird-postgres psql -U postgres -d firebird_dev
```

### Reset Database (WARNING: This will delete all data)
```bash
npm run docker:reset
# or
docker-compose down -v && docker-compose up -d
```

### Backup Database
```bash
npm run db:backup
# Creates a backup file with timestamp
```

### Restore Database
```bash
docker exec -i firebird-postgres psql -U postgres -d firebird_dev < backup_20241201_143022.sql
```

## Environment Variables

Copy `env.example` to `.env.local` and update the database URL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/firebird_dev
REDIS_URL=redis://localhost:6379
```

## Database Schema

The database is automatically initialized with the following schema:

- **users**: Spotify OAuth user data
- **playlists**: Cached playlist data from Spotify API
- **song_rankings**: Calculated popularity scores

See `docker/postgres/init/01-init.sql` for the complete schema definition.

## Troubleshooting

### Port Already in Use
If you get a port conflict error:
```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process or change the port in docker-compose.yml
```

### Database Connection Issues
1. Ensure the container is running: `docker-compose ps`
2. Check container logs: `docker-compose logs postgres`
3. Verify the health check passed
4. Try restarting: `docker-compose restart postgres`

### Permission Issues
If you encounter permission issues:
```bash
# Fix volume permissions
sudo chown -R 999:999 ./docker/postgres/data
```

### Reset Everything
To completely reset the Docker environment:
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove images (optional)
docker rmi postgres:17.4 redis:7-alpine

# Start fresh
docker-compose up -d
```

## Production Considerations

When deploying to production:

1. **Change default passwords** in production environment
2. **Use environment variables** for sensitive data
3. **Configure proper backups** for production data
4. **Set up monitoring** for database performance
5. **Use connection pooling** for better performance

## Performance Tips

- The database data is persisted in a Docker volume
- Redis is included for caching Spotify API responses
- Health checks ensure services are ready before accepting connections
- Indexes are created automatically for better query performance 