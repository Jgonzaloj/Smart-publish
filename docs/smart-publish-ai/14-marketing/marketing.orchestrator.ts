import { generateCopy } from '../15-copywriter/copy.agent';
import { generateVisualConcept } from '../16-art-director/art.agent';
import { runQualityControl } from '../17-quality-control/quality.agent';
import { publishToSocials } from '../18-social-publish/publish.service';

// SKILL-14: Orquestador de Marketing AI
export async function runMarketingCampaign(goal: string, tenantId: string): Promise<boolean> {
    console.log(`[Marketing AI] Iniciando campaña para el objetivo: "${goal}"`);

    try {
        // 1. Pedir el texto al Copywriter (SKILL-15)
        const copy = await generateCopy(goal);
        console.log(`[Marketing AI] Copy generado exitosamente.`);

        // 2. Pedir el concepto visual al Art Director (SKILL-16)
        const visualConcept = await generateVisualConcept(goal, copy);
        console.log(`[Marketing AI] Concepto visual generado exitosamente.`);

        // 3. Pasar el paquete por Control de Calidad (SKILL-17)
        const qaResult = await runQualityControl(copy, visualConcept);

        if (qaResult.approved) {
            console.log(`[Marketing AI] Control de Calidad SUPERADO. Enviando a publicación...`);
            // 4. Publicar el post (SKILL-18)
            await publishToSocials(tenantId, copy, visualConcept);
            return true;
        } else {
            console.warn(`[Marketing AI] Control de Calidad FALLÓ: ${qaResult.reason}`);
            // En el futuro, podríamos hacer que el orquestador pida al copywriter que corrija sus errores
            return false;
        }
    } catch (error) {
        console.error('[Marketing AI] Error en el flujo de orquestación:', error);
        return false;
    }
}
