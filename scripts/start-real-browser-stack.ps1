param(
    [int]$FrontendPort = 5173,
    [int]$BackendPort = 8081
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runner = Join-Path $PSScriptRoot 'run-real-browser-e2e.ps1'

if (-not (Test-Path $runner)) {
    throw "未找到脚本: $runner"
}

& $runner -FrontendPort $FrontendPort -BackendPort $BackendPort -SkipPlaywright -KeepRunning
