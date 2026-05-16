param(
    [int]$FrontendPort = 5178,
    [int]$BackendPort = 8085,
    [string]$DatabaseName = "shopping_mall_test",
    [string]$DatabaseUser = "root",
    [string]$DatabasePassword = "123456",
    [string]$DatabaseHost = "",
    [string]$DatabasePort = "",
    [switch]$ForceReseed,
    [switch]$VerifyOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$seedScript = Join-Path $PSScriptRoot "rebuild-graduation-data.ps1"
$startStackScript = Join-Path $PSScriptRoot "start-real-browser-stack.ps1"

if (-not (Test-Path $seedScript)) {
    throw "未找到脚本: $seedScript"
}

if (-not (Test-Path $startStackScript)) {
    throw "未找到脚本: $startStackScript"
}

function ConvertTo-GraduationDatasetStatus {
    param([string[]]$Lines)

    $startIndex = -1
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i].Trim().StartsWith("{")) {
            $startIndex = $i
            break
        }
    }

    if ($startIndex -lt 0) {
        return $null
    }

    $jsonText = ($Lines[$startIndex..($Lines.Count - 1)] -join [Environment]::NewLine)
    return $jsonText | ConvertFrom-Json
}

function Get-GraduationDatasetStatus {
    param([string]$DatabaseName = "shopping_mall")

    $seedArgs = @{
        Mode = "verify"
        DatabaseName = $DatabaseName
        DatabaseUser = $DatabaseUser
        DatabasePassword = $DatabasePassword
    }
    if ($DatabaseHost) {
        $seedArgs.DatabaseHost = $DatabaseHost
    }
    if ($DatabasePort) {
        $seedArgs.DatabasePort = $DatabasePort
    }

    $output = & $seedScript @seedArgs 2>&1
    $lines = @($output | ForEach-Object { "$_" })
    $verifyExitCode = $LASTEXITCODE
    $status = ConvertTo-GraduationDatasetStatus -Lines $lines
    if ($status) {
        return $status
    }

    return [pscustomobject]@{
        ready = $false
        database = $DatabaseName
        verifyExitCode = $verifyExitCode
        verifyError = ($lines -join [Environment]::NewLine).Trim()
    }
}

function Test-GraduationDatasetReady {
    param([pscustomobject]$Status)

    return [bool]$Status.ready
}

Write-Host "Checking localized graduation dataset in $DatabaseName"
$status = Get-GraduationDatasetStatus -DatabaseName $DatabaseName
$isReady = Test-GraduationDatasetReady -Status $status

if ($VerifyOnly) {
    $status | ConvertTo-Json -Depth 5
    exit 0
}

if ($ForceReseed -or -not $isReady) {
    if ($ForceReseed) {
        Write-Host "Force rebuild requested. Rebuilding localized graduation dataset."
    } elseif ($status.PSObject.Properties.Name -contains 'verifyError' -and $status.verifyError) {
        Write-Host "Localized dataset verification failed. Rebuilding local database content."
    } else {
        Write-Host "Localized dataset is incomplete. Rebuilding local database content."
    }

    if ($DatabaseHost -or $DatabasePort) {
        $executeArgs = @{
            Mode = "execute"
            DatabaseName = $DatabaseName
            DatabaseUser = $DatabaseUser
            DatabasePassword = $DatabasePassword
        }
        if ($DatabaseHost) {
            $executeArgs.DatabaseHost = $DatabaseHost
        }
        if ($DatabasePort) {
            $executeArgs.DatabasePort = $DatabasePort
        }
        & $seedScript @executeArgs
    } else {
        & $seedScript -Mode execute -DatabaseName $DatabaseName
    }
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} else {
    Write-Host "Localized graduation dataset already matches the target snapshot."
}

Write-Host "Starting real-browser stack"
$env:DB_NAME = $DatabaseName
$env:DB_USERNAME = $DatabaseUser
$env:DB_PASSWORD = $DatabasePassword
$env:DB_HOST = $DatabaseHost
$env:DB_PORT = $DatabasePort
& $startStackScript -FrontendPort $FrontendPort -BackendPort $BackendPort
exit $LASTEXITCODE
