param(
    [switch]$DryRun,
    [int]$Port = 9222,
    [string]$ProfileDir = "",
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Url
)

$ErrorActionPreference = "Stop"

if ($Url -notmatch '^https?://') {
    throw "URL must start with http:// or https://"
}

if ([string]::IsNullOrWhiteSpace($ProfileDir)) {
    $ProfileDir = Join-Path $Env:TEMP "qq-ads-report-download-chrome-profile"
}

New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

$candidatePaths = @(
    "$Env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${Env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$Env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $candidatePaths) {
    if ($path -and (Test-Path $path)) {
        $chromePath = $path
        break
    }
}

if (-not $chromePath) {
    $command = Get-Command chrome -ErrorAction SilentlyContinue
    if ($command) {
        $chromePath = $command.Source
    }
}

if (-not $chromePath) {
    throw "Google Chrome executable was not found. Install Chrome or update the script."
}

$arguments = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--new-window",
    $Url
)

if ($DryRun) {
    Write-Output ("DRY_RUN: Start-Process -FilePath `"{0}`" -ArgumentList {1}" -f $chromePath, ($arguments -join " "))
    exit 0
}

Start-Process -FilePath $chromePath -ArgumentList $arguments | Out-Null
Write-Output "Opened debug Chrome on port $Port: $Url"
Write-Output "Profile dir: $ProfileDir"
