# Shion Fuuen Graduation Project

Vue 3 + Spring Boot full-stack e-commerce demo for local showcase use.

The normal local demo runs the backend on `8080` and the frontend on `5173`.
Business demo data and media assets are kept in the repository so the main
showcase can run without external placeholder providers.

## Requirements

- JDK 17
- Node.js `>=20.19.0` or `>=22.12.0`
- MySQL 8
- Redis 7
- Maven
- Frontend dependencies installed once with `npm ci`

## Database

The root SQL dump `shopping_mall_init.sql` creates and initializes the
`shopping_mall` database.

Import it before starting the project:

```powershell
mysql -uroot -p < .\shopping_mall_init.sql
```

## Start

One-command Windows startup:

```powershell
.\run-dev.cmd
```

Manual backend startup:

```powershell
cd backend
mvn spring-boot:run
```

Manual frontend startup:

```powershell
cd frontend
node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173
```

Open:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8080/api`

## Demo Accounts

- `admin / 123456`: administrator and review operator
- `zhangsan / 123456`: buyer with complete order flow
- `lisi / 123456`: seller with product and shipment workflows
- `wangwu / 123456`: buyer with alerts, wishlist, cart, and coupons
- `chenmo / 123456`: rational-consumption and budget showcase user
- `sunqi / 123456`: upload, notification, and contact-message showcase user

## Project Layout

- `backend/`: Spring Boot application
- `frontend/`: Vue 3 + Vite application
- `scripts/`: local startup, test, tooling, and demo-data scripts
- `uploads/`: committed demo media used by the showcase
- `frontend/public/seed/`: lightweight fallback seed assets
- `frontend/public/external-cache/`: local images used by E2E upload tests

## Checks

Full project check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1
```

This runs backend tests, frontend build/tests, project diff checks, Python
compile checks for dataset tooling, and localized demo-data verification.

Use `-SkipDataVerify` only when MySQL is unavailable and you need a quick
code-only check.

## Demo Data And Media

Useful entry points:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode execute
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-demo-environment.ps1
```

The showcase expects these local resource families to exist:

- `/uploads/products/...`
- `/uploads/avatars/...`
- `/uploads/music/...`
- `/uploads/videos/...`
- `/seed/...`

## AI Assistant

The `/ai-recommend` page is part of the frontend application. It uses the
DeepSeek Chat Completions endpoint through `frontend/src/utils/aiChat.ts`.

No real AI API key is committed. Configure the key locally from the AI
recommendation page when testing the optional assistant.
