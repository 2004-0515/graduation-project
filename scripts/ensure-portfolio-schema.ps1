param(
    [string]$DatabaseName = "shopping_mall",
    [string]$DatabaseUser = "root",
    [string]$DatabasePassword = "123456",
    [string]$DatabaseHost = "",
    [string]$DatabasePort = ""
)

$ErrorActionPreference = "Stop"

$mysqlCandidates = @(
    $env:MYSQL_EXE,
    "mysql",
    "C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe"
)

$mysql = $null
foreach ($candidate in $mysqlCandidates) {
    if (-not $candidate) {
        continue
    }

    if (Test-Path $candidate) {
        $mysql = (Resolve-Path $candidate).Path
        break
    }

    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($command) {
        $mysql = $command.Source
        break
    }
}

if (-not $mysql) {
    throw "mysql client not found. Install MySQL CLI or set MYSQL_EXE."
}

$sqlFile = Join-Path $PSScriptRoot "ensure-portfolio-schema.sql"
if (-not (Test-Path $sqlFile)) {
    throw "Schema repair SQL file not found: $sqlFile"
}

$sql = Get-Content $sqlFile -Raw -Encoding UTF8

Write-Host "Ensuring portfolio schema for database: $DatabaseName"
$previousMysqlPwd = $env:MYSQL_PWD
$mysqlArgs = @("--default-character-set=utf8mb4", "-u$DatabaseUser")
if ($DatabaseHost) {
    $mysqlArgs += "-h$DatabaseHost"
}
if ($DatabasePort) {
    $mysqlArgs += "-P$DatabasePort"
}
$mysqlArgs += $DatabaseName
try {
    $env:MYSQL_PWD = $DatabasePassword
    $sql | & $mysql @mysqlArgs
    exit $LASTEXITCODE
}
finally {
    if ($null -eq $previousMysqlPwd) {
        Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    }
    else {
        $env:MYSQL_PWD = $previousMysqlPwd
    }
}
