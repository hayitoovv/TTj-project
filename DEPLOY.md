# TTJ Platforma — VPS Deployment

Production deployment to `ttj.ultrasoft.uz`.

## Prerequisites

- Ubuntu 22.04/24.04
- Docker + Docker Compose installed
- DNS A record: `ttj.ultrasoft.uz` → VPS IP
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## First-time setup

```bash
# 1. Pull code
cd /opt/TTJ-project
git pull

# 2. Add swap (4GB VPS recommended)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Configure environment
cp .env.production.example .env
# Edit SECRET_KEY (openssl rand -hex 32) and POSTGRES_PASSWORD
nano .env

# 4. Build & start (5-10 min on first run)
make build
make up

# 5. Run migrations
make migrate

# 6. Optional: seed demo data
make seed

# 7. Set up SSL (after DNS has propagated)
make ssl

# 8. Configure firewall
sudo ufw allow 22/tcp 80/tcp 443/tcp
sudo ufw --force enable
```

After SSL: open `https://ttj.ultrasoft.uz`.

## Daily operations

| Action | Command |
|---|---|
| View logs | `make logs` |
| Restart all | `make up` |
| Update from git | `make restart` |
| DB shell | `docker compose -f docker-compose.prod.yml exec postgres psql -U ttj_user -d ttj_db` |
| Backend shell | `make shell` |
| Stop everything | `make down` |

## Updating after code changes

```bash
cd /opt/TTJ-project
make restart       # git pull + rebuild + restart
make migrate       # if there are new migrations
```

## Backups

Postgres data is in a Docker volume. Manual dump:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
    pg_dump -U ttj_user ttj_db | gzip > backup-$(date +%F).sql.gz
```

Restore:

```bash
gunzip -c backup-2026-06-22.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U ttj_user ttj_db
```

## Troubleshooting

- **Frontend build fails (OOM)**: add more swap (`fallocate -l 4G /swapfile2 ...`).
- **502 Bad Gateway**: `make logs` to check which service is failing.
- **SSL not working**: verify DNS first (`dig ttj.ultrasoft.uz`), then re-run `make ssl`.
- **Certbot renewal**: runs automatically every 12 hours via the `certbot` container.
