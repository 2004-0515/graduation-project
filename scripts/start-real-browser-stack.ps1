param(
    [int]$FrontendPort = 5178,
    [int]$BackendPort = 8085,
    [string]$DatabaseName = 'shopping_mall_test',
    [string]$DatabaseUser = 'root',
    [string]$DatabasePassword = '123456',
    [string]$DatabaseHost = '',
    [string]$DatabasePort = '',
    [Alias("SeedMediumDemoData")]
    [switch]$SeedGraduationData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'project-env.ps1')

$projectRoot = Get-ProjectRoot
$uploadsRoot = Join-Path $projectRoot 'uploads'
$tempRoot = Join-Path $projectRoot '.tmp'
$e2eUploadsRootBase = Join-Path $tempRoot 'e2e-uploads'
$stackStateFile = Join-Path $projectRoot 'tmp-browser-stack.json'
$runner = Join-Path $PSScriptRoot 'run-real-browser-e2e.ps1'
$seedScript = Join-Path $PSScriptRoot 'rebuild-graduation-data.ps1'

function New-StackUploadRoot {
    param(
        [string]$SourcePath,
        [string]$TargetBasePath
    )

    if (-not (Test-Path $SourcePath)) {
        throw "Upload asset source directory does not exist: $SourcePath"
    }

    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $TargetBasePath | Out-Null
    $runFolderName = 'run-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N')
    $targetPath = Join-Path $TargetBasePath $runFolderName
    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
    Copy-Item -Path (Join-Path $SourcePath '*') -Destination $targetPath -Recurse -Force
    return $targetPath
}

function Resolve-StackUploadRoot {
    if ($env:FILE_UPLOAD_DIR -and (Test-Path $env:FILE_UPLOAD_DIR)) {
        return [System.IO.Path]::GetFullPath($env:FILE_UPLOAD_DIR)
    }

    if (Test-Path $stackStateFile) {
        try {
            $state = Get-Content $stackStateFile | ConvertFrom-Json
            if (
                $state `
                -and $state.PSObject.Properties.Name -contains 'backendPid' `
                -and $state.PSObject.Properties.Name -contains 'uploadRoot' `
                -and $state.backendPid `
                -and (Get-Process -Id ([int]$state.backendPid) -ErrorAction SilentlyContinue) `
                -and $state.uploadRoot `
                -and (Test-Path $state.uploadRoot)
            ) {
                return [System.IO.Path]::GetFullPath([string]$state.uploadRoot)
            }
        } catch {
        }
    }

    return New-StackUploadRoot -SourcePath $uploadsRoot -TargetBasePath $e2eUploadsRootBase
}

if (-not (Test-Path $runner)) {
    throw "未找到脚本: $runner"
}

if ($SeedGraduationData) {
    if (-not (Test-Path $seedScript)) {
        throw "未找到脚本: $seedScript"
    }
    $env:FILE_UPLOAD_DIR = Resolve-StackUploadRoot
    Ensure-UploadDirectoriesWritable -UploadRoot $env:FILE_UPLOAD_DIR
    $seedArgs = @{
        Mode = 'execute'
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
        exit $LASTEXITCODE
    }
}

$env:DB_NAME = $DatabaseName
$env:DB_USERNAME = $DatabaseUser
$env:DB_PASSWORD = $DatabasePassword
$env:DB_HOST = $DatabaseHost
$env:DB_PORT = $DatabasePort

& $runner -FrontendPort $FrontendPort -BackendPort $BackendPort -SkipPlaywright -KeepRunning
