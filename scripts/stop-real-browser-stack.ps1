param(
    [int]$FrontendPort = 5178,
    [int]$BackendPort = 8085
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path $PSScriptRoot -Parent
$stackStateFile = Join-Path $projectRoot 'tmp-browser-stack.json'

function Get-ListeningProcessIds {
    param([int[]]$Ports)

    $ids = [System.Collections.Generic.HashSet[int]]::new()
    foreach ($port in $Ports) {
        $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
        foreach ($connection in $connections) {
            [void]$ids.Add([int]$connection.OwningProcess)
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

function Test-ManagedProcessIdentity {
    param(
        [int]$ProcessId,
        [int]$ExpectedPort,
        [string[]]$CommandMarkers
    )

    if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        return $false
    }

    if (@(Get-ListeningProcessIds -Ports @($ExpectedPort)) -contains $ProcessId) {
        return $true
    }

    $commandLine = Get-ProcessCommandLine -ProcessId $ProcessId
    if (-not $commandLine) {
        return $false
    }

    if ($commandLine.Contains($projectRoot)) {
        return $true
    }

    foreach ($marker in $CommandMarkers) {
        if ($commandLine.Contains($marker)) {
            return $true
        }
    }

    return $false
}

if (Test-Path $stackStateFile) {
    try {
        $state = Get-Content $stackStateFile | ConvertFrom-Json
        $uploadRoot = if ($state.PSObject.Properties.Name -contains 'uploadRoot') { [string]$state.uploadRoot } else { '' }
        $managedTargets = @(
            [pscustomobject]@{
                Name = 'frontend'
                Pid = $state.frontendPid
                Port = if ($state.frontendPort) { [int]$state.frontendPort } else { $FrontendPort }
                Managed = if ($null -ne $state.frontendManaged) { [bool]$state.frontendManaged } else { $null -ne $state.frontendPid }
                CommandMarkers = @(
                    'vite.js',
                    "--port $FrontendPort",
                    "http://127.0.0.1:$FrontendPort",
                    "http://localhost:$FrontendPort"
                )
            }
            [pscustomobject]@{
                Name = 'backend'
                Pid = $state.backendPid
                Port = if ($state.backendPort) { [int]$state.backendPort } else { $BackendPort }
                Managed = if ($null -ne $state.backendManaged) { [bool]$state.backendManaged } else { $null -ne $state.backendPid }
                CommandMarkers = @(
                    'ShoppingMallApplication',
                    'spring-boot:run',
                    "--server.port=$BackendPort",
                    "http://127.0.0.1:$BackendPort/api",
                    "http://localhost:$BackendPort/api"
                )
            }
        )

        foreach ($target in $managedTargets) {
            if (-not $target.Managed -or -not $target.Pid) {
                continue
            }

            if (Test-ManagedProcessIdentity -ProcessId ([int]$target.Pid) -ExpectedPort ([int]$target.Port) -CommandMarkers $target.CommandMarkers) {
                try {
                    $process = Get-Process -Id ([int]$target.Pid) -ErrorAction Stop
                    Stop-Process -Id $process.Id -Force -ErrorAction Stop
                    Wait-Process -Id $process.Id -Timeout 5 -ErrorAction SilentlyContinue
                    Write-Host "Stopped managed $($target.Name) PID $($process.Id)."
                } catch {
                    Write-Host "Failed to stop managed $($target.Name) PID $($target.Pid): $($_.Exception.Message)"
                }
            } else {
                Write-Host "Skipping $($target.Name) PID $($target.Pid): state file does not match a current project-owned process."
            }
        }

        if ($uploadRoot) {
            $allowedRoot = Join-Path $projectRoot '.tmp\e2e-uploads'
            $resolvedAllowedRoot = [System.IO.Path]::GetFullPath($allowedRoot)
            $resolvedUploadRoot = [System.IO.Path]::GetFullPath($uploadRoot)
            if ($resolvedUploadRoot.StartsWith($resolvedAllowedRoot, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $resolvedUploadRoot)) {
                Remove-Item -LiteralPath $resolvedUploadRoot -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "Removed managed upload root $resolvedUploadRoot."
            }
        }
    } catch {
        Write-Host "Failed to parse or inspect ${stackStateFile}: $($_.Exception.Message)"
    }
    Remove-Item $stackStateFile -ErrorAction SilentlyContinue
    Write-Host "Stopped managed browser stack from $stackStateFile."
} else {
    Write-Host "No managed browser stack state found. No processes were stopped."
}

