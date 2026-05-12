param(
    [string[]]$Specs = @(),
    [int]$FrontendPort = 5173,
    [int]$BackendPort = 8081,
    [string]$BuyerUsername = 'zhangsan',
    [string]$SellerUsername = '',
    [string]$AdminUsername = 'admin',
    [string]$Password = '123456',
    [switch]$SkipPlaywright,
    [switch]$KeepRunning
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path $PSScriptRoot -Parent
$frontendRoot = Join-Path $projectRoot 'frontend'
$backendRoot = Join-Path $projectRoot 'backend'
$stackStateFile = Join-Path $projectRoot 'tmp-browser-stack.json'
$browserUploadDir = 'uploads'
$node = 'C:\Program Files\cursor\resources\app\resources\helpers\node.exe'
$maven = 'D:\apache-maven-3.9.9\bin\mvn.cmd'

function Get-ListeningProcessIds {
    param([int[]]$Ports)

    $ids = [System.Collections.Generic.HashSet[int]]::new()
    $patterns = $Ports | ForEach-Object { ":$_\s" }
    $matches = netstat -ano | Select-String -Pattern $patterns

    foreach ($line in $matches) {
        $parts = (($line.ToString() -replace '^\s+', '') -split '\s+')
        if ($parts.Length -ge 5 -and $parts[0] -eq 'TCP' -and $parts[3] -eq 'LISTENING') {
            [void]$ids.Add([int]$parts[4])
        }
    }

    return @($ids)
}

function Get-ProcessCommandLine {
    param([int]$ProcessId)

    try {
        return (Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId").CommandLine
    } catch {
        return $null
    }
}

function Stop-ProjectProcessOnPorts {
    param([int[]]$Ports)

    foreach ($processId in (Get-ListeningProcessIds -Ports $Ports)) {
        $commandLine = Get-ProcessCommandLine -ProcessId $processId
        if (-not $commandLine) {
            continue
        }

        $isProjectProcess =
            $commandLine.Contains($projectRoot) -or
            $commandLine.Contains('ShoppingMallApplication') -or
            $commandLine.Contains('vite.js')

        if (-not $isProjectProcess) {
            continue
        }

        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            Stop-Process -Id $processId -Force
        }
    }
}

function Wait-HttpReady {
    param(
        [string]$Url,
        [int]$Attempts = 120
    )

    for ($i = 0; $i -lt $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200) {
                return
            }
        } catch {
        }
        Start-Sleep -Seconds 2
    }

    throw "服务未就绪: $Url"
}

if (-not (Test-Path $node)) {
    throw "未找到 Node 可执行文件: $node"
}

if (-not (Test-Path $maven)) {
    throw "未找到 Maven 可执行文件: $maven"
}

$frontendProc = $null
$backendProc = $null

try {
    Stop-ProjectProcessOnPorts -Ports @($FrontendPort, $BackendPort)

    $backendLog = Join-Path $backendRoot "spring-browser.log"
    $backendErrLog = Join-Path $backendRoot "spring-browser.err.log"
    $frontendLog = Join-Path $frontendRoot "vite-browser.log"
    $frontendErrLog = Join-Path $frontendRoot "vite-browser.err.log"
    Remove-Item $backendLog, $backendErrLog, $frontendLog, $frontendErrLog -ErrorAction SilentlyContinue

    $springApplicationJson = @{
        file = @{
            'upload-dir' = $browserUploadDir
        }
        resilience4j = @{
            ratelimiter = @{
                instances = @{
                    'api-rate-limiter' = @{
                        'limit-for-period' = 100000
                        'limit-refresh-period' = '60s'
                        'timeout-duration' = '100ms'
                    }
                    'login-rate-limiter' = @{
                        'limit-for-period' = 1000
                        'limit-refresh-period' = '60s'
                        'timeout-duration' = '100ms'
                    }
                }
            }
        }
    } | ConvertTo-Json -Compress -Depth 6
    $env:SPRING_APPLICATION_JSON = $springApplicationJson
    $backendArgs = @(
        '/c',
        "`"$maven`"",
        'spring-boot:run',
        "-Dspring-boot.run.arguments=--server.port=$BackendPort"
    )
    $backendProc = Start-Process -FilePath 'cmd.exe' -ArgumentList $backendArgs -WorkingDirectory $backendRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrLog

    $env:VITE_PROXY_TARGET = "http://127.0.0.1:$BackendPort"
    $frontendArgs = @('.\node_modules\vite\bin\vite.js', '--host', '127.0.0.1', '--port', "$FrontendPort")
    $frontendProc = Start-Process -FilePath $node -ArgumentList $frontendArgs -WorkingDirectory $frontendRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErrLog

    Wait-HttpReady -Url "http://127.0.0.1:$BackendPort/api/auth/captcha"
    Wait-HttpReady -Url "http://127.0.0.1:$FrontendPort"

    @{
        frontendPort = $FrontendPort
        backendPort = $BackendPort
        frontendPid = if ($frontendProc) { $frontendProc.Id } else { $null }
        backendPid = if ($backendProc) { $backendProc.Id } else { $null }
        frontendUrl = "http://127.0.0.1:$FrontendPort"
        backendUrl = "http://127.0.0.1:$BackendPort/api"
        updatedAt = (Get-Date).ToString('s')
    } | ConvertTo-Json -Compress | Set-Content $stackStateFile

    Write-Host "Backend ready on http://127.0.0.1:$BackendPort"
    Write-Host "Frontend ready on http://127.0.0.1:$FrontendPort"

    if ($SkipPlaywright) {
        if ($KeepRunning) {
            Write-Host "Browser stack is running and has been left active."
            Write-Host "Use scripts\\stop-real-browser-stack.ps1 to stop it."
        } else {
            Write-Host "SkipPlaywright was requested; browser stack will stop after this script exits."
        }
        return
    }

    $env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:$FrontendPort"
    $env:E2E_USERNAME = $BuyerUsername
    if ($SellerUsername) {
        $env:E2E_SELLER_USERNAME = $SellerUsername
    } else {
        Remove-Item Env:E2E_SELLER_USERNAME -ErrorAction SilentlyContinue
    }
    $env:E2E_ADMIN_USERNAME = $AdminUsername
    $env:E2E_PASSWORD = $Password

    $playwrightArgs = @('.\node_modules\playwright\cli.js', 'test')
    if ($Specs.Count -gt 0) {
        $playwrightArgs += $Specs
    }
    $playwrightArgs += '--reporter=line'

    Write-Host "Running Playwright specs: $($Specs -join ', ')"

    Push-Location $frontendRoot
    try {
        & $node @playwrightArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright 失败，退出码: $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}
finally {
    if (-not $KeepRunning) {
        foreach ($process in @($frontendProc, $backendProc)) {
            if ($process -and -not $process.HasExited) {
                Stop-Process -Id $process.Id -Force
            }
        }

        Stop-ProjectProcessOnPorts -Ports @($FrontendPort, $BackendPort)
        Remove-Item $stackStateFile -ErrorAction SilentlyContinue
    }
}
