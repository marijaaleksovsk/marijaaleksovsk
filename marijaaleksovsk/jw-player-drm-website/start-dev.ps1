$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Error "Missing $envFile. Create it with JW_API_SECRET=your_real_secret"
}

$lines = Get-Content $envFile
foreach ($line in $lines) {
  $trimmed = $line.Trim()
  if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
    continue
  }

  $parts = $trimmed.Split("=", 2)
  if ($parts.Length -ne 2) {
    continue
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()
  [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
}

if (-not $env:JW_API_SECRET) {
  Write-Error "JW_API_SECRET is missing in .env.local"
}

node (Join-Path $projectRoot "server.js")
