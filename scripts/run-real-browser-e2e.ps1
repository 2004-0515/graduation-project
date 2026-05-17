param(
    [string[]]$Specs = @(),
    [string]$Suite = '',
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
$stackStateFile = Join-Path $projectRoot 'tmp-browser-stack.json'
$uploadsRoot = Join-Path $projectRoot 'uploads'
$tempRoot = Join-Path $projectRoot '.tmp'
$e2eUploadsRoot = Join-Path $tempRoot 'e2e-uploads'
$seedScript = Join-Path $PSScriptRoot 'rebuild-graduation-data.ps1'
$viteCli = './node_modules/vite/bin/vite.js'
$playwrightCli = './node_modules/playwright/cli.js'
$isWindowsPlatform = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT
$suiteSpecsMap = @{
    smoke = @(
        'tests/e2e/smoke.spec.ts',
        'tests/e2e/user-smoke.spec.ts',
        'tests/e2e/admin-smoke.spec.ts'
    )
    public = @(
        'tests/e2e/public-routes-smoke.spec.ts',
        'tests/e2e/route-guard-smoke.spec.ts',
        'tests/e2e/footer-navigation.spec.ts',
        'tests/e2e/help-and-terms.spec.ts',
        'tests/e2e/category-browse.spec.ts',
        'tests/e2e/hot-products-browse.spec.ts',
        'tests/e2e/search-dropdown-flow.spec.ts'
    )
    user = @(
        'tests/e2e/account-settings.spec.ts',
        'tests/e2e/profile-persistence.spec.ts',
        'tests/e2e/profile-quick-actions.spec.ts',
        'tests/e2e/address-management.spec.ts',
        'tests/e2e/settings-persistence.spec.ts',
        'tests/e2e/notifications-operations.spec.ts',
        'tests/e2e/rational-consumption-flow.spec.ts',
        'tests/e2e/cart-management.spec.ts',
        'tests/e2e/product-detail-cart.spec.ts',
        'tests/e2e/product-detail-wishlist.spec.ts',
        'tests/e2e/product-detail-price-alert.spec.ts',
        'tests/e2e/price-alerts-operations.spec.ts',
        'tests/e2e/price-alert-notification.spec.ts',
        'tests/e2e/coupon-flow.spec.ts',
        'tests/e2e/contact-message-management.spec.ts'
    )
    orders = @(
        'tests/e2e/payment-management.spec.ts',
        'tests/e2e/orders-management.spec.ts',
        'tests/e2e/order-detail-management.spec.ts',
        'tests/e2e/seller-orders-management.spec.ts',
        'tests/e2e/order-phase2.spec.ts'
    )
    admin = @(
        'tests/e2e/admin-smoke.spec.ts',
        'tests/e2e/admin-categories-management.spec.ts',
        'tests/e2e/admin-users-management.spec.ts',
        'tests/e2e/admin-notifications-management.spec.ts',
        'tests/e2e/admin-rational-management.spec.ts',
        'tests/e2e/admin-coupons-management.spec.ts',
        'tests/e2e/admin-product-review-management.spec.ts',
        'tests/e2e/admin-file-review-management.spec.ts',
        'tests/e2e/admin-orders-management.spec.ts',
        'tests/e2e/admin-price-alert-management.spec.ts',
        'tests/e2e/my-products-management.spec.ts',
        'tests/e2e/notification-routing.spec.ts'
    )
}

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

    throw "Unable to locate $Label via PATH or environment variables. Candidates: $($Candidates -join ', ')"
}

$nodeCandidates = @(
    $env:NODE_EXE
)
if ($isWindowsPlatform) {
    $nodeCandidates += @(
        'C:\Users\Administrator\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe',
        'C:\Program Files\cursor\resources\app\resources\helpers\node.exe',
        'node'
    )
} else {
    $nodeCandidates += 'node'
}
$node = Resolve-CommandPath -Candidates $nodeCandidates -Label 'Node'

$mavenCandidates = @($env:MAVEN_CMD)
if ($isWindowsPlatform) {
    $mavenCandidates += @(
        'mvn.cmd',
        'mvn',
        'D:\apache-maven-3.9.9\bin\mvn.cmd'
    )
} else {
    $mavenCandidates += 'mvn'
}
$maven = Resolve-CommandPath -Candidates $mavenCandidates -Label 'Maven'

function Get-ListeningProcessIds {
    param([int[]]$Ports)

    $ids = [System.Collections.Generic.HashSet[int]]::new()
    if ($isWindowsPlatform) {
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

    if (Get-Command 'ss' -ErrorAction SilentlyContinue) {
        $matches = ss -ltnp 2>$null
        foreach ($line in $matches) {
            if ($line -match 'LISTEN' -and $line -match ':(?<port>\d+)\s+\S+.*pid=(?<pid>\d+)') {
                if ($Ports -contains [int]$Matches.port) {
                    [void]$ids.Add([int]$Matches.pid)
                }
            }
        }
        return @($ids)
    }

    if (Get-Command 'netstat' -ErrorAction SilentlyContinue) {
        $matches = netstat -ltnp 2>$null
        foreach ($line in $matches) {
            if ($line -match ':(?<port>\d+)\s+\S+\s+LISTEN\s+(?<pid>\d+)') {
                if ($Ports -contains [int]$Matches.port) {
                    [void]$ids.Add([int]$Matches.pid)
                }
            }
        }

        return @($ids)
    }

    throw 'No supported port inspection command was found. Install ss or netstat.'
}

function Get-ListeningProcessId {
    param([int]$Port)

    return (Get-ListeningProcessIds -Ports @($Port) | Select-Object -First 1)
}

function Get-PortProcessSummary {
    param([int]$Port)

    $processIds = @(Get-ListeningProcessIds -Ports @($Port))
    if ($processIds.Count -eq 0) {
        return 'none'
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

    throw "Service did not become ready: $Url"
}

function Start-ManagedProcess {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory,
        [string]$StdoutPath,
        [string]$StderrPath
    )

    $params = @{
        FilePath = $FilePath
        ArgumentList = $ArgumentList
        WorkingDirectory = $WorkingDirectory
        PassThru = $true
        RedirectStandardOutput = $StdoutPath
        RedirectStandardError = $StderrPath
    }

    if ($isWindowsPlatform) {
        $params.WindowStyle = 'Hidden'
    }

    return Start-Process @params
}

function Reset-E2EUploadsDirectory {
    param(
        [string]$SourcePath,
        [string]$TargetPath
    )

    if (-not (Test-Path $SourcePath)) {
        throw "Upload asset source directory does not exist: $SourcePath"
    }

    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    if (Test-Path $TargetPath) {
        Remove-Item -LiteralPath $TargetPath -Recurse -Force
    }

    New-Item -ItemType Directory -Force -Path $TargetPath | Out-Null
    Copy-Item -Path (Join-Path $SourcePath '*') -Destination $TargetPath -Recurse -Force
}

function ConvertTo-GraduationDatasetStatus {
    param([string[]]$Lines)

    $startIndex = -1
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i].Trim().StartsWith("{")) {
            $startIndex = $i
            break
        }
    }

    if ($startIndex -lt 0) {
        return $null
    }

    $jsonText = ($Lines[$startIndex..($Lines.Count - 1)] -join [Environment]::NewLine)
    return $jsonText | ConvertFrom-Json
}

function Get-GraduationDatasetStatus {
    param(
        [string]$DatabaseName,
        [string]$DatabaseUser,
        [string]$DatabasePassword,
        [string]$DatabaseHost = "",
        [string]$DatabasePort = ""
    )

    $seedArgs = @{
        Mode = "verify"
        DatabaseName = $DatabaseName
        DatabaseUser = $DatabaseUser
        DatabasePassword = $DatabasePassword
    }
    if ($DatabaseHost) {
        $seedArgs.DatabaseHost = $DatabaseHost
    }
    if ($DatabasePort) {
        $seedArgs.DatabasePort = $DatabasePort
    }

    $output = & $seedScript @seedArgs 2>&1
    $verifyExitCode = $LASTEXITCODE
    $lines = @($output | ForEach-Object { "$_" })
    $status = ConvertTo-GraduationDatasetStatus -Lines $lines
    if ($status) {
        return $status
    }

    return [pscustomobject]@{
        ready = $false
        database = $DatabaseName
        verifyExitCode = $verifyExitCode
        verifyError = ($lines -join [Environment]::NewLine).Trim()
    }
}

function Ensure-GraduationDatasetReady {
    param(
        [string]$DatabaseName,
        [string]$DatabaseUser,
        [string]$DatabasePassword,
        [string]$DatabaseHost = "",
        [string]$DatabasePort = ""
    )

    if (-not (Test-Path $seedScript)) {
        throw "Required script was not found: $seedScript"
    }

    Write-Host "Checking localized graduation dataset in $DatabaseName"
    $status = Get-GraduationDatasetStatus -DatabaseName $DatabaseName -DatabaseUser $DatabaseUser -DatabasePassword $DatabasePassword -DatabaseHost $DatabaseHost -DatabasePort $DatabasePort
    if ([bool]$status.ready) {
        Write-Host "Localized graduation dataset already matches the target snapshot."
        return
    }

    if ($status.PSObject.Properties.Name -contains 'verifyError' -and $status.verifyError) {
        Write-Host "Localized dataset verification failed. Rebuilding local database content."
    } else {
        Write-Host "Localized dataset is incomplete. Rebuilding local database content."
    }

    $seedArgs = @{
        Mode = "execute"
        DatabaseName = $DatabaseName
        DatabaseUser = $DatabaseUser
        DatabasePassword = $DatabasePassword
    }
    if ($DatabaseHost) {
        $seedArgs.DatabaseHost = $DatabaseHost
    }
    if ($DatabasePort) {
        $seedArgs.DatabasePort = $DatabasePort
    }

    & $seedScript @seedArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Localized dataset rebuild failed with exit code: $LASTEXITCODE"
    }
}

$frontendProc = $null
$backendProc = $null
$startedFrontend = $false
$startedBackend = $false
$reusedFrontend = $false
$reusedBackend = $false
$activeFrontendPid = $null
$activeBackendPid = $null
if ($Suite) {
    if (-not $suiteSpecsMap.ContainsKey($Suite)) {
        throw "Unknown E2E suite: $Suite. Allowed values: $($suiteSpecsMap.Keys -join ', ')"
    }

    $Specs = @($suiteSpecsMap[$Suite]) + @($Specs)
}

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
        $env:DB_NAME = 'shopping_mall_test'
    }
    if (-not $env:REDIS_DB) {
        $env:REDIS_DB = '1'
    }

    $dbUser = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'root' }
    $dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { '123456' }
    $dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { '' }
    $dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { '' }
    Ensure-GraduationDatasetReady -DatabaseName $env:DB_NAME -DatabaseUser $dbUser -DatabasePassword $dbPassword -DatabaseHost $dbHost -DatabasePort $dbPort

    Reset-E2EUploadsDirectory -SourcePath $uploadsRoot -TargetPath $e2eUploadsRoot
    $env:FILE_UPLOAD_DIR = $e2eUploadsRoot

    $frontendPortOccupied = @(Get-ListeningProcessIds -Ports @($FrontendPort)).Count -gt 0
    $backendPortOccupied = @(Get-ListeningProcessIds -Ports @($BackendPort)).Count -gt 0

    if ($frontendPortOccupied) {
        if (Test-ProjectFrontendInstance -Port $FrontendPort) {
            $reusedFrontend = $true
            $activeFrontendPid = Get-ListeningProcessId -Port $FrontendPort
            Write-Host "Reusing existing project frontend on http://127.0.0.1:$FrontendPort"
        } else {
            throw ('Frontend port {0} is already occupied by a non-project process: {1}' -f $FrontendPort, (Get-PortProcessSummary -Port $FrontendPort))
        }
    }

    if ($backendPortOccupied) {
        if (Test-ProjectBackendInstance -Port $BackendPort) {
            $reusedBackend = $true
            $activeBackendPid = Get-ListeningProcessId -Port $BackendPort
            Write-Host "Reusing existing project backend on http://127.0.0.1:$BackendPort/api"
        } else {
            throw ('Backend port {0} is already occupied by a non-project process: {1}' -f $BackendPort, (Get-PortProcessSummary -Port $BackendPort))
        }
    }

    if ($reusedFrontend -and -not $reusedBackend) {
        throw "A project frontend is already listening on port $FrontendPort, but the matching backend on port $BackendPort is not ready. Release the frontend instance or start the matching backend first."
    }

    $backendLog = Join-Path $backendRoot "spring-browser.log"
    $backendErrLog = Join-Path $backendRoot "spring-browser.err.log"
    $frontendLog = Join-Path $frontendRoot "vite-browser.log"
    $frontendErrLog = Join-Path $frontendRoot "vite-browser.err.log"
    Remove-Item $backendLog, $backendErrLog, $frontendLog, $frontendErrLog -ErrorAction SilentlyContinue

    if (-not $reusedBackend) {
        if ($isWindowsPlatform) {
            $backendFilePath = 'cmd.exe'
            $backendArgs = @(
                '/c',
                "`"$maven`"",
                'spring-boot:run',
                '-Dspring-boot.run.profiles=demo,browser',
                "-Dspring-boot.run.arguments=--server.port=$BackendPort"
            )
        } else {
            $backendFilePath = $maven
            $backendArgs = @(
                'spring-boot:run',
                '-Dspring-boot.run.profiles=demo,browser',
                "-Dspring-boot.run.arguments=--server.port=$BackendPort"
            )
        }

        $backendProc = Start-ManagedProcess -FilePath $backendFilePath -ArgumentList $backendArgs -WorkingDirectory $backendRoot -StdoutPath $backendLog -StderrPath $backendErrLog
        $startedBackend = $true
    }

    Wait-HttpReady -Url "http://127.0.0.1:$BackendPort/api/products?pageNo=0&pageSize=1"
    if (-not $activeBackendPid) {
        $activeBackendPid = Get-ListeningProcessId -Port $BackendPort
    }

    if (-not $reusedFrontend) {
        $env:VITE_PROXY_TARGET = "http://127.0.0.1:$BackendPort"
        $env:VITE_E2E = 'true'
        $frontendArgs = @($viteCli, '--host', '127.0.0.1', '--port', "$FrontendPort")
        $frontendProc = Start-ManagedProcess -FilePath $node -ArgumentList $frontendArgs -WorkingDirectory $frontendRoot -StdoutPath $frontendLog -StderrPath $frontendErrLog
        $startedFrontend = $true
    }

    Wait-HttpReady -Url "http://127.0.0.1:$FrontendPort"
    if (-not $activeFrontendPid) {
        $activeFrontendPid = Get-ListeningProcessId -Port $FrontendPort
    }

    if ($KeepRunning -or $startedFrontend -or $startedBackend) {
        @{
            stackKind = 'browser-stack'
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
            Write-Host "Managed browser/E2E stack is running and has been left active."
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

    $playwrightArgs = @($playwrightCli, 'test')
    if ($Specs.Count -gt 0) {
        $playwrightArgs += $Specs
    }
    $playwrightArgs += '--reporter=line'

    Write-Host "Running Playwright specs: $($Specs -join ', ')"

    Push-Location $frontendRoot
    try {
        & $node @playwrightArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright failed with exit code: $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}
finally {
    if (-not $KeepRunning) {
        $managedProcessIds = [System.Collections.Generic.HashSet[int]]::new()
        if ($startedFrontend) {
            if ($frontendProc) {
                [void]$managedProcessIds.Add([int]$frontendProc.Id)
            }
            if ($activeFrontendPid) {
                [void]$managedProcessIds.Add([int]$activeFrontendPid)
            }
        }
        if ($startedBackend) {
            if ($backendProc) {
                [void]$managedProcessIds.Add([int]$backendProc.Id)
            }
            if ($activeBackendPid) {
                [void]$managedProcessIds.Add([int]$activeBackendPid)
            }
        }

        foreach ($processId in $managedProcessIds) {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process -and -not $process.HasExited) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }

        Remove-Item $stackStateFile -ErrorAction SilentlyContinue
    }
}

