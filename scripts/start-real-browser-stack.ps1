param(
    [int]$FrontendPort = 5178,
    [int]$BackendPort = 8085,
    [string]$DatabaseName = 'shopping_mall_test',
    [string]$DatabaseUser = 'root',
    [string]$DatabasePassword = '123456',
    [string]$DatabaseHost = '',
    [string]$DatabasePort = '',
    [Alias("SeedMediumDemoData")]
    [switch]$SeedGraduationData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runner = Join-Path $PSScriptRoot 'run-real-browser-e2e.ps1'
$seedScript = Join-Path $PSScriptRoot 'rebuild-graduation-data.ps1'

if (-not (Test-Path $runner)) {
    throw "未找到脚本: $runner"
}

if ($SeedGraduationData) {
    if (-not (Test-Path $seedScript)) {
        throw "未找到脚本: $seedScript"
    }
    $seedArgs = @{
        Mode = 'execute'
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

    & $seedScript @seedArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$env:DB_NAME = $DatabaseName
$env:DB_USERNAME = $DatabaseUser
$env:DB_PASSWORD = $DatabasePassword
$env:DB_HOST = $DatabaseHost
$env:DB_PORT = $DatabasePort

& $runner -FrontendPort $FrontendPort -BackendPort $BackendPort -SkipPlaywright -KeepRunning
