class PasswordGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.generatePassword(); 
        this.checkAuthentication(); 
    }

    initializeElements() {
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.querySelector('.length-value');
        this.passwordOutput = document.getElementById('passwordOutput');
        
        const checkboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]');
        this.uppercaseCheck = checkboxes[0];
        this.lowercaseCheck = checkboxes[1];
        this.numbersCheck = checkboxes[2];
        this.symbolsCheck = checkboxes[3];
        
        // Buttons
        this.refreshBtn = document.querySelector('.refresh-btn');
        this.copyBtn = document.querySelector('.copy-btn');
        this.saveBtn = document.querySelector('.save-btn');
        
        // Strength indicators
        this.strengthBar = document.querySelector('.strength-bar');
        this.strengthText = document.querySelector('.strength-text');
    }

    attachEventListeners() {
        // Password length slider
        this.lengthSlider.addEventListener('input', () => {
            this.lengthValue.textContent = this.lengthSlider.value;
            this.generatePassword();
        });

        // Character type checkboxes
        [this.uppercaseCheck, this.lowercaseCheck, this.numbersCheck, this.symbolsCheck]
            .forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.validateCheckboxes(checkbox);
                    this.generatePassword();
                });
            });

        // Manual password input
        this.passwordOutput.addEventListener('input', () => {
            this.validatePassword(this.passwordOutput.value);
        });

        // Button actions
        this.refreshBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyPassword());
        this.saveBtn.addEventListener('click', () => this.savePassword());
    }

    validateCheckboxes(changedCheckbox) {
        // Ensure at least one checkbox remains checked
        const checkboxes = [this.uppercaseCheck, this.lowercaseCheck, this.numbersCheck, this.symbolsCheck];
        const checkedCount = checkboxes.filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
            changedCheckbox.checked = true;
            alert('At least one character type must be selected');
        }
    }

    validatePassword(password) {
        // Update checkbox states based on password content
        this.uppercaseCheck.checked = /[A-Z]/.test(password);
        this.lowercaseCheck.checked = /[a-z]/.test(password);
        this.numbersCheck.checked = /[0-9]/.test(password);
        this.symbolsCheck.checked = /[^A-Za-z0-9]/.test(password);

        // Update strength meter
        this.updateStrengthMeter(password);
    }

    updateStrengthMeter(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password)
        };

        // Calculate strength score
        strength += password.length >= 12 ? 25 : (password.length >= 8 ? 15 : 0);
        strength += checks.uppercase ? 20 : 0;
        strength += checks.lowercase ? 20 : 0;
        strength += checks.numbers ? 20 : 0;
        strength += checks.symbols ? 15 : 0;

        // Update UI
        this.strengthBar.className = 'strength-bar';
        if (strength >= 80) {
            this.strengthBar.classList.add('very-strong');
            this.strengthText.textContent = 'Very Strong';
        } else if (strength >= 60) {
            this.strengthBar.classList.add('strong');
            this.strengthText.textContent = 'Strong';
        } else if (strength >= 40) {
            this.strengthBar.classList.add('medium');
            this.strengthText.textContent = 'Medium';
        } else {
            this.strengthBar.classList.add('weak');
            this.strengthText.textContent = 'Weak';
        }
    }

    async generatePassword() {
        try {
            const options = {
                length: parseInt(this.lengthSlider.value),
                use_uppercase: this.uppercaseCheck.checked,
                use_lowercase: this.lowercaseCheck.checked,
                use_numbers: this.numbersCheck.checked,
                use_symbols: this.symbolsCheck.checked
            };

            const response = await fetch('http://127.0.0.1:5000/generate-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate password');
                } else {
                    throw new Error('Server returned non-JSON response');
                }
            }

            const data = await response.json();
            this.passwordOutput.value = data.password;
            this.validatePassword(data.password);
            this.addToHistory(data.password);

        } catch (error) {
            console.error('Generate password error:', error);
            this.passwordOutput.value = '';
            this.updateStrengthMeter('');
            alert(error.message);
        }
    }

    addToHistory(password) {
        const historyList = document.querySelector('.history-list');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="password-text">${password}</span>
            <div class="history-actions">
                <button title="Copy password"><i class="fas fa-copy"></i></button>
                <button title="Save to vault"><i class="fas fa-save"></i></button>
            </div>
        `;

        // Add at the top of the list
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // Remove oldest item if more than 3
        if (historyList.children.length > 3) {
            historyList.removeChild(historyList.lastChild);
        }

        // Add event listeners to new history item buttons
        const [copyBtn, saveBtn] = historyItem.querySelectorAll('button');
        copyBtn.addEventListener('click', () => this.copyToClipboard(password));
        saveBtn.addEventListener('click', () => this.savePassword(password));
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Password copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy password');
        }
    }

    copyPassword() {
        this.copyToClipboard(this.passwordOutput.value);
    }

    async savePassword(password = null) {
        try {
            const passwordToSave = password || this.passwordOutput.value;
            if (!passwordToSave) {
                throw new Error('No password to save');
            }

            const website = prompt('Enter website name:');
            const username = prompt('Enter username:');

            if (!website || !username) {
                throw new Error('Website and username are required');
            }

            const response = await fetch('http://127.0.0.1:5000/save-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',  // Important for sending cookies
                body: JSON.stringify({
                    password: passwordToSave,
                    website: website,
                    username: username
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = '/login.php';
                    return;
                }
                throw new Error(errorData.error || 'Failed to save password');
            }

            const data = await response.json();
            alert('Password saved successfully!');
            return data;

        } catch (error) {
            console.error('Save password error:', error);
            alert(error.message);
            throw error;
        }
    }

    async checkAuthentication() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/check-auth', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                // Redirect to login page if not authenticated
                window.location.href = '/login.php';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login.php';
        }
    }
}

// Initialize the generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PasswordGenerator();
});
