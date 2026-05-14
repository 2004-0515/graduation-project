-- Structured demo-data enhancements only.
-- This file intentionally avoids downloading media or mutating filesystem state.
-- Use `python scripts/import_openverse_assets.py --mode execute` for audited media imports.

USE shopping_mall;

INSERT INTO demo_import_batch (batch_id, batch_type, status, summary, created_time, updated_time)
VALUES (
  'demo-data-enhancements-bootstrap',
  'sql-enhancement',
  'READY',
  'Structured demo-data enhancement entrypoint created. Media ingestion is handled by scripts/import_openverse_assets.py.',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  summary = VALUES(summary),
  updated_time = NOW();
