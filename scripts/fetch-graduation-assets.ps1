param(
    [string[]]$OnlySlugs = @(),
    [string[]]$RefreshProvider = @()
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot "fetch_young_catalog_assets.py"

function Resolve-PythonCommand {
    $candidates = @(
        $env:PYTHON_EXE,
        "python",
        "python3"
    )

    foreach ($candidate in $candidates) {
        if (-not $candidate) {
            continue
        }

        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }

        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    throw "python is required to run $scriptPath. Install Python or set PYTHON_EXE."
}

$python = Resolve-PythonCommand
$args = @($scriptPath)

if ($OnlySlugs.Count -gt 0) {
    $args += "--only-slugs"
    $args += $OnlySlugs
}

foreach ($provider in $RefreshProvider) {
    if ($provider) {
        $args += @("--refresh-provider", $provider)
    }
}

Write-Host "Running localized catalog asset fetch script"

Push-Location $projectRoot
try {
    & $python @args
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
