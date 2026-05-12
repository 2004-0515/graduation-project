param(
    [switch]$BuildOnly
)

. (Join-Path $PSScriptRoot "project-env.ps1")

$frontendRoot = Get-FrontendRoot
Invoke-ProjectCommand -Command "npm" -Arguments @("run", "build") -WorkingDirectory $frontendRoot | Out-Host
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not $BuildOnly) {
    Invoke-ProjectCommand -Command "npm" -Arguments @("run", "test:run") -WorkingDirectory $frontendRoot | Out-Host
    exit $LASTEXITCODE
}

exit 0
