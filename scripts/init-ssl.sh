#!/usr/bin/env bash
# ============================================================
# TTJ Platforma — initial SSL certificate via Let's Encrypt
# Run this AFTER `docker compose -f docker-compose.prod.yml up -d`
# and AFTER DNS has propagated.
# ============================================================
set -euo pipefail

DOMAIN="ttj.ultrasoft.uz"
EMAIL="umrzoqtoxirov@gmail.com"  # change if needed
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> 1. Sanity check: DNS"
RESOLVED=$(getent ahosts "$DOMAIN" | awk '{print $1; exit}' || true)
echo "    $DOMAIN resolves to: ${RESOLVED:-NOTHING — check DNS first}"

echo "==> 2. Ensure nginx is running and reachable"
$COMPOSE up -d nginx
sleep 3

echo "==> 3. Request Let's Encrypt certificate (webroot mode)"
$COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "==> 4. Activate HTTPS in nginx.conf"
sed -i 's|# location / {|location / {|' nginx/nginx.conf || true
sed -i 's|#     return 301|    return 301|' nginx/nginx.conf || true
sed -i 's|#     }|    }|' nginx/nginx.conf || true
# Uncomment HTTPS server block
sed -i '/^# server {/,/^# }/ s/^# //' nginx/nginx.conf

echo "==> 5. Reload nginx"
$COMPOSE exec nginx nginx -s reload

echo ""
echo "✅ Done! Open https://$DOMAIN"
