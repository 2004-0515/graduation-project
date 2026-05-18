param(
    [switch]$BuildOnly
)

. (Join-Path $PSScriptRoot "project-env.ps1")

$nodeTooling = Resolve-ProjectNodeTooling
$null = Initialize-ProjectNodeTooling -Tooling $nodeTooling
Write-ProjectNodeToolingDiagnostics -Tooling $nodeTooling

$frontendRoot = Get-FrontendRoot

$buildInvocation = Resolve-ProjectNodeInvocation -CommandName "npx" -Arguments @("vite", "build") -Tooling $nodeTooling
Write-Host "Frontend build launcher: $(Format-NodeInvocation -Invocation $buildInvocation)"

Invoke-ProjectNodeInvocation -Invocation $buildInvocation -WorkingDirectory $frontendRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not $BuildOnly) {
    $testInvocation = Resolve-ProjectNodeInvocation -CommandName "npx" -Arguments @("vitest", "run", "src/test", "--maxWorkers=1", "--minWorkers=1") -Tooling $nodeTooling
    Write-Host "Frontend test launcher: $(Format-NodeInvocation -Invocation $testInvocation)"

    Invoke-ProjectNodeInvocation -Invocation $testInvocation -WorkingDirectory $frontendRoot
    exit $LASTEXITCODE
}

exit 0
