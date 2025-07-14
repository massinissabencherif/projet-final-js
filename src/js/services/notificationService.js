// Service pour gérer les notifications de l'application
class NotificationService {
    constructor() {
        this.notifications = [];
        this.defaultDuration = 5000; // 5 secondes
    }

    // Afficher une notification
    show(message, type = 'info', duration = this.defaultDuration) {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fermer la notification">&times;</button>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Ajout d'aria-live pour l'accessibilité
        notification.setAttribute('aria-live', 'polite');
        
        // Gestionnaire de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });
        
        // Auto-fermeture
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }
        
        // Stocker la référence
        this.notifications.push(notification);
        
        return notification;
    }

    // Masquer une notification
    hide(notification) {
        if (!notification) return;
        
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            // Retirer de la liste
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    // Masquer toutes les notifications
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification);
        });
    }

    // Méthodes utilitaires pour différents types de notifications
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    }

    // Notification de chargement
    showLoading(message = 'Chargement...') {
        const notification = this.show(message, 'loading', 0); // Pas d'auto-fermeture
        notification.classList.add('loading-notification');
        return notification;
    }

    // Masquer la notification de chargement
    hideLoading(notification) {
        this.hide(notification);
    }

    // Notification avec actions
    showWithActions(message, actions = []) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-actions';
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-action-btn ${action.class || ''}" 
                            data-action="${action.action}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
            <button class="notification-close" aria-label="Fermer la notification">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Gestionnaires d'événements pour les actions
        actions.forEach(action => {
            const btn = notification.querySelector(`[data-action="${action.action}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', () => {
                    action.handler();
                    this.hide(notification);
                });
            }
        });
        
        // Gestionnaire de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });
        
        this.notifications.push(notification);
        return notification;
    }

    // Obtenir le nombre de notifications actives
    getActiveCount() {
        return this.notifications.length;
    }

    // Nettoyer les notifications orphelines
    cleanup() {
        this.notifications = this.notifications.filter(notification => {
            if (!document.body.contains(notification)) {
                return false;
            }
            return true;
        });
    }
}

// Exporter une instance unique du service
export const notificationService = new NotificationService(); 