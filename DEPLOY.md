# TTJ Platforma — VPS Deployment

Production deployment to `ttj.ultrasoft.uz`.

This setup uses **host system nginx** as the reverse proxy (so it can coexist
with other sites on the VPS) and Docker for the application stack.

## Prerequisites

- Ubuntu 22.04/24.04
- Docker + Docker Compose v2 plugin
- System nginx + certbot installed
- DNS A record: `ttj.ultrasoft.uz` → VPS IP
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## First-time setup

```bash
# 1. Clone / pull
cd /opt/TTJ-project
git pull

# 2. Configure environment
cp .env.production.example .env
nano .env       # set SECRET_KEY (openssl rand -hex 32) and POSTGRES_PASSWORD

# 3. Build & start application stack
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# 5. Optional: seed demo data
docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed

# 6. Set up host nginx
sudo cp nginx/system-nginx.conf /etc/nginx/sites-available/ttj.ultrasoft.uz
sudo ln -s /etc/nginx/sites-available/ttj.ultrasoft.uz /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl reload nginx

# 7. Open http://ttj.ultrasoft.uz to verify, then get SSL:
sudo certbot --nginx -d ttj.ultrasoft.uz \
    --non-interactive --agree-tos -m umrzoqtoxirov@gmail.com --redirect

# After certbot, https://ttj.ultrasoft.uz works.
```

## Daily operations

| Action | Command |
|---|---|
| View logs | `docker compose -f docker-compose.prod.yml logs -f --tail=100` |
| Restart | `docker compose -f docker-compose.prod.yml restart` |
| Update from git | `git pull && docker compose -f docker-compose.prod.yml up -d --build` |
| DB shell | `docker compose -f docker-compose.prod.yml exec postgres psql -U ttj_user -d ttj_db` |
| Backend shell | `docker compose -f docker-compose.prod.yml exec backend bash` |
| Stop everything | `docker compose -f docker-compose.prod.yml down` |

## Backups

```bash
docker compose -f docker-compose.prod.yml exec postgres \
    pg_dump -U ttj_user ttj_db | gzip > backup-$(date +%F).sql.gz
```

## Troubleshooting

- **502 Bad Gateway**: container down. Check `docker compose -f docker-compose.prod.yml ps`.
- **Frontend build fails (OOM)**: add swap (`fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile`).
- **SSL renewal**: certbot's systemd timer renews automatically (`systemctl status certbot.timer`).
