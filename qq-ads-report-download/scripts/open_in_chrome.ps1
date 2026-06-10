param(
    [switch]$DryRun,
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Url
)

$ErrorActionPreference = "Stop"

if ($Url -notmatch '^https?://') {
    throw "URL must start with http:// or https://"
}

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

if ($DryRun) {
    Write-Output ("DRY_RUN: Start-Process -FilePath `"{0}`" -ArgumentList `"{1}`"" -f $chromePath, $Url)
    exit 0
}

Start-Process -FilePath $chromePath -ArgumentList $Url | Out-Null
Write-Output "Opened in Google Chrome: $Url"
