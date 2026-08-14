const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function auditLiveSite() {
    console.log('Iniciando auditoría visual con Playwright...');
    const url = 'https://redes.inversionesvawi.com/';
    const outputDir = path.join(__dirname, 'visual_audit');
    
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log(`Navegando a ${url}...`);
    try {
        await page.goto(url, { waitUntil: 'networkidle' });
        const title = await page.title();
        console.log(`Título de la página: ${title}`);
        
        const screenshotPath = path.join(outputDir, 'homepage.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot guardado en: ${screenshotPath}`);
        
        // Aquí podríamos extraer metadata adicional para el reporte de auditoría
        const metadata = {
            url: url,
            title: title,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        
    } catch (e) {
        console.error('Error al auditar el sitio web:', e);
    } finally {
        await browser.close();
        console.log('Auditoría visual finalizada.');
    }
}

auditLiveSite();
