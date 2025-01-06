document.addEventListener('DOMContentLoaded', () => {
    // Password visibility toggle functionality
    document.querySelector('.toggle-visibility').addEventListener('click', function() {
        const passwordInput = document.getElementById('passwordCheck');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Password strength checker
    document.getElementById("passwordCheck").addEventListener("input", (e) => {
        const password = e.target.value;
        const strengthBar = document.querySelector(".strength-bar");
        const strengthLabel = document.querySelector(".strength-label span");
        const requirements = document.querySelectorAll(".requirement");
        
        // Check password strength locally
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        // Update requirements list
        requirements[0].classList.toggle('met', hasMinLength);
        requirements[1].classList.toggle('met', hasUpperCase);
        requirements[2].classList.toggle('met', hasNumber);
        requirements[3].classList.toggle('met', hasSpecialChar);
        
        // Calculate strength score
        let score = 0;
        if (hasMinLength) score += 25;
        if (hasUpperCase) score += 25;
        if (hasNumber) score += 25;
        if (hasSpecialChar) score += 25;
        
        // Update strength bar and label
        strengthBar.style.width = `${score}%`;
        strengthBar.style.backgroundColor = score >= 75 ? "#4CAF50" : score >= 50 ? "#FFA500" : "#FF0000";
        
        if (score >= 75) strengthLabel.textContent = "Strong";
        else if (score >= 50) strengthLabel.textContent = "Medium";
        else strengthLabel.textContent = "Weak";
    });

    // Password breach check (simulated)
    document.querySelector(".check-breach-btn").addEventListener("click", () => {
        const password = document.getElementById("breachCheck").value;
        const breachResult = document.querySelector(".breach-result p");
        const resultIcon = document.querySelector(".breach-result .result-icon i");
        
        // Simulate API check (in real-world, you'd use an actual API like HaveIBeenPwned)
        const simulateBreachCheck = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Simple simulation - considers passwords shorter than 8 chars as "breached"
                    const breached = password.length < 8;
                    resolve({
                        breached,
                        count: breached ? Math.floor(Math.random() * 1000) + 1 : 0
                    });
                }, 1000);
            });
        };

        // Show loading state
        breachResult.textContent = "Checking...";
        resultIcon.className = "fas fa-spinner fa-spin";

        simulateBreachCheck().then(result => {
            if (result.breached) {
                breachResult.textContent = `This password has been found in ${result.count} data breaches. Please choose a different password.`;
                breachResult.style.color = "#FF0000";
                resultIcon.className = "fas fa-times-circle";
                resultIcon.style.color = "#FF0000";
            } else {
                breachResult.textContent = "Good news! This password hasn't been found in any known data breaches.";
                breachResult.style.color = "#4CAF50";
                resultIcon.className = "fas fa-check-circle";
                resultIcon.style.color = "#4CAF50";
            }
        });
    });

    // Simulated security alerts
    const mockAlerts = [
        {
            type: 'warning',
            title: 'Weak Password Detected',
            message: 'Your Facebook account password is potentially weak',
            time: '2 hours ago'
        },
        {
            type: 'danger',
            title: 'Password Breach Detected',
            message: 'Your email password was found in a recent data breach',
            time: '1 day ago'
        }
    ];

    // Display mock alerts
    const alertsList = document.querySelector(".alerts-list");
    alertsList.innerHTML = ''; // Clear existing alerts
    
    mockAlerts.forEach(alert => {
        const alertItem = document.createElement("div");
        alertItem.classList.add("alert-item", alert.type);
        
        alertItem.innerHTML = `
            <div class="alert-icon">
                <i class="fas ${alert.type === 'danger' ? 'fa-skull' : 'fa-exclamation-triangle'}"></i>
            </div>
            <div class="alert-content">
                <h3>${alert.title}</h3>
                <p>${alert.message}</p>
                <span class="alert-time">${alert.time}</span>
            </div>
            <button class="alert-action">${alert.type === 'danger' ? 'Change Password' : 'Fix Now'}</button>
        `;
        
        alertsList.appendChild(alertItem);
    });
});
