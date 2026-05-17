/**
 * Sistema de Notificaciones
 * Maneja notificaciones para admins y clientes
 */

class NotificationSystem {
    constructor() {
        this.notifications = this.loadNotifications();
        this.init();
    }

    init() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Crear badge de notificaciones si no existe
        this.createNotificationBadge();
    }

    createNotificationBadge() {
        // Buscar el header del dashboard
        const dashboardNavbar = document.querySelector('.dashboard-navbar');
        if (!dashboardNavbar) return;

        // Verificar si ya existe el badge
        if (document.getElementById('notification-bell')) return;

        const userInfo = dashboardNavbar.querySelector('.user-info');
        if (!userInfo) return;

        // Crear botón de notificaciones
        const notificationBtn = document.createElement('button');
        notificationBtn.id = 'notification-bell';
        notificationBtn.className = 'notification-bell';
        notificationBtn.setAttribute('aria-label', 'Ver notificaciones');
        notificationBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge" style="display: none;">0</span>
        `;

        // Insertar antes del user-info
        userInfo.parentNode.insertBefore(notificationBtn, userInfo);

        // Panel de notificaciones
        const notificationPanel = document.createElement('div');
        notificationPanel.id = 'notification-panel';
        notificationPanel.className = 'notification-panel';
        notificationPanel.innerHTML = `
            <div class="notification-panel-header">
                <h3>Notificaciones</h3>
                <button id="mark-all-read" class="btn-text" aria-label="Marcar todas como leídas">
                    <i class="fas fa-check-double"></i> Marcar todas como leídas
                </button>
            </div>
            <div class="notification-panel-body" id="notification-list">
                <!-- Notificaciones se cargarán aquí -->
            </div>
            <div class="notification-panel-footer">
                <button id="clear-all-notifications" class="btn-text" aria-label="Limpiar todas las notificaciones">
                    <i class="fas fa-trash"></i> Limpiar todas
                </button>
            </div>
        `;
        document.body.appendChild(notificationPanel);

        // Event listeners
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        document.getElementById('mark-all-read').addEventListener('click', () => {
            this.markAllAsRead();
        });

        document.getElementById('clear-all-notifications').addEventListener('click', () => {
            this.clearAll();
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationPanel.classList.remove('active');
            }
        });

        // Actualizar UI
        this.updateBadge();
        this.renderNotifications();
    }

    togglePanel() {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('active');
        
        if (panel.classList.contains('active')) {
            this.renderNotifications();
        }
    }

    loadNotifications() {
        const stored = localStorage.getItem('notifications');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    addNotification(type, title, message, data = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            type, // 'success', 'info', 'warning', 'error'
            title,
            message,
            data,
            read: false,
            timestamp: new Date().toISOString()
        };

        this.notifications.unshift(notification);
        
        // Limitar a 50 notificaciones
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.saveNotifications();
        this.updateBadge();
        this.showToast(notification);

        return notification;
    }

    showToast(notification) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.type}`;
        toast.innerHTML = `
            <div class="notification-toast-icon">
                <i class="fas ${this.getIcon(notification.type)}"></i>
            </div>
            <div class="notification-toast-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
            </div>
            <button class="notification-toast-close" aria-label="Cerrar notificación">
                <i class="fas fa-times"></i>
            </button>
        `;

        toast.querySelector('.notification-toast-close').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });

        container.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };
        return icons[type] || 'fa-bell';
    }

    updateBadge() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    renderNotifications() {
        const list = document.getElementById('notification-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No tienes notificaciones</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-item-icon notification-${notif.type}">
                    <i class="fas ${this.getIcon(notif.type)}"></i>
                </div>
                <div class="notification-item-content">
                    <strong>${notif.title}</strong>
                    <p>${notif.message}</p>
                    <span class="notification-time">${this.getTimeAgo(notif.timestamp)}</span>
                </div>
                ${!notif.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');

        // Añadir listeners
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseFloat(item.dataset.id);
                this.markAsRead(id);
                
                // Si tiene un enlace, navegar
                const notif = this.notifications.find(n => n.id === id);
                if (notif && notif.data && notif.data.link) {
                    window.location.href = notif.data.link;
                }
            });
        });
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return past.toLocaleDateString('es-ES');
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.saveNotifications();
            this.updateBadge();
            this.renderNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    async clearAll() {
        if (window.showConfirm) {
            const confirmed = await window.showConfirm(
                '¿Estás seguro de que quieres eliminar todas las notificaciones?',
                'Eliminar Notificaciones',
                { type: 'warning', confirmText: 'Sí, eliminar', cancelText: 'Cancelar' }
            );
            if (!confirmed) return;
        }
        this.notifications = [];
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    // Métodos helper para tipos específicos de notificaciones
    notifyNewPhotos(clientName, count) {
        return this.addNotification(
            'success',
            '📸 Nuevas fotos subidas',
            `Se han subido ${count} nuevas foto${count > 1 ? 's' : ''} para ${clientName}`,
            { type: 'photos', clientName }
        );
    }

    notifyNewClient(clientName) {
        return this.addNotification(
            'info',
            '👤 Nuevo cliente creado',
            `Se ha creado el cliente: ${clientName}`,
            { type: 'client', clientName }
        );
    }

    notifyGalleryShared(clientName) {
        return this.addNotification(
            'success',
            '🔗 Galería compartida',
            `La galería de ${clientName} ha sido compartida`,
            { type: 'share', clientName }
        );
    }

    notifyError(message) {
        return this.addNotification(
            'error',
            '⚠️ Error',
            message,
            { type: 'error' }
        );
    }
}

// CSS para las notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
/* Contenedor de toasts */
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
}

/* Toast individual */
.notification-toast {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--gold);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
}

.notification-toast.fade-out {
    animation: slideOut 0.3s ease;
}

.notification-toast-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.notification-toast-content {
    flex: 1;
}

.notification-toast-content strong {
    display: block;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
}

.notification-toast-content p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0;
}

.notification-toast-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    font-size: 1.2rem;
    flex-shrink: 0;
    transition: color 0.2s;
}

.notification-toast-close:hover {
    color: var(--text-primary);
}

/* Tipos de notificaciones */
.notification-success {
    border-left-color: #4caf50;
}

.notification-success .notification-toast-icon {
    color: #4caf50;
}

.notification-info {
    border-left-color: #2196f3;
}

.notification-info .notification-toast-icon {
    color: #2196f3;
}

.notification-warning {
    border-left-color: #ff9800;
}

.notification-warning .notification-toast-icon {
    color: #ff9800;
}

.notification-error {
    border-left-color: #f44336;
}

.notification-error .notification-toast-icon {
    color: #f44336;
}

/* Botón de campana */
.notification-bell {
    position: relative;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.3rem;
    cursor: pointer;
    padding: 0.5rem;
    margin-right: 1rem;
    transition: color 0.2s;
}

.notification-bell:hover {
    color: var(--gold);
}

.notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #f44336;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 10px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Panel de notificaciones */
.notification-panel {
    position: fixed;
    top: 70px;
    right: 20px;
    width: 400px;
    max-height: 600px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 9999;
    display: none;
    flex-direction: column;
}

.notification-panel.active {
    display: flex;
    animation: fadeIn 0.2s ease;
}

.notification-panel-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.notification-panel-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.notification-panel-body {
    flex: 1;
    overflow-y: auto;
    max-height: 450px;
}

.notification-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
}

.notification-item:hover {
    background: var(--bg);
}

.notification-item.unread {
    background: rgba(212, 175, 55, 0.05);
}

.notification-item-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.2rem;
}

.notification-item-content {
    flex: 1;
}

.notification-item-content strong {
    display: block;
    color: var(--text-primary);
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
}

.notification-item-content p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
}

.notification-time {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.notification-dot {
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: var(--gold);
    border-radius: 50%;
}

.notification-empty {
    padding: 3rem;
    text-align: center;
    color: var(--text-secondary);
}

.notification-empty i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.notification-panel-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
}

.btn-text {
    background: none;
    border: none;
    color: var(--gold);
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.5rem;
    transition: color 0.2s;
}

.btn-text:hover {
    color: #b8941f;
}

/* Animaciones */
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .notification-container {
        max-width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
    }

    .notification-panel {
        width: calc(100vw - 40px);
        right: 20px;
        top: 60px;
    }
}
`;
document.head.appendChild(notificationStyles);

// Instancia global
window.notificationSystem = new NotificationSystem();
