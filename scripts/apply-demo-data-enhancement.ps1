[CmdletBinding()]
param(
    [string]$Database = "shopping_mall",
    [string]$Username = "root",
    [string]$Password = "123456",
    [switch]$AllowPrimaryDatabase
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "demo-data-enhancement.sql"

if (-not (Test-Path $sqlFile)) {
    throw "Enhancement SQL not found: $sqlFile"
}

if ($Database -eq "shopping_mall" -and -not $AllowPrimaryDatabase) {
    throw "Refusing to modify shopping_mall without -AllowPrimaryDatabase."
}

$mysql = (Get-Command mysql.exe -ErrorAction Stop).Source
$mysqldump = (Get-Command mysqldump.exe -ErrorAction Stop).Source

$backupTables = @(
    "tb_user",
    "tb_product",
    "tb_coupon",
    "tb_user_coupon",
    "tb_order",
    "tb_order_item",
    "tb_review",
    "notifications",
    "tb_wishlist",
    "tb_consumption_budget",
    "tb_consumption_achievement",
    "tb_price_alert",
    "tb_price_history",
    "tb_upload_file"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $scriptDir "backups\shopping-mall-enhancement-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "Backup directory: $backupDir"

$commonDumpArgs = @(
    "--default-character-set=utf8mb4",
    "--single-transaction",
    "--skip-triggers",
    "--complete-insert",
    "-u$Username",
    "-p$Password",
    $Database
)

foreach ($table in $backupTables) {
    Write-Host "Backing up $table ..."
    & $mysqldump @commonDumpArgs $table | Out-File -FilePath (Join-Path $backupDir "$table.sql") -Encoding utf8
}

$restoreNote = @"
Temporary backup created before shopping_mall enhancement.

Restore example:
  mysql -u USER -p DATABASE < tb_product.sql

Tables backed up:
  $($backupTables -join ", ")
"@
$restoreNote | Out-File -FilePath (Join-Path $backupDir "README.txt") -Encoding utf8

$tempFile = [System.IO.Path]::GetTempFileName()
$tempSqlFile = [System.IO.Path]::ChangeExtension($tempFile, ".sql")
Move-Item -LiteralPath $tempFile -Destination $tempSqlFile -Force

try {
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($tempSqlFile, (Get-Content -Raw -Encoding utf8 $sqlFile), $utf8Bom)

    Write-Host "Applying enhancement SQL to $Database ..."
    $command = "`"$mysql`" --default-character-set=utf8mb4 -u$Username -p$Password $Database < `"$tempSqlFile`""
    & cmd.exe /c $command
    if ($LASTEXITCODE -ne 0) {
        throw "mysql execution failed with exit code $LASTEXITCODE"
    }
}
finally {
    Remove-Item -LiteralPath $tempSqlFile -ErrorAction SilentlyContinue
}

$auditSql = @"
SELECT 'tb_user.avatar' AS metric, COUNT(*) AS value FROM tb_user WHERE avatar IS NULL OR avatar = ''
UNION ALL
SELECT 'tb_product.images', COUNT(*) FROM tb_product WHERE images IS NULL OR images = ''
UNION ALL
SELECT 'tb_review.images', COUNT(*) FROM tb_review WHERE images IS NULL OR images = ''
UNION ALL
SELECT 'tb_review.reply', COUNT(*) FROM tb_review WHERE reply IS NULL OR reply = ''
UNION ALL
SELECT 'notifications.related_id', COUNT(*) FROM notifications WHERE related_id IS NULL
UNION ALL
SELECT 'tb_wishlist.reason', COUNT(*) FROM tb_wishlist WHERE reason IS NULL OR reason = ''
UNION ALL
SELECT 'new_products', COUNT(*) FROM tb_product WHERE created_time IN ('2026-05-06 10:00:00','2026-05-07 09:20:00','2026-05-08 11:10:00','2026-05-09 14:40:00','2026-05-10 09:30:00','2026-05-11 16:10:00')
UNION ALL
SELECT 'new_orders', COUNT(*) FROM tb_order WHERE order_no IN ('ORD202605140001','ORD202605140002','ORD202605140003','ORD202605140004')
UNION ALL
SELECT 'new_coupons', COUNT(*) FROM tb_coupon WHERE created_time IN ('2026-05-10 09:00:00.000000','2026-05-10 09:10:00.000000')
UNION ALL
SELECT 'e2e_products', COUNT(*) FROM tb_product WHERE name LIKE 'E2E-%'
UNION ALL
SELECT 'e2e_notifications', COUNT(*) FROM notifications WHERE title LIKE 'E2E-%' OR message LIKE '%E2E-%'
UNION ALL
SELECT 'e2e_wishlist', COUNT(*) FROM tb_wishlist WHERE reason LIKE 'E2E%';
"@

Write-Host ""
Write-Host "Post-run audit:"
& $mysql "--default-character-set=utf8mb4" "-u$Username" "-p$Password" "-e" $auditSql $Database
if ($LASTEXITCODE -ne 0) {
    throw "audit query failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Done. Backup saved to $backupDir"
Write-Host "Target database: $Database"
