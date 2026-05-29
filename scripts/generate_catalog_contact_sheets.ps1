param(
    [string]$OutputDir = "scratch\catalog-visual-audit-20260526-curated"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$manifestPath = Join-Path $projectRoot "scripts\young-catalog-assets.json"
$manifest = Get-Content -LiteralPath $manifestPath -Encoding UTF8 -Raw | ConvertFrom-Json
$products = @($manifest.products.PSObject.Properties | ForEach-Object { $_.Value })
$targetRoot = Join-Path $projectRoot $OutputDir
New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
Get-ChildItem -LiteralPath $targetRoot -File -Filter "*.jpg" -ErrorAction SilentlyContinue | Remove-Item -Force

$tileWidth = 220
$tileHeight = 262
$imageSize = 170
$padding = 12
$columns = 4
$fontName = "Microsoft YaHei"
$nameFont = New-Object System.Drawing.Font($fontName, 9, [System.Drawing.FontStyle]::Bold)
$metaFont = New-Object System.Drawing.Font($fontName, 7, [System.Drawing.FontStyle]::Regular)
$brushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 32, 32))
$brushMeta = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 92, 92))
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 226, 226), 1)
$format = New-Object System.Drawing.StringFormat
$format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
$format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit

function Save-Jpeg([System.Drawing.Bitmap]$Bitmap, [string]$Path) {
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
    $qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]92)
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = $qualityParam
    $Bitmap.Save($Path, $codec, $encoderParams)
    $qualityParam.Dispose()
    $encoderParams.Dispose()
}

foreach ($group in ($products | Group-Object category | Sort-Object Name)) {
    $items = @($group.Group | Sort-Object slug)
    $rows = [Math]::Ceiling($items.Count / $columns)
    $width = $tileWidth * $columns
    $height = [int]($tileHeight * $rows)
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.Clear([System.Drawing.Color]::White)

    for ($i = 0; $i -lt $items.Count; $i++) {
        $item = $items[$i]
        $col = $i % $columns
        $row = [Math]::Floor($i / $columns)
        $x = $col * $tileWidth
        $y = $row * $tileHeight
        $graphics.DrawRectangle($borderPen, $x, $y, $tileWidth - 1, $tileHeight - 1)

        $imagePath = Join-Path $projectRoot ($item.local_path.TrimStart("/") -replace "/", "\")
        $image = [System.Drawing.Image]::FromFile($imagePath)
        try {
            $graphics.DrawImage($image, $x + $padding, $y + $padding, $imageSize, $imageSize)
        }
        finally {
            $image.Dispose()
        }

        $textX = $x + $padding
        $textWidth = $tileWidth - (2 * $padding)
        $nameY = $y + $padding + $imageSize + 6
        $slugY = $y + $padding + $imageSize + 42
        $queryY = $y + $padding + $imageSize + 58
        $nameRect = New-Object System.Drawing.RectangleF($textX, $nameY, $textWidth, 34)
        $slugRect = New-Object System.Drawing.RectangleF($textX, $slugY, $textWidth, 16)
        $queryRect = New-Object System.Drawing.RectangleF($textX, $queryY, $textWidth, 16)
        $graphics.DrawString([string]$item.name, $nameFont, $brushText, $nameRect, $format)
        $graphics.DrawString([string]$item.slug, $metaFont, $brushMeta, $slugRect, $format)
        $graphics.DrawString([string]$item.query, $metaFont, $brushMeta, $queryRect, $format)
    }

    $safeName = ($group.Name -replace '[\\/:*?"<>|]', '_')
    Save-Jpeg $bitmap (Join-Path $targetRoot "$safeName.jpg")
    $graphics.Dispose()
    $bitmap.Dispose()
}

$nameFont.Dispose()
$metaFont.Dispose()
$brushText.Dispose()
$brushMeta.Dispose()
$borderPen.Dispose()
$format.Dispose()

Write-Output $targetRoot
