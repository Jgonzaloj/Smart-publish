$ErrorActionPreference = "Stop"
$dest = "c:\Users\PC\Downloads\dsddsdsdsds\crediya-completo.zip"
if (Test-Path $dest) { Remove-Item $dest -Force }

$items = Get-ChildItem -Path "c:\Users\PC\Downloads\dsddsdsdsds\backend" -Exclude "node_modules", "dist", "playwright-report", "test-results", ".git", "*.zip"
Write-Host "Comprimiendo $($items.Count) elementos a $dest..."
Compress-Archive -Path $items.FullName -DestinationPath $dest -Force
Write-Host "Compresion finalizada con exito!"
Get-Item $dest | Select-Object Name, Length, FullName | Format-List
