/**
 * JavaScript para el menú móvil
 * Se ejecuta después de que el header se haya cargado
 */

function initMobileMenu() {
    console.log('=== INICIANDO MENU MOVIL ===');
    
    const hamburger = document.querySelector('.hamburger-menu');
    const mainNav = document.querySelector('.main-nav');
    const overlay = document.querySelector('.mobile-overlay');
    
    console.log('Hamburger:', hamburger);
    console.log('MainNav:', mainNav);
    console.log('Overlay:', overlay);
    
    if (!hamburger || !mainNav) {
        console.error('❌ No se encontraron elementos del menú');
        return;
    }
    
    function closeMenu() {
        hamburger.classList.remove('active');
        mainNav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
        console.log('Menú cerrado');
    }

    function openMenu() {
        hamburger.classList.add('active');
        mainNav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Menú abierto');
    }

    // 1. HAMBURGER
    hamburger.addEventListener('click', function(e) {
        console.log('👆 Click en hamburger');
        e.stopPropagation();
        const isActive = mainNav.classList.contains('active');
        if (isActive) {
            closeMenu();
            hamburger.setAttribute('aria-expanded', 'false');
        } else {
            openMenu();
            hamburger.setAttribute('aria-expanded', 'true');
        }
    });

    // 2. DROPDOWNS
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    console.log('📋 Dropdowns encontrados:', dropdownToggles.length);
    
    dropdownToggles.forEach(function(toggle, index) {
        console.log('🔧 Configurando dropdown', index, toggle.textContent.trim());
        
        toggle.addEventListener('click', function(e) {
            console.log('');
            console.log('=== 👆 CLICK EN DROPDOWN ===');
            console.log('Texto:', this.textContent.trim());
            console.log('Ancho ventana:', window.innerWidth);
            
            // SIEMPRE prevenir navegación
            e.preventDefault();
            e.stopPropagation();
            
            if (window.innerWidth <= 1024) {
                console.log('📱 Modo móvil activo');
                
                const parentDropdown = this.closest('.dropdown');
                const isActive = parentDropdown.classList.contains('active');
                
                console.log('Estado antes:', isActive ? '✅ Abierto' : '❌ Cerrado');
                
                // Cerrar todos
                document.querySelectorAll('.dropdown.active').forEach(function(dd) {
                    dd.classList.remove('active');
                });
                
                // Abrir si no estaba activo
                if (!isActive) {
                    parentDropdown.classList.add('active');
                    this.setAttribute('aria-expanded', 'true');
                    console.log('✅ DROPDOWN AHORA ABIERTO');
                } else {
                    this.setAttribute('aria-expanded', 'false');
                    console.log('✅ DROPDOWN AHORA CERRADO');
                }
                
                console.log('Estado después:', parentDropdown.classList.contains('active') ? '✅ Abierto' : '❌ Cerrado');
            } else {
                console.log('💻 Modo escritorio - ignorando');
            }
        });
    });

    // 3. OVERLAY
    if (overlay) {
        overlay.addEventListener('click', function() {
            console.log('👆 Click en overlay');
            closeMenu();
        });
    }

    // 4. ENLACES EN SUBMENUS
    const submenuLinks = document.querySelectorAll('.dropdown-menu a:not(.dropdown-toggle), .mega-menu a:not(.dropdown-toggle)');
    console.log('🔗 Enlaces en submenus:', submenuLinks.length);
    submenuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                console.log('👆 Click en enlace de submenu');
                setTimeout(closeMenu, 100);
            }
        });
    });

    // 5. ENLACES DIRECTOS
    const directLinks = document.querySelectorAll('.nav-links > li:not(.dropdown) > a');
    console.log('🔗 Enlaces directos:', directLinks.length);
    directLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                console.log('👆 Click en enlace directo');
                closeMenu();
            }
        });
    });

    // 6. CLICK FUERA
    document.addEventListener('click', function(e) {
        if (mainNav.classList.contains('active')) {
            // Verificar que no es un dropdown-toggle
            if (e.target.classList.contains('dropdown-toggle') || 
                e.target.closest('.dropdown-toggle')) {
                console.log('⚠️ Click en dropdown-toggle, no cerrar menú');
                return;
            }
            
            if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
                console.log('👆 Click fuera del menú');
                closeMenu();
            }
        }
    });

    // 7. RESIZE
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeMenu();
        }
    });

    // 8. SCROLL
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }
    
    console.log('✅ MENU MOVIL CONFIGURADO CORRECTAMENTE');
    console.log('');
}

// Exportar para que pueda ser llamado desde include.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = initMobileMenu;
}
