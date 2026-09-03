import { OutreachEngineService } from '../skills/skill5-outreach/outreach.service.js';
import { config } from '../config/env.js';

export class SchedulerService {
  private outreachEngine = new OutreachEngineService();
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Inicia el temporizador periódico en segundo plano
   */
  start(): void {
    if (!config.SCHEDULER_ENABLED) {
      console.log('[Scheduler] ⏸️ Temporizador de seguimientos desactivado por configuración (SCHEDULER_ENABLED=false).');
      return;
    }

    if (this.timer) {
      console.log('[Scheduler] El scheduler ya está en ejecución.');
      return;
    }

    const intervalMs = Math.max(config.SCHEDULER_INTERVAL_MINUTES, 1) * 60 * 1000;
    console.log(`[Scheduler] ⏱️ Iniciando servicio de seguimiento automático cada ${config.SCHEDULER_INTERVAL_MINUTES} minutos.`);

    // Ejecución inicial diferida (10 segundos tras levantar el servidor)
    setTimeout(() => {
      this.runFollowupCycle().catch((err) => {
        console.error('[Scheduler] Error en ciclo inicial de seguimientos:', err);
      });
    }, 10000);

    this.timer = setInterval(() => {
      this.runFollowupCycle().catch((err) => {
        console.error('[Scheduler] Error ejecutando ciclo periódico de seguimientos:', err);
      });
    }, intervalMs);
  }

  /**
   * Detiene el temporizador en segundo plano
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] 🛑 Temporizador de seguimientos detenido.');
    }
  }

  /**
   * Ejecuta el ciclo de seguimiento bajo demanda
   */
  async runFollowupCycle(): Promise<{
    followup1Sent: number;
    followup2Sent: number;
    movedToCold: number;
  }> {
    if (this.isProcessing) {
      console.log('[Scheduler] ⚠️ Ya hay un ciclo de seguimientos ejecutándose. Omitiendo.');
      return { followup1Sent: 0, followup2Sent: 0, movedToCold: 0 };
    }

    this.isProcessing = true;
    try {
      // 1. Despachar prospectos nuevos que estén en cola (primer contacto)
      const queuedRes = await this.outreachEngine.dispatchQueuedMessages(5);
      if (queuedRes.sent > 0) {
        console.log(`[Scheduler] 🚀 Despachados ${queuedRes.sent} prospectos nuevos desde la cola.`);
      }

      console.log('[Scheduler] 🔄 Ejecutando escaneo de seguimientos automáticos (48h/72h -> COLD)...');
      const result = await this.outreachEngine.dispatchFollowups(20);

      if (result.followup1Sent > 0 || result.followup2Sent > 0 || result.movedToCold > 0) {
        console.log(`[Scheduler] ✅ Ciclo completado: F1 enviados: ${result.followup1Sent}, F2 enviados: ${result.followup2Sent}, Archivados en frío: ${result.movedToCold}`);
      } else {
        console.log('[Scheduler] ℹ️ No se encontraron prospectos con antigüedad requerida para seguimiento en este ciclo.');
      }

      return result;
    } finally {
      this.isProcessing = false;
    }
  }
}
