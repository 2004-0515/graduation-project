Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:IsWindowsNodeTooling = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT

function Get-WindowsProgramFilesRoots {
    if (-not $script:IsWindowsNodeTooling) {
        return @()
    }

    return @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramW6432, 'C:\Program Files', 'C:\Program Files (x86)') |
        Where-Object { $_ } |
        Select-Object -Unique
}

function Get-WindowsLocalAppDataRoots {
    if (-not $script:IsWindowsNodeTooling) {
        return @()
    }

    $roots = @($env:LocalAppData)
    if ($env:USERPROFILE) {
        $roots += (Join-Path $env:USERPROFILE 'AppData\Local')
    }

    return @($roots | Where-Object { $_ } | Select-Object -Unique)
}

function Join-NodeToolPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BasePath,
        [Parameter(Mandatory = $true)]
        [string[]]$Segments
    )

    $currentPath = $BasePath
    foreach ($segment in $Segments) {
        $currentPath = Join-Path $currentPath $segment
    }

    return $currentPath
}

function New-NodeToolResolution {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Tool,
        [bool]$Available = $false,
        [string]$CommandPath = '',
        [string[]]$ArgumentsPrefix = @(),
        [string]$Source = 'unresolved',
        [string]$Resolution = 'unresolved',
        [bool]$RepoLocalFallback = $false,
        [string]$DetectedCommandPath = '',
        [string]$FailureKind = '',
        [string]$FailureDetail = ''
    )

    return [pscustomobject]@{
        Tool = $Tool
        Available = $Available
        CommandPath = $CommandPath
        ArgumentsPrefix = @($ArgumentsPrefix)
        Source = $Source
        Resolution = $Resolution
        RepoLocalFallback = $RepoLocalFallback
        DetectedCommandPath = $DetectedCommandPath
        FailureKind = $FailureKind
        FailureDetail = $FailureDetail
    }
}

function New-NodeToolProbeResult {
    param(
        [bool]$Success = $false,
        [int]$ExitCode = 0,
        [string]$FailureKind = '',
        [string]$FailureDetail = ''
    )

    return [pscustomobject]@{
        Success = $Success
        ExitCode = $ExitCode
        FailureKind = $FailureKind
        FailureDetail = $FailureDetail
    }
}

function Get-NodeToolProbeFailureKind {
    param(
        [Parameter(Mandatory = $true)]
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    $message = [string]$ErrorRecord.Exception.Message
    if ($message -match '拒绝访问|Access is denied') {
        return 'access-denied'
    }

    if ($message -match 'StandardOutputEncoding is only supported when standard output is redirected') {
        return 'host-redirection'
    }

    return 'command-start-failed'
}

function Get-NodeToolProbeFailureDetail {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FailureKind,
        [System.Management.Automation.ErrorRecord]$ErrorRecord,
        [int]$ExitCode = 0
    )

    switch ($FailureKind) {
        'access-denied' {
            return 'access denied by current session'
        }
        'host-redirection' {
            return 'PowerShell native-command redirection failure'
        }
        'nonzero-exit' {
            return "probe exited with code $ExitCode"
        }
        default {
            if ($ErrorRecord) {
                $firstLine = (([string]$ErrorRecord.Exception.Message) -split "(`r`n|`n|`r)")[0].Trim()
                if ($firstLine) {
                    return $firstLine
                }
            }

            return $FailureKind
        }
    }
}

function Get-NodeToolProbeFailurePriority {
    param([string]$FailureKind)

    switch ($FailureKind) {
        'access-denied' { return 400 }
        'host-redirection' { return 300 }
        'command-start-failed' { return 200 }
        'nonzero-exit' { return 100 }
        default { return 0 }
    }
}

function Select-PreferredNodeToolFailure {
    param(
        [pscustomobject]$CurrentFailure,
        [pscustomobject]$CandidateFailure
    )

    if (-not $CandidateFailure) {
        return $CurrentFailure
    }

    if (-not $CurrentFailure) {
        return $CandidateFailure
    }

    $currentPriority = Get-NodeToolProbeFailurePriority -FailureKind $CurrentFailure.FailureKind
    $candidatePriority = Get-NodeToolProbeFailurePriority -FailureKind $CandidateFailure.FailureKind

    if ($candidatePriority -gt $currentPriority) {
        return $CandidateFailure
    }

    if ($candidatePriority -eq $currentPriority -and $CandidateFailure.DetectedCommandPath -and -not $CurrentFailure.DetectedCommandPath) {
        return $CandidateFailure
    }

    return $CurrentFailure
}

function Test-NodeToolInvocationDetailed {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandPath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = ''
    )

    $pushedLocation = $false
    $hadPreviousExitCode = Test-Path Variable:\global:LASTEXITCODE
    $previousExitCode = if ($hadPreviousExitCode) { $global:LASTEXITCODE } else { $null }
    try {
        if ($WorkingDirectory) {
            Push-Location $WorkingDirectory
            $pushedLocation = $true
        }

        $null = & $CommandPath @Arguments 2>&1
        $currentExitCode = Get-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue
        $exitCode = if ($currentExitCode) { [int]$currentExitCode.Value } else { 0 }
        if ($exitCode -eq 0) {
            return New-NodeToolProbeResult -Success $true -ExitCode 0
        }

        return New-NodeToolProbeResult `
            -ExitCode $exitCode `
            -FailureKind 'nonzero-exit' `
            -FailureDetail (Get-NodeToolProbeFailureDetail -FailureKind 'nonzero-exit' -ExitCode $exitCode)
    } catch {
        $failureKind = Get-NodeToolProbeFailureKind -ErrorRecord $_
        return New-NodeToolProbeResult `
            -FailureKind $failureKind `
            -FailureDetail (Get-NodeToolProbeFailureDetail -FailureKind $failureKind -ErrorRecord $_)
    } finally {
        if ($pushedLocation) {
            Pop-Location
        }

        if ($hadPreviousExitCode) {
            $global:LASTEXITCODE = $previousExitCode
        } else {
            Remove-Variable -Name LASTEXITCODE -Scope Global -ErrorAction SilentlyContinue
        }
    }
}

function Test-NodeToolInvocation {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandPath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = ''
    )

    return (Test-NodeToolInvocationDetailed -CommandPath $CommandPath -Arguments $Arguments -WorkingDirectory $WorkingDirectory).Success
}

function Test-IsNodeToolShimCandidate {
    param([string]$ResolvedPath)

    if (-not $ResolvedPath -or -not $env:NODE_TOOLING_SHIM_DIR) {
        return $false
    }

    try {
        $shimRoot = [IO.Path]::GetFullPath($env:NODE_TOOLING_SHIM_DIR)
        $candidatePath = [IO.Path]::GetFullPath($ResolvedPath)
        return $candidatePath.StartsWith($shimRoot, [System.StringComparison]::OrdinalIgnoreCase)
    } catch {
        return $false
    }
}

function Test-NeedsRepoLocalCliFallback {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Tooling,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$NpxResolution
    )

    if (-not $script:IsWindowsNodeTooling) {
        return $false
    }

    if (-not $Tooling.FrontendRoot -or $Tooling.FrontendRoot -notmatch '\s') {
        return $false
    }

    return $NpxResolution.CommandPath -like '*.cmd'
}

function Resolve-ToolExecutableCandidate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [object[]]$Candidates,
        [string[]]$ProbeArguments = @()
    )

    $bestFailure = $null
    foreach ($candidate in $Candidates) {
        if (-not $candidate) {
            continue
        }

        $value = ''
        $source = ''
        $resolution = ''

        if ($candidate -is [string]) {
            $value = $candidate
            $source = $candidate
            $resolution = 'candidate'
        } else {
            $value = [string]$candidate.Value
            $source = [string]$candidate.Source
            $resolution = [string]$candidate.Resolution
        }

        if (-not $value) {
            continue
        }

        if (Test-Path $value) {
            $resolvedPath = (Resolve-Path $value).Path
            if (Test-IsNodeToolShimCandidate -ResolvedPath $resolvedPath) {
                continue
            }

            if ($ProbeArguments.Count -gt 0) {
                $probeResult = Test-NodeToolInvocationDetailed -CommandPath $resolvedPath -Arguments $ProbeArguments
                if (-not $probeResult.Success) {
                    $bestFailure = Select-PreferredNodeToolFailure -CurrentFailure $bestFailure -CandidateFailure ([pscustomobject]@{
                        Source = $source
                        Resolution = $resolution
                        DetectedCommandPath = $resolvedPath
                        FailureKind = $probeResult.FailureKind
                        FailureDetail = $probeResult.FailureDetail
                    })
                    continue
                }
            }

            return New-NodeToolResolution -Tool $Tool -Available $true -CommandPath $resolvedPath -Source $source -Resolution $resolution
        }

        $command = Get-Command $value -ErrorAction SilentlyContinue
        if ($command) {
            $commandSource = if ($command.PSObject.Properties.Name -contains 'Source') { [string]$command.Source } else { '' }
            $commandPathProperty = if ($command.PSObject.Properties.Name -contains 'Path') { [string]$command.Path } else { '' }
            $commandPath = if ($commandSource) { $commandSource } elseif ($commandPathProperty) { $commandPathProperty } else { $value }
            if ($commandSource -and (Test-IsNodeToolShimCandidate -ResolvedPath $commandSource)) {
                continue
            }

            if ($ProbeArguments.Count -gt 0) {
                $probeResult = Test-NodeToolInvocationDetailed -CommandPath $commandPath -Arguments $ProbeArguments
                if (-not $probeResult.Success) {
                    $bestFailure = Select-PreferredNodeToolFailure -CurrentFailure $bestFailure -CandidateFailure ([pscustomobject]@{
                        Source = $source
                        Resolution = $resolution
                        DetectedCommandPath = $commandPath
                        FailureKind = $probeResult.FailureKind
                        FailureDetail = $probeResult.FailureDetail
                    })
                    continue
                }
            }

            return New-NodeToolResolution -Tool $Tool -Available $true -CommandPath $commandPath -Source $source -Resolution $resolution
        }
    }

    if ($bestFailure) {
        return New-NodeToolResolution `
            -Tool $Tool `
            -Source $bestFailure.Source `
            -Resolution $bestFailure.Resolution `
            -DetectedCommandPath $bestFailure.DetectedCommandPath `
            -FailureKind $bestFailure.FailureKind `
            -FailureDetail $bestFailure.FailureDetail
        }

    return New-NodeToolResolution -Tool $Tool
}

function Resolve-NodeCliScriptCandidate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$NodeResolution,
        [Parameter(Mandatory = $true)]
        [object[]]$Candidates,
        [string[]]$LeadingArguments = @(),
        [bool]$RepoLocalFallback = $false,
        [string[]]$ProbeArguments = @('--version')
    )

    if (-not $NodeResolution.Available) {
        return New-NodeToolResolution -Tool $Tool
    }

    $bestFailure = $null
    foreach ($candidate in $Candidates) {
        if (-not $candidate) {
            continue
        }

        $value = ''
        $source = ''
        $resolution = ''

        if ($candidate -is [string]) {
            $value = $candidate
            $source = $candidate
            $resolution = 'candidate'
        } else {
            $value = [string]$candidate.Value
            $source = [string]$candidate.Source
            $resolution = [string]$candidate.Resolution
        }

        if (-not $value -or -not (Test-Path $value)) {
            continue
        }

        $resolvedScriptPath = (Resolve-Path $value).Path
        $probeInvocationArguments = @($LeadingArguments) + @($resolvedScriptPath) + @($ProbeArguments)
        if ($ProbeArguments.Count -gt 0) {
            $probeResult = Test-NodeToolInvocationDetailed -CommandPath $NodeResolution.CommandPath -Arguments $probeInvocationArguments
            if (-not $probeResult.Success) {
                $bestFailure = Select-PreferredNodeToolFailure -CurrentFailure $bestFailure -CandidateFailure ([pscustomobject]@{
                    Source = $source
                    Resolution = $resolution
                    DetectedCommandPath = $resolvedScriptPath
                    FailureKind = $probeResult.FailureKind
                    FailureDetail = $probeResult.FailureDetail
                })
                continue
            }
        }

        return New-NodeToolResolution `
            -Tool $Tool `
            -Available $true `
            -CommandPath $NodeResolution.CommandPath `
            -ArgumentsPrefix (@($LeadingArguments) + @($resolvedScriptPath)) `
            -Source $source `
            -Resolution $resolution `
            -RepoLocalFallback:$RepoLocalFallback
    }

    if ($bestFailure) {
        return New-NodeToolResolution `
            -Tool $Tool `
            -Source $bestFailure.Source `
            -Resolution $bestFailure.Resolution `
            -RepoLocalFallback:$RepoLocalFallback `
            -DetectedCommandPath $bestFailure.DetectedCommandPath `
            -FailureKind $bestFailure.FailureKind `
            -FailureDetail $bestFailure.FailureDetail
    }

    return New-NodeToolResolution -Tool $Tool
}

function Get-NodeCommonCandidates {
    $candidates = @()

    if ($script:IsWindowsNodeTooling) {
        $programFiles = Get-WindowsProgramFilesRoots
        foreach ($basePath in $programFiles | Select-Object -Unique) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath 'nodejs\node.exe')
                Source = "common-install:$basePath\\nodejs\\node.exe"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in Get-WindowsLocalAppDataRoots) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath 'Programs\nodejs\node.exe')
                Source = "common-install:$basePath\\Programs\\nodejs\\node.exe"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in @($env:NVM_SYMLINK, $env:NVM_HOME) | Where-Object { $_ } | Select-Object -Unique) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath 'node.exe')
                Source = "common-install:$basePath\\node.exe"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in Get-WindowsLocalAppDataRoots) {
            $cursorHelper = Join-Path $basePath 'Programs\cursor\resources\app\resources\helpers\node.exe'
            $candidates += [pscustomobject]@{
                Value = $cursorHelper
                Source = "common-install:$cursorHelper"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in $programFiles) {
            $cursorHelper = Join-Path $basePath 'cursor\resources\app\resources\helpers\node.exe'
            $candidates += [pscustomobject]@{
                Value = $cursorHelper
                Source = "common-install:$cursorHelper"
                Resolution = 'common-install'
            }
        }
    } else {
        foreach ($path in @('/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node', '/snap/bin/node')) {
            $candidates += [pscustomobject]@{
                Value = $path
                Source = "common-install:$path"
                Resolution = 'common-install'
            }
        }
    }

    return @($candidates)
}

function Get-PackageManagerExecutableCandidates {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('npm', 'npx')]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$NodeResolution
    )

    $candidates = @()
    $overrideName = if ($Tool -eq 'npm') { 'NPM_CMD' } else { 'NPX_CMD' }
    $overrideValue = [Environment]::GetEnvironmentVariable($overrideName)
    if ($overrideValue) {
        $candidates += [pscustomobject]@{
            Value = $overrideValue
            Source = "env:$overrideName"
            Resolution = 'env-override'
        }
    }

    $pathCommand = if ($script:IsWindowsNodeTooling) { "$Tool.cmd" } else { $Tool }
    $candidates += [pscustomobject]@{
        Value = $Tool
        Source = "PATH:$Tool"
        Resolution = 'path-command'
    }
    if ($pathCommand -ne $Tool) {
        $candidates += [pscustomobject]@{
            Value = $pathCommand
            Source = "PATH:$pathCommand"
            Resolution = 'path-command'
        }
    }

    if ($NodeResolution.Available) {
        $nodeDir = Split-Path $NodeResolution.CommandPath -Parent
        $nodeAdjacentCandidates = if ($script:IsWindowsNodeTooling) {
            @(
                (Join-Path $nodeDir $pathCommand),
                (Join-Path $nodeDir "$Tool.ps1"),
                (Join-Path $nodeDir $Tool)
            )
        } else {
            @(
                (Join-Path $nodeDir $Tool),
                (Join-Path $nodeDir $pathCommand)
            )
        }

        foreach ($candidatePath in $nodeAdjacentCandidates) {
            $candidates += [pscustomobject]@{
                Value = $candidatePath
                Source = "node-adjacent:$candidatePath"
                Resolution = 'node-adjacent'
            }
        }
    }

    if ($script:IsWindowsNodeTooling) {
        $programFiles = Get-WindowsProgramFilesRoots
        foreach ($basePath in $programFiles | Select-Object -Unique) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath "nodejs\$pathCommand")
                Source = "common-install:$basePath\\nodejs\\$pathCommand"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in Get-WindowsLocalAppDataRoots) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath "Programs\nodejs\$pathCommand")
                Source = "common-install:$basePath\\Programs\\nodejs\\$pathCommand"
                Resolution = 'common-install'
            }
        }

        foreach ($basePath in @($env:NVM_SYMLINK, $env:NVM_HOME) | Where-Object { $_ } | Select-Object -Unique) {
            $candidates += [pscustomobject]@{
                Value = (Join-Path $basePath $pathCommand)
                Source = "common-install:$basePath\\$pathCommand"
                Resolution = 'common-install'
            }
        }
    } else {
        foreach ($path in @("/usr/local/bin/$Tool", "/usr/bin/$Tool", "/opt/homebrew/bin/$Tool", "/snap/bin/$Tool")) {
            $candidates += [pscustomobject]@{
                Value = $path
                Source = "common-install:$path"
                Resolution = 'common-install'
            }
        }
    }

    return @($candidates)
}

function Get-NpmCliScriptCandidates {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('npm', 'npx')]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$NodeResolution
    )

    $candidates = @()
    if (-not $NodeResolution.Available) {
        return @($candidates)
    }

    $nodeDir = Split-Path $NodeResolution.CommandPath -Parent
    $cliRelativePaths = @()

    if ($Tool -eq 'npm') {
        $cliRelativePaths += @('node_modules', 'npm', 'bin', 'npm-cli.js') -join '/'
    } else {
        $cliRelativePaths += @(
            (@('node_modules', 'npm', 'bin', 'npx-cli.js') -join '/'),
            (@('node_modules', 'npm', 'bin', 'npm-cli.js') -join '/')
        )
    }

    foreach ($relativePath in $cliRelativePaths | Select-Object -Unique) {
        $segments = $relativePath -split '[/\\]'
        $candidates += [pscustomobject]@{
            Value = (Join-NodeToolPath -BasePath $nodeDir -Segments $segments)
            Source = "node-adjacent:$relativePath"
            Resolution = 'node-adjacent-cli'
        }
    }

    return @($candidates)
}

function Resolve-NodeRuntime {
    $candidates = @()
    if ($env:NODE_EXE) {
        $candidates += [pscustomobject]@{
            Value = $env:NODE_EXE
            Source = 'env:NODE_EXE'
            Resolution = 'env-override'
        }
    }

    $candidates += [pscustomobject]@{
        Value = 'node'
        Source = 'PATH:node'
        Resolution = 'path-command'
    }
    $candidates += Get-NodeCommonCandidates

    return Resolve-ToolExecutableCandidate -Tool 'node' -Candidates $candidates -ProbeArguments @('--version')
}

function Resolve-AvailableNodeRuntimes {
    $candidates = @()
    if ($env:NODE_EXE) {
        $candidates += [pscustomobject]@{
            Value = $env:NODE_EXE
            Source = 'env:NODE_EXE'
            Resolution = 'env-override'
        }
    }

    $candidates += [pscustomobject]@{
        Value = 'node'
        Source = 'PATH:node'
        Resolution = 'path-command'
    }
    $candidates += Get-NodeCommonCandidates

    $resolvedNodes = @()
    $seenPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($candidate in $candidates) {
        $resolution = Resolve-ToolExecutableCandidate -Tool 'node' -Candidates @($candidate) -ProbeArguments @('--version')
        if (-not $resolution.Available) {
            continue
        }

        if ($seenPaths.Add($resolution.CommandPath)) {
            $resolvedNodes += $resolution
        }
    }

    return @($resolvedNodes)
}

function Resolve-PackageManager {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('npm', 'npx')]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$NodeResolution
    )

    $commandResolution = Resolve-ToolExecutableCandidate -Tool $Tool -Candidates (Get-PackageManagerExecutableCandidates -Tool $Tool -NodeResolution $NodeResolution) -ProbeArguments @('--version')
    if ($commandResolution.Available) {
        return $commandResolution
    }

    $bestFailure = $null
    if ($commandResolution.FailureKind) {
        $bestFailure = [pscustomobject]@{
            Source = $commandResolution.Source
            Resolution = $commandResolution.Resolution
            DetectedCommandPath = if ($commandResolution.DetectedCommandPath) { $commandResolution.DetectedCommandPath } else { $commandResolution.CommandPath }
            FailureKind = $commandResolution.FailureKind
            FailureDetail = $commandResolution.FailureDetail
        }
    }

    foreach ($candidate in Get-NpmCliScriptCandidates -Tool $Tool -NodeResolution $NodeResolution) {
        $leadingArguments = @()
        if ($Tool -eq 'npx' -and [string]$candidate.Value -like '*npm-cli.js') {
            $leadingArguments = @('exec', '--')
        }

        $cliResolution = Resolve-NodeCliScriptCandidate -Tool $Tool -NodeResolution $NodeResolution -Candidates @($candidate) -LeadingArguments $leadingArguments
        if ($cliResolution.Available) {
            return $cliResolution
        }

        if ($cliResolution.FailureKind) {
            $bestFailure = Select-PreferredNodeToolFailure -CurrentFailure $bestFailure -CandidateFailure ([pscustomobject]@{
                Source = $cliResolution.Source
                Resolution = $cliResolution.Resolution
                DetectedCommandPath = if ($cliResolution.DetectedCommandPath) { $cliResolution.DetectedCommandPath } else { $cliResolution.CommandPath }
                FailureKind = $cliResolution.FailureKind
                FailureDetail = $cliResolution.FailureDetail
            })
        }
    }

    if ($bestFailure) {
        return New-NodeToolResolution `
            -Tool $Tool `
            -Source $bestFailure.Source `
            -Resolution $bestFailure.Resolution `
            -DetectedCommandPath $bestFailure.DetectedCommandPath `
            -FailureKind $bestFailure.FailureKind `
            -FailureDetail $bestFailure.FailureDetail
    }

    return New-NodeToolResolution -Tool $Tool
}

function Resolve-RepoLocalCliFallback {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('playwright', 'vite', 'vitest')]
        [string]$PackageName,
        [Parameter(Mandatory = $true)]
        [pscustomobject[]]$NodeResolutions,
        [Parameter(Mandatory = $true)]
        [string]$FrontendRoot
    )

    $relativePath = switch ($PackageName) {
        'playwright' { @('node_modules', '@playwright', 'test', 'cli.js') -join '/' }
        'vite' { @('node_modules', 'vite', 'bin', 'vite.js') -join '/' }
        'vitest' { @('node_modules', 'vitest', 'vitest.mjs') -join '/' }
    }

    $repoLocalCandidate = [pscustomobject]@{
        Value = (Join-NodeToolPath -BasePath $FrontendRoot -Segments ($relativePath -split '[/\\]'))
        Source = "repo-local:$relativePath"
        Resolution = 'repo-local-cli'
    }

    foreach ($nodeResolution in @($NodeResolutions)) {
        $resolvedFallback = Resolve-NodeCliScriptCandidate `
            -Tool $PackageName `
            -NodeResolution $nodeResolution `
            -Candidates @($repoLocalCandidate) `
            -RepoLocalFallback:$true

        if ($resolvedFallback.Available) {
            return $resolvedFallback
        }
    }

    return New-NodeToolResolution -Tool $PackageName
}

function Resolve-NodeTooling {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot,
        [Parameter(Mandatory = $true)]
        [string]$FrontendRoot
    )

    $availableNodeResolutions = Resolve-AvailableNodeRuntimes
    $nodeResolution = $availableNodeResolutions | Select-Object -First 1
    if (-not $nodeResolution) {
        $nodeResolution = New-NodeToolResolution -Tool 'node'
    }
    $npmResolution = Resolve-PackageManager -Tool 'npm' -NodeResolution $nodeResolution
    $npxResolution = Resolve-PackageManager -Tool 'npx' -NodeResolution $nodeResolution

    $repoLocal = [ordered]@{
        playwright = Resolve-RepoLocalCliFallback -PackageName 'playwright' -NodeResolutions $availableNodeResolutions -FrontendRoot $FrontendRoot
        vite = Resolve-RepoLocalCliFallback -PackageName 'vite' -NodeResolutions $availableNodeResolutions -FrontendRoot $FrontendRoot
        vitest = Resolve-RepoLocalCliFallback -PackageName 'vitest' -NodeResolutions $availableNodeResolutions -FrontendRoot $FrontendRoot
    }

    return [pscustomobject]@{
        ProjectRoot = $ProjectRoot
        FrontendRoot = $FrontendRoot
        Node = $nodeResolution
        Npm = $npmResolution
        Npx = $npxResolution
        RepoLocal = [pscustomobject]$repoLocal
    }
}

function Format-NodeToolResolution {
    param([pscustomobject]$Resolution)

    if (-not $Resolution.Available) {
        if ($Resolution.FailureKind) {
            $status = switch ($Resolution.FailureKind) {
                'access-denied' { 'blocked' }
                'host-redirection' { 'probe-error' }
                'nonzero-exit' { 'probe-failed' }
                default { 'unavailable' }
            }

            $parts = @($status)
            if ($Resolution.Source) {
                $parts += $Resolution.Source
            }

            $candidatePath = if ($Resolution.DetectedCommandPath) { $Resolution.DetectedCommandPath } elseif ($Resolution.CommandPath) { $Resolution.CommandPath } else { '' }
            if ($candidatePath) {
                $parts += $candidatePath
            }

            if ($Resolution.FailureDetail) {
                $parts += $Resolution.FailureDetail
            }

            return $parts -join ' | '
        }

        return 'unresolved'
    }

    $prefix = if ($Resolution.RepoLocalFallback) { 'repo-local fallback' } else { $Resolution.Resolution }
    $commandText = $Resolution.CommandPath
    if ($Resolution.ArgumentsPrefix.Count -gt 0) {
        $commandText = "$commandText $($Resolution.ArgumentsPrefix -join ' ')"
    }

    return "$prefix | $($Resolution.Source) | $commandText"
}

function Write-NodeToolingDiagnostics {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Tooling
    )

    Write-Host 'Node tooling preflight:'
    Write-Host "  node: $(Format-NodeToolResolution -Resolution $Tooling.Node)"
    Write-Host "  npm:  $(Format-NodeToolResolution -Resolution $Tooling.Npm)"
    Write-Host "  npx:  $(Format-NodeToolResolution -Resolution $Tooling.Npx)"

    $availableRepoFallbacks = @()
    foreach ($packageName in @('playwright', 'vite', 'vitest')) {
        $resolution = $Tooling.RepoLocal.$packageName
        if ($resolution.Available) {
            $availableRepoFallbacks += $packageName
        }
    }

    if ($availableRepoFallbacks.Count -gt 0) {
        Write-Host "  repo-local fallback available: $($availableRepoFallbacks -join ', ')"
    } else {
        Write-Host '  repo-local fallback available: none'
    }
}

function Resolve-NodeCommandInvocation {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('node', 'npm', 'npx')]
        [string]$CommandName,
        [string[]]$Arguments = @(),
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Tooling
    )

    switch ($CommandName) {
        'node' {
            if (-not $Tooling.Node.Available) {
                throw "Unable to resolve node. Current probe result: $(Format-NodeToolResolution -Resolution $Tooling.Node). Install Node.js, expose it in PATH, or set NODE_EXE."
            }

            return [pscustomobject]@{
                RequestedCommand = 'node'
                CommandPath = $Tooling.Node.CommandPath
                Arguments = @($Tooling.Node.ArgumentsPrefix) + @($Arguments)
                Source = $Tooling.Node.Source
                Resolution = $Tooling.Node.Resolution
                RepoLocalFallback = $Tooling.Node.RepoLocalFallback
            }
        }
        'npm' {
            if (-not $Tooling.Npm.Available) {
                throw "Unable to resolve npm. Current probe result: $(Format-NodeToolResolution -Resolution $Tooling.Npm). Set NPM_CMD or use a host shell where real npm is executable. npm fallback is not available for package installation commands."
            }

            return [pscustomobject]@{
                RequestedCommand = 'npm'
                CommandPath = $Tooling.Npm.CommandPath
                Arguments = @($Tooling.Npm.ArgumentsPrefix) + @($Arguments)
                Source = $Tooling.Npm.Source
                Resolution = $Tooling.Npm.Resolution
                RepoLocalFallback = $Tooling.Npm.RepoLocalFallback
            }
        }
        'npx' {
            if ($Arguments.Count -eq 0) {
                if ($Tooling.Npx.Available) {
                    return [pscustomobject]@{
                        RequestedCommand = 'npx'
                        CommandPath = $Tooling.Npx.CommandPath
                        Arguments = @($Tooling.Npx.ArgumentsPrefix) + @($Arguments)
                        Source = $Tooling.Npx.Source
                        Resolution = $Tooling.Npx.Resolution
                        RepoLocalFallback = $Tooling.Npx.RepoLocalFallback
                    }
                }

                throw "Unable to resolve npx. Current probe result: $(Format-NodeToolResolution -Resolution $Tooling.Npx). Set NPX_CMD or use a host shell where real npx is executable."
            }

            $packageName = [string]$Arguments[0]
            $repoLocalResolution = if ($Tooling.RepoLocal.PSObject.Properties.Name -contains $packageName) {
                $Tooling.RepoLocal.$packageName
            } else {
                $null
            }

            if ($Tooling.Npx.Available) {
                $npxInvocation = [pscustomobject]@{
                    RequestedCommand = "npx $packageName"
                    CommandPath = $Tooling.Npx.CommandPath
                    Arguments = @($Tooling.Npx.ArgumentsPrefix) + @($Arguments)
                    Source = $Tooling.Npx.Source
                    Resolution = $Tooling.Npx.Resolution
                    RepoLocalFallback = $Tooling.Npx.RepoLocalFallback
                }

                $directNpxUsable = $true
                if ($repoLocalResolution -and $repoLocalResolution.Available) {
                    if (Test-NeedsRepoLocalCliFallback -Tooling $Tooling -NpxResolution $Tooling.Npx) {
                        $directNpxUsable = $false
                    } else {
                        $probeArguments = @($Tooling.Npx.ArgumentsPrefix) + @($packageName, '--version')
                        $directNpxUsable = Test-NodeToolInvocation -CommandPath $Tooling.Npx.CommandPath -Arguments $probeArguments -WorkingDirectory $Tooling.FrontendRoot
                    }
                }

                if ($directNpxUsable) {
                    return $npxInvocation
                }
            }

            if ($repoLocalResolution -and $repoLocalResolution.Available) {
                return [pscustomobject]@{
                    RequestedCommand = "npx $packageName"
                    CommandPath = $repoLocalResolution.CommandPath
                    Arguments = @($repoLocalResolution.ArgumentsPrefix) + @($Arguments | Select-Object -Skip 1)
                    Source = $repoLocalResolution.Source
                    Resolution = $repoLocalResolution.Resolution
                    RepoLocalFallback = $true
                }
            }

            if ($packageName -in @('playwright', 'vite', 'vitest')) {
                throw "Unable to resolve npx for '$packageName'. Current probe result: $(Format-NodeToolResolution -Resolution $Tooling.Npx). Repo-local fallback for '$packageName' is unavailable. Run npm ci in frontend or expose a real npx via NPX_CMD."
            }

            throw "Unable to resolve npx for '$packageName'. Current probe result: $(Format-NodeToolResolution -Resolution $Tooling.Npx). No repo-local fallback exists for this command; set NPX_CMD or use a host shell where real npx is executable."
        }
    }
}

function Format-NodeInvocation {
    param([pscustomobject]$Invocation)

    $suffix = if ($Invocation.RepoLocalFallback) { ' (repo-local fallback)' } else { '' }
    return "$($Invocation.RequestedCommand) -> $($Invocation.Source)$suffix"
}

function Invoke-ResolvedNodeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Invocation,
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory
    )

    Push-Location $WorkingDirectory
    try {
        & $Invocation.CommandPath @($Invocation.Arguments)
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    $global:LASTEXITCODE = $exitCode
}

function New-NodeToolPowerShellShimContents {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('node', 'npm', 'npx')]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [string]$ProxyScriptPath,
        [Parameter(Mandatory = $true)]
        [string]$FrontendRoot
    )

    $escapedProxy = $ProxyScriptPath.Replace("'", "''")
    $escapedFrontend = $FrontendRoot.Replace("'", "''")
    return @(
        'param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)'
        "& '$escapedProxy' -Tool $Tool -FrontendRoot '$escapedFrontend' -Arguments `$Arguments"
        'exit $LASTEXITCODE'
        ''
    ) -join "`r`n"
}

function New-NodeToolShimContents {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('node', 'npm', 'npx')]
        [string]$Tool,
        [Parameter(Mandatory = $true)]
        [string]$PowerShellShimPath
    )

    if ($script:IsWindowsNodeTooling) {
        $escapedShim = $PowerShellShimPath.Replace("'", "''")
        return @(
            '@echo off'
            "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ""& '$escapedShim' %*"""
            'exit /b %ERRORLEVEL%'
            ''
        ) -join "`r`n"
    }

    $escapedShim = $PowerShellShimPath.Replace("'", "'\''")
    return @(
        '#!/usr/bin/env sh'
        "pwsh -NoProfile -File '$escapedShim' ""`$@"""
        ''
    ) -join "`n"
}

function Set-NodeToolingFileContent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    if (Test-Path $Path) {
        $existing = [IO.File]::ReadAllText($Path)
        if ($existing -eq $Content) {
            return
        }
    }

    [IO.File]::WriteAllText($Path, $Content, [Text.Encoding]::ASCII)
}

function Initialize-NodeToolingBootstrap {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Tooling
    )

    $shimDir = Join-NodeToolPath -BasePath $Tooling.ProjectRoot -Segments @('.tmp', 'node-tooling', 'bin')
    $proxyScript = Join-NodeToolPath -BasePath $Tooling.ProjectRoot -Segments @('scripts', 'invoke-node-tool.ps1')

    New-Item -ItemType Directory -Force -Path $shimDir | Out-Null

    $shimNames = if ($script:IsWindowsNodeTooling) {
        @{
            node = @{ PowerShell = 'node.ps1'; Shell = 'node.cmd' }
            npm = @{ PowerShell = 'npm.ps1'; Shell = 'npm.cmd' }
            npx = @{ PowerShell = 'npx.ps1'; Shell = 'npx.cmd' }
        }
    } else {
        @{
            node = @{ PowerShell = 'node'; Shell = 'node' }
            npm = @{ PowerShell = 'npm'; Shell = 'npm' }
            npx = @{ PowerShell = 'npx'; Shell = 'npx' }
        }
    }

    foreach ($tool in @('node', 'npm', 'npx')) {
        $powerShellShimPath = Join-Path $shimDir $shimNames[$tool].PowerShell
        Set-NodeToolingFileContent -Path $powerShellShimPath -Content (New-NodeToolPowerShellShimContents -Tool $tool -ProxyScriptPath $proxyScript -FrontendRoot $Tooling.FrontendRoot)

        $shimPath = Join-Path $shimDir $shimNames[$tool].Shell
        Set-NodeToolingFileContent -Path $shimPath -Content (New-NodeToolShimContents -Tool $tool -PowerShellShimPath $powerShellShimPath)
        if (-not $script:IsWindowsNodeTooling) {
            & chmod +x $powerShellShimPath
            & chmod +x $shimPath
        }
    }

    $existingPathEntries = @($env:PATH -split [IO.Path]::PathSeparator) | Where-Object { $_ }
    if ($existingPathEntries -notcontains $shimDir) {
        $env:PATH = "$shimDir$([IO.Path]::PathSeparator)$env:PATH"
    }
    $env:NODE_TOOLING_SHIM_DIR = $shimDir

    return [pscustomobject]@{
        ShimDirectory = $shimDir
        Tooling = $Tooling
    }
}
