param(
    [int]$FrontendPort = 5173,
    [int]$BackendPort = 8081
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path $PSScriptRoot -Parent
$stackStateFile = Join-Path $projectRoot 'tmp-browser-stack.json'

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
            $commandLine.Contains('vite.js') -or
            $commandLine.Contains('spring-boot:run')

        if (-not $isProjectProcess) {
            continue
        }

        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            Stop-Process -Id $processId -Force
        }
    }
}

if (Test-Path $stackStateFile) {
    try {
        $state = Get-Content $stackStateFile | ConvertFrom-Json
        foreach ($pid in @($state.frontendPid, $state.backendPid)) {
            if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                Stop-Process -Id $pid -Force
            }
        }
    } catch {
    }
}

Stop-ProjectProcessOnPorts -Ports @($FrontendPort, $BackendPort)
Remove-Item $stackStateFile -ErrorAction SilentlyContinue

Write-Host "Stopped project browser stack on ports $FrontendPort and $BackendPort."
