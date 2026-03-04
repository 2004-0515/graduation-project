# ============================================
# 数据完整性检查脚本
# ============================================
# 
# 说明：此脚本用于提醒用户在 Navicat 中执行 SQL 检查
# 
# 执行步骤：
# 1. 打开 Navicat
# 2. 连接到 shopping_mall 数据库
# 3. 打开 ultra_comprehensive_check.sql 文件
# 4. 确保编码为 UTF-8
# 5. 执行整个脚本
# 6. 查看所有结果，确保 problem_count 都为 0
#
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "数据完整性检查提醒" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请在 Navicat 中执行以下步骤：" -ForegroundColor Green
Write-Host ""
Write-Host "1. 打开 Navicat 并连接到 shopping_mall 数据库" -ForegroundColor White
Write-Host "2. 打开文件: ultra_comprehensive_check.sql" -ForegroundColor White
Write-Host "3. 确保文件编码为 UTF-8" -ForegroundColor White
Write-Host "4. 点击 '运行' 按钮执行整个脚本" -ForegroundColor White
Write-Host "5. 查看所有结果表格" -ForegroundColor White
Write-Host ""
Write-Host "检查标准：" -ForegroundColor Yellow
Write-Host "- 所有 'problem_count' 列的值都应该为 0" -ForegroundColor White
Write-Host "- 如果有非 0 值，说明存在数据问题" -ForegroundColor Red
Write-Host ""
Write-Host "检查项目包括：" -ForegroundColor Yellow
Write-Host "- 外键引用完整性 (22项)" -ForegroundColor White
Write-Host "- 必填字段检查 (12项)" -ForegroundColor White
Write-Host "- 状态值有效性 (12项)" -ForegroundColor White
Write-Host "- 数据一致性 (3项)" -ForegroundColor White
Write-Host "- 业务逻辑一致性 (10项)" -ForegroundColor White
Write-Host "- 数据统计信息" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键关闭..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
