$dest = "C:\Users\PC\Desktop\crediya-produccion"
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Path $dest -Force | Out-Null

$items = @("dist", "public", "prisma", "scripts", "package.json", "package-lock.json", ".env.example", ".env.production.example", "Dockerfile", "docker-compose.yml", "README.md")
foreach ($it in $items) {
    if (Test-Path $it) {
        Copy-Item -Path $it -Destination $dest -Recurse -Force
    }
}
$zip = "C:\Users\PC\Desktop\crediya-produccion.zip"
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path "$dest\*" -DestinationPath $zip -Force
Write-Host "Bundle crediya-produccion creado exitosamente en Desktop"
