/**
 * Sistema de Alertas y Confirmaciones Modales
 * Reemplaza alert() y confirm() del navegador con modales integrados
 */

(function() {
    'use strict';

    // Crear contenedor de modales si no existe
    if (!document.getElementById('modal-container')) {
        const container = document.createElement('div');
        container.id = 'modal-container';
        document.body.appendChild(container);
    }

    /**
     * Muestra una alerta simple (reemplaza alert())
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Duración en ms (0 = no auto-cerrar)
     */
    window.showAlert = function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('modal-container');
        if (!container) return;

        // Cerrar alerta existente si hay una
        const existing = container.querySelector('.modal-alert');
        if (existing) {
            existing.remove();
        }

        const alert = document.createElement('div');
        alert.className = `modal-alert modal-alert-${type}`;
        
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };

        alert.innerHTML = `
            <div class="modal-alert-content">
                <div class="modal-alert-icon">
                    <i class="fas ${icons[type] || icons.info}"></i>
                </div>
                <div class="modal-alert-message">${message}</div>
                <button class="modal-alert-close" aria-label="Cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(alert);

        // Animar entrada
        setTimeout(() => alert.classList.add('show'), 10);

        // Cerrar al hacer click en el botón
        const closeBtn = alert.querySelector('.modal-alert-close');
        closeBtn.addEventListener('click', () => {
            closeAlert(alert);
        });

        // Auto-cerrar si se especifica duración
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentNode) {
                    closeAlert(alert);
                }
            }, duration);
        }

        return alert;
    };

    function closeAlert(alert) {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 300);
    }

    /**
     * Muestra una confirmación (reemplaza confirm())
     * @param {string} message - Mensaje a mostrar
     * @param {string} title - Título del modal (opcional)
     * @param {Object} options - Opciones: { confirmText, cancelText, type }
     * @returns {Promise<boolean>} - true si se confirma, false si se cancela
     */
    window.showConfirm = function(message, title = 'Confirmar', options = {}) {
        return new Promise((resolve) => {
            const container = document.getElementById('modal-container');
            if (!container) {
                resolve(false);
                return;
            }

            // Cerrar confirmación existente si hay una
            const existing = container.querySelector('.modal-confirm');
            if (existing) {
                existing.remove();
            }

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const confirm = document.createElement('div');
            confirm.className = 'modal-confirm';
            
            const type = options.type || 'warning';
            const icons = {
                info: 'fa-info-circle',
                success: 'fa-check-circle',
                warning: 'fa-exclamation-triangle',
                error: 'fa-times-circle'
            };

            const confirmText = options.confirmText || 'Confirmar';
            const cancelText = options.cancelText || 'Cancelar';

            confirm.innerHTML = `
                <div class="modal-confirm-header">
                    <div class="modal-confirm-icon modal-confirm-${type}">
                        <i class="fas ${icons[type] || icons.warning}"></i>
                    </div>
                    <h3 class="modal-confirm-title">${title}</h3>
                </div>
                <div class="modal-confirm-body">
                    <p class="modal-confirm-message">${message}</p>
                </div>
                <div class="modal-confirm-footer">
                    <button class="modal-btn modal-btn-cancel">${cancelText}</button>
                    <button class="modal-btn modal-btn-confirm">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(confirm);
            container.appendChild(overlay);

            // Animar entrada
            setTimeout(() => {
                overlay.classList.add('show');
                confirm.classList.add('show');
            }, 10);

            // Handlers
            const handleConfirm = () => {
                closeConfirm(overlay);
                resolve(true);
            };

            const handleCancel = () => {
                closeConfirm(overlay);
                resolve(false);
            };

            const handleOverlay = (e) => {
                if (e.target === overlay) {
                    handleCancel();
                }
            };

            confirm.querySelector('.modal-btn-confirm').addEventListener('click', handleConfirm);
            confirm.querySelector('.modal-btn-cancel').addEventListener('click', handleCancel);
            overlay.addEventListener('click', handleOverlay);

            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    };

    function closeConfirm(overlay) {
        overlay.classList.remove('show');
        const confirm = overlay.querySelector('.modal-confirm');
        if (confirm) {
            confirm.classList.remove('show');
        }
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    }

    // Estilos CSS
    const styles = document.createElement('style');
    styles.textContent = `
        #modal-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        }

        /* Alertas (toast) */
        .modal-alert {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            background: var(--card-bg, #1a1a1a);
            border: 1px solid var(--border-color, #333);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
            pointer-events: all;
            z-index: 10001;
        }

        .modal-alert.show {
            opacity: 1;
            transform: translateX(0);
        }

        .modal-alert-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
        }

        .modal-alert-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .modal-alert-info .modal-alert-icon {
            color: #2196f3;
        }

        .modal-alert-success .modal-alert-icon {
            color: #4caf50;
        }

        .modal-alert-warning .modal-alert-icon {
            color: #ff9800;
        }

        .modal-alert-error .modal-alert-icon {
            color: #f44336;
        }

        .modal-alert-message {
            flex: 1;
            color: var(--text-primary, #fff);
            font-size: 0.95rem;
            line-height: 1.5;
            white-space: pre-line;
        }

        .modal-alert-close {
            background: none;
            border: none;
            color: var(--text-secondary, #999);
            cursor: pointer;
            padding: 0.25rem;
            font-size: 1.1rem;
            transition: color 0.2s;
            flex-shrink: 0;
        }

        .modal-alert-close:hover {
            color: var(--text-primary, #fff);
        }

        /* Confirmaciones (modal) */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: all;
            z-index: 10002;
        }

        .modal-overlay.show {
            opacity: 1;
        }

        .modal-confirm {
            background: var(--card-bg, #1a1a1a);
            border: 1px solid var(--border-color, #333);
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
            transition: all 0.3s ease;
        }

        .modal-confirm.show {
            opacity: 1;
            transform: scale(1) translateY(0);
        }

        .modal-confirm-header {
            padding: 1.5rem 1.5rem 1rem;
            text-align: center;
            border-bottom: 1px solid var(--border-color, #333);
        }

        .modal-confirm-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 2rem;
        }

        .modal-confirm-info {
            background: rgba(33, 150, 243, 0.1);
            color: #2196f3;
        }

        .modal-confirm-success {
            background: rgba(76, 175, 80, 0.1);
            color: #4caf50;
        }

        .modal-confirm-warning {
            background: rgba(255, 152, 0, 0.1);
            color: #ff9800;
        }

        .modal-confirm-error {
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
        }

        .modal-confirm-title {
            margin: 0;
            color: var(--text-primary, #fff);
            font-size: 1.25rem;
            font-weight: 600;
        }

        .modal-confirm-body {
            padding: 1.5rem;
        }

        .modal-confirm-message {
            margin: 0;
            color: var(--text-secondary, #ccc);
            font-size: 1rem;
            line-height: 1.6;
            white-space: pre-line;
        }

        .modal-confirm-footer {
            padding: 1rem 1.5rem 1.5rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            border-top: 1px solid var(--border-color, #333);
        }

        .modal-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .modal-btn-cancel {
            background: var(--bg, #2a2a2a);
            color: var(--text-primary, #fff);
            border: 1px solid var(--border-color, #333);
        }

        .modal-btn-cancel:hover {
            background: var(--bg-hover, #333);
        }

        .modal-btn-confirm {
            background: var(--gold, #d4af37);
            color: #fff;
        }

        .modal-btn-confirm:hover {
            background: #b8941f;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .modal-alert {
                right: 10px;
                left: 10px;
                max-width: none;
            }

            .modal-confirm {
                width: 95%;
                margin: 1rem;
            }

            .modal-confirm-footer {
                flex-direction: column-reverse;
            }

            .modal-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(styles);

    console.log('✅ Sistema de modales cargado');
})();
