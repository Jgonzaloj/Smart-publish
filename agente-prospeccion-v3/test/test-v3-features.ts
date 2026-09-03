import crypto from 'crypto';
import { normalizeToE164 } from '../src/utils/phone.utils.js';
import { verifyMetaSignature } from '../src/utils/crypto.utils.js';
import { LeadsRepository } from '../src/db/repositories/leads.repository.js';
import { ProposalsRepository } from '../src/db/repositories/proposals.repository.js';
import { OutreachEngineService } from '../src/skills/skill5-outreach/outreach.service.js';
import { getDatabase } from '../src/db/database.js';

async function runFeatureTests() {
  console.log('================================================================');
  console.log('TESTING V3.0 FEATURES: SEGUIMIENTOS, SEGURIDAD & LEAD HUNTER');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Normalizador Telefónico E.164
  // -------------------------------------------------------------
  console.log('--- TEST 1: Normalización de Teléfonos al estándar E.164 ---');

  const phoneCases = [
    { input: '987654321', defaultCountry: '+51', expected: '+51987654321' },
    { input: ' 987 654 321 ', defaultCountry: '+51', expected: '+51987654321' },
    { input: '(01) 456-7890', defaultCountry: '+51', expected: '+5114567890' },
    { input: '612345678', defaultCountry: '+34', expected: '+34612345678' },
    { input: '+34 612 34 56 78', defaultCountry: '+51', expected: '+34612345678' },
    { input: '+1 (555) 234-5678', defaultCountry: '+51', expected: '+15552345678' },
    { input: '51987654321', defaultCountry: '+51', expected: '+51987654321' },
    { input: 'abc', defaultCountry: '+51', expected: undefined },
    { input: '', defaultCountry: '+51', expected: undefined },
  ];

  for (const tc of phoneCases) {
    const result = normalizeToE164(tc.input, tc.defaultCountry);
    if (result !== tc.expected) {
      throw new Error(`TEST 1 FALLIDO para entrada "${tc.input}": obtenido "${result}", esperado "${tc.expected}"`);
    }
    console.log(`  ✅ "${tc.input}" (${tc.defaultCountry}) -> ${result || 'undefined (descartado correctamente)'}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Verificación Criptográfica HMAC-SHA256 para Meta WhatsApp
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Verificación de Firma Criptográfica HMAC (Meta Webhook) ---');

  const appSecret = 'super_secret_meta_app_key_123';
  const validPayload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

  const validHmac = crypto.createHmac('sha256', appSecret).update(validPayload).digest('hex');
  const validHeader = `sha256=${validHmac}`;

  // Caso 2.1: Firma válida
  const isSignatureValid = verifyMetaSignature(validPayload, validHeader, appSecret);
  if (!isSignatureValid) {
    throw new Error('TEST 2.1 FALLIDO: La firma válida fue rechazada');
  }
  console.log('  ✅ Firma HMAC legítima verificada correctamente');

  // Caso 2.2: Payload alterado (ataque tampering)
  const tamperedPayload = JSON.stringify({ object: 'whatsapp_business_account', entry: ['tampered'] });
  const isTamperedValid = verifyMetaSignature(tamperedPayload, validHeader, appSecret);
  if (isTamperedValid) {
    throw new Error('TEST 2.2 FALLIDO: El payload alterado fue aceptado');
  }
  console.log('  ✅ Payload alterado rechazado correctamente');

  // Caso 2.3: App Secret incorrecto
  const isWrongSecretValid = verifyMetaSignature(validPayload, validHeader, 'wrong_secret');
  if (isWrongSecretValid) {
    throw new Error('TEST 2.3 FALLIDO: Se aceptó firma con secret incorrecto');
  }
  console.log('  ✅ Secret incorrecto rechazado correctamente');

  // -------------------------------------------------------------
  // TEST 3: Inbound Email Match & Traspaso al Humano
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Webhook de Email Inbound & Human Handoff ---');

  const leadsRepo = new LeadsRepository();
  const proposalsRepo = new ProposalsRepository();
  const outreachEngine = new OutreachEngineService();
  const db = getDatabase();

  const testEmail = `prospecto.test.${Date.now()}@clinicasmile.pe`;
  const dummyLead = leadsRepo.insertLead({
    place_id: `place_test_email_${Date.now()}`,
    business_name: 'Clínica Dental Sonrisa Test',
    niche: 'Dentistas',
    phone: '+51987000111',
    whatsapp: '+51987000111',
    email: testEmail,
    google_maps_url: 'https://maps.google.com/?q=test',
    rating: 4.9,
    reviews_count: 85,
    current_website_url: 'https://clinicasmile.pe',
  });

  if (!dummyLead) {
    throw new Error('TEST 3 FALLIDO: No se pudo insertar lead de prueba');
  }

  // Verificar búsqueda por email
  const foundLead = leadsRepo.findByEmail(testEmail);
  if (!foundLead || foundLead.id !== dummyLead.id) {
    throw new Error('TEST 3 FALLIDO: findByEmail no encontró el lead registrado');
  }
  console.log(`  ✅ Lead localizado exitosamente por email: ${foundLead.email}`);

  // Simular respuesta por correo recibida en el webhook
  await outreachEngine.handleProspectReply(dummyLead.id, 'Respuesta Email: Me gustaría agendar una demo mañana.');
  const updatedLead = leadsRepo.findById(dummyLead.id);
  if (updatedLead?.status !== 'HUMAN_HANDOFF') {
    throw new Error(`TEST 3 FALLIDO: El lead no pasó a HUMAN_HANDOFF tras responder por correo (Estado: ${updatedLead?.status})`);
  }
  console.log(`  ✅ Lead transferido exitosamente a: ${updatedLead.status} con closer: ${updatedLead.assigned_closer}`);

  // -------------------------------------------------------------
  // TEST 4: Máquina de Estados de Seguimientos (48h -> 72h -> COLD)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Ciclo Completo de Seguimientos Automáticos ---');

  // Crear propuesta mock para el lead
  proposalsRepo.saveProposal({
    lead_id: dummyLead.id,
    opportunity_type: 'MODERNIZATION',
    priority_score: 8,
    pain_points: ['Web lenta', 'Sin versión móvil'],
    proposed_solution: 'Modernización web',
    outreach_copy: {
      whatsapp_pitch: 'Hola, pitch de prueba',
      email_subject: 'Oportunidad técnica',
      email_body: 'Cuerpo de correo de prueba',
    },
  });

  // Paso 4.1: Lead enviado hace 50 horas (debe transicionar a FOLLOWUP_SENT)
  leadsRepo.forceUpdateStatus(dummyLead.id, 'SENT');
  db.prepare(`UPDATE prospect_leads SET updated_at = datetime('now', '-50 hours') WHERE id = ?`).run(dummyLead.id);

  const eligibleForF1 = leadsRepo.findLeadsForFollowup1(48, 10);
  const isLeadInF1 = eligibleForF1.some((l) => l.id === dummyLead.id);
  if (!isLeadInF1) {
    throw new Error('TEST 4.1 FALLIDO: findLeadsForFollowup1 no detectó el lead tras 50h');
  }
  console.log('  ✅ Lead detectado como elegible para Follow-up 1 (> 48h)');

  const fResult1 = await outreachEngine.dispatchFollowups(10);
  const leadAfterF1 = leadsRepo.findById(dummyLead.id);
  if (leadAfterF1?.status !== 'FOLLOWUP_SENT') {
    throw new Error(`TEST 4.1 FALLIDO: Esperado FOLLOWUP_SENT, obtenido ${leadAfterF1?.status}`);
  }
  console.log(`  ✅ Transición atómica exitosa a: ${leadAfterF1.status} (Enviados: ${fResult1.followup1Sent})`);

  // Paso 4.2: Lead en FOLLOWUP_SENT hace 75 horas (debe transicionar a FOLLOWUP_2)
  db.prepare(`UPDATE prospect_leads SET updated_at = datetime('now', '-75 hours') WHERE id = ?`).run(dummyLead.id);

  const eligibleForF2 = leadsRepo.findLeadsForFollowup2(72, 10);
  const isLeadInF2 = eligibleForF2.some((l) => l.id === dummyLead.id);
  if (!isLeadInF2) {
    throw new Error('TEST 4.2 FALLIDO: findLeadsForFollowup2 no detectó el lead tras 75h');
  }
  console.log('  ✅ Lead detectado como elegible para Follow-up 2 (> 72h)');

  const fResult2 = await outreachEngine.dispatchFollowups(10);
  const leadAfterF2 = leadsRepo.findById(dummyLead.id);
  if (leadAfterF2?.status !== 'FOLLOWUP_2') {
    throw new Error(`TEST 4.2 FALLIDO: Esperado FOLLOWUP_2, obtenido ${leadAfterF2?.status}`);
  }
  console.log(`  ✅ Transición atómica exitosa a: ${leadAfterF2.status} (Enviados: ${fResult2.followup2Sent})`);

  // Paso 4.3: Lead en FOLLOWUP_2 hace 75 horas sin respuesta (debe pasar a COLD)
  db.prepare(`UPDATE prospect_leads SET updated_at = datetime('now', '-75 hours') WHERE id = ?`).run(dummyLead.id);

  const eligibleForCold = leadsRepo.findLeadsForCold(72, 10);
  const isLeadInCold = eligibleForCold.some((l) => l.id === dummyLead.id);
  if (!isLeadInCold) {
    throw new Error('TEST 4.3 FALLIDO: findLeadsForCold no detectó el lead tras 75h');
  }
  console.log('  ✅ Lead detectado como elegible para archivo en frío (> 72h)');

  const fResult3 = await outreachEngine.dispatchFollowups(10);
  const leadAfterCold = leadsRepo.findById(dummyLead.id);
  if (leadAfterCold?.status !== 'COLD') {
    throw new Error(`TEST 4.3 FALLIDO: Esperado COLD, obtenido ${leadAfterCold?.status}`);
  }
  console.log(`  ✅ Transición atómica exitosa a: ${leadAfterCold.status} (Archivados: ${fResult3.movedToCold})`);

  // Limpieza del lead de prueba
  leadsRepo.deleteLead(dummyLead.id);

  // -------------------------------------------------------------
  // TEST 5: Prevención de XSS en Demo Generator (Skill 4)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Validación Anti-XSS en Plantillas de Demo ---');
  const { generateFullWebsiteDemoHtml } = await import('../src/skills/skill4-demobuilder/demo-template.js');

  const maliciousBusinessName = `Clínica O'Brien <script>alert("xss")</script> & "Asociados"`;
  const demoHtml = generateFullWebsiteDemoHtml({
    business_name: maliciousBusinessName,
    phone: '+51 987 654 321',
    proposed_solution: 'Solución con <img src=x onerror=alert(1)>',
  });

  // 1. Verificar que no haya inyección de script sin escapar en HTML
  if (demoHtml.includes('<script>alert("xss")</script>')) {
    throw new Error('TEST 5 FALLIDO: Se detectó tag <script> sin escapar en el HTML generado');
  }
  if (!demoHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')) {
    throw new Error('TEST 5 FALLIDO: No se encontraron las entidades HTML escapadas');
  }

  // 2. Verificar que en el contexto JavaScript se use escape de comillas simples y backslashes
  if (demoHtml.includes("Hola Clínica O'Brien")) {
    throw new Error('TEST 5 FALLIDO: Comilla simple sin escapar en string literal de JavaScript');
  }
  if (!demoHtml.includes("O\\'Brien")) {
    throw new Error("TEST 5 FALLIDO: No se encontró comilla escapada O\\'Brien en JavaScript");
  }
  console.log('  ✅ HTML injection neutralizado (tags y entidades escapadas)');
  console.log('  ✅ JS string literal injection neutralizado (comillas simples escapadas)');

  console.log('\n================================================================');
  console.log('🎉 TODOS LOS TESTS DE AUDITORÍA Y SEGURIDAD PASARON AL 100%');
  console.log('================================================================');
}

runFeatureTests().catch((err) => {
  console.error('❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
