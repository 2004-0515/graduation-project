param(
    [string[]]$Specs = @(),
    [int]$FrontendPort = 5178,
    [int]$BackendPort = 8085,
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
$stackStateFile = Join-Path $projectRoot 'tmp-demo-browser-stack.json'

function Resolve-CommandPath {
    param(
        [string[]]$Candidates,
        [string]$Label
    )

    foreach ($candidate in $Candidates) {
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

    throw "未找到 $Label，可通过 PATH 或环境变量提供。候选项: $($Candidates -join ', ')"
}

$node = Resolve-CommandPath -Candidates @(
    $env:NODE_EXE,
    'node',
    'C:\Program Files\cursor\resources\app\resources\helpers\node.exe'
) -Label 'Node'

$maven = Resolve-CommandPath -Candidates @(
    $env:MAVEN_CMD,
    'mvn.cmd',
    'mvn',
    'D:\apache-maven-3.9.9\bin\mvn.cmd'
) -Label 'Maven'

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

function Get-ListeningProcessId {
    param([int]$Port)

    return (Get-ListeningProcessIds -Ports @($Port) | Select-Object -First 1)
}

function Get-PortProcessSummary {
    param([int]$Port)

    $processIds = @(Get-ListeningProcessIds -Ports @($Port))
    if ($processIds.Count -eq 0) {
        return '无'
    }

    $processList = foreach ($processId in $processIds | Sort-Object -Unique) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            "$($process.ProcessName)($processId)"
        } else {
            "PID $processId"
        }
    }

    return ($processList -join ', ')
}

function Test-ProjectFrontendInstance {
    param([int]$Port)

    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -ge 200 `
            -and $response.Content.Contains('<script type="module" src="/@vite/client"></script>') `
            -and $response.Content.Contains('<div id="app"></div>')
    } catch {
        return $false
    }
}

function Test-ProjectBackendInstance {
    param([int]$Port)

    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/products?pageNo=0&pageSize=1" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content -match '"code"\s*:\s*200'
    } catch {
        return $false
    }
}

function Remove-StaleManagedStackState {
    if (-not (Test-Path $stackStateFile)) {
        return
    }

    try {
        $state = Get-Content $stackStateFile | ConvertFrom-Json
        $activeManagedPids = @($state.frontendPid, $state.backendPid) | Where-Object {
            $_ -and (Get-Process -Id $_ -ErrorAction SilentlyContinue)
        }

        if ($activeManagedPids.Count -eq 0) {
            Remove-Item $stackStateFile -ErrorAction SilentlyContinue
        }
    } catch {
        Remove-Item $stackStateFile -ErrorAction SilentlyContinue
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

$frontendProc = $null
$backendProc = $null
$startedFrontend = $false
$startedBackend = $false
$reusedFrontend = $false
$reusedBackend = $false
$activeFrontendPid = $null
$activeBackendPid = $null
$Specs = @(
    $Specs |
        Where-Object { $_ } |
        ForEach-Object { $_ -split ',' } |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ }
)

try {
    Remove-StaleManagedStackState

    if (-not $env:DB_NAME) {
        $env:DB_NAME = 'shopping_mall_demo'
    }
    if (-not $env:REDIS_DB) {
        $env:REDIS_DB = '1'
    }

    $frontendPortOccupied = @(Get-ListeningProcessIds -Ports @($FrontendPort)).Count -gt 0
    $backendPortOccupied = @(Get-ListeningProcessIds -Ports @($BackendPort)).Count -gt 0

    if ($frontendPortOccupied) {
        if (Test-ProjectFrontendInstance -Port $FrontendPort) {
            $reusedFrontend = $true
            $activeFrontendPid = Get-ListeningProcessId -Port $FrontendPort
            Write-Host "Reusing existing project frontend on http://127.0.0.1:$FrontendPort"
        } else {
            throw ('前端端口 {0} 已被非本项目实例占用: {1}' -f $FrontendPort, (Get-PortProcessSummary -Port $FrontendPort))
        }
    }

    if ($backendPortOccupied) {
        if (Test-ProjectBackendInstance -Port $BackendPort) {
            $reusedBackend = $true
            $activeBackendPid = Get-ListeningProcessId -Port $BackendPort
            Write-Host "Reusing existing project backend on http://127.0.0.1:$BackendPort/api"
        } else {
            throw ('后端端口 {0} 已被非本项目实例占用: {1}' -f $BackendPort, (Get-PortProcessSummary -Port $BackendPort))
        }
    }

    if ($reusedFrontend -and -not $reusedBackend) {
        throw "前端端口 $FrontendPort 上已经有本项目实例，但后端端口 $BackendPort 未就绪。为避免代理错连，请先释放该前端实例或补齐匹配后端。"
    }

    $backendLog = Join-Path $backendRoot "spring-demo.log"
    $backendErrLog = Join-Path $backendRoot "spring-demo.err.log"
    $frontendLog = Join-Path $frontendRoot "vite-demo.log"
    $frontendErrLog = Join-Path $frontendRoot "vite-demo.err.log"
    Remove-Item $backendLog, $backendErrLog, $frontendLog, $frontendErrLog -ErrorAction SilentlyContinue

    if (-not $reusedBackend) {
        $backendArgs = @(
            '/c',
            "`"$maven`"",
            'spring-boot:run',
            '-Dspring-boot.run.profiles=demo,browser',
            "-Dspring-boot.run.arguments=--server.port=$BackendPort"
        )
        $backendProc = Start-Process -FilePath 'cmd.exe' -ArgumentList $backendArgs -WorkingDirectory $backendRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrLog
        $startedBackend = $true
    }

    Wait-HttpReady -Url "http://127.0.0.1:$BackendPort/api/products?pageNo=0&pageSize=1"
    if (-not $activeBackendPid) {
        $activeBackendPid = Get-ListeningProcessId -Port $BackendPort
    }

    if (-not $reusedFrontend) {
        $env:VITE_PROXY_TARGET = "http://127.0.0.1:$BackendPort"
        $frontendArgs = @('.\node_modules\vite\bin\vite.js', '--host', '127.0.0.1', '--port', "$FrontendPort")
        $frontendProc = Start-Process -FilePath $node -ArgumentList $frontendArgs -WorkingDirectory $frontendRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErrLog
        $startedFrontend = $true
    }

    Wait-HttpReady -Url "http://127.0.0.1:$FrontendPort"
    if (-not $activeFrontendPid) {
        $activeFrontendPid = Get-ListeningProcessId -Port $FrontendPort
    }

    if ($KeepRunning -or $startedFrontend -or $startedBackend) {
        @{
            stackKind = 'demo-browser'
            frontendPort = $FrontendPort
            backendPort = $BackendPort
            frontendPid = if ($activeFrontendPid) { [int]$activeFrontendPid } else { $null }
            backendPid = if ($activeBackendPid) { [int]$activeBackendPid } else { $null }
            frontendManaged = $startedFrontend
            backendManaged = $startedBackend
            frontendUrl = "http://127.0.0.1:$FrontendPort"
            backendUrl = "http://127.0.0.1:$BackendPort/api"
            dbName = $env:DB_NAME
            redisDb = $env:REDIS_DB
            updatedAt = (Get-Date).ToString('s')
        } | ConvertTo-Json -Compress | Set-Content $stackStateFile
    }

    Write-Host "Backend ready on http://127.0.0.1:$BackendPort/api (DB=$($env:DB_NAME), RedisDB=$($env:REDIS_DB))"
    Write-Host "Frontend ready on http://127.0.0.1:$FrontendPort"

    if ($SkipPlaywright) {
        if ($KeepRunning) {
            Write-Host "Demo/E2E stack is running and has been left active."
            if ($startedFrontend -or $startedBackend) {
                Write-Host "Use scripts\\stop-real-browser-stack.ps1 to stop the managed instance."
            } else {
                Write-Host "This run reused existing project instances and did not take process ownership."
            }
        } else {
            Write-Host "SkipPlaywright was requested; managed processes started by this script will stop after exit."
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
        $managedProcesses = @()
        if ($startedFrontend -and $frontendProc) {
            $managedProcesses += $frontendProc
        }
        if ($startedBackend -and $backendProc) {
            $managedProcesses += $backendProc
        }

        foreach ($process in $managedProcesses) {
            if ($process -and -not $process.HasExited) {
                Stop-Process -Id $process.Id -Force
            }
        }

        Remove-Item $stackStateFile -ErrorAction SilentlyContinue
    }
}
