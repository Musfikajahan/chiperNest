document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    setupEventListeners();
});

function loadNotifications(filterType = 'all') {
    fetch(`/api/notifications?type=${filterType}`)
        .then(response => response.json())
        .then(notifications => {
            const notificationsList = document.querySelector('.notifications-list');
            notificationsList.innerHTML = '';
            
            notifications.forEach(notification => {
                notificationsList.appendChild(createNotificationElement(notification));
            });
        })
        .catch(error => console.error('Error loading notifications:', error));
}

function createNotificationElement(notification) {
    const template = `
        <div class="notification-item ${notification.severity} ${notification.is_read ? '' : 'unread'}" data-id="${notification.id}">
            <div class="notification-icon">
                <i class="fas ${getIconForType(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <h3>${notification.title}</h3>
                    <span class="notification-time">${formatTimeAgo(notification.created_at)}</span>
                </div>
                <p>${notification.message}</p>
                <div class="notification-actions">
                    ${notification.action_url ? 
                        `<button class="action-btn" onclick="handleAction('${notification.action_url}')">${notification.action_text}</button>` 
                        : ''}
                    <button class="dismiss-btn" onclick="dismissNotification(${notification.id})">Dismiss</button>
                </div>
            </div>
        </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    return wrapper.firstChild;
}

function setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            loadNotifications(e.target.textContent.toLowerCase());
        });
    });

    // Mark all as read
    document.querySelector('.mark-all-btn').addEventListener('click', markAllAsRead);

    // Notification preferences
    document.querySelectorAll('.setting-item input').forEach(toggle => {
        toggle.addEventListener('change', updatePreferences);
    });
}

function dismissNotification(id) {
    fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_id: id })
    })
    .then(response => {
        if (response.ok) {
            const element = document.querySelector(`[data-id="${id}"]`);
            element?.remove();
        }
    })
    .catch(error => console.error('Error dismissing notification:', error));
}

function markAllAsRead() {
    fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            document.querySelectorAll('.notification-item.unread')
                .forEach(item => item.classList.remove('unread'));
        }
    })
    .catch(error => console.error('Error marking notifications as read:', error));
}

function updatePreferences(event) {
    const preferences = {
        security_alerts: document.querySelector('input[name="security_alerts"]').checked,
        password_updates: document.querySelector('input[name="password_updates"]').checked,
        login_attempts: document.querySelector('input[name="login_attempts"]').checked,
        email_notifications: document.querySelector('input[name="email_notifications"]').checked
    };

    fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
    })
    .catch(error => console.error('Error updating preferences:', error));
}

function getIconForType(type) {
    const icons = {
        security_alert: 'fa-shield-alt',
        password_update: 'fa-key',
        login_attempt: 'fa-user-shield',
        system_update: 'fa-sync',
        password_strength: 'fa-lock',
        password_reuse: 'fa-copy',
        '2fa_setup': 'fa-qrcode'
    };
    return icons[type] || 'fa-bell';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}
