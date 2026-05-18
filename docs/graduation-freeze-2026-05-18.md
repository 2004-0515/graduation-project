# Graduation Freeze 2026-05-18

## Baseline

- Tag: `graduation-freeze-2026-05-18`
- Freeze commit: `5e8b70e`
- Repository branch at freeze time: `main`

This tag is the verified graduation demo baseline.

## Scope

The freeze contains these release commits:

- `9725533` Expand localized graduation catalog assets
- `de13b36` feat(backend): formalize role model and admin user controls
- `fa70ad8` feat(backend): add showcase media and order infrastructure
- `ffb2cb3` feat(frontend): align roles and showcase admin flows
- `2df8b54` build(tooling): harden local node and browser workflows
- `c58a936` chore(tooling): add packaged backend launcher
- `5e8b70e` chore(assets): prune orphaned tracked media

## Startup

Default local demo:

```powershell
cd backend
mvn spring-boot:run
```

```powershell
cd frontend
node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173
```

Packaged backend alternative:

```powershell
cd backend
.\run-local.cmd
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8080/api`

## Showcase Accounts

All showcase accounts use password `123456`.

- `admin`: administrator and review operator
- `zhangsan`: buyer with complete order flow
- `lisi`: seller with product and shipment workflows
- `wangwu`: buyer with alerts, wishlist, cart, and coupons
- `chenmo`: rational-consumption and budget showcase user
- `sunqi`: upload, notification, and contact-message showcase user

## Verification

Remote CI for freeze commit `5e8b70e`:

- Backend Tests: <https://github.com/2004-0515/graduation-project/actions/runs/26021717276>
- Frontend Tests: <https://github.com/2004-0515/graduation-project/actions/runs/26021717333>

Local validation completed before tagging:

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-project.ps1`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-real-browser-e2e.ps1 -Suite smoke`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306`

## Recovery Notes

- The freeze tag is the safest rollback point for code.
- The localized MySQL datasets are `shopping_mall` and `shopping_mall_test`.
- Business media required for the demo lives under `uploads/`.
