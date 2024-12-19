// Security Check JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize security dashboard
    initializeSecurityCheck();
    
    // Add event listeners for password check form
    const passwordCheckForm = document.getElementById('password-check-form');
    if (passwordCheckForm) {
        passwordCheckForm.addEventListener('submit', handlePasswordCheck);
    }
    
    // Set up periodic account checks
    setInterval(checkAccountSecurity, 3600000); // Check every hour
});

async function initializeSecurityCheck() {
    try {
        // Get security alerts
        const alertsResponse = await fetch('/api/security/alerts');
        const alertsData = await alertsResponse.json();
        updateSecurityAlerts(alertsData.alerts);
        
        // Check account security
        await checkAccountSecurity();
        
    } catch (error) {
        console.error('Error initializing security check:', error);
        showError('Failed to initialize security check');
    }
}

async function handlePasswordCheck(event) {
    event.preventDefault();
    
    const password = document.getElementById('password-input').value;
    
    try {
        const response = await fetch('/api/security/check-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        displayPasswordCheckResults(data);
        
    } catch (error) {
        console.error('Error checking password:', error);
        showError('Failed to check password security');
    }
}

async function checkAccountSecurity() {
    try {
        const response = await fetch('/api/security/check-accounts');
        const data = await response.json();
        
        updateSecurityDashboard(data.accounts);
        
    } catch (error) {
        console.error('Error checking account security:', error);
        showError('Failed to check account security');
    }
}

function updateSecurityDashboard(accounts) {
    const dashboard = document.querySelector('.security-dashboard');
    if (!dashboard) return;
    
    // Clear existing content
    dashboard.innerHTML = '';
    
    // Add summary section
    const summary = createSecuritySummary(accounts);
    dashboard.appendChild(summary);
    
    // Add account list
    const accountList = createAccountList(accounts);
    dashboard.appendChild(accountList);
}

function createSecuritySummary(accounts) {
    const summary = document.createElement('div');
    summary.className = 'security-summary';
    
    const totalAccounts = accounts.length;
    const weakPasswords = accounts.filter(acc => acc.security_status.score < 60).length;
    const breachedAccounts = accounts.filter(acc => acc.is_breached).length;
    const oldPasswords = accounts.filter(acc => acc.age_warning).length;
    
    summary.innerHTML = `
        <div class="summary-item">
            <h3>Total Accounts</h3>
            <p>${totalAccounts}</p>
        </div>
        <div class="summary-item ${weakPasswords > 0 ? 'warning' : ''}">
            <h3>Weak Passwords</h3>
            <p>${weakPasswords}</p>
        </div>
        <div class="summary-item ${breachedAccounts > 0 ? 'danger' : ''}">
            <h3>Breached Accounts</h3>
            <p>${breachedAccounts}</p>
        </div>
        <div class="summary-item ${oldPasswords > 0 ? 'warning' : ''}">
            <h3>Old Passwords</h3>
            <p>${oldPasswords}</p>
        </div>
    `;
    
    return summary;
}

function createAccountList(accounts) {
    const list = document.createElement('div');
    list.className = 'account-list';
    
    accounts.forEach(account => {
        const accountCard = document.createElement('div');
        accountCard.className = `account-card ${getSecurityClass(account)}`;
        
        accountCard.innerHTML = `
            <div class="account-header">
                <h4>${account.website}</h4>
                <span class="username">${account.username}</span>
            </div>
            <div class="security-details">
                <div class="strength-meter">
                    <div class="strength-bar" style="width: ${account.security_status.score}%"></div>
                </div>
                <p class="last-updated">Last updated: ${formatDate(account.last_updated)}</p>
                ${account.is_breached ? '<p class="breach-warning">⚠️ Password exposed in breach</p>' : ''}
                ${account.age_warning ? '<p class="age-warning">⚠️ Password needs update</p>' : ''}
            </div>
        `;
        
        list.appendChild(accountCard);
    });
    
    return list;
}

function displayPasswordCheckResults(results) {
    const resultsDiv = document.querySelector('.check-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="strength-section">
            <h3>Password Strength: ${results.strength_score.score.toFixed(1)}%</h3>
            <div class="strength-meter">
                <div class="strength-bar" style="width: ${results.strength_score.score}%"></div>
            </div>
        </div>
        
        <div class="checks-section">
            <h3>Security Checks</h3>
            <ul>
                ${Object.entries(results.strength_score.checks).map(([check, passed]) => `
                    <li class="${passed ? 'passed' : 'failed'}">
                        ${formatCheckName(check)}: ${passed ? '✓' : '✗'}
                    </li>
                `).join('')}
            </ul>
        </div>
        
        ${results.patterns_found.length > 0 ? `
            <div class="patterns-section warning">
                <h3>Patterns Found</h3>
                <ul>
                    ${Object.entries(results.patterns_found).map(([pattern, found]) => `
                        <li>${formatPatternName(pattern)}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${results.is_breached ? `
            <div class="breach-section danger">
                <h3>⚠️ Password Breach Detected</h3>
                <p>This password has been exposed in known data breaches.</p>
            </div>
        ` : ''}
        
        <div class="recommendations-section">
            <h3>Recommendations</h3>
            <ul>
                ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

function updateSecurityAlerts(alerts) {
    const alertsContainer = document.querySelector('.security-alerts');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
            <span class="alert-icon">${getAlertIcon(alert.severity)}</span>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <span class="alert-time">${formatDate(alert.created_at)}</span>
            </div>
        </div>
    `).join('');
}

// Utility functions
function getSecurityClass(account) {
    if (account.is_breached) return 'danger';
    if (account.security_status.score < 60 || account.age_warning) return 'warning';
    return 'safe';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCheckName(check) {
    return check.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatPatternName(pattern) {
    return pattern.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getAlertIcon(severity) {
    switch (severity) {
        case 'danger': return '🚨';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '✓';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}
