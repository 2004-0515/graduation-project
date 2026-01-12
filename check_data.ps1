# 数据检查脚本
$baseUrl = "http://localhost:8080/api"

function Get-ApiData($endpoint) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -UseBasicParsing -TimeoutSec 10
        return $response.Content | ConvertFrom-Json
    } catch {
        return @{error = $_.Exception.Message}
    }
}

Write-Host "`n========== 数据库表数据检查 ==========`n" -ForegroundColor Cyan

# 1. 商品分类
$categories = Get-ApiData "/categories"
Write-Host "1. 商品分类 (tb_category): " -NoNewline
if ($categories.data) {
    Write-Host "$($categories.data.Count) 条" -ForegroundColor Green
} else {
    Write-Host "获取失败" -ForegroundColor Red
}

# 2. 商品
$products = Get-ApiData "/products"
Write-Host "2. 商品 (tb_product): " -NoNewline
if ($products.data.totalElements) {
    Write-Host "$($products.data.totalElements) 条" -ForegroundColor Green
} else {
    Write-Host "获取失败" -ForegroundColor Red
}

# 3. 优惠券
$coupons = Get-ApiData "/coupons"
Write-Host "3. 优惠券 (tb_coupon): " -NoNewline
if ($coupons.data) {
    Write-Host "$($coupons.data.Count) 条" -ForegroundColor Green
} else {
    Write-Host "获取失败" -ForegroundColor Red
}

# 4. 音乐
$music = Get-ApiData "/music"
Write-Host "4. 音乐 (music): " -NoNewline
if ($music.data) {
    Write-Host "$($music.data.Count) 条" -ForegroundColor Green
} else {
    Write-Host "获取失败" -ForegroundColor Red
}

Write-Host "`n========== 检查完成 ==========`n" -ForegroundColor Cyan
