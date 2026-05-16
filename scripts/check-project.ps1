param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipDataVerify,
    [string]$DatabaseName = "shopping_mall",
    [string]$DatabaseUser = "root",
    [string]$DatabasePassword = "123456",
    [string]$DatabaseHost = "",
    [string]$DatabasePort = ""
)

. (Join-Path $PSScriptRoot "project-env.ps1")

Set-ProjectUtf8Environment

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

    throw "python is required to run check-project.ps1. Install Python or set PYTHON_EXE."
}

$python = Resolve-PythonCommand

git -c core.safecrlf=false diff --check
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $python -m py_compile (Join-Path $PSScriptRoot "rebuild_graduation_dataset.py")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

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

if (-not $SkipDataVerify) {
    $verifyArgs = @{
        Mode = "verify"
        DatabaseName = $DatabaseName
        DatabaseUser = $DatabaseUser
        DatabasePassword = $DatabasePassword
    }
    if ($DatabaseHost) {
        $verifyArgs.DatabaseHost = $DatabaseHost
    }
    if ($DatabasePort) {
        $verifyArgs.DatabasePort = $DatabasePort
    }

    & (Join-Path $PSScriptRoot "rebuild-graduation-data.ps1") @verifyArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

exit 0
