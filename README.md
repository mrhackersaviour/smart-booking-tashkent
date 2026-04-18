# Smart Booking Tashkent

AI + 3D venue booking platform for Tashkent, Uzbekistan. Users discover,
preview (via 360° panorama), and book across six service categories —
restaurants, cafes, stadiums, fitness centres, barbershops, car washes.

**Live demo:** http://103.125.217.228:3000/
*Demo login: `demo@smartbooking.uz` / `demo123456`*

---

## Why this exists

Booking a venue in Tashkent today means a phone call, an Instagram DM, or
showing up and hoping for a table. There is no centralised, modern,
multi-category booking layer. We built one, with two differentiators:

1. **3D / 360° panorama preview** — see the table, the lighting, the
   surrounding seats, the "vibe" before you commit.
2. **Natural-language AI chat** — "Byudjetim 150K, milliy taom, kam odam
   joy" returns three matching venues plus one discovery suggestion.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Three.js, Framer Motion |
| Backend | Node.js, Express, SQLite (PostgreSQL-ready) |
| AI | Anthropic Claude API |
| Real-time | WebSocket |
| Payments | Payme, Click.uz, Stripe (international) |
| DevOps | Docker, Docker Compose, Nginx |

## Run it locally

```bash
# Quick start (starts backend + frontend)
./scripts/dev.sh

# Or manually
cd backend  && npm install && npm run migrate && npm run seed && npm run dev
cd frontend && npm install --legacy-peer-deps && npm run dev
```

Access points:
- Frontend — http://localhost:3000
- Backend API — http://localhost:5000/api
- WebSocket — ws://localhost:5000/ws
- Health check — http://localhost:5000/api/health

## Production (Docker)

```bash
cp .env.example .env          # fill in API keys and secrets
./scripts/deploy.sh production
```

See `docs/DEPLOYMENT.md` for full production setup including SSL,
database backups, and monitoring.

## Team

Project built by a cross-functional 8-person MIX team. Roles:

- **Yoldoshali Esonaliyev** — Project Manager / Security Engineer (shadow)
- **Rajabov Nurmuhammad** — Database Manager
- **Mo'minjonov Farruxbek** — Back-End / LLM
- **Abdulbosit Jalilov** — Back-End / Front-End
- **Ibrohimjon Umidjonov** — Security Engineer / IT Coordinator
- **Qudratbek Bahodirov** — Front-End / QA
- **Otabek Isamboyev** — Designer / Front-End
- **Eshmurodov Mehrojbek** — Data Analyst / Designer

## Documentation

- `docs/PRD.md` — Product requirements
- `docs/TECHNICAL_DOC.md` — Architecture and API reference
- `docs/BUSINESS_ANALYSIS.md` — Market and business model
- `docs/ANALYTICS.md` — Admin dashboard metric definitions
- `docs/DEPLOYMENT.md` — Production deployment playbook
- `CLAUDE.md` — Engineering operating playbook
- `PROGRESS.md` — Build log and sprint summary

## License

All rights reserved — Smart Booking Tashkent, 2026.
