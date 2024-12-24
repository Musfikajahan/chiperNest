class PasswordGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.generatePassword(); // Generate initial password on load
    }

    initializeElements() {
        // Slider and display for password length
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.querySelector('.length-value');
        this.passwordOutput = document.getElementById('passwordOutput');

        // Checkbox elements
        this.uppercaseCheck = document.querySelector('input[type="checkbox"]:nth-of-type(1)');
        this.lowercaseCheck = document.querySelector('input[type="checkbox"]:nth-of-type(2)');
        this.numbersCheck = document.querySelector('input[type="checkbox"]:nth-of-type(3)');
        this.symbolsCheck = document.querySelector('input[type="checkbox"]:nth-of-type(4)');

        // Buttons
        this.refreshBtn = document.querySelector('.refresh-btn');
        this.copyBtn = document.querySelector('.copy-btn');
        this.saveBtn = document.querySelector('.save-btn');
    }

    attachEventListeners() {
        // Update length value on slider input
        this.lengthSlider.addEventListener('input', () => this.updateLengthValue());

        // Validate user-edited password on Enter key
        this.passwordOutput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.validateUserPassword();
            }
        });

        // Update strength meter on user input without alerts
        this.passwordOutput.addEventListener('input', () => {
            this.updateStrengthMeter(this.passwordOutput.value);
        });

        // Button actions
        this.refreshBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyPassword());
        this.saveBtn.addEventListener('click', () => this.savePassword());
    }

    updateLengthValue() {
        this.lengthValue.textContent = this.lengthSlider.value;
    }

    async generatePassword() {
        try {
            const response = await fetch('http://127.0.0.1:5000/generate-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                
                },
                body: JSON.stringify({
                    length: parseInt(this.lengthSlider.value),
                    use_uppercase: this.uppercaseCheck.checked,
                    use_lowercase: this.lowercaseCheck.checked,
                    use_numbers: this.numbersCheck.checked,
                    use_symbols: this.symbolsCheck.checked,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to generate password: ${error.error}`);
            }

            const data = await response.json();
            this.passwordOutput.value = data.password;
            this.updateStrengthMeter(data.password);
        } catch (error) {
            console.error('Error generating password:', error);
            alert('Error generating password. Please try again.');
        }
    }

    validateUserPassword() {
        const password = this.passwordOutput.value;
        const length = password.length;
        const containsUppercase = /[A-Z]/.test(password);
        const containsLowercase = /[a-z]/.test(password);
        const containsNumbers = /[0-9]/.test(password);
        const containsSymbols = /[^A-Za-z0-9]/.test(password);

        // Validation checks
        if (length < parseInt(this.lengthSlider.value)) {
            alert(`Password must be at least ${this.lengthSlider.value} characters long.`);
        }
        if (this.uppercaseCheck.checked && !containsUppercase) {
            alert('Password must contain at least one uppercase letter.');
        }
        if (this.lowercaseCheck.checked && !containsLowercase) {
            alert('Password must contain at least one lowercase letter.');
        }
        if (this.numbersCheck.checked && !containsNumbers) {
            alert('Password must contain at least one number.');
        }
        if (this.symbolsCheck.checked && !containsSymbols) {
            alert('Password must contain at least one special character.');
        }
    }

    updateStrengthMeter(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        let strength = 0;
        strength += Math.min(password.length * 4, 40); // Length
        if (/[A-Z]/.test(password)) strength += 15; // Uppercase
        if (/[a-z]/.test(password)) strength += 15; // Lowercase
        if (/[0-9]/.test(password)) strength += 15; // Numbers
        if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Symbols

        // Update UI based on strength
        strengthBar.className = 'strength-bar'; // Reset classes
        if (strength < 40) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (strength < 60) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else if (strength < 80) {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
        } else {
            strengthBar.classList.add('very-strong');
            strengthText.textContent = 'Very Strong';
        }
    }

    async copyPassword() {
        try {
            await navigator.clipboard.writeText(this.passwordOutput.value);
            alert('Password copied to clipboard!');
        } catch (error) {
            console.error('Error copying password:', error);
            alert('Failed to copy password.');
        }
    }

    async savePassword() {
        try {
            const response = await fetch('http://127.0.0.1:5000/save-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: this.passwordOutput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save password: ${response.statusText}`);
            }

            const data = await response.json();
            alert('Password saved successfully!');
        } catch (error) {
            console.error('Error saving password:', error);
            alert('Failed to save password.');
        }
    }
}

// Initialize the Password Generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PasswordGenerator();
});
