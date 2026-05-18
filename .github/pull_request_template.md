## Summary

- What changed:
- Why this change is needed:

## Validation

- [ ] `powershell -ExecutionPolicy Bypass -File .\scripts\check-project.ps1`
- [ ] `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-real-browser-e2e.ps1 -Suite smoke`
- [ ] Not run, with reason explained below

## Data And Media Impact

- [ ] No demo dataset or media impact
- [ ] Demo dataset changed and verified with `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify`
- [ ] Browser/E2E dataset changed and verified with `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-graduation-data.ps1 -Mode verify -DatabaseName shopping_mall_test -DatabaseHost 127.0.0.1 -DatabasePort 3306`

## Notes

- Risk or rollback notes:
- Follow-up work:
