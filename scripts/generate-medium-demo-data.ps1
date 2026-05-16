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

$wrapper = Join-Path $PSScriptRoot "rebuild-graduation-data.ps1"

if (-not (Test-Path $wrapper)) {
    throw "未找到脚本: $wrapper"
}

Write-Host "generate-medium-demo-data.ps1 is deprecated. Forwarding to rebuild-graduation-data.ps1"
$forwardArgs = @{
    Mode = $Mode
    DatabaseName = $DatabaseName
    DatabaseUser = $DatabaseUser
    DatabasePassword = $DatabasePassword
}
if ($DatabaseHost) {
    $forwardArgs.DatabaseHost = $DatabaseHost
}
if ($DatabasePort) {
    $forwardArgs.DatabasePort = $DatabasePort
}

& $wrapper @forwardArgs
