[CmdletBinding()]
param(
    [string]$Database = "shopping_mall_demo",
    [string]$Username = "root",
    [string]$Password = "123456",
    [switch]$AllowPrimaryDatabase
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$sqlFile = Join-Path $scriptDir "demo-data-enhancement.sql"

if (-not (Test-Path $sqlFile)) {
    throw "Enhancement SQL not found: $sqlFile"
}

if ($Database -eq 'shopping_mall' -and -not $AllowPrimaryDatabase) {
    throw "默认禁止直接修改主库 shopping_mall。请改用独立演示库，或明确传入 -AllowPrimaryDatabase。"
}

$mysql = (Get-Command mysql.exe -ErrorAction Stop).Source
$mysqldump = (Get-Command mysqldump.exe -ErrorAction Stop).Source

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $scriptDir "backups\demo-enhancement-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$productIds = "15,24,25,40,44,45,46,51"
$userIds = "10,11,12,13,14,15,16,17,18"
$demoOrderWhere = "order_no LIKE 'DEMO-2026-0513-%'"
$demoOrderIdSubquery = "SELECT id FROM tb_order WHERE order_no LIKE 'DEMO-2026-0513-%'"

Write-Host "Backup directory: $backupDir"

$commonDumpArgs = @(
    "--default-character-set=utf8mb4",
    "--skip-triggers",
    "--no-create-info",
    "--complete-insert",
    "--single-transaction",
    "-u$Username",
    "-p$Password",
    $Database
)

& $mysqldump @commonDumpArgs "--where=id IN ($productIds)" "tb_product" | Out-File -FilePath (Join-Path $backupDir "tb_product.sql") -Encoding utf8
& $mysqldump @commonDumpArgs "--where=id IN ($userIds)" "tb_user" | Out-File -FilePath (Join-Path $backupDir "tb_user.sql") -Encoding utf8
& $mysqldump @commonDumpArgs "--where=$demoOrderWhere" "tb_order" | Out-File -FilePath (Join-Path $backupDir "tb_order.sql") -Encoding utf8
& $mysqldump @commonDumpArgs "--where=order_id IN ($demoOrderIdSubquery)" "tb_order_item" | Out-File -FilePath (Join-Path $backupDir "tb_order_item.sql") -Encoding utf8
& $mysqldump @commonDumpArgs "--where=order_id IN ($demoOrderIdSubquery)" "tb_review" | Out-File -FilePath (Join-Path $backupDir "tb_review.sql") -Encoding utf8

$restoreNote = @"
Backup created before demo enhancement.

Restore with commands similar to:
  mysql -u $Username -p $Database < path\to\tb_product.sql
  mysql -u $Username -p $Database < path\to\tb_user.sql
  mysql -u $Username -p $Database < path\to\tb_order.sql
  mysql -u $Username -p $Database < path\to\tb_order_item.sql
  mysql -u $Username -p $Database < path\to\tb_review.sql

Because this enhancement updates existing products and users inside the target demo database, keep this backup folder if you want a rollback point.
"@

$restoreNote | Out-File -FilePath (Join-Path $backupDir "README.txt") -Encoding utf8

Write-Host "Applying demo enhancement SQL..."
$tempFile = [System.IO.Path]::GetTempFileName()
$tempSqlFile = [System.IO.Path]::ChangeExtension($tempFile, ".sql")
Move-Item -LiteralPath $tempFile -Destination $tempSqlFile -Force

try {
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($tempSqlFile, (Get-Content -Raw -Encoding utf8 $sqlFile), $utf8Bom)

    $command = "`"$mysql`" --default-character-set=utf8mb4 -u$Username -p$Password $Database < `"$tempSqlFile`""
    & cmd.exe /c $command
    if ($LASTEXITCODE -ne 0) {
        throw "mysql 执行失败，退出码: $LASTEXITCODE"
    }
} finally {
    Remove-Item -LiteralPath $tempSqlFile -ErrorAction SilentlyContinue
}

Write-Host "Done. Backup saved to $backupDir"
Write-Host "Target database: $Database"
