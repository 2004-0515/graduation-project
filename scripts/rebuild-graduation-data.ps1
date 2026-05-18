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
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
