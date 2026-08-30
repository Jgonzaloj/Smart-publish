import { chromium, Browser, BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';
import { LeadsRepository } from '../../db/repositories/leads.repository.js';
import { AuditsRepository } from '../../db/repositories/audits.repository.js';
import { ProspectLead, AuditDiagnostics, DetectedTechStack, OpportunityType } from '../../types/index.js';
import { config } from '../../config/env.js';

export class WebAuditorService {
  private leadsRepo = new LeadsRepository();
  private auditsRepo = new AuditsRepository();
  private browser: Browser | null = null;

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Procesa todos los leads en estado 'INGESTED' de forma idempotente y atómica.
   */
  async processIngestedLeads(batchSize = 10): Promise<{ processed: number; qualified: number; discarded: number }> {
    const leads = this.leadsRepo.findByStatus('INGESTED', batchSize);
    let qualified = 0;
    let discarded = 0;

    for (const lead of leads) {
      try {
        const auditResult = await this.auditSingleLead(lead);

        // Guardar resultado de auditoría
        this.auditsRepo.saveAudit(auditResult);

        // Criterio de calificación:
        // 1. Si no tiene web -> Calificado para NEW_WEBSITE
        // 2. Si tiene web pero score < 85 o stack desactualizado -> Calificado para MODERNIZATION / PERFORMANCE
        // 3. Si tiene web excelente (score >= 90 y rápida) -> DISCARDED (no hay dolor para venta)
        const isQualified = !auditResult.has_website || auditResult.lighthouse_perf_score < 90 || auditResult.detected_tech_stack.is_outdated_stack;

        if (isQualified) {
          const transitioned = this.leadsRepo.updateStatusAtomic(lead.id, 'INGESTED', 'AUDITED_QUALIFIED');
          if (transitioned) qualified++;
        } else {
          const transitioned = this.leadsRepo.updateStatusAtomic(lead.id, 'INGESTED', 'DISCARDED');
          if (transitioned) discarded++;
        }
      } catch (error: any) {
        console.error(`[Auditor] Error auditando lead ${lead.id} (${lead.business_name}):`, error.message);
        const retries = this.leadsRepo.incrementRetryCount(lead.id);

        if (retries >= 2) {
          this.leadsRepo.updateStatusAtomic(lead.id, 'INGESTED', 'DISCARDED');
          discarded++;
        }
      }
    }

    return { processed: leads.length, qualified, discarded };
  }

  /**
   * Ejecuta la auditoría técnica completa sobre un lead individual usando Playwright
   */
  async auditSingleLead(lead: ProspectLead): Promise<Omit<AuditDiagnostics, 'id' | 'created_at'>> {
    // Caso 1: Negocio sin sitio web
    if (!lead.current_website_url || lead.current_website_url.trim() === '') {
      return {
        lead_id: lead.id,
        has_website: false,
        is_mobile_responsive: false,
        lighthouse_perf_score: 0,
        ttfb_ms: 0,
        issues_found: [
          'No tiene presencia web propia registrada en Google Maps',
          'Pérdida de clientes que buscan servicios directamente en navegadores',
          'Falta de sistema de reservas/contacto digital centralizado',
        ],
        detected_tech_stack: {
          is_outdated_stack: true,
          details: ['Sin sitio web detectado'],
        },
        ai_opportunity_type: 'NEW_WEBSITE',
      };
    }

    const browser = await this.initBrowser();
    let context: BrowserContext | null = null;

    try {
      context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // Emulación móvil iPhone SE / estándar
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      });

      const page = await context.newPage();
      let ttfb = 0;
      let requestStartTimestamp = Date.now();

      page.on('request', () => {
        requestStartTimestamp = Date.now();
      });

      page.on('response', (response) => {
        if (response.url() === page.url() && ttfb === 0) {
          ttfb = Date.now() - requestStartTimestamp;
        }
      });

      const startTime = Date.now();
      let targetUrl = lead.current_website_url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      const loadTime = Date.now() - startTime;

      // Medir TTFB exacto mediante Performance Navigation Timing API si está disponible
      const perfMetrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (nav) {
          return {
            ttfb: Math.round(nav.responseStart - nav.requestStart),
            domComplete: Math.round(nav.domComplete),
            transferSize: nav.transferSize,
          };
        }
        return null;
      });

      const finalTtfb = perfMetrics?.ttfb && perfMetrics.ttfb > 0 ? perfMetrics.ttfb : Math.max(ttfb, 120);

      // Comprobar si es responsive en móvil
      const mobileAudit = await page.evaluate(() => {
        const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
        const documentWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalOverflow = documentWidth > windowWidth + 10;
        const hasWhatsAppWidget = !!document.querySelector('a[href*="whatsapp"], a[href*="wa.me"], [id*="whatsapp"], [class*="whatsapp"]');
        const hasSsl = window.location.protocol === 'https:';

        return {
          hasViewportMeta,
          hasHorizontalOverflow,
          isResponsive: hasViewportMeta && !hasHorizontalOverflow,
          hasWhatsAppWidget,
          hasSsl,
          htmlLength: document.documentElement.innerHTML.length,
          title: document.title,
        };
      });

      // Captura de pantalla de la web
      if (!fs.existsSync(config.SCREENSHOTS_PATH)) {
        fs.mkdirSync(config.SCREENSHOTS_PATH, { recursive: true });
      }
      const screenshotFilename = `${lead.id}.jpg`;
      const screenshotFullPath = path.join(config.SCREENSHOTS_PATH, screenshotFilename);
      const screenshotRelativePath = `/storage/screenshots/${screenshotFilename}`;

      await page.screenshot({
        path: screenshotFullPath,
        type: 'jpeg',
        quality: 75,
        fullPage: false,
      });

      // Análisis de Stack Tecnológico
      const stack = await this.detectTechStack(page);

      // Compilación de problemas y cálculo de score
      const issues: string[] = [];
      let calculatedScore = 95;

      if (finalTtfb > 1500) {
        issues.push(`Tiempo de respuesta inicial del servidor (TTFB) muy lento: ${finalTtfb}ms (lo recomendado es < 400ms)`);
        calculatedScore -= 25;
      } else if (finalTtfb > 800) {
        issues.push(`Velocidad TTFB mejorable: ${finalTtfb}ms`);
        calculatedScore -= 12;
      }

      if (loadTime > 4500) {
        issues.push(`Tiempo total de carga elevado: ${(loadTime / 1000).toFixed(1)} segundos`);
        calculatedScore -= 20;
      }

      if (!mobileAudit.isResponsive) {
        issues.push('Diseño no optimizado para teléfonos móviles (desbordamiento horizontal o falta de viewport meta)');
        calculatedScore -= 30;
      }

      if (!mobileAudit.hasWhatsAppWidget) {
        issues.push('Sin botón directo de WhatsApp o contacto rápido (fricción para nuevos prospectos)');
        calculatedScore -= 10;
      }

      if (!mobileAudit.hasSsl) {
        issues.push('Sitio sin certificado SSL seguro (aparece como "No Seguro" en Google Chrome)');
        calculatedScore -= 35;
      }

      if (stack.is_outdated_stack) {
        issues.push(`Stack desactualizado o pesado detectado: ${stack.details.join(', ')}`);
        calculatedScore -= 15;
      }

      const lighthousePerfScore = Math.max(10, Math.min(100, calculatedScore));

      // Determinar oportunidad primaria
      let opportunity: OpportunityType = 'MODERNIZATION';
      if (!mobileAudit.isResponsive) {
        opportunity = 'MODERNIZATION';
      } else if (finalTtfb > 1200 || loadTime > 4000) {
        opportunity = 'PERFORMANCE_OVERHAUL';
      } else if (!mobileAudit.hasWhatsAppWidget) {
        opportunity = 'SYSTEM_INTEGRATION';
      }

      return {
        lead_id: lead.id,
        has_website: true,
        is_mobile_responsive: mobileAudit.isResponsive,
        lighthouse_perf_score: lighthousePerfScore,
        ttfb_ms: finalTtfb,
        load_time_ms: loadTime,
        screenshot_path: screenshotRelativePath,
        detected_tech_stack: stack,
        ai_opportunity_type: opportunity,
        issues_found: issues,
      };
    } finally {
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * Inspector determinista de tecnologías, librerías y CMS
   */
  private async detectTechStack(page: any): Promise<DetectedTechStack> {
    return page.evaluate(() => {
      const details: string[] = [];
      const cms: string[] = [];
      const jsFrameworks: string[] = [];
      const pageBuilders: string[] = [];
      let isOutdated = false;

      const html = document.documentElement.outerHTML.toLowerCase();
      const metaGenerator = document.querySelector('meta[name="generator"]')?.getAttribute('content')?.toLowerCase() || '';

      // Detección WordPress
      if (html.includes('wp-content') || html.includes('wp-includes') || metaGenerator.includes('wordpress')) {
        cms.push('WordPress');
        details.push('WordPress CMS');

        if (html.includes('elementor')) {
          pageBuilders.push('Elementor');
          details.push('Elementor Builder');
        }
        if (html.includes('divi')) {
          pageBuilders.push('Divi');
          details.push('Divi Builder');
        }
        if (html.includes('woocommerce')) {
          cms.push('WooCommerce');
          details.push('WooCommerce E-commerce');
        }
      }

      // Detección Shopify / Wix / Squarespace
      if (html.includes('cdn.shopify.com') || (window as any).Shopify) {
        cms.push('Shopify');
        details.push('Shopify');
      }
      if (html.includes('wix.com') || (window as any).wixBiSession) {
        cms.push('Wix');
        details.push('Wix Builder');
      }
      if (html.includes('squarespace.com')) {
        cms.push('Squarespace');
        details.push('Squarespace');
      }

      // Detección jQuery / librerías antiguas
      if ((window as any).jQuery || (window as any).$) {
        const jQVersion = (window as any).jQuery?.fn?.jquery || (window as any).$?.fn?.jquery;
        if (jQVersion) {
          details.push(`jQuery v${jQVersion}`);
          if (jQVersion.startsWith('1.') || jQVersion.startsWith('2.')) {
            isOutdated = true;
            details.push('jQuery versión legada/desactualizada');
          }
        } else {
          details.push('jQuery');
        }
      }

      // Detección Frameworks Modernos (React, Next.js, Vue, Svelte)
      if (html.includes('__next') || (window as any).__NEXT_DATA__) {
        jsFrameworks.push('Next.js');
        details.push('Next.js (Modern React)');
      } else if (html.includes('data-reactroot') || (window as any).React) {
        jsFrameworks.push('React');
        details.push('React');
      }

      if ((window as any).Vue || html.includes('data-v-')) {
        jsFrameworks.push('Vue.js');
        details.push('Vue.js');
      }

      // Detección Google Analytics / Pixel
      if (html.includes('gtag') || html.includes('google-analytics.com') || (window as any).ga) {
        details.push('Google Analytics');
      }
      if (html.includes('fbevents.js') || (window as any).fbq) {
        details.push('Facebook Pixel');
      }

      return {
        cms,
        page_builders: pageBuilders,
        js_frameworks: jsFrameworks,
        is_outdated_stack: isOutdated || (cms.includes('WordPress') && pageBuilders.length > 0),
        details: details.length > 0 ? details : ['Custom HTML/CSS Web Stack'],
      };
    });
  }
}
