Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:ProjectRoot = Split-Path $PSScriptRoot -Parent
$script:BackendRoot = Join-Path $script:ProjectRoot "backend"
$script:FrontendRoot = Join-Path $script:ProjectRoot "frontend"

function Set-ProjectUtf8Environment {
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $global:OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    chcp 65001 | Out-Null

    $javaFlags = @("-Dfile.encoding=UTF-8", "-Dsun.jnu.encoding=UTF-8")
    $currentJavaToolOptions = @($env:JAVA_TOOL_OPTIONS -split "\s+" | Where-Object { $_ })
    $currentMavenOptions = @($env:MAVEN_OPTS -split "\s+" | Where-Object { $_ })

    $env:JAVA_TOOL_OPTIONS = (@($currentJavaToolOptions + $javaFlags) | Select-Object -Unique) -join " "
    $env:MAVEN_OPTS = (@($currentMavenOptions + $javaFlags) | Select-Object -Unique) -join " "
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
