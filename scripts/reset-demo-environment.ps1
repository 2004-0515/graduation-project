[CmdletBinding()]
param(
    [string]$Database = "shopping_mall_demo",
    [string]$Username = "root",
    [string]$Password = "123456",
    [switch]$SkipEnhancement
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$resourceRoot = Join-Path $projectRoot "backend\src\main\resources"
$schemaFile = Join-Path $resourceRoot "schema.sql"
$dataFile = Join-Path $resourceRoot "data.sql"
$enhancementFile = Join-Path $scriptDir "demo-data-enhancement.sql"

foreach ($requiredFile in @($schemaFile, $dataFile)) {
    if (-not (Test-Path $requiredFile)) {
        throw "Required file not found: $requiredFile"
    }
}

if (-not $SkipEnhancement -and -not (Test-Path $enhancementFile)) {
    throw "Enhancement SQL not found: $enhancementFile"
}

$mysql = (Get-Command mysql.exe -ErrorAction Stop).Source

function Invoke-MySqlText {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Sql,
        [string]$TargetDatabase = ""
    )

    $tempFile = [System.IO.Path]::GetTempFileName()
    $tempSqlFile = [System.IO.Path]::ChangeExtension($tempFile, ".sql")
    Move-Item -LiteralPath $tempFile -Destination $tempSqlFile -Force

    try {
        $utf8Bom = New-Object System.Text.UTF8Encoding($true)
        [System.IO.File]::WriteAllText($tempSqlFile, $Sql, $utf8Bom)

        $command = "`"$mysql`" --default-character-set=utf8mb4 -u$Username -p$Password"
        if ($TargetDatabase) {
            $command += " $TargetDatabase"
        }
        $command += " < `"$tempSqlFile`""

        & cmd.exe /c $command
        if ($LASTEXITCODE -ne 0) {
            throw "mysql 执行失败，退出码: $LASTEXITCODE"
        }
    } finally {
        Remove-Item -LiteralPath $tempSqlFile -ErrorAction SilentlyContinue
    }
}

function Convert-SqlForDatabase {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $content = Get-Content -Raw -Encoding utf8 $Path
    $content = $content -replace 'CREATE DATABASE IF NOT EXISTS shopping_mall', "CREATE DATABASE IF NOT EXISTS $Database"
    $content = $content -replace 'USE shopping_mall;', "USE $Database;"
    return $content
}

Write-Host "Resetting demo database: $Database"
Invoke-MySqlText -Sql @"
DROP DATABASE IF EXISTS $Database;
CREATE DATABASE $Database DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
"@

Write-Host "Importing schema.sql ..."
Invoke-MySqlText -Sql (Convert-SqlForDatabase -Path $schemaFile)

Write-Host "Importing data.sql ..."
Invoke-MySqlText -Sql (Convert-SqlForDatabase -Path $dataFile)

if (-not $SkipEnhancement) {
    Write-Host "Applying demo enhancement ..."
    Invoke-MySqlText -Sql (Get-Content -Raw -Encoding utf8 $enhancementFile) -TargetDatabase $Database
}

Write-Host "Demo database is ready: $Database"
