param(
    [ValidateSet("execute", "verify")]
    [string]$Mode = "verify",

    [string]$DatabaseName = "shopping_mall",

    [string]$DatabaseUser = "root",

    [string]$DatabasePassword = "123456",

    [string]$DatabaseHost = "",

    [string]$DatabasePort = ""
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "project-env.ps1")

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot "rebuild_graduation_dataset.py"
$qualityEnhancePath = Join-Path $PSScriptRoot "enhance_high_quality_demo_data.py"
$rationalSyncPath = Join-Path $PSScriptRoot "sync_rational_consumption_data.py"
$schemaFixPath = Join-Path $PSScriptRoot "ensure-portfolio-schema.ps1"

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

$args = @(
    $scriptPath,
    "--mode", $Mode,
    "--db-name", $DatabaseName,
    "--db-user", $DatabaseUser,
    "--db-password", $DatabasePassword
)

if ($DatabaseHost) {
    $args += @("--db-host", $DatabaseHost)
}

if ($DatabasePort) {
    $args += @("--db-port", $DatabasePort)
}

Write-Host "Running localized graduation dataset script with mode: $Mode"
Write-Host "Target database: $DatabaseName"

Ensure-UploadDirectoriesWritable

Push-Location $projectRoot
try {
    if ($Mode -eq 'execute' -and (Test-Path $schemaFixPath)) {
        $schemaFixArgs = @{
            DatabaseName = $DatabaseName
            DatabaseUser = $DatabaseUser
            DatabasePassword = $DatabasePassword
        }
        if ($DatabaseHost) {
            $schemaFixArgs.DatabaseHost = $DatabaseHost
        }
        if ($DatabasePort) {
            $schemaFixArgs.DatabasePort = $DatabasePort
        }

        & $schemaFixPath @schemaFixArgs
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    & $python @args
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    if (Test-Path $qualityEnhancePath) {
        $qualityMode = if ($Mode -eq "execute") { "execute" } else { "audit" }
        $qualityArgs = @(
            $qualityEnhancePath,
            "--mode", $qualityMode,
            "--db-name", $DatabaseName,
            "--db-user", $DatabaseUser,
            "--db-password", $DatabasePassword
        )
        if ($DatabaseHost) {
            $qualityArgs += @("--db-host", $DatabaseHost)
        }
        if ($DatabasePort) {
            $qualityArgs += @("--db-port", $DatabasePort)
        }

        Write-Host "Running high-quality demo data enhancer with mode: $qualityMode"
        & $python @qualityArgs
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }

    if (Test-Path $rationalSyncPath) {
        $rationalMode = if ($Mode -eq "execute") { "execute" } else { "audit" }
        $rationalArgs = @(
            $rationalSyncPath,
            "--mode", $rationalMode,
            "--db-name", $DatabaseName,
            "--db-user", $DatabaseUser,
            "--db-password", $DatabasePassword
        )
        if ($DatabaseHost) {
            $rationalArgs += @("--db-host", $DatabaseHost)
        }
        if ($DatabasePort) {
            $rationalArgs += @("--db-port", $DatabasePort)
        }

        Write-Host "Running rational consumption data sync with mode: $rationalMode"
        & $python @rationalArgs
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }

    exit 0
}
finally {
    Pop-Location
}
