$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
Write-Host "Rodes Signage kører på http://localhost:8080"
Write-Host "Tryk Ctrl+C for at stoppe serveren."
py -m http.server 8080
