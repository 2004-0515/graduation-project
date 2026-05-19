# Localized Graduation Dataset

## Purpose

This repository uses a single reset-and-rebuild dataset flow for the local MySQL database `shopping_mall`.

The target snapshot is designed for graduation rehearsal:

- no visible `演示`, `demo`, `test`, `mock`, or `sample` markers in business content
- medium-size but presentation-grade localized data
- contiguous ids for rebuilt core business tables
- enough linked records to cover frontend and backend showcase flows

## Entry Script

- [scripts/rebuild-graduation-data.ps1](/d:/graduation%20project/scripts/rebuild-graduation-data.ps1)
- [scripts/rebuild_graduation_dataset.py](/d:/graduation%20project/scripts/rebuild_graduation_dataset.py)
- [scripts/fetch-graduation-assets.ps1](/d:/graduation%20project/scripts/fetch-graduation-assets.ps1)
- [scripts/fetch_young_catalog_assets.py](/d:/graduation%20project/scripts/fetch_young_catalog_assets.py)

Default commands:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode execute
```

`verify` is read-only. It reports whether the current database still matches the target snapshot, but it does not normalize roles or mutate data.

`execute` is the repair path. It creates the target database when missing, applies the required schema compatibility fix, then rebuilds the localized snapshot from scratch.

Seed the isolated browser/E2E database:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode execute -DatabaseName shopping_mall_test
```

If MySQL is not exposed as the default local instance, pass the connection explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode execute -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306
```

Refresh the local product-image manifest and refill missing catalog assets:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-graduation-assets.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-graduation-assets.ps1 -OnlySlugs anime-cup-sleeve desk-usb-hub
```

## Snapshot Shape

The rebuild creates the following target snapshot:

- `tb_user`: 30
- `tb_product`: 128
- `tb_order`: 540
- `tb_review`: 288
- `notifications`: 192
- `music`: 24
- `tb_price_history`: 512
- `tb_price_alert`: 24
- `addresses`: 42
- `tb_cart`: 30
- `tb_wishlist`: 28
- `tb_user_coupon`: 36
- `tb_contact_message`: 10
- `tb_upload_file`: 24
- `tb_consumption_budget`: 10
- `tb_consumption_achievement`: 10
- `tb_search_history`: 12
- `tb_search_stats`: 18

It also rebuilds categories and coupons into a clean localized baseline.

## Showcase Accounts

All showcase accounts use password `123456`.

- `admin`: administrator and review operator
- `zhangsan`: normal buyer with complete order flow
- `lisi`: seller with products and review notifications
- `wangwu`: active buyer with alerts, wishlist, cart, and coupons
- `chenmo`: budget and achievement showcase user
- `sunqi`: upload, notification, and contact-message related showcase user

## Local Assets

The dataset only uses local project resources:

- `uploads/products/...`
- `uploads/avatars/...`
- `uploads/music/...`
- `uploads/videos/...`
- `frontend/public/seed/...`
- `scripts/young-catalog-assets.json`

No external placeholder media is required for the rebuilt snapshot.

## Verification Rules

`verify` returns a JSON report with:

- exact table counts for the target snapshot
- banned-marker hit count
- showcase account presence
- id continuity for core tables

The dataset is considered ready only when:

- every target count matches exactly
- banned-marker hits are `0`
- showcase accounts are present
- rebuilt core tables stay contiguous

The browser/E2E runner uses this readiness check before starting the stack. If `ready` is `false`, it rebuilds `shopping_mall_test` through `execute` and then continues with Playwright.

The GitHub Actions Playwright workflow follows the same path: it imports schema first, then calls `rebuild-graduation-data.ps1 -Mode execute` instead of maintaining a separate CI-only `data.sql` import flow.
