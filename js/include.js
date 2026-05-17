/**
 * IIFE para incluir dinámicamente contenido HTML en la página.
 * Busca elementos con el atributo `data-include` y carga en ellos
 * el HTML especificado en el atributo.
 * 
 * Ejemplo: <div data-include="components/header.html"></div>
 * Cargará el contenido de 'components/header.html' dentro de ese div.
 */
(function () {
    const includeHTML = async (el) => {
        let file = el.getAttribute('data-include');
        if (file) {
            // Si la ruta no empieza con /, calcular ruta relativa desde la raíz
            if (!file.startsWith('/') && !file.startsWith('http')) {
                // Obtener la ruta actual del HTML
                const currentPath = window.location.pathname;
                // Contar niveles de profundidad (pages/admin, pages/client, etc.)
                const pathParts = currentPath.split('/').filter(p => p && p !== 'index.html');
                const depth = pathParts.length - 1; // -1 porque el archivo HTML no cuenta
                
                // Construir ruta relativa a la raíz
                if (depth > 0) {
                    file = '../'.repeat(depth) + file;
                }
            }
            
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`No se pudo cargar el archivo: ${file} (Estado: ${response.status})`);
                }
                const html = await response.text();
                el.innerHTML = html;
                
                console.log(`✅ Archivo cargado: ${file}`);

                // Si el elemento incluido es el header, inicializar el menú móvil
                if (el.dataset.include.includes('header')) {
                    console.log('🔄 Header cargado, inicializando menú móvil...');
                    
                    // Esperar un poco para asegurar que el DOM está completamente renderizado
                    setTimeout(() => {
                        if (typeof initMobileMenu === 'function') {
                            initMobileMenu();
                        } else {
                            console.error('❌ initMobileMenu no está definida');
                        }
                    }, 200);
                }

            } catch (error) {
                console.error('❌ Error al incluir HTML:', error);
                el.innerHTML = `<p style="color:red;">Error cargando ${file}</p>`;
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM cargado, incluyendo componentes...');
        const elementsToInclude = document.querySelectorAll('[data-include]');
        elementsToInclude.forEach(el => includeHTML(el));
    });

})();
