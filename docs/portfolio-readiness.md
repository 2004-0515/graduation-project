# Portfolio Readiness

## Positioning

Shion Fuuen is a full-stack e-commerce showcase built with Vue 3, Element Plus, Pinia, Spring Boot, Spring Security, JPA, MySQL, and Redis.

The project is optimized for local portfolio review:

- two-command startup for the default MySQL-backed application
- local showcase media under `uploads/` and `frontend/public/seed/`
- role-based buyer, seller, and administrator workflows
- focused unit tests plus real-browser E2E coverage for core flows

## Engineering Highlights

- Role model: permissions use `BUYER`, `SELLER`, and `ADMIN` roles from persisted user data and Spring Security authorities, not username checks.
- Admin workflows: product ownership, user management, order review, file review, notifications, price alerts, and rational-consumption management are covered by focused tests.
- Data reliability: the localized dataset rebuild verifies table counts, banned marker absence, showcase accounts, and contiguous rebuilt ids.
- Frontend reliability: important actions prefer server truth after success, distinguish user-cancel from real failure, and display backend Chinese business messages when available.
- Resource portability: business media uses local `/uploads/...`, `/seed/...`, or `data:` paths instead of external placeholder providers.

## Practical Strict Gate

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1
```

The gate includes:

- whitespace check via `git diff --check`
- backend `mvn test`
- frontend production build
- frontend low-concurrency Vitest
- Python dataset script compilation
- localized dataset verification

When MySQL is not available, use this code-only variant:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1 -SkipDataVerify
```

When the verification target is the isolated browser database instead of the default local showcase DB:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1 -SkipBackend -SkipFrontend -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306
```

The portfolio data scripts now auto-repair older local `shopping_mall` schemas before verification.
Run the repair manually only if you want that step independently:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ensure-portfolio-schema.ps1
```

## Manual Showcase Checklist

Before recording or review:

- Start backend with `cd backend; mvn spring-boot:run`.
- Start frontend with `cd frontend; node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173`.
- Log in as `admin`, confirm dashboard and management pages load.
- Log in as `zhangsan`, complete product browsing, cart, checkout, payment, and order review.
- Log in as `lisi`, confirm seller product/order workflows.
- Trigger or inspect notifications, price alerts, uploads, and rational-consumption pages.
- Confirm product images, avatars, music, and videos load from local project resources.

## Known Operating Defaults

- Default backend profile uses MySQL database `shopping_mall` and Redis DB `0`.
- Browser/E2E helper scripts may use isolated `shopping_mall_test` and Redis DB `1`.
- The optional `local` Spring profile is a small H2 fallback only; it is not the portfolio showcase dataset.
- `frontend/.env.development` intentionally leaves `VITE_AI_API_KEY` empty. The AI assistant remains optional.
