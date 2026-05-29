[CmdletBinding()]
param(
    [string]$PlantUmlJar = $env:PLANTUML_JAR,
    [ValidateSet('png', 'svg', 'both')]
    [string]$Format = 'both'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $PlantUmlJar) {
    throw 'Please pass -PlantUmlJar or set PLANTUML_JAR.'
}

if (-not (Test-Path -LiteralPath $PlantUmlJar)) {
    throw "PlantUML jar not found: $PlantUmlJar"
}

$sourceDir = Join-Path $PSScriptRoot 'plantuml'
$files = Get-ChildItem -LiteralPath $sourceDir -Filter *.puml | Select-Object -ExpandProperty FullName

if (-not $files) {
    throw "No .puml files found under $sourceDir"
}

$javaArgsBase = @('-Dfile.encoding=UTF-8', '-jar', $PlantUmlJar, '-charset', 'UTF-8')

if ($Format -in @('png', 'both')) {
    & java @javaArgsBase '-tpng' @files
}

if ($Format -in @('svg', 'both')) {
    & java @javaArgsBase '-tsvg' @files
}
