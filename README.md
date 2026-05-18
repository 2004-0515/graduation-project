# Shion Fuuen Graduation Project

Vue 3 + Spring Boot full-stack e-commerce project for portfolio and graduation showcase use.

The default local setup is designed for a two-command demo: start the backend, start the frontend, then open the Vite URL. Business data and media assets are kept local to the repository so the main showcase does not depend on external placeholder image, audio, or font providers.

## Two-Line Showcase Startup

Prerequisites:

- JDK 17
- Node.js `>=20.19.0` or `>=22.12.0`
- MySQL 8 with database `shopping_mall`
- Redis 7
- Frontend dependencies installed once with `npm install`

Start backend:

```powershell
cd backend
mvn spring-boot:run
```

Start frontend:

```powershell
cd frontend
node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173
```

Open:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8080/api`

Showcase accounts:

- `admin / 123456`: administrator and review operator
- `zhangsan / 123456`: buyer with complete order flow
- `lisi / 123456`: seller with product and shipment workflows
- `wangwu / 123456`: buyer with alerts, wishlist, cart, and coupons
- `chenmo / 123456`: rational-consumption and budget showcase user
- `sunqi / 123456`: upload, notification, and contact-message showcase user

## Repo Layout

- [frontend](/d:/graduation%20project/frontend): Vue 3 + Vite application
- [backend](/d:/graduation%20project/backend): Spring Boot application
- [scripts](/d:/graduation%20project/scripts): local automation, test, seed, and cleanup scripts
- [docs](/d:/graduation%20project/docs): focused project notes

Portfolio review notes:

- [portfolio-readiness.md](/d:/graduation%20project/docs/portfolio-readiness.md): engineering highlights, quality gate, and manual showcase checklist
- [localized-graduation-data.md](/d:/graduation%20project/docs/localized-graduation-data.md): localized dataset contract and verification rules

## Default Local Environment

- MySQL database: `shopping_mall`
- Backend default port: `8080`
- Frontend showcase port: `5173`
- Backend demo profile port: `8085`
- Backend default local credentials come from [application.properties](/d:/graduation%20project/backend/src/main/resources/application.properties)
- Upload/media root: [uploads](/d:/graduation%20project/uploads)
- Frontend seed assets: [frontend/public/seed](/d:/graduation%20project/frontend/public/seed)

Related backend profiles:

- [application.properties](/d:/graduation%20project/backend/src/main/resources/application.properties): default MySQL + Redis local config
- [application-demo.properties](/d:/graduation%20project/backend/src/main/resources/application-demo.properties): demo/browser stack profile
- [application-local.properties](/d:/graduation%20project/backend/src/main/resources/application-local.properties): H2 local fallback profile

## Development Commands

Frontend:

```powershell
cd frontend
npm install
node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173
```

Backend:

```powershell
cd backend
mvn spring-boot:run
```

Packaged jar startup on Windows:

```powershell
cd backend
mvn -DskipTests package
.\run-local.cmd
```

## Node Tooling Entry Points

Project scripts support two explicit Node tooling entry modes:

1. Same-session shim bootstrap for a shell you plan to keep using:

```powershell
. .\scripts\project-env.ps1
Initialize-ProjectNodeTooling | Out-Null

Set-Location .\frontend
npx vitest --version
```

2. Stateless direct invocation for restricted or disposable PowerShell sessions:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\invoke-node-tool.ps1 -Tool npx vite --version
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\invoke-node-tool.ps1 -Tool npx playwright --version
```

`invoke-node-tool.ps1` defaults `FrontendRoot` to the repo's `frontend` directory. Only pass `-FrontendRoot` when you need a nonstandard location.

`Node tooling preflight` may report a status like `blocked | ... | access denied by current session`. That means the tool path was found, but the current shell cannot execute it. In that state:

- repo-local fallback still covers `playwright`, `vite`, and `vitest`
- `npm install` / `npm ci` still require a host shell where real `npm` is executable, or an explicit runnable `NPM_CMD`

Practical strict project checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1
```

This runs:

- `git diff --check`
- backend `mvn test`
- frontend build
- frontend low-concurrency Vitest
- dataset Python compile check
- localized dataset verification

Use `-SkipDataVerify` only when MySQL is unavailable and you are doing a quick code-only check.

To verify the isolated browser database instead of the default local showcase DB:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1 -SkipBackend -SkipFrontend -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306
```

`check-project.ps1` and `rebuild-graduation-data.ps1` now auto-repair older local `shopping_mall` schemas before verification.
Run the repair script manually only when you want that step standalone:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ensure-portfolio-schema.ps1
```

## Localized Dataset

The localized graduation dataset flow is documented in [localized-graduation-data.md](/d:/graduation%20project/docs/localized-graduation-data.md).

Useful entrypoints:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode execute
```

The default showcase expects these local resource families to exist:

- `/uploads/products/...`
- `/uploads/avatars/...`
- `/uploads/music/...`
- `/uploads/videos/...`
- `/seed/...`

Runtime business media should not depend on external placeholder providers.

## One-Step Demo Environment

Verify the localized snapshot, rebuild only when needed, then start the real-browser local stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-demo-environment.ps1
```

This wrapper targets the isolated browser database `shopping_mall_test` by default.

Force rebuild before startup:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-demo-environment.ps1 -ForceReseed
```

The browser stack startup script is also available directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-real-browser-stack.ps1 -SeedGraduationData
```

If the isolated test DB is not exposed as the default local MySQL instance, pass the same DB arguments explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-real-browser-stack.ps1 -SeedGraduationData -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306
```

## Notes

- The localized dataset flow is validated in PowerShell 7 for CI and remains compatible with local Windows PowerShell. It auto-discovers `mysql`, `python`, or `python3`; set `MYSQL_EXE` or `PYTHON_EXE` only when auto-discovery is insufficient.
- `execute` is a deterministic rebuild of business data, not an additive fill.
- The script rebuilds the requested target database from a clean business snapshot while keeping local uploaded assets in place.
- `frontend/.env.development` intentionally does not contain a real AI API key. Configure one locally only when testing the optional AI assistant.
- `scripts/ensure-portfolio-schema.ps1` is an idempotent local repair for older `shopping_mall` schemas missing the `tb_user.role` field.
