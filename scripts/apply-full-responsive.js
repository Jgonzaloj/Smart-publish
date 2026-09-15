const fs = require('fs');

const completeResponsiveGlassCSS = `/* ============================================================
   SISTEMA DE DISEÑO: GLASSMORPHISM & CYBER DYNAMIC (APPLE VISIONOS)
   COMPLETAMENTE RESPONSIVO: MOBILE (320px+), TABLET, DESKTOP (4K)
   ============================================================ */

/* ------------------------------------------------------------
   1. VARIABLES & DESIGN TOKENS
   ------------------------------------------------------------ */
:root,
body.theme-cream {
  --bg-dark: #FAF7EE;
  --bg-body-grad: radial-gradient(circle at 50% 0%, #FFFDF5 0%, #FAF7EE 65%, #F2ECE0 100%);
  --bg-card: rgba(255, 255, 255, 0.85);
  --bg-card-hover: rgba(255, 255, 255, 0.96);
  --border-color: rgba(226, 221, 208, 0.85);
  --border-subtle: rgba(237, 232, 220, 0.6);
  --border-focus: #10B981;

  --text-primary: #1E293B;
  --text-secondary: #475569;
  --text-muted: #64748B;

  --badge-dark: rgba(36, 41, 46, 0.9);
  --badge-dark-hover: rgba(51, 65, 85, 0.95);
  --badge-dark-border: rgba(36, 41, 46, 0.15);
  --badge-green: #10B981;
  --badge-green-hover: #059669;
  --badge-red: #F43F5E;
  --badge-red-hover: #E11D48;
  --badge-grey: #64748B;
  --badge-blue: #0284C7;

  --accent-primary: #10B981;
  --accent-primary-hover: #059669;
  --success: #10B981;
  --success-bg: rgba(16, 185, 129, 0.14);
  --warning: #F59E0B;
  --warning-bg: rgba(245, 158, 11, 0.14);
  --danger: #F43F5E;
  --danger-bg: rgba(244, 63, 94, 0.14);
  --info: #0284C7;
  --info-bg: rgba(2, 132, 199, 0.14);

  --nav-bg: rgba(255, 253, 245, 0.88);
  --toolbar-bg: rgba(244, 239, 228, 0.85);
  --input-bg: rgba(255, 255, 255, 0.92);
  --input-text: #1E293B;
  --input-border: rgba(216, 209, 192, 0.9);

  --card-shadow: 0 16px 36px rgba(36, 41, 46, 0.08), 0 2px 8px rgba(36, 41, 46, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  --badge-shadow: 0 4px 12px rgba(36, 41, 46, 0.12);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;

  --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: 'Outfit', sans-serif;
}

body.theme-dark {
  --bg-dark: #070B14;
  --bg-body-grad: radial-gradient(circle at 50% -10%, #1e1b4b 0%, #0c1222 45%, #070b14 100%);
  --bg-card: rgba(15, 23, 42, 0.78);
  --bg-card-hover: rgba(30, 41, 59, 0.9);
  --border-color: rgba(255, 255, 255, 0.12);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-focus: #10B981;

  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  --badge-dark: rgba(30, 41, 59, 0.85);
  --badge-dark-hover: rgba(51, 65, 85, 0.95);
  --badge-dark-border: rgba(255, 255, 255, 0.15);
  --badge-green: #10B981;
  --badge-green-hover: #059669;
  --badge-red: #F43F5E;
  --badge-red-hover: #E11D48;
  --badge-grey: #64748B;
  --badge-blue: #38BDF8;

  --accent-primary: #10B981;
  --accent-primary-hover: #059669;
  --success: #10B981;
  --success-bg: rgba(16, 185, 129, 0.16);
  --warning: #F59E0B;
  --warning-bg: rgba(245, 158, 11, 0.16);
  --danger: #F43F5E;
  --danger-bg: rgba(244, 63, 94, 0.16);
  --info: #38BDF8;
  --info-bg: rgba(56, 189, 248, 0.16);

  --nav-bg: rgba(15, 23, 42, 0.85);
  --toolbar-bg: rgba(15, 23, 42, 0.75);
  --input-bg: rgba(15, 23, 42, 0.85);
  --input-text: #F8FAFC;
  --input-border: rgba(255, 255, 255, 0.14);

  --card-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --badge-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

/* ------------------------------------------------------------
   2. RESET & BASE
   ------------------------------------------------------------ */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-main);
  background: var(--bg-body-grad);
  background-attachment: fixed;
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.25s ease, color 0.25s ease;
  overflow-x: hidden;
  max-width: 100vw;
  -webkit-tap-highlight-color: transparent;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: 1rem;
}

button {
  touch-action: manipulation;
  user-select: none;
}

/* ------------------------------------------------------------
   3. TOP NAVBAR (ISLA DE CRISTAL FLOTANTE)
   ------------------------------------------------------------ */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--nav-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.3px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

body.theme-dark .brand-badge {
  background: linear-gradient(135deg, #10B981 0%, #38BDF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
  font-size: 1.25rem;
}

.brand-meta {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tenant-badge {
  font-size: 0.75rem;
  color: var(--badge-blue);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  background: var(--badge-dark);
  color: #F0F6FC;
  border: 1px solid var(--badge-dark-border);
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: var(--badge-shadow);
  backdrop-filter: blur(12px);
  white-space: nowrap;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--badge-green);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--badge-green);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.currency-switcher-box {
  display: flex;
  align-items: center;
}

.currency-select {
  background: var(--badge-dark);
  color: #FFFFFF;
  border: 1px solid var(--badge-dark-border);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: var(--badge-shadow);
  backdrop-filter: blur(12px);
}

.currency-select:hover, .currency-select:focus {
  border-color: var(--badge-green);
  box-shadow: 0 0 0 2px rgba(46, 164, 79, 0.25);
}

.user-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-role {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #F0F6FC;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-shadow: var(--badge-shadow);
  backdrop-filter: blur(12px);
  white-space: nowrap;
}

.btn-role:hover {
  background: var(--badge-dark-hover);
  color: #FFFFFF;
  transform: translateY(-1px);
}

.btn-role.active {
  background: var(--badge-green);
  border-color: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.btn-theme-toggle {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #F0F6FC;
  font-weight: 700;
}

.btn-theme-toggle:hover {
  background: var(--badge-dark-hover);
  border-color: #57606A;
}

.btn-icon {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #F0F6FC;
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--badge-shadow);
  backdrop-filter: blur(12px);
}

.btn-icon:hover {
  background: var(--badge-dark-hover);
  color: #FFFFFF;
  transform: translateY(-1px);
}

/* ------------------------------------------------------------
   4. BARRA DE NAVEGACIÓN COMPACTA & MENÚ DESPLEGABLE
   ------------------------------------------------------------ */
.nav-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: var(--toolbar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 61px;
  z-index: 95;
  transition: all 0.25s ease;
}

.nav-toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-menu-wrapper {
  position: relative;
  display: inline-block;
}

.btn-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--badge-shadow);
  white-space: nowrap !important;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
}

.btn-dropdown-trigger:hover,
.btn-dropdown-trigger.dropdown-open {
  background: var(--badge-dark-hover);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.dropdown-icon {
  font-size: 1.15rem;
}

.dropdown-label {
  letter-spacing: -0.2px;
}

.dropdown-chevron {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-left: 2px;
  transition: transform 0.25s ease;
}

.btn-dropdown-trigger.dropdown-open .dropdown-chevron {
  transform: rotate(180deg);
  color: var(--badge-green);
}

.dropdown-menu-card {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 360px;
  max-width: 90vw;
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
  z-index: 600;
  animation: dropdownAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@keyframes dropdownAppear {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dropdown-category {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-cat-title {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
  margin: 4px 10px 2px 10px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: 1px solid transparent;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  position: relative;
  color: var(--text-primary);
}

.menu-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-color);
  transform: translateX(3px);
}

.menu-item.active {
  background: var(--success-bg);
  border-color: rgba(16, 185, 129, 0.3);
}

.menu-item.active .item-info strong {
  color: var(--badge-green);
}

.item-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-info strong {
  font-size: 0.86rem;
  font-weight: 700;
}

.item-info small {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pill-badge-fast {
  position: absolute;
  right: 12px;
  background: var(--badge-green);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.quick-nav-pills {
  display: flex;
  gap: 6px;
  align-items: center;
}

.quick-pill {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-pill:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.quick-pill.active {
  background: var(--badge-dark);
  color: #FFFFFF;
  border-color: var(--badge-dark-border);
  box-shadow: var(--badge-shadow);
}

.btn-fast-sale {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  white-space: nowrap !important;
}

.btn-fast-sale:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.fast-sale-icon {
  font-size: 1rem;
}

.btn-nav-drawer {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #FFFFFF;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: var(--badge-shadow);
  white-space: nowrap;
}

.btn-nav-drawer:hover {
  background: var(--badge-dark-hover);
}

/* ------------------------------------------------------------
   5. DRAWER / MENÚ LATERAL DESPLEGABLE
   ------------------------------------------------------------ */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  opacity: 0;
  pointer-events: none !important;
  visibility: hidden;
  transition: opacity 0.22s ease, visibility 0.22s ease;
}

.drawer-backdrop.open {
  opacity: 1;
  pointer-events: auto !important;
  visibility: visible;
}

.drawer-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 86vw;
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-right: 1px solid var(--border-color);
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  box-shadow: 10px 0 40px rgba(0, 0, 0, 0.4);
  color: var(--text-primary);
}

.drawer-backdrop.open .drawer-panel {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.drawer-brand {
  display: flex;
  flex-direction: column;
}

.drawer-tenant-badge {
  font-size: 0.75rem;
  color: var(--badge-blue);
  font-weight: 700;
}

.drawer-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.drawer-user-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--badge-dark);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.drawer-user-info strong {
  display: block;
  font-size: 0.92rem;
  color: var(--text-primary);
}

.drawer-quick-action {
  margin-bottom: 16px;
}

.btn-drawer-new-sale {
  width: 100%;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  padding: 12px 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.sale-icon {
  font-size: 1.4rem;
}

.sale-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.sale-text strong {
  font-size: 0.95rem;
}

.sale-text small {
  font-size: 0.72rem;
  opacity: 0.85;
}

.drawer-nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.drawer-section-title {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 12px 0 4px 6px;
}

.drawer-nav-item {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.drawer-nav-item:hover {
  background: var(--bg-card-hover);
}

.drawer-nav-item.active {
  background: var(--success-bg);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--badge-green);
  font-weight: 700;
}

.nav-item-icon {
  font-size: 1.15rem;
}

.btn-drawer-action {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ------------------------------------------------------------
   6. CONTENIDO PRINCIPAL & SECCIONES
   ------------------------------------------------------------ */
.content-area {
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 100px 24px;
  flex: 1;
}

.tab-section {
  display: none;
}

.tab-section.active {
  display: block;
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.section-header h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.section-header p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ------------------------------------------------------------
   7. KPI METRICS GRID (GLASSMORPHISM RESPONSIVE)
   ------------------------------------------------------------ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.metric-card {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.2);
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
}

.metric-val {
  font-family: var(--font-display);
  font-size: 1.85rem;
  font-weight: 800;
  margin: 6px 0 2px;
  color: var(--text-primary);
  line-height: 1.1;
  word-break: break-word;
}

.metric-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.metric-success .metric-val { color: var(--badge-green) !important; }
.metric-warning .metric-val { color: var(--warning) !important; }
.metric-danger .metric-val { color: var(--badge-red) !important; }
.metric-info .metric-val { color: var(--badge-blue) !important; }

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #38BDF8);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* ------------------------------------------------------------
   8. BARRA DE BÚSQUEDA Y FILTROS DE LA RUTA
   ------------------------------------------------------------ */
.ruta-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.ruta-search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.ruta-search-box .search-icon {
  position: absolute;
  left: 14px;
  font-size: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.ruta-search-box input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  background: var(--input-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--input-border);
  border-radius: 14px;
  color: var(--input-text);
  font-size: 0.92rem;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ruta-search-box input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.btn-clear-search {
  position: absolute;
  right: 14px;
  background: var(--border-color);
  border: none;
  color: var(--text-secondary);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.15s;
}

.btn-clear-search:hover {
  background: var(--badge-dark);
  color: #ffffff;
}

.ruta-filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #F0F6FC;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--badge-shadow);
  backdrop-filter: blur(12px);
  white-space: nowrap;
}

.filter-chip:hover {
  background: var(--badge-dark-hover);
  color: #FFFFFF;
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--badge-green);
  border-color: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

/* ------------------------------------------------------------
   9. TARJETA DE CLIENTE (HOJA DE RUTA RESPONSIVA)
   ------------------------------------------------------------ */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-card {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--card-shadow);
  user-select: none;
}

.client-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.client-card.expanded {
  background: var(--bg-card);
  border-color: var(--badge-green);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.client-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
}

.order-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.order-badge {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  color: #FFFFFF;
  background: var(--badge-dark);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid var(--badge-dark-border);
  box-shadow: var(--badge-shadow);
  flex-shrink: 0;
}

.order-arrows {
  display: flex;
  gap: 4px;
}

.order-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
}

.client-summary-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.status-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 14px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-al-dia {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-pagado-hoy {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.status-atrasado {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-ausente {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.3);
}

.client-summary-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.client-saldo {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
}

.client-cuota {
  font-size: 0.75rem;
  color: var(--badge-green);
  font-weight: 700;
  white-space: nowrap;
}

.client-chevron-box {
  color: var(--text-muted);
  font-size: 0.9rem;
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.client-card.expanded .client-chevron-box {
  transform: rotate(180deg);
  color: var(--badge-green);
}

.client-expanded-panel {
  display: none;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--border-color);
  animation: expandPanel 0.2s ease-out;
}

.client-card.expanded .client-expanded-panel {
  display: block;
}

@keyframes expandPanel {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.client-expanded-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.detail-val {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  word-break: break-word;
}

.client-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.client-actions button {
  flex: 1;
  min-height: 42px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

/* ------------------------------------------------------------
   10. BOTONES GENERALES
   ------------------------------------------------------------ */
.btn-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  backdrop-filter: blur(12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--badge-dark-hover);
}

.btn-whatsapp {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.btn-danger {
  background: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.35);
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.btn-accent {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.btn-block {
  width: 100%;
}

.btn-lg {
  padding: 14px 20px;
  font-size: 1rem;
}

.flex-1 {
  flex: 1;
}

/* ------------------------------------------------------------
   11. FORMULARIOS & TARJETAS
   ------------------------------------------------------------ */
.form-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--card-shadow);
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 12px;
  color: var(--input-text);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-with-icon .input-icon {
  position: absolute;
  left: 14px;
  font-size: 1.1rem;
  pointer-events: none;
  z-index: 2;
}

.input-with-icon input,
.input-with-icon select {
  padding-left: 44px;
  padding-right: 44px;
}

.btn-toggle-pass {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 6px;
}

/* ------------------------------------------------------------
   12. MODALES (GLASSMORPHISM RESPONSIVO)
   ------------------------------------------------------------ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 16px;
  overflow-y: auto;
}

.modal-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  animation: modalScale 0.2s ease-out;
  color: var(--text-primary);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.modal-card.modal-lg {
  max-width: 760px;
}

@keyframes modalScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-header h3 {
  font-weight: 800;
  font-size: 1.15rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* ------------------------------------------------------------
   13. PIN OVERLAY & TOAST
   ------------------------------------------------------------ */
.pin-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-dark);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.pin-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  text-align: center;
  max-width: 360px;
  width: 100%;
  box-shadow: var(--card-shadow);
  color: var(--text-primary);
}

.pin-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.pin-dots {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin: 20px 0;
}

.pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--text-muted);
  transition: all 0.2s;
}

.pin-dot.filled {
  background: var(--badge-green);
  border-color: var(--badge-green);
  box-shadow: 0 0 12px var(--badge-green);
}

.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pin-btn {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: #FFFFFF;
  font-size: 1.3rem;
  font-weight: 800;
  padding: 14px 0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--badge-shadow);
  min-height: 48px;
}

.pin-btn:hover {
  background: var(--badge-dark-hover);
  transform: scale(1.04);
}

.pin-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 18px;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--badge-dark);
  backdrop-filter: blur(20px);
  color: #fff;
  padding: 12px 20px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  border-left: 4px solid var(--badge-green);
  font-size: 0.88rem;
  font-weight: 700;
  z-index: 99999;
  animation: slideIn 0.25s ease-out;
  max-width: 90vw;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.hidden, [hidden],
.modal-backdrop.hidden,
.pin-overlay.hidden,
.landing-portal.hidden,
.drawer-backdrop.hidden {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
  z-index: -9999 !important;
  opacity: 0 !important;
}

/* ------------------------------------------------------------
   14. RECIBO DIGITAL & TICKET POS
   ------------------------------------------------------------ */
.modal-recibo-wrapper {
  max-width: 440px;
  padding: 20px;
}

.ticket-container {
  display: flex;
  justify-content: center;
  margin: 10px 0 15px 0;
}

.recibo-ticket {
  background: #FFFFFF;
  color: #111827;
  width: 100%;
  border-radius: 20px;
  padding: 22px 18px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid #E5E7EB;
}

body.theme-dark .recibo-ticket {
  background: #0f172a;
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.12);
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

body.theme-dark .ticket-row {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.ticket-label {
  color: var(--text-muted);
}

.ticket-value {
  font-weight: 700;
}

.ticket-section-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 14px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--badge-green);
  color: var(--text-primary);
}

.recibo-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recibo-secondary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ------------------------------------------------------------
   15. TABLAS & DASHBOARD EJECUTIVO
   ------------------------------------------------------------ */
.table-container {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--card-shadow);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 500px;
}

.data-table th {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 14px;
  font-size: 0.86rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  white-space: nowrap;
}

.data-table tr:hover td {
  background: var(--bg-card-hover);
}

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 30px !important;
}

.split-layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
  align-items: start;
}

.preview-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.92rem;
}

.preview-item.highlight {
  font-size: 1.05rem;
  font-weight: 800;
}

.preview-note {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 14px;
  line-height: 1.4;
}

.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 10px 0;
}

/* ------------------------------------------------------------
   16. ESTADO DE CUENTA
   ------------------------------------------------------------ */
.ec-summary-card {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px;
  margin-bottom: 16px;
}

.ec-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ec-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ec-summary-grid strong {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  word-break: break-word;
}

.ec-progress-box {
  margin-top: 14px;
}

.ec-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  margin-bottom: 6px;
  font-weight: 700;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #38BDF8);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* ------------------------------------------------------------
   17. PORTADA DE INGRESO Y LOGIN PORTAL FINTECH
   ------------------------------------------------------------ */
.landing-portal {
  position: fixed;
  inset: 0;
  background: var(--bg-dark);
  z-index: 999;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 16px;
}

.landing-container {
  width: 100%;
  max-width: 580px;
  position: relative;
  z-index: 2;
  margin: auto;
}

.landing-hero {
  text-align: center;
  margin-bottom: 26px;
}

.brand-badge-lg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  padding: 8px 18px;
  border-radius: 24px;
  margin-bottom: 16px;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.landing-title {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 4vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 10px;
  line-height: 1.25;
}

.landing-subtitle {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.landing-features-pills {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-pill {
  background: var(--badge-dark);
  border: 1px solid var(--badge-dark-border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(12px);
}

.landing-auth-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--card-shadow);
  margin-bottom: 20px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
  padding: 4px;
  border-radius: 14px;
  margin-bottom: 22px;
}

.auth-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 10px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.auth-tab-btn.active {
  background: var(--badge-dark);
  color: #fff;
  box-shadow: var(--badge-shadow);
}

.auth-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}

.auth-hint {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.demo-access-box {
  margin-top: 20px;
}

.demo-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.demo-divider::before, .demo-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.demo-divider span {
  padding: 0 10px;
}

.demo-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-demo-card {
  background: var(--bg-card-hover);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  transition: all 0.2s;
  color: var(--text-primary);
}

.btn-demo-card:hover {
  border-color: var(--badge-green);
  transform: translateY(-2px);
}

.demo-icon {
  font-size: 1.4rem;
}

.demo-text {
  display: flex;
  flex-direction: column;
}

.demo-text strong {
  font-size: 0.88rem;
}

.demo-text small {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pwa-banner {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.pwa-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-icon {
  font-size: 1.8rem;
}

.btn-pwa-install {
  background: var(--badge-green);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
}

.landing-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ------------------------------------------------------------
   18. BARRA INFERIOR MÓVIL (DESKTOP DEFAULT = HIDDEN)
   ------------------------------------------------------------ */
.mobile-bottom-nav {
  display: none; /* Oculto en PC / Desktop */
}

/* ------------------------------------------------------------
   19. RESPONSIVE BREAKPOINTS (TABLET & DESKTOP FINE-TUNING)
   ------------------------------------------------------------ */
@media (min-width: 1025px) {
  .top-nav {
    padding: 14px 32px;
  }
  .nav-toolbar {
    padding: 12px 32px;
  }
  .content-area {
    padding: 28px 32px 100px 32px;
  }
  .metrics-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .top-nav {
    padding: 12px 20px;
  }
  .nav-toolbar {
    padding: 10px 20px;
  }
  .content-area {
    padding: 20px 20px 100px 20px;
  }
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .ec-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ------------------------------------------------------------
   20. RESPONSIVE GLOBAL (MÓVIL <= 768px)
   ------------------------------------------------------------ */
@media (max-width: 768px) {
  .top-nav {
    padding: 10px 14px;
    flex-wrap: wrap;
    gap: 10px;
    position: relative;
    top: auto;
    z-index: 100;
  }

  .nav-brand {
    gap: 8px;
  }

  .brand-title {
    display: none;
  }

  .nav-controls {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-wrap: wrap;
  }

  .status-indicator {
    padding: 6px 10px;
    font-size: 0.7rem;
  }

  .currency-select {
    padding: 6px 8px;
    font-size: 0.78rem;
    min-height: 38px;
  }

  .user-switcher {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .btn-role {
    min-height: 40px;
    padding: 8px 12px;
    font-size: 0.78rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
  }

  .btn-icon {
    min-height: 40px;
    min-width: 40px;
    padding: 8px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: manipulation;
  }

  .nav-toolbar {
    padding: 8px 12px;
    position: relative;
    top: auto;
    z-index: 90;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .btn-dropdown-trigger {
    min-height: 42px;
    padding: 8px 14px;
    font-size: 0.82rem;
    gap: 6px;
    cursor: pointer;
    touch-action: manipulation;
  }

  .btn-fast-sale {
    min-height: 42px;
    padding: 8px 14px;
    font-size: 0.82rem;
    cursor: pointer;
    touch-action: manipulation;
  }

  .btn-nav-drawer {
    min-height: 42px;
    padding: 8px 14px;
    font-size: 0.82rem;
    cursor: pointer;
    touch-action: manipulation;
  }

  .desktop-only {
    display: none !important;
  }

  .content-area {
    padding: 14px 12px 100px 12px !important;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .section-actions button,
  .section-actions select {
    flex: 1;
    min-height: 42px;
    justify-content: center;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .metric-card {
    padding: 14px 12px;
  }

  .metric-val {
    font-size: clamp(1.2rem, 5.5vw, 1.65rem);
  }

  .client-summary-row {
    gap: 8px;
  }

  .order-badge {
    width: 32px;
    height: 32px;
    font-size: 0.88rem;
  }

  .client-name {
    font-size: 0.94rem;
    max-width: 160px;
  }

  .client-saldo {
    font-size: 1.05rem;
  }

  .client-cuota {
    font-size: 0.72rem;
  }

  .client-expanded-details {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .client-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
  }

  .client-actions button {
    width: 100%;
    min-height: 44px;
    font-size: 0.8rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-card {
    padding: 18px 14px;
    border-radius: 16px;
  }

  .split-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-card {
    width: calc(100% - 20px);
    max-height: 90vh;
    padding: 20px 16px;
    border-radius: 20px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer button {
    width: 100%;
    min-height: 44px;
  }

  .ec-summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .table-container {
    padding: 10px;
    border-radius: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 10px 8px;
    font-size: 0.8rem;
  }

  /* BARRA INFERIOR FLOTANTE TIPO DOCK (APPLE VISIONOS / TIKTOK) */
  .mobile-bottom-nav {
    display: flex !important;
    position: fixed;
    bottom: max(12px, env(safe-area-inset-bottom, 12px));
    left: 10px;
    right: 10px;
    margin: 0 auto;
    max-width: 440px;
    width: calc(100% - 20px);
    height: 60px;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 32px;
    z-index: 1500;
    justify-content: space-between;
    align-items: center;
    padding: 4px 6px;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
    user-select: none;
    touch-action: manipulation;
  }

  body.theme-cream .mobile-bottom-nav {
    background: rgba(255, 253, 245, 0.95);
    border: 1px solid rgba(36, 41, 46, 0.12);
    box-shadow: 0 12px 36px rgba(36, 41, 46, 0.14);
  }

  .mob-nav-btn {
    background: transparent;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 20px;
    flex: 1;
    min-height: 50px;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    touch-action: manipulation;
  }

  .mob-nav-icon {
    font-size: 1.25rem;
    line-height: 1;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .mob-nav-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: -0.1px;
  }

  .mob-nav-btn.active {
    background: var(--badge-green);
    color: #FFFFFF !important;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
    transform: translateY(-2px);
  }

  .mob-nav-btn.active .mob-nav-icon {
    transform: scale(1.18);
  }

  .mob-nav-btn.active .mob-nav-label {
    color: #FFFFFF !important;
    font-weight: 800;
  }

  .mob-nav-center {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.2));
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
}

/* ------------------------------------------------------------
   21. EXTRA SMALL PHONES (< 380px: iPhone SE, Galaxy Mini)
   ------------------------------------------------------------ */
@media (max-width: 380px) {
  .brand-badge {
    font-size: 0.95rem;
    padding: 4px 8px;
  }

  .tenant-badge {
    max-width: 130px;
  }

  .status-indicator {
    font-size: 0.65rem;
    padding: 4px 8px;
  }

  .currency-select {
    font-size: 0.72rem;
    padding: 4px 6px;
  }

  .btn-role {
    font-size: 0.72rem;
    padding: 6px 8px;
  }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .metric-card {
    padding: 10px 8px;
  }

  .metric-val {
    font-size: 1.15rem;
  }

  .client-name {
    max-width: 110px;
    font-size: 0.88rem;
  }

  .client-saldo {
    font-size: 0.95rem;
  }

  .demo-buttons-grid {
    grid-template-columns: 1fr;
  }

  .mob-nav-label {
    font-size: 0.62rem;
  }

  .mob-nav-icon {
    font-size: 1.1rem;
  }
}
`;

fs.writeFileSync('public/style.css', completeResponsiveGlassCSS, 'utf8');
console.log('Successfully written full responsive Glassmorphism design system to public/style.css');
