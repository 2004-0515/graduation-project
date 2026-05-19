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

function Test-UploadDirectoryWriteProbe {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $probePath = Join-Path $Path (".write-probe-" + [Guid]::NewGuid().ToString("N") + ".tmp")
    try {
        [System.IO.File]::WriteAllText($probePath, "probe")
        [System.IO.File]::Delete($probePath)
        return $true
    } catch {
        try {
            if (Test-Path -LiteralPath $probePath) {
                Remove-Item -LiteralPath $probePath -Force -ErrorAction SilentlyContinue
            }
        } catch {
        }
        throw
    }
}

function Ensure-UploadDirectoriesWritable {
    param(
        [string]$UploadRoot = $(if ($env:FILE_UPLOAD_DIR) { $env:FILE_UPLOAD_DIR } else { Join-Path $script:ProjectRoot "uploads" }),
        [string[]]$RelativePaths = @(
            "avatars",
            "banners",
            "categories",
            "images",
            "music",
            "music/covers",
            "products",
            "promotions",
            "reviews",
            "videos"
        )
    )

    $isWindowsPlatform = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT

    foreach ($relativePath in $RelativePaths) {
        $targetPath = Join-Path $UploadRoot $relativePath

        try {
            [System.IO.Directory]::CreateDirectory($targetPath) | Out-Null
        } catch {
            throw "无法创建上传目录: $targetPath. $($_.Exception.Message)"
        }

        try {
            Test-UploadDirectoryWriteProbe -Path $targetPath | Out-Null
            continue
        } catch {
            $probeError = $_.Exception.Message
        }

        if (-not $isWindowsPlatform) {
            throw "上传目录不可写: $targetPath. error=$probeError"
        }

        $username = $env:USERNAME
        if (-not $username) {
            $username = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        }

        try {
            & icacls $targetPath /grant "${username}:(OI)(CI)M" | Out-Null
        } catch {
            throw "无法修复上传目录权限: $targetPath. probe_error=$probeError acl_error=$($_.Exception.Message)"
        }

        try {
            Test-UploadDirectoryWriteProbe -Path $targetPath | Out-Null
        } catch {
            throw "上传目录不可写: $targetPath. probe_error=$probeError retry_error=$($_.Exception.Message)"
        }
    }
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
