# Deployment Playbook

Production deployment procedure for Smart Booking Tashkent. Kept
intentionally short — anything more than one page tends to rot.

## Prerequisites

- Ubuntu 22.04 LTS host (or equivalent) with Docker and Docker Compose v2
- Domain name pointed at the host (A record)
- Payme and Click.uz merchant credentials (sandbox is fine for staging)
- Anthropic API key for the AI chat feature

## First-time setup

```bash
git clone https://github.com/mrhackersaviour/smart-booking-tashkent.git
cd smart-booking-tashkent

cp .env.example .env
# Fill in: JWT_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY,
#         PAYME_MERCHANT_ID, PAYME_SECRET, CLICK_*, STRIPE_*, FRONTEND_URL
```

## Deploy

```bash
./scripts/deploy.sh production
```

The script:
1. Pulls the latest main branch
2. Builds backend and frontend Docker images
3. Runs database migrations (`npm run migrate`)
4. Starts the stack via docker-compose
5. Waits for `/api/health` to return 200 before reporting success

## Zero-downtime updates

```bash
git pull origin main
./scripts/deploy.sh production --no-rebuild-db
```

The backend and frontend containers are rebuilt in place; nginx keeps
serving the old build until the new one passes its health check.

## Rollback

```bash
git checkout <previous-commit>
./scripts/deploy.sh production
```

Database migrations are additive by convention — no destructive down
migrations. If a schema change is rolled back, the extra columns remain
and are simply ignored by the older application code.

## Monitoring

- `/api/health` — application health (checked by deploy script)
- Docker logs — `docker compose logs -f backend`
- Database — sqlite file under `backend/data/smart_booking.db`;
  daily backup via cron is expected for production

## Security notes

- All secrets live in `.env` (git-ignored). Never commit real secrets.
- Rate limiting is enabled on `/api/auth/*` and `/api/ai/*`
  (see `src/middleware/rate-limit.js`).
- JWT refresh tokens rotate on every refresh; stolen access tokens expire
  in 15 minutes.
- Payme/Click webhook signatures are verified with HMAC before any
  database write. See `src/services/payme.js`.

## Known operational issues

- Port 80 conflict on some Linux distros (notably Kali) — nginx container
  cannot bind. Work-around is to expose frontend on port 3000 during
  development; production deploys run on port 80/443 on a clean host.
- Backend Docker cache retains stale seed data after migrations. Run
  `docker compose build --no-cache backend` when updating seeds.

## Contact

Operations questions: yoldoshali@proton.me
