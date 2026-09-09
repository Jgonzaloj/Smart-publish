<?php
$current_page = basename($_SERVER['SCRIPT_NAME']);
?>
<div id="sidebar">
    <!-- Botón de colapsar -->
    <button class="sidebar-toggle" onclick="toggleSidebar()">
        <i class="fa-solid fa-chevron-left" id="toggleIcon"></i>
    </button>

    <div class="sidebar-header d-flex align-items-center p-4">
        <div class="brand-icon me-3">
            <i class="fa-solid fa-bolt"></i>
        </div>
        <h4 class="fw-bold mb-0 text-white nav-text">GeoRegistro</h4>
    </div>
    
    <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search" class="nav-text">
    </div>
    
    <div class="list-group list-group-flush mt-2">
        <a href="dashboard.php" class="nav-link <?= $current_page == 'dashboard.php' ? 'active' : '' ?>">
            <i class="fa-solid fa-border-all"></i>
            <span class="nav-text">Dashboard</span>
        </a>
        
        <a href="registro.php" class="nav-link <?= $current_page == 'registro.php' ? 'active' : '' ?>">
            <i class="fa-regular fa-square-plus"></i>
            <span class="nav-text">Registrar</span>
        </a>

        <div class="sidebar-section-title">Reports</div>
        
        <a href="listado.php" class="nav-link <?= $current_page == 'listado.php' ? 'active' : '' ?>">
            <i class="fa-solid fa-table-list"></i>
            <span class="nav-text">Padrones</span>
        </a>
        
        <a href="mapa_general.php" class="nav-link <?= $current_page == 'mapa_general.php' ? 'active' : '' ?>">
            <i class="fa-solid fa-layer-group"></i>
            <span class="nav-text">Mapa General</span>
        </a>
        
        <a href="reportes.php" class="nav-link <?= $current_page == 'reportes.php' ? 'active' : '' ?>">
            <i class="fa-solid fa-chart-line"></i>
            <span class="nav-text">Estadísticas</span>
        </a>

        <?php if (isset($_SESSION['rol']) && $_SESSION['rol'] === 'Administrador'): ?>
        <div class="sidebar-section-title">Admin</div>
        <a href="usuarios.php" class="nav-link <?= $current_page == 'usuarios.php' ? 'active' : '' ?>">
            <i class="fa-solid fa-users"></i>
            <span class="nav-text">Users</span>
        </a>
        <?php endif; ?>
    </div>
    
    <div class="mt-auto p-3 user-info">
        <div class="d-flex align-items-center p-2 rounded-3" style="background: rgba(255, 255, 255, 0.05);">
            <div class="me-3">
                <div style="width: 32px; height: 32px; background: #6C5DD3; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="fa-solid fa-user"></i>
                </div>
            </div>
            <div class="overflow-hidden">
                <div class="fw-bold text-white text-truncate small"><?= htmlspecialchars($_SESSION['nombre'] ?? 'Usuario') ?></div>
                <div class="small text-white-50 text-truncate" style="font-size: 0.75rem;"><?= htmlspecialchars($_SESSION['rol'] ?? 'Rol') ?></div>
            </div>
        </div>
        <a href="auth/logout.php" class="btn btn-outline-light w-100 mt-2 btn-sm rounded-pill border-0" style="background: rgba(255,255,255,0.1);"><i class="fa-solid fa-right-from-bracket me-2"></i>Salir</a>
    </div>
</div>

<!-- Mobile Overlay -->
<div class="mobile-overlay" id="mobileOverlay" onclick="toggleMobileMenu()"></div>

<script>
    function toggleMobileMenu() {
        document.getElementById('sidebar').classList.toggle('show-mobile');
        document.getElementById('mobileOverlay').classList.toggle('show');
    }
</script>
