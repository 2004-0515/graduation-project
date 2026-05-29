param(
    [switch]$BuildOnly
)

. (Join-Path $PSScriptRoot "project-env.ps1")

$nodeTooling = Resolve-ProjectNodeTooling
$null = Initialize-ProjectNodeTooling -Tooling $nodeTooling
Write-ProjectNodeToolingDiagnostics -Tooling $nodeTooling

$frontendRoot = Get-FrontendRoot

$typeCheckInvocation = Resolve-ProjectNodeInvocation -CommandName "node" -Arguments @(
    (Join-Path $frontendRoot "node_modules\vue-tsc\bin\vue-tsc.js"),
    "--noEmit",
    "-p",
    "tsconfig.json"
) -Tooling $nodeTooling
Write-Host "Frontend app type-check launcher: $(Format-NodeInvocation -Invocation $typeCheckInvocation)"

Invoke-ProjectNodeInvocation -Invocation $typeCheckInvocation -WorkingDirectory $frontendRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$testTypeCheckInvocation = Resolve-ProjectNodeInvocation -CommandName "node" -Arguments @(
    (Join-Path $frontendRoot "node_modules\vue-tsc\bin\vue-tsc.js"),
    "--noEmit",
    "-p",
    "tsconfig.test.json"
) -Tooling $nodeTooling
Write-Host "Frontend test type-check launcher: $(Format-NodeInvocation -Invocation $testTypeCheckInvocation)"

Invoke-ProjectNodeInvocation -Invocation $testTypeCheckInvocation -WorkingDirectory $frontendRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$buildInvocation = Resolve-ProjectNodeInvocation -CommandName "npx" -Arguments @("vite", "build") -Tooling $nodeTooling
Write-Host "Frontend build launcher: $(Format-NodeInvocation -Invocation $buildInvocation)"

Invoke-ProjectNodeInvocation -Invocation $buildInvocation -WorkingDirectory $frontendRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not $BuildOnly) {
    $testInvocation = Resolve-ProjectNodeInvocation -CommandName "npx" -Arguments @("vitest", "run", "src/test", "--maxWorkers=1", "--minWorkers=1", "--cache=false") -Tooling $nodeTooling
    Write-Host "Frontend test launcher: $(Format-NodeInvocation -Invocation $testInvocation)"

    Invoke-ProjectNodeInvocation -Invocation $testInvocation -WorkingDirectory $frontendRoot
    exit $LASTEXITCODE
}

exit 0
