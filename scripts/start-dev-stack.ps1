[CmdletBinding()]
param(
    [int]$BackendBasePort = 8080,
    [int]$FrontendBasePort = 5173,
    [int]$MaxPortAttempts = 20,
    [int]$SmokeTestSeconds = 0,
    [switch]$AllowPortFallback,
    [switch]$ReleasePorts,
    [int]$BackendReadyAttempts = 120,
    [int]$FrontendReadyAttempts = 60
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path $PSScriptRoot -Parent
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'

. (Join-Path $PSScriptRoot 'node-tooling.ps1')

function Test-PortAvailable {
    param([Parameter(Mandatory = $true)][int]$Port)

    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) {
            $listener.Stop()
        }
    }
}

function Find-AvailablePort {
    param(
        [Parameter(Mandatory = $true)][int]$StartPort,
        [Parameter(Mandatory = $true)][int]$Attempts
    )

    for ($port = $StartPort; $port -lt ($StartPort + $Attempts); $port++) {
        if (Test-PortAvailable -Port $port) {
            return $port
        }
    }

    throw "No available port found from $StartPort to $($StartPort + $Attempts - 1)."
}

function Get-ListeningProcessIds {
    param([int[]]$Ports)

    $ids = [System.Collections.Generic.HashSet[int]]::new()
    foreach ($port in $Ports) {
        $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
        foreach ($connection in $connections) {
            [void]$ids.Add([int]$connection.OwningProcess)
        }
    }

    if ($ids.Count -eq 0 -and (Get-Command 'netstat.exe' -ErrorAction SilentlyContinue)) {
        $portSet = [System.Collections.Generic.HashSet[int]]::new()
        foreach ($port in $Ports) {
            [void]$portSet.Add($port)
        }

        $lines = netstat.exe -ano
        foreach ($line in $lines) {
            $parts = (($line -replace '^\s+', '') -split '\s+')
            if ($parts.Length -lt 5 -or $parts[0] -ne 'TCP' -or $parts[3] -ne 'LISTENING') {
                continue
            }

            $localAddress = $parts[1]
            $portText = ($localAddress -replace '^\[.*\]:(\d+)$', '$1' -replace '^.*:(\d+)$', '$1')
            $parsedPort = 0
            if ([int]::TryParse($portText, [ref]$parsedPort) -and $portSet.Contains($parsedPort)) {
                [void]$ids.Add([int]$parts[4])
            }
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
        return 'reserved or unavailable; no listening PID was visible to this shell'
    }

    $processList = foreach ($processId in $processIds | Sort-Object -Unique) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            $path = if ($process.Path) { " $($process.Path)" } else { '' }
            "$($process.ProcessName)($processId)$path"
        } else {
            "PID $processId"
        }
    }

    return ($processList -join ', ')
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

function ConvertTo-ProcessArgument {
    param([Parameter(Mandatory = $true)][string]$Argument)

    if ($Argument -notmatch '[\s"]') {
        return $Argument
    }

    return '"' + ($Argument -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
}

function Join-ProcessArguments {
    param([string[]]$Arguments = @())

    return (@($Arguments) | ForEach-Object { ConvertTo-ProcessArgument -Argument $_ }) -join ' '
}

function Start-LoggedProcess {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [hashtable]$Environment = @()
    )

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    if ($FilePath -match '\.(cmd|bat)$') {
        $Arguments = @('/c', $FilePath) + $Arguments
        $FilePath = 'cmd.exe'
    }

    $startInfo.FileName = $FilePath
    $startInfo.Arguments = Join-ProcessArguments -Arguments $Arguments
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $startInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $environmentBlock = $startInfo.Environment
    if (-not $environmentBlock) {
        $environmentBlock = $startInfo.EnvironmentVariables
    }

    foreach ($key in $Environment.Keys) {
        $environmentBlock[$key] = [string]$Environment[$key]
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    $process.EnableRaisingEvents = $true

    $outputAction = {
        if ($EventArgs.Data) {
            Write-Host "[$($Event.MessageData)] $($EventArgs.Data)"
        }
    }

    $errorAction = {
        if ($EventArgs.Data) {
            Write-Host "[$($Event.MessageData)] $($EventArgs.Data)"
        }
    }

    [void](Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action $outputAction -MessageData $Name)
    [void](Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action $errorAction -MessageData $Name)

    [void]$process.Start()
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()

    return $process
}

function Resolve-RequiredCommandPath {
    param([Parameter(Mandatory = $true)][string]$CommandName)

    $command = Get-Command $CommandName -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $command) {
        throw "Unable to resolve required command '$CommandName'. Check PATH or install the required tool."
    }

    return $command.Source
}

function Stop-ProcessTree {
    param([Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process)

    $Process.Refresh()
    if ($Process.HasExited) {
        return
    }

    Write-Host "Stopping process tree $($Process.Id)..."
    if (Get-Command 'taskkill.exe' -ErrorAction SilentlyContinue) {
        & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Host
        Start-Sleep -Milliseconds 500
        $Process.Refresh()
        if ($Process.HasExited) {
            return
        }
    }

    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    $Process.Refresh()
    if (-not $Process.HasExited) {
        & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Host
    }
}

function Stop-PortListeners {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $processIds = @(Get-ListeningProcessIds -Ports @($Port) | Sort-Object -Unique)
    if ($processIds.Count -eq 0) {
        return
    }

    foreach ($processId in $processIds) {
        if ($processId -le 4) {
            throw "Refusing to stop system PID $processId on $Name port $Port."
        }

        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        $processLabel = if ($process) {
            $path = if ($process.Path) { " $($process.Path)" } else { '' }
            "$($process.ProcessName)($processId)$path"
        } else {
            "PID $processId"
        }

        Write-Host "Releasing $Name port ${Port}: stopping $processLabel"
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Wait-Process -Id $processId -Timeout 8 -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Stop-Process failed for PID ${processId}: $($_.Exception.Message). Trying taskkill..."
            & taskkill.exe /PID $processId /T /F 2>$null | Out-Host
        }
    }

    for ($i = 0; $i -lt 20; $i++) {
        if (Test-PortAvailable -Port $Port) {
            Write-Host "$Name port $Port released."
            return
        }

        Start-Sleep -Milliseconds 500
    }

    throw "$Name port $Port is still unavailable after stopping listeners: $(Get-PortProcessSummary -Port $Port)."
}

function Wait-HttpReady {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$Attempts = 120,
        [System.Diagnostics.Process[]]$Processes = @()
    )

    for ($i = 0; $i -lt $Attempts; $i++) {
        foreach ($process in @($Processes)) {
            if ($process -and $process.HasExited) {
                throw "Process $($process.Id) exited with code $($process.ExitCode) while waiting for $Url."
            }
        }

        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200) {
                return
            }
        } catch {
            Start-Sleep -Seconds 1
            continue
        }

        Start-Sleep -Seconds 1
    }

    throw "Timed out waiting for $Url after $Attempts attempts."
}

if ($ReleasePorts -and $AllowPortFallback) {
    throw 'Do not combine -ReleasePorts with -AllowPortFallback. Demo startup should use fixed ports; temporary debugging can use fallback ports.'
}

if ($AllowPortFallback) {
    $backendPort = Find-AvailablePort -StartPort $BackendBasePort -Attempts $MaxPortAttempts
    $frontendPort = Find-AvailablePort -StartPort $FrontendBasePort -Attempts $MaxPortAttempts
} else {
    $backendPort = $BackendBasePort
    $frontendPort = $FrontendBasePort
}

$backendUrl = "http://127.0.0.1:$backendPort/api"
$frontendUrl = "http://127.0.0.1:$frontendPort"
$backendHealthUrl = "$backendUrl/products?pageNo=0&pageSize=1"

$reuseBackend = $false
$reuseFrontend = $false

if ($ReleasePorts) {
    Stop-PortListeners -Port $frontendPort -Name 'frontend'
    Stop-PortListeners -Port $backendPort -Name 'backend'
}

if (-not $AllowPortFallback -and -not (Test-PortAvailable -Port $backendPort)) {
    if (Test-ProjectBackendInstance -Port $backendPort) {
        $reuseBackend = $true
    } else {
        throw "Backend port $backendPort is occupied by a non-project process: $(Get-PortProcessSummary -Port $backendPort). Stop it, or rerun with -AllowPortFallback for temporary debugging."
    }
}

if (-not $AllowPortFallback -and -not (Test-PortAvailable -Port $frontendPort)) {
    if (Test-ProjectFrontendInstance -Port $frontendPort) {
        $reuseFrontend = $true
    } else {
        throw "Frontend port $frontendPort is occupied by a non-project process: $(Get-PortProcessSummary -Port $frontendPort). Stop it, or rerun with -AllowPortFallback for temporary debugging."
    }
}

$processes = @()
$startedBackendProcess = $null
$startedFrontendProcess = $null
try {
    Write-Host "Backend:       $backendUrl"
    Write-Host "Frontend:      $frontendUrl"
    Write-Host "Frontend proxy: http://127.0.0.1:$backendPort"
    if (-not $AllowPortFallback) {
        Write-Host 'Port policy:   strict fixed ports. Use -AllowPortFallback only for temporary debugging.'
    }
    if ($ReleasePorts) {
        Write-Host 'Port cleanup:  enabled. Existing listeners on the selected fixed ports were stopped before startup.'
    }

    if ($reuseBackend) {
        Write-Host "Reusing existing project backend on $backendUrl."
    } else {
        $mavenCommand = Resolve-RequiredCommandPath -CommandName 'mvn'
        Write-Host "Starting backend on $backendUrl..."
        $startedBackendProcess = Start-LoggedProcess `
            -Name 'backend' `
            -FilePath $mavenCommand `
            -Arguments @('spring-boot:run') `
            -WorkingDirectory $backendRoot `
            -Environment @{
                SERVER_PORT = $backendPort
                JPA_DDL_AUTO = 'none'
            }
        $processes += $startedBackendProcess
    }

    Wait-HttpReady -Url $backendHealthUrl -Attempts $BackendReadyAttempts -Processes @($processes)
    Write-Host "Backend ready:  $backendHealthUrl"

    if ($reuseFrontend) {
        Write-Host "Reusing existing project frontend on $frontendUrl."
    } else {
        $tooling = Resolve-NodeTooling -ProjectRoot $projectRoot -FrontendRoot $frontendRoot
        Write-NodeToolingDiagnostics -Tooling $tooling
        $viteInvocation = Resolve-NodeCommandInvocation -CommandName 'npx' -Arguments @(
            'vite',
            '--host',
            '127.0.0.1',
            '--port',
            [string]$frontendPort
        ) -Tooling $tooling

        Write-Host "Starting frontend on $frontendUrl..."
        $startedFrontendProcess = Start-LoggedProcess `
            -Name 'frontend' `
            -FilePath $viteInvocation.CommandPath `
            -Arguments $viteInvocation.Arguments `
            -WorkingDirectory $frontendRoot `
            -Environment @{
                VITE_PROXY_TARGET = "http://127.0.0.1:$backendPort"
            }
        $processes += $startedFrontendProcess
    }

    Wait-HttpReady -Url $frontendUrl -Attempts $FrontendReadyAttempts -Processes @($processes)

    Write-Host ''
    Write-Host "Open: $frontendUrl"
    if ($processes.Count -gt 0) {
        Write-Host 'Press Ctrl+C in this run window to stop processes started by this script.'
    } else {
        Write-Host 'Both ports are already served by existing project processes. Ctrl+C only exits this watcher.'
    }

    $startedAt = Get-Date
    while ($true) {
        Start-Sleep -Seconds 1
        if ($SmokeTestSeconds -gt 0 -and ((Get-Date) - $startedAt).TotalSeconds -ge $SmokeTestSeconds) {
            Write-Host "Smoke test window elapsed after $SmokeTestSeconds seconds."
            break
        }

        $exited = @($processes | Where-Object { $_.HasExited })
        if ($exited.Count -gt 0) {
            foreach ($process in $exited) {
                Write-Host "Process $($process.Id) exited with code $($process.ExitCode)."
            }
            break
        }
    }
} finally {
    foreach ($process in $processes) {
        if ($process -and -not $process.HasExited) {
            Stop-ProcessTree -Process $process
        }
    }

    if ($startedFrontendProcess) {
        Stop-PortListeners -Port $frontendPort -Name 'frontend'
    }
    if ($startedBackendProcess) {
        Stop-PortListeners -Port $backendPort -Name 'backend'
    }
}
