import { PipelineOrchestrator } from './pipeline/orchestrator.js';

async function main() {
  const orchestrator = new PipelineOrchestrator();
  const niche = process.argv[2] || 'Clínicas Dentales';
  const location = process.argv[3] || 'Madrid';
  const limit = parseInt(process.argv[4] || '5', 10);

  console.log('Iniciando Agente Autónomo de Prospección B2B v3.0...');
  try {
    const result = await orchestrator.runFullCycle({ niche, location, limit });
    console.log('\n--- CICLO COMPLETADO EXITOSAMENTE ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error durante la ejecución del pipeline:', error);
    process.exit(1);
  }
}

main();
