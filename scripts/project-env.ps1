Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "node-tooling.ps1")

$script:ProjectRoot = Split-Path $PSScriptRoot -Parent
$script:BackendRoot = Join-Path $script:ProjectRoot "backend"
$script:FrontendRoot = Join-Path $script:ProjectRoot "frontend"

function Set-ProjectUtf8Environment {
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $global:OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    chcp 65001 | Out-Null
}

function Get-ProjectRoot {
    return $script:ProjectRoot
}

function Get-BackendRoot {
    return $script:BackendRoot
}

function Get-FrontendRoot {
    return $script:FrontendRoot
}

function Resolve-ProjectNodeTooling {
    return Resolve-NodeTooling -ProjectRoot $script:ProjectRoot -FrontendRoot $script:FrontendRoot
}

function Write-ProjectNodeToolingDiagnostics {
    param([pscustomobject]$Tooling = $(Resolve-ProjectNodeTooling))

    Write-NodeToolingDiagnostics -Tooling $Tooling
}

function Initialize-ProjectNodeTooling {
    param([pscustomobject]$Tooling = $(Resolve-ProjectNodeTooling))

    return Initialize-NodeToolingBootstrap -Tooling $Tooling
}

function Resolve-ProjectNodeInvocation {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("node", "npm", "npx")]
        [string]$CommandName,
        [string[]]$Arguments = @(),
        [pscustomobject]$Tooling = $(Resolve-ProjectNodeTooling)
    )

    return Resolve-NodeCommandInvocation -CommandName $CommandName -Arguments $Arguments -Tooling $Tooling
}

function Invoke-ProjectNodeInvocation {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Invocation,
        [string]$WorkingDirectory = $script:FrontendRoot
    )

    Set-ProjectUtf8Environment
    Invoke-ResolvedNodeCommand -Invocation $Invocation -WorkingDirectory $WorkingDirectory
}

function Invoke-ProjectCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [string[]]$Arguments = @(),

        [string]$WorkingDirectory = $script:ProjectRoot
    )

    Set-ProjectUtf8Environment
    Push-Location $WorkingDirectory
    try {
        & $Command @Arguments
        return $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

function Invoke-ProjectMaven {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Goals,

        [string]$WorkingDirectory = $script:BackendRoot
    )

    return Invoke-ProjectCommand -Command "mvn" -Arguments $Goals -WorkingDirectory $WorkingDirectory
}

function Start-BackendMySql {
    return Invoke-ProjectMaven -Goals @("spring-boot:run")
}

function Start-BackendLocalFallback {
    return Invoke-ProjectMaven -Goals @("spring-boot:run", "-Dspring-boot.run.profiles=local")
}
