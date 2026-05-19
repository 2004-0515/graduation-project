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
$schemaBootstrapPath = Join-Path $projectRoot "backend\src\main\resources\schema.sql"

function Resolve-MySqlCommand {
    $candidates = @(
        $env:MYSQL_EXE,
        "mysql",
        "C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe"
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

    throw "mysql is required to prepare database $DatabaseName. Install MySQL CLI or set MYSQL_EXE."
}

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

function Ensure-TargetDatabaseExists {
    param([string]$Name)

    $mysql = Resolve-MySqlCommand
    $previousMysqlPwd = $env:MYSQL_PWD
    $mysqlArgs = @("--default-character-set=utf8mb4", "-u$DatabaseUser")
    if ($DatabaseHost) {
        $mysqlArgs += "-h$DatabaseHost"
    }
    if ($DatabasePort) {
        $mysqlArgs += "-P$DatabasePort"
    }
    $mysqlArgs += @(
        "-e",
        "CREATE DATABASE IF NOT EXISTS ``$Name`` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"
    )

    try {
        $env:MYSQL_PWD = $DatabasePassword
        & $mysql @mysqlArgs
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }
        else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

function Get-MySqlConnectionArgs {
    $mysqlArgs = @("--default-character-set=utf8mb4", "-u$DatabaseUser")
    if ($DatabaseHost) {
        $mysqlArgs += "-h$DatabaseHost"
    }
    if ($DatabasePort) {
        $mysqlArgs += "-P$DatabasePort"
    }
    return $mysqlArgs
}

function Invoke-MySqlInlineSql {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Sql
    )

    $mysql = Resolve-MySqlCommand
    $previousMysqlPwd = $env:MYSQL_PWD
    $mysqlArgs = Get-MySqlConnectionArgs
    $mysqlArgs += @("-N", "-s", "-e", $Sql)

    try {
        $env:MYSQL_PWD = $DatabasePassword
        return & $mysql @mysqlArgs
    }
    finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }
        else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

function Test-TargetSchemaInitialized {
    param([string]$Name)

    $escapedName = $Name.Replace("'", "''")
    $result = Invoke-MySqlInlineSql -Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$escapedName' AND table_name = 'tb_user';"
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    $countText = (@($result) | Select-Object -Last 1).ToString().Trim()
    return $countText -eq '1'
}

function Initialize-TargetSchema {
    param([string]$Name)

    if (-not (Test-Path $schemaBootstrapPath)) {
        throw "Schema bootstrap SQL file not found: $schemaBootstrapPath"
    }

    $quotedName = '`' + $Name.Replace('`', '``') + '`'
    $schemaSql = Get-Content $schemaBootstrapPath -Raw -Encoding UTF8
    $schemaSql = $schemaSql.Replace("CREATE DATABASE IF NOT EXISTS shopping_mall", "CREATE DATABASE IF NOT EXISTS $quotedName")
    $schemaSql = $schemaSql.Replace("USE shopping_mall;", "USE $quotedName;")

    $mysql = Resolve-MySqlCommand
    $previousMysqlPwd = $env:MYSQL_PWD
    $mysqlArgs = Get-MySqlConnectionArgs

    Write-Host "Initializing schema in database: $Name"
    try {
        $env:MYSQL_PWD = $DatabasePassword
        $schemaSql | & $mysql @mysqlArgs
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }
        else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
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

if ($Mode -eq 'execute') {
    Ensure-UploadDirectoriesWritable
    Write-Host "Ensuring database exists: $DatabaseName"
    Ensure-TargetDatabaseExists -Name $DatabaseName
    if (-not (Test-TargetSchemaInitialized -Name $DatabaseName)) {
        Initialize-TargetSchema -Name $DatabaseName
    }
}

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
