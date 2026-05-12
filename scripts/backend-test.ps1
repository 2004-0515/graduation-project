param(
    [string[]]$Goals = @("test")
)

. (Join-Path $PSScriptRoot "project-env.ps1")

Invoke-ProjectMaven -Goals $Goals | Out-Host
exit $LASTEXITCODE
