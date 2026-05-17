/**
 * Servicio de Galería - CL Fotógrafos
 * 
 * Maneja la visualización dinámica de galerías de fotos
 * con diseño Grid Masonry responsive
 */

class GalleryService {
    constructor() {
        this.currentPhotos = {};
        this.currentCategory = 'all';
        this.favorites = [];
    }

    /**
     * Cargar fotos del cliente
     * @param {string} clientId - ID del cliente
     * @param {string} accessCode - Código de acceso (para modo demo)
     * @returns {Promise<Object>} Fotos organizadas por categoría
     */
    async loadClientPhotos(clientId, accessCode = null) {
        if (CONFIG.useDemoMode() && accessCode) {
            // Modo demo: cargar desde localStorage
            const storedPhotos = JSON.parse(localStorage.getItem(`photos_${accessCode}`) || '{}');
            this.currentPhotos = storedPhotos;
            return {
                success: true,
                data: storedPhotos
            };
        } else {
            // Modo real: cargar desde Supabase
            // Pasar accessCode también para que busque fotos con client_id incorrecto
            const result = await window.dbService.getClientPhotos(clientId, null, accessCode);
            if (result.success) {
                this.currentPhotos = result.data;
            }
            return result;
        }
    }

    /**
     * Renderizar galería en el contenedor
     * @param {HTMLElement} container - Contenedor donde renderizar
     * @param {string} category - Categoría a mostrar ('all' para todas)
     * @param {Object} options - Opciones de renderizado
     */
    renderGallery(container, category = 'all', options = {}) {
        this.currentCategory = category;

        // Limpiar contenedor completamente
        container.innerHTML = '';
        
        // Asegurar que el contenedor tenga los estilos correctos
        if (container.classList.contains('photos-grid')) {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            container.style.gap = options.gap || '1.5rem';
            container.style.width = '100%';
            container.style.boxSizing = 'border-box';
        }

        // Obtener fotos a mostrar
        let photosToShow = [];

        if (category === 'all') {
            // Mostrar todas las fotos de todas las categorías
            Object.values(this.currentPhotos).forEach(categoryPhotos => {
                photosToShow = photosToShow.concat(categoryPhotos);
            });
        } else if (category === 'favorites') {
            // Mostrar solo favoritos que realmente existen en las fotos cargadas
            // Normalizar URLs para comparación (eliminar espacios, normalizar)
            const normalizeUrl = (url) => {
                if (!url || typeof url !== 'string') return null;
                return url.trim();
            };
            
            photosToShow = this.favorites.map(fav => {
                // Normalizar URL del favorito
                const favUrl = normalizeUrl(
                    typeof fav === 'string' ? fav : fav.r2_url || fav.url || fav
                );
                if (!favUrl) return null;
                
                // Buscar la foto en todas las categorías
                for (const catPhotos of Object.values(this.currentPhotos)) {
                    const found = catPhotos.find(photo => {
                        const photoUrl = normalizeUrl(
                            typeof photo === 'string' ? photo : photo.r2_url || photo.url || photo
                        );
                        return photoUrl && photoUrl === favUrl;
                    });
                    if (found) return found;
                }
                return null;
            }).filter(Boolean);
        } else {
            // Mostrar fotos de una categoría específica
            photosToShow = this.currentPhotos[category] || [];
        }

        if (photosToShow.length === 0) {
            container.innerHTML = this.renderEmptyState(category);
            return;
        }

        // Determinar qué elemento usar como grid (el contenedor o uno nuevo)
        let grid;
        
        // Si el contenedor es .photos-grid, crear las tarjetas directamente
        // Si no, crear un .gallery-grid dentro
        if (container.classList.contains('photos-grid')) {
            // Usar el contenedor directamente como grid
            grid = container;
            photosToShow.forEach((photo, index) => {
                // photo puede ser un string (URL) o un objeto {id, r2_url, r2_key}
                const photoUrl = typeof photo === 'string' ? photo : photo.r2_url || photo.url || photo;
                const photoElement = this.createPhotoCardElement(photoUrl, index, options);
                grid.appendChild(photoElement);
            });
        } else {
            // Crear grid masonry
            grid = document.createElement('div');
            grid.className = 'gallery-grid';
            grid.setAttribute('role', 'grid');
            grid.setAttribute('aria-label', `Galería de fotos - ${category === 'all' ? 'Todas' : category}`);

            // Aplicar estilos al grid
            this.applyGridStyles(grid, options);

            // Crear elementos de imagen
            photosToShow.forEach((photo, index) => {
                // photo puede ser un string (URL) o un objeto {id, r2_url, r2_key}
                const photoUrl = typeof photo === 'string' ? photo : photo.r2_url || photo.url || photo;
                const photoElement = this.createPhotoElement(photoUrl, index, options);
                grid.appendChild(photoElement);
            });

            container.appendChild(grid);
        }

        // Inicializar lightbox si está habilitado
        if (options.enableLightbox !== false && grid) {
            this.initLightbox(grid);
        }

        // Lazy loading
        if (grid) {
            this.initLazyLoading(grid);
        }
    }

    /**
     * Crear elemento de foto
     * @param {string} photoUrl - URL de la foto
     * @param {number} index - Índice de la foto
     * @param {Object} options - Opciones
     * @returns {HTMLElement} Elemento de foto
     */
    createPhotoElement(photoUrl, index, options = {}) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('role', 'gridcell');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Foto ${index + 1}`);
        
        // Asegurar que el item no se expanda más de lo necesario
        item.style.cssText = `
            width: 100%;
            max-width: 100%;
            min-width: 0;
            aspect-ratio: 1;
            position: relative;
            overflow: hidden;
        `;

        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = `Foto ${index + 1}`;
        img.loading = 'lazy';
        img.className = 'gallery-image';
        
        // Aplicar estilos de imagen
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
            transition: transform 0.3s ease, opacity 0.3s ease;
            cursor: pointer;
            display: block;
        `;

        // Efecto hover
        item.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.05)';
            img.style.opacity = '0.9';
        });

        item.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
            img.style.opacity = '1';
        });

        // Click para lightbox
        if (options.enableLightbox !== false) {
            item.addEventListener('click', () => {
                this.openLightbox(photoUrl, index);
            });

            // Soporte de teclado
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openLightbox(photoUrl, index);
                }
            });
        }

        // Botón de favorito (si está habilitado)
        if (options.enableFavorites) {
            const favoriteBtn = this.createFavoriteButton(photoUrl);
            item.appendChild(favoriteBtn);
        }

        item.appendChild(img);
        return item;
    }

    /**
     * Crear elemento de tarjeta de foto (para usar con .photos-grid)
     * @param {string} photoUrl - URL de la foto
     * @param {number} index - Índice de la foto
     * @param {Object} options - Opciones
     * @returns {HTMLElement} Elemento de tarjeta de foto
     */
    createPhotoCardElement(photoUrl, index, options = {}) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.style.cssText = `
            width: 100%;
            max-width: 100%;
            min-width: 0;
            aspect-ratio: 1;
            position: relative;
        `;

        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = `Foto ${index + 1}`;
        img.loading = 'lazy';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            cursor: pointer;
        `;

        // Botones de acción
        const actions = document.createElement('div');
        actions.className = 'photo-actions';
        actions.style.cssText = `
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            display: flex;
            gap: 0.5rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const isFavorite = this.favorites.includes(photoUrl);
        
        // Botón favorito
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = `photo-action-btn favorite ${isFavorite ? 'active' : ''}`;
        favoriteBtn.dataset.url = photoUrl;
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(photoUrl, favoriteBtn);
        });

        // Botón descargar (el listener se añadirá desde dashboard-cliente.html)
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'photo-action-btn download';
        downloadBtn.dataset.url = photoUrl;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        // No añadir listener aquí, se añadirá desde dashboard-cliente.html

        actions.appendChild(favoriteBtn);
        actions.appendChild(downloadBtn);

        // Info de categoría
        const info = document.createElement('div');
        info.className = 'photo-info';
        info.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 0.75rem;
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
        `;

        // Hover para mostrar acciones
        card.addEventListener('mouseenter', () => {
            actions.style.opacity = '1';
        });
        card.addEventListener('mouseleave', () => {
            actions.style.opacity = '0';
        });

        // Click para lightbox
        if (options.enableLightbox !== false) {
            card.addEventListener('click', () => {
                this.openLightbox(photoUrl, index);
            });
        }

        card.appendChild(img);
        card.appendChild(actions);
        card.appendChild(info);

        return card;
    }

    /**
     * Crear botón de favorito
     * @param {string} photoUrl - URL de la foto
     * @returns {HTMLElement} Botón de favorito
     */
    createFavoriteButton(photoUrl) {
        const btn = document.createElement('button');
        btn.className = 'favorite-btn';
        btn.setAttribute('aria-label', 'Marcar como favorito');
        btn.innerHTML = '<i class="fas fa-heart"></i>';
        
        const isFavorite = this.favorites.includes(photoUrl);
        if (isFavorite) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(photoUrl, btn);
        });

        return btn;
    }

    /**
     * Alternar favorito
     * @param {string} photoUrl - URL de la foto
     * @param {HTMLElement} button - Botón de favorito
     */
    toggleFavorite(photoUrl, button) {
        const index = this.favorites.indexOf(photoUrl);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            button.classList.remove('active');
        } else {
            this.favorites.push(photoUrl);
            button.classList.add('active');
        }

        // Guardar favoritos
        const user = window.authService.getCurrentUser();
        if (user && user.accessCode) {
            localStorage.setItem(`favorites_${user.accessCode}`, JSON.stringify(this.favorites));
        }
    }

    /**
     * Aplicar estilos al grid
     * @param {HTMLElement} grid - Elemento grid
     * @param {Object} options - Opciones
     */
    applyGridStyles(grid, options = {}) {
        const columns = options.columns || 3;
        const gap = options.gap || '1rem';

        grid.style.cssText = `
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
            gap: ${gap};
            padding: 1rem 0;
            width: 100%;
            box-sizing: border-box;
        `;

        // Asegurar que los elementos del grid no se expandan
        grid.querySelectorAll('.gallery-item').forEach(item => {
            item.style.minWidth = '0';
            item.style.maxWidth = '100%';
        });

        // Responsive
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const updateColumns = () => {
            if (mediaQuery.matches) {
                grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr)) !important';
            } else {
                grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(250px, 1fr)) !important`;
            }
        };

        mediaQuery.addEventListener('change', updateColumns);
        updateColumns();
    }

    /**
     * Renderizar estado vacío
     * @param {string} category - Categoría
     * @returns {string} HTML del estado vacío
     */
    renderEmptyState(category) {
        return `
            <div class="empty-state" style="
                text-align: center;
                padding: 4rem 2rem;
                color: var(--text-secondary);
            ">
                <i class="fas fa-images" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">No hay fotos disponibles</h3>
                <p>${category === 'all' ? 'Aún no se han subido fotos a esta galería.' : `No hay fotos en la categoría "${category}".`}</p>
            </div>
        `;
    }

    /**
     * Inicializar lazy loading
     * @param {HTMLElement} container - Contenedor
     */
    initLazyLoading(container) {
        const images = container.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => {
                if (img.dataset.src) {
                    imageObserver.observe(img);
                }
            });
        }
    }

    /**
     * Inicializar lightbox
     * @param {HTMLElement} container - Contenedor
     */
    initLightbox(container) {
        // El lightbox se maneja en el evento click de cada foto
        // Ver método openLightbox
    }

    /**
     * Abrir lightbox
     * @param {string} photoUrl - URL de la foto
     * @param {number} index - Índice de la foto
     */
    openLightbox(photoUrl, index) {
        // Usar el lightbox existente en dashboard-cliente.html si existe
        let lightbox = document.getElementById('lightbox');
        
        if (!lightbox) {
            // Si no existe, crear uno nuevo
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.innerHTML = `
                <span class="close-btn">&times;</span>
                <button class="lightbox-prev" aria-label="Foto anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="lightbox-next" aria-label="Foto siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <img src="" alt="Imagen ampliada">
            `;
            document.body.appendChild(lightbox);
        }

        // Obtener todas las fotos visibles para navegación
        const allVisiblePhotos = [];
        const photoCards = document.querySelectorAll('.photo-card img, .gallery-item img');
        photoCards.forEach(card => {
            const url = card.src || card.dataset.src || card.getAttribute('src');
            if (url) allVisiblePhotos.push(url);
        });

        // Guardar datos para navegación
        lightbox.dataset.currentIndex = index;
        lightbox.dataset.allPhotos = JSON.stringify(allVisiblePhotos);

        // Mostrar foto
        const img = lightbox.querySelector('img');
        if (img) {
            img.src = photoUrl;
        }
        lightbox.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Añadir listeners si no existen
        if (!lightbox.dataset.listenersAdded) {
            const closeBtn = lightbox.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeLightbox();
                });
            }

            const prevBtn = lightbox.querySelector('.lightbox-prev');
            const nextBtn = lightbox.querySelector('.lightbox-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    this.navigateLightbox(-1);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.navigateLightbox(1);
                });
            }

            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.closeLightbox();
                }
            });

            // Navegación con teclado
            const keyHandler = (e) => {
                if (lightbox.classList.contains('visible')) {
                    if (e.key === 'Escape') {
                        this.closeLightbox();
                    } else if (e.key === 'ArrowLeft') {
                        this.navigateLightbox(-1);
                    } else if (e.key === 'ArrowRight') {
                        this.navigateLightbox(1);
                    }
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            lightbox.dataset.keyHandler = 'true';
            
            lightbox.dataset.listenersAdded = 'true';
        }
    }

    /**
     * Cerrar lightbox
     */
    closeLightbox() {
        const lightbox = document.getElementById('lightbox') || document.getElementById('gallery-lightbox');
        if (lightbox) {
            lightbox.classList.remove('visible');
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Navegar en lightbox
     * @param {number} direction - Dirección (-1: anterior, 1: siguiente)
     */
    navigateLightbox(direction) {
        const lightbox = document.getElementById('lightbox') || document.getElementById('gallery-lightbox');
        if (!lightbox) return;

        try {
            const allPhotos = JSON.parse(lightbox.dataset.allPhotos || '[]');
            if (allPhotos.length === 0) return;

            let currentIndex = parseInt(lightbox.dataset.currentIndex || '0');
            currentIndex += direction;

            // Circular navigation
            if (currentIndex < 0) {
                currentIndex = allPhotos.length - 1;
            } else if (currentIndex >= allPhotos.length) {
                currentIndex = 0;
            }

            const nextPhotoUrl = allPhotos[currentIndex];
            if (nextPhotoUrl) {
                const img = lightbox.querySelector('img');
                if (img) {
                    img.src = nextPhotoUrl;
                }
                lightbox.dataset.currentIndex = currentIndex;
            }
        } catch (error) {
            console.error('Error navegando lightbox:', error);
        }
    }

    /**
     * Aplicar estilos al lightbox
     * @param {HTMLElement} lightbox - Elemento lightbox
     */
    styleLightbox(lightbox) {
        lightbox.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        `;

        const content = lightbox.querySelector('.lightbox-content');
        content.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            position: relative;
        `;

        const img = lightbox.querySelector('.lightbox-image');
        img.style.cssText = `
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 4px;
        `;

        // Botones
        const buttons = lightbox.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                transition: all 0.3s ease;
            `;

            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.1)';
            });
        });

        lightbox.querySelector('.lightbox-close').style.cssText += `
            top: 20px;
            right: 20px;
        `;

        lightbox.querySelector('.lightbox-prev').style.cssText += `
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
        `;

        lightbox.querySelector('.lightbox-next').style.cssText += `
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        `;
    }

    /**
     * Cargar favoritos
     * @param {string} accessCode - Código de acceso
     */
    loadFavorites(accessCode) {
        if (accessCode) {
            this.favorites = JSON.parse(localStorage.getItem(`favorites_${accessCode}`) || '[]');
        }
    }
}

// Inicializar servicio global
window.galleryService = new GalleryService();
