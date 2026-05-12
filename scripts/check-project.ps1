param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

. (Join-Path $PSScriptRoot "project-env.ps1")

Set-ProjectUtf8Environment

if (-not $SkipBackend) {
    & (Join-Path $PSScriptRoot "backend-test.ps1")
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not $SkipFrontend) {
    & (Join-Path $PSScriptRoot "frontend-check.ps1")
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

exit 0
