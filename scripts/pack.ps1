
$items = Get-ChildItem -Path . | Where-Object { 
    $_.Name -notin @('node_modules', '.git', 'dist', 'playwright-report', 'test-results') -and 
    $_.Extension -ne '.zip' -and 
    $_.Extension -ne '.mp4' 
}
Compress-Archive -Path $items -DestinationPath "./crediya-proyecto-actualizado.zip" -Force
Write-Host "ZIP generado exitosamente: crediya-proyecto-actualizado.zip"
