class NotificationManager {
    constructor() {
        this.initializeElements();
        this.loadPreferences();
        this.attachEventListeners();
    }

    initializeElements() {
        this.toggles = {
            securityAlerts: document.querySelector('input[type="checkbox"][data-pref="security_alerts"]'),
            passwordUpdates: document.querySelector('input[type="checkbox"][data-pref="password_updates"]'),
            loginAttempts: document.querySelector('input[type="checkbox"][data-pref="login_attempts"]'),
            emailNotifications: document.querySelector('input[type="checkbox"][data-pref="email_notifications"]')
        };
    }

    async loadPreferences() {
        try {
            const response = await fetch('/api/notifications/preferences');
            if (!response.ok) throw new Error('Failed to load preferences');
            
            const prefs = await response.json();
            Object.keys(this.toggles).forEach(key => {
                const prefKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (this.toggles[key]) {
                    this.toggles[key].checked = prefs[prefKey];
                }
            });
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    attachEventListeners() {
        Object.values(this.toggles).forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('change', () => this.updatePreferences());
            }
        });
    }

    async updatePreferences() {
        try {
            const prefs = {
                security_alerts: this.toggles.securityAlerts?.checked || false,
                password_updates: this.toggles.passwordUpdates?.checked || false,
                login_attempts: this.toggles.loginAttempts?.checked || false,
                email_notifications: this.toggles.emailNotifications?.checked || false
            };

            const response = await fetch('/api/notifications/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prefs)
            });

            if (!response.ok) throw new Error('Failed to update preferences');
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotificationManager();
});