// =========================================================================
// AGENTE DE PROSPECCIÓN B2B v3.0 — CLIENT INTERACTION SCRIPT
// =========================================================================

const state = {
  leads: [],
  stats: null,
  activeLead: null,
};

// Elementos DOM
const colIngested = document.getElementById('listIngested');
const colProposals = document.getElementById('listProposals');
const colOutreach = document.getElementById('listOutreach');
const colHuman = document.getElementById('listHuman');
const colFinal = document.getElementById('listFinal');

const badgeIngested = document.getElementById('badgeIngested');
const badgeProposals = document.getElementById('badgeProposals');
const badgeOutreach = document.getElementById('badgeOutreach');
const badgeHuman = document.getElementById('badgeHuman');
const badgeFinal = document.getElementById('badgeFinal');

const statTotalLeads = document.getElementById('statTotalLeads');
const statAudited = document.getElementById('statAudited');
const statReview = document.getElementById('statReview');
const statHandoff = document.getElementById('statHandoff');
const statWon = document.getElementById('statWon');

const pipelineModal = document.getElementById('pipelineModal');
const btnOpenPipelineModal = document.getElementById('btnOpenPipelineModal');
const btnClosePipelineModal = document.getElementById('btnClosePipelineModal');
const btnCancelPipeline = document.getElementById('btnCancelPipeline');
const pipelineForm = document.getElementById('pipelineForm');
const pipelineSpinner = document.getElementById('pipelineSpinner');
const btnSubmitPipeline = document.getElementById('btnSubmitPipeline');

const leadModal = document.getElementById('leadModal');
const btnCloseLeadModal = document.getElementById('btnCloseLeadModal');
const modalLeadName = document.getElementById('modalLeadName');
const modalLeadSubtitle = document.getElementById('modalLeadSubtitle');
const leadModalBody = document.getElementById('leadModalBody');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  setupEventListeners();
});

function setupEventListeners() {
  // Modal de pipeline
  btnOpenPipelineModal.addEventListener('click', () => {
    pipelineModal.classList.add('active');
  });
  btnClosePipelineModal.addEventListener('click', () => {
    pipelineModal.classList.remove('active');
  });
  btnCancelPipeline.addEventListener('click', () => {
    pipelineModal.classList.remove('active');
  });

  // Modal de lead
  btnCloseLeadModal.addEventListener('click', () => {
    leadModal.classList.remove('active');
  });

  // Resetear tablero completo
  const btnResetBoard = document.getElementById('btnResetBoard');
  if (btnResetBoard) {
    btnResetBoard.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas limpiar y resetear todos los prospectos del tablero?')) {
        try {
          const res = await fetch('/api/leads/reset', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            await loadDashboardData();
          }
        } catch (err) {
          alert('Error al resetear el tablero');
        }
      }
    });
  }

  // Ejecución de pipeline
  pipelineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const niche = document.getElementById('inputNiche').value;
    const location = document.getElementById('inputLocation').value;
    const limit = document.getElementById('inputLimit').value;

    pipelineSpinner.classList.add('active');
    btnSubmitPipeline.disabled = true;

    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, limit }),
      });

      const data = await res.json();
      if (data.success) {
        pipelineModal.classList.remove('active');
        await loadDashboardData();
      } else {
        alert('Error ejecutando pipeline: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al ejecutar el pipeline');
    } finally {
      pipelineSpinner.classList.remove('active');
      btnSubmitPipeline.disabled = false;
    }
  });
}

// Carga de datos
async function loadDashboardData() {
  try {
    const [statsRes, leadsRes] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/leads'),
    ]);

    state.stats = await statsRes.json();
    state.leads = await leadsRes.json();

    renderStats();
    renderKanban();
  } catch (err) {
    console.error('Error cargando datos del dashboard:', err);
  }
}

function renderStats() {
  if (!state.stats) return;
  const s = state.stats.stats;
  statTotalLeads.textContent = s.total || 0;

  const auditedCount = (s.byStatus['AUDITED_QUALIFIED'] || 0) + (s.byStatus['PROPOSAL_COMPILED'] || 0) + (s.byStatus['READY_TO_SEND'] || 0) + (s.byStatus['SENT'] || 0) + (s.byStatus['HUMAN_HANDOFF'] || 0) + (s.byStatus['WON'] || 0);
  statAudited.textContent = auditedCount;

  statReview.textContent = s.byStatus['FLAGGED_FOR_REVIEW'] || 0;
  statHandoff.textContent = (s.byStatus['REPLIED'] || 0) + (s.byStatus['HUMAN_HANDOFF'] || 0);
  statWon.textContent = s.byStatus['WON'] || 0;

  // Actualizar Badge MOCK vs REAL en Header
  const modeBadge = document.getElementById('modeBadge');
  const modeText = document.getElementById('modeText');
  if (modeBadge && modeText) {
    if (state.stats.mockMode) {
      modeBadge.className = 'mode-badge mock';
      modeText.textContent = '🟡 Modo Simulación (Sandbox)';
    } else {
      modeBadge.className = 'mode-badge real';
      modeText.textContent = '🟢 Modo Real Activo';
    }
  }
}

function renderKanban() {
  colIngested.innerHTML = '';
  colProposals.innerHTML = '';
  colOutreach.innerHTML = '';
  colHuman.innerHTML = '';
  colFinal.innerHTML = '';

  let c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0;

  state.leads.forEach((lead) => {
    const card = createLeadCard(lead);

    switch (lead.status) {
      case 'INGESTED':
      case 'AUDITED_QUALIFIED':
        colIngested.appendChild(card);
        c1++;
        break;

      case 'PROPOSAL_COMPILED':
      case 'DEMO_DEPLOYED':
      case 'FLAGGED_FOR_REVIEW':
      case 'READY_TO_SEND':
        colProposals.appendChild(card);
        c2++;
        break;

      case 'QUEUED':
      case 'SENT':
      case 'FOLLOWUP_SENT':
      case 'FOLLOWUP_2':
      case 'COLD':
        colOutreach.appendChild(card);
        c3++;
        break;

      case 'REPLIED':
      case 'HUMAN_HANDOFF':
        colHuman.appendChild(card);
        c4++;
        break;

      case 'WON':
      case 'LOST':
      case 'DISCARDED':
        colFinal.appendChild(card);
        c5++;
        break;
    }
  });

  badgeIngested.textContent = c1;
  badgeProposals.textContent = c2;
  badgeOutreach.textContent = c3;
  badgeHuman.textContent = c4;
  badgeFinal.textContent = c5;
}

function createLeadCard(lead) {
  const div = document.createElement('div');
  div.className = 'lead-card';
  div.onclick = () => openLeadDetail(lead.id);

  div.innerHTML = `
    <div class="lead-card-header">
      <h4 class="lead-card-title">${lead.business_name}</h4>
      <span class="lead-status-chip status-${lead.status}">${formatStatus(lead.status)}</span>
    </div>
    <div class="lead-meta">
      <span class="rating-badge">★ ${lead.rating ? lead.rating.toFixed(1) : '4.9'}</span>
      <span>${lead.reviews_count || 0} reseñas</span>
      <span>&bull;</span>
      <span class="lead-niche-text">${lead.niche || 'B2B'}</span>
    </div>
    <div class="lead-card-footer">
      <a href="/api/demos/${lead.id}" target="_blank" class="btn-card-demo" onclick="event.stopPropagation()">
        ✨ Ver Demo
      </a>
      <span class="tag-status">${lead.current_website_url ? '🌐 Con Web' : '🚫 Sin Web'}</span>
    </div>
  `;

  return div;
}

function formatStatus(status) {
  const map = {
    INGESTED: 'Ingestado',
    AUDITED_QUALIFIED: 'Auditado OK',
    DISCARDED: 'Descartado',
    PROPOSAL_COMPILED: 'Propuesta Lista',
    DEMO_DEPLOYED: 'Demo Activa',
    FLAGGED_FOR_REVIEW: 'Revisión Gate',
    READY_TO_SEND: 'Listo Envío',
    QUEUED: 'En Cola',
    SENT: 'Enviado',
    FOLLOWUP_SENT: 'Follow-up',
    REPLIED: 'Respondió!',
    HUMAN_HANDOFF: 'Humano Cierra',
    WON: '🏆 Ganada',
    LOST: 'Perdida',
  };
  return map[status] || status;
}

async function openLeadDetail(leadId) {
  try {
    const res = await fetch(`/api/leads/${leadId}`);
    const data = await res.json();
    if (!data.lead) return;

    state.activeLead = data;
    renderLeadModal(data);
    leadModal.classList.add('active');
  } catch (err) {
    alert('Error cargando detalle del lead');
  }
}

function renderLeadModal(data) {
  const { lead, audit, proposal } = data;

  modalLeadName.textContent = lead.business_name;
  modalLeadSubtitle.textContent = `Estado: ${formatStatus(lead.status)} | Nicho: ${lead.niche || 'N/A'} | ID: ${lead.id.substring(0, 8)}...`;

  const techBadges = audit?.detected_tech_stack?.details?.map(d => `<span class="chip">${d}</span>`).join('') || '<span class="chip">No auditado</span>';
  const issuesList = audit?.issues_found?.map(i => `<li>${i}</li>`).join('') || '<li>Sin incidencias críticas</li>';

  leadModalBody.innerHTML = `
    <div class="detail-grid">
      <!-- Columna Izquierda: Auditoría Técnica Playwright -->
      <div class="detail-section">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M20 12l-4-4m4 4-4 4"/></svg>
          Diagnóstico Playwright (Skill 2)
        </h4>

        <div class="audit-metric-row">
          <span class="metric-name">Score de Rendimiento:</span>
          <span class="metric-val" style="color: ${audit?.lighthouse_perf_score > 75 ? '#34d399' : '#fbbf24'}; font-size: 1.1rem;">
            ${audit ? audit.lighthouse_perf_score : 'N/A'} / 100
          </span>
        </div>
        <div class="audit-metric-row">
          <span class="metric-name">TTFB (Respuesta Servidor):</span>
          <span class="metric-val">${audit ? audit.ttfb_ms + ' ms' : 'N/A'}</span>
        </div>
        <div class="audit-metric-row">
          <span class="metric-name">Diseño Móvil Responsive:</span>
          <span class="metric-val">${audit ? (audit.is_mobile_responsive ? '✅ Sí' : '❌ No (Falla)') : 'N/A'}</span>
        </div>
        <div class="audit-metric-row">
          <span class="metric-name">Sitio Web Actual:</span>
          <span class="metric-val">
            ${lead.current_website_url ? `
              <a href="${lead.current_website_url}" target="_blank" rel="noopener noreferrer" class="web-current-pill">
                🌐 Abrir Web Actual ↗
              </a>
            ` : '<span style="color: #f59e0b; font-size: 0.82rem; font-weight: 600;">🚫 Sin Web (Oportunidad Web Nueva)</span>'}
          </span>
        </div>

        <div style="margin-top: 1rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 600;">Tecnologías Detectadas:</span>
          <div class="chips-container">${techBadges}</div>
        </div>

        <div style="margin-top: 1rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 600;">Puntos de Dolor Identificados:</span>
          <ul style="font-size: 0.85rem; color: #cbd5e1; margin-left: 1.2rem; margin-top: 0.4rem; line-height: 1.5;">
            ${issuesList}
          </ul>
        </div>

        <!-- Smartphone Device Frame Preview -->
        <div style="margin-top: 1.2rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 0.6rem;">
            📱 Diagnóstico Móvil Playwright (Simulación Headless):
          </span>
          <div class="mobile-phone-frame">
            <div class="phone-notch"><div class="phone-camera"></div></div>
            <div class="phone-browser-bar">
              <span class="lock-icon">🔒</span>
              <span class="browser-url-text">${lead.current_website_url || (lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.pe')}</span>
            </div>
            <div class="phone-screen-content">
              ${audit?.screenshot_path ? `
                <img src="${audit.screenshot_path}" class="screenshot-mobile-img" alt="Auditoría Playwright" />
              ` : `
                <div class="empty-audit-screen">
                  <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">⚠️</div>
                  <div style="font-weight: 700; font-size: 0.85rem; color: #fff;">Web No Optimizada</div>
                  <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.3rem;">Falla carga en smartphones (&gt;3s)</div>
                </div>
              `}
              <div class="phone-audit-tag">
                <span>⚡ Score: ${audit?.lighthouse_perf_score || 35}/100</span>
                <span>•</span>
                <span>${audit?.is_mobile_responsive ? 'Móvil OK' : 'Falla Móvil ❌'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Propuesta Cognitiva & Cierre Humano -->
      <div class="detail-section">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Propuesta & Mensajes (Skills 3 & 5)
        </h4>

        <div class="audit-metric-row">
          <span class="metric-name">Oportunidad Primaria:</span>
          <span class="metric-val" style="color: #38bdf8;">${proposal?.opportunity_type || 'MODERNIZATION'}</span>
        </div>
        <div class="audit-metric-row">
          <span class="metric-name">Priority Score:</span>
          <span class="metric-val" style="color: #a855f7;">${proposal?.priority_score || 8} / 10</span>
        </div>

        <div style="margin: 1rem 0;">
          <a href="/api/demos/${lead.id}" target="_blank" class="btn btn-primary" style="width: 100%; font-size: 0.92rem; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); font-weight: 800; border-radius: 12px; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);">
            ✨ Ver Prototipo / Demo Desplegada (Sitio Web Completo)
          </a>
        </div>

        <div style="margin-top: 0.8rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 600;">Pitch WhatsApp (Generado):</span>
          <div class="copy-box">${proposal?.outreach_copy?.whatsapp_pitch || proposal?.whatsapp_pitch || 'Sin pitch generado'}</div>
        </div>

        <div style="margin-top: 0.8rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 600;">Correo Electrónico (Generado):</span>
          <div class="copy-box"><strong>Asunto:</strong> ${proposal?.outreach_copy?.email_subject || proposal?.email_subject || ''}<br><br>${(proposal?.outreach_copy?.email_body || proposal?.email_body || '').replace(/\n/g, '<br>')}</div>
        </div>

        <!-- Acciones del Flujo Humano -->
        <div style="margin-top: 1.2rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
          <span class="metric-name" style="font-size: 0.85rem; font-weight: 700; color: #94a3b8;">Acciones de Control & Cierre Humano:</span>
          <div class="human-actions">
            ${lead.status === 'FLAGGED_FOR_REVIEW' ? `
              <button class="btn btn-emerald" onclick="approveGate('${lead.id}')" style="flex: 1;">
                ✅ Aprobar Gate (Revisado)
              </button>
            ` : ''}

            ${['SENT', 'QUEUED', 'FOLLOWUP_SENT'].includes(lead.status) ? `
              <button class="btn btn-primary" onclick="simulateReply('${lead.id}')" style="flex: 1;">
                💬 Simular Respuesta Prospecto (Handoff)
              </button>
            ` : ''}

            ${lead.status === 'HUMAN_HANDOFF' || lead.status === 'REPLIED' ? `
              <button class="btn btn-emerald" onclick="closeLead('${lead.id}', 'WON')" style="flex: 1;">
                🏆 Cerrar como GANADA
              </button>
              <button class="btn btn-rose" onclick="closeLead('${lead.id}', 'LOST')" style="flex: 1;">
                ❌ Marcar PERDIDA
              </button>
            ` : ''}
          </div>

          <div style="margin-top: 0.8rem; text-align: right;">
            <button onclick="deleteLead('${lead.id}')" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; color: #f87171; border-color: rgba(248, 113, 113, 0.3);">
              🗑️ Eliminar este Prospecto
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Acciones de API desde el Modal
window.deleteLead = async function(leadId) {
  if (confirm('¿Eliminar este prospecto del tablero?')) {
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        leadModal.classList.remove('active');
        await loadDashboardData();
      }
    } catch (err) {
      alert('Error al eliminar lead');
    }
  }
};
window.approveGate = async function(leadId) {
  try {
    const res = await fetch(`/api/leads/${leadId}/gate/approve`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await openLeadDetail(leadId);
      await loadDashboardData();
    }
  } catch (err) {
    alert('Error al aprobar lead');
  }
};

window.simulateReply = async function(leadId) {
  try {
    const res = await fetch(`/api/leads/${leadId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Prospecto respondió pidiendo ver la demo' }),
    });
    const data = await res.json();
    if (data.success) {
      await openLeadDetail(leadId);
      await loadDashboardData();
    }
  } catch (err) {
    alert('Error al simular respuesta');
  }
};

window.closeLead = async function(leadId, outcome) {
  try {
    const res = await fetch(`/api/leads/${leadId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    const data = await res.json();
    if (data.success) {
      leadModal.classList.remove('active');
      await loadDashboardData();
    }
  } catch (err) {
    alert('Error al cerrar lead');
  }
};

// Auto-refresco en vivo para Control Center (cada 4 segundos)
setInterval(() => {
  // Solo refrescar si no hay modales abiertos para no interrumpir al usuario
  if (!leadModal.classList.contains('active') && !pipelineModal.classList.contains('active')) {
    loadDashboardData();
  }
}, 4000);
