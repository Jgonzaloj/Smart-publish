const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const psScript = `
$items = Get-ChildItem -Path . | Where-Object { 
    $_.Name -notin @('node_modules', '.git', 'dist', 'playwright-report', 'test-results') -and 
    $_.Extension -ne '.zip' -and 
    $_.Extension -ne '.mp4' 
}
Compress-Archive -Path $items -DestinationPath "./crediya-proyecto-actualizado.zip" -Force
Write-Host "ZIP generado exitosamente: crediya-proyecto-actualizado.zip"
`;

fs.writeFileSync('scripts/pack.ps1', psScript, 'utf8');
try {
  const out = execSync('powershell -ExecutionPolicy Bypass -File scripts/pack.ps1', { encoding: 'utf8' });
  console.log(out);
} catch (e) {
  console.error('Error al generar ZIP:', e.message);
}
