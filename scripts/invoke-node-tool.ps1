[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('node', 'npm', 'npx')]
    [string]$Tool,
    [Parameter()]
    [string]$FrontendRoot = '',
    [Parameter()]
    [switch]$EmitDiagnostics,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'node-tooling.ps1')

$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $FrontendRoot) {
    $FrontendRoot = Join-Path $projectRoot 'frontend'
}

$tooling = Resolve-NodeTooling -ProjectRoot $projectRoot -FrontendRoot $FrontendRoot
if ($EmitDiagnostics) {
    Write-NodeToolingDiagnostics -Tooling $tooling
}

$invocation = Resolve-NodeCommandInvocation -CommandName $Tool -Arguments $Arguments -Tooling $tooling
Invoke-ResolvedNodeCommand -Invocation $invocation -WorkingDirectory $FrontendRoot
exit $LASTEXITCODE
