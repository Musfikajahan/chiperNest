class TwoFactorAuth {
    constructor() {
        this.BASE_URL = 'http://127.0.0.1:5000'; // Your Flask backend URL
        this.initializeElements();
        this.attachEventListeners();
        this.generateTwoFA(); // Automatically generate 2FA on load
    }

    initializeElements() {
        // Step elements
        this.steps = Array.from(document.querySelectorAll('.step'));
        
        // QR code elements
        this.qrImage = document.querySelector(".qr-code");
        this.manualKeyBtn = document.querySelector(".manual-key-btn");
        
        // Verification elements
        this.verifyButton = document.querySelector(".verify-btn");
        this.otpInput = document.querySelector("input[name='otp']");
        
        // Other elements
        this.backupCodesContainer = document.querySelector(".codes-grid");
        this.messageContainer = document.querySelector(".message-container");
    }

    attachEventListeners() {
        // Generate 2FA on page load
        window.addEventListener('load', () => this.generate2FA());
        
        // Manual key button
        this.manualKeyBtn?.addEventListener("click", () => this.toggleManualKey());
        
        // Verification input
        this.otpInput?.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            if (e.target.value.length === 6) {
                this.verifyButton.removeAttribute('disabled');
            } else {
                this.verifyButton.setAttribute('disabled', 'true');
            }
        });

        // Verify button
        this.verifyButton?.addEventListener("click", () => this.verifyOTP());
    }

    async generate2FA() {
        try {
            const email = localStorage.getItem('userEmail') || 'user@example.com'; // Replace with actual user email
            const response = await fetch(`${this.BASE_URL}/api/2fa/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to generate 2FA.");

            this.updateQRCode(data.qr_code);
            this.updateBackupCodes(data.backup_codes);
            this.secretKey = data.secret; // Store the secret key for manual display
        } catch (error) {
            this.displayMessage(error.message, true);
            console.error("2FA Generation Error:", error);
        }
    }

    updateQRCode(qrCodeBase64) {
        if (this.qrImage && qrCodeBase64) {
            this.qrImage.src = `data:image/png;base64,${qrCodeBase64}`; // Set QR code image source
        }
    }

    toggleManualKey() {
        if (!this.secretKey) {
            this.displayMessage("Secret key not available", true);
            return;
        }

        const existingKey = document.querySelector('.manual-key');
        if (existingKey) {
            existingKey.remove();
            this.manualKeyBtn.textContent = "Show Manual Key";
        } else {
            const keyElement = document.createElement('div');
            keyElement.className = 'manual-key';
            keyElement.textContent = this.secretKey; // Display the secret key
            this.qrImage.parentNode.insertBefore(keyElement, this.qrImage.nextSibling);
            this.manualKeyBtn.textContent = "Hide Manual Key";
        }
    }

    async verifyOTP() {
        try {
            const otp = this.otpInput.value.trim();
            const email = localStorage.getItem('userEmail') || 'user@example.com'; // Replace with actual user email

            if (otp.length !== 6) {
                this.displayMessage("Please enter a 6-digit code", true);
                return;
            }

            this.verifyButton.disabled = true; // Disable button during verification
            const response = await fetch(`${this.BASE_URL}/api/2fa/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }) // Send email and OTP to backend
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verification failed");

            this.displayMessage("2FA verified successfully!");
            this.otpInput.value = ''; // Clear input after successful verification
        } catch (error) {
            this.displayMessage(error.message, true);
            console.error("2FA Verification Error:", error);
        } finally {
            this.verifyButton.disabled = false; // Re-enable button
        }
    }

    updateBackupCodes(codes) {
        if (!codes || !Array.isArray(codes)) {
            this.displayMessage("No backup codes generated", true);
            return;
        }

        this.backupCodesContainer.innerHTML = ''; // Clear existing codes
        codes.forEach(code => {
            const codeElement = document.createElement("div");
            codeElement.className = "code-item";
            codeElement.textContent = code; // Add each backup code to the container
            this.backupCodesContainer.appendChild(codeElement);
        });
    }

    displayMessage(message, isError = false) {
        if (!this.messageContainer) return;

        this.messageContainer.textContent = message;
        this.messageContainer.className = `message-container ${isError ? 'error' : 'success'}`;
        this.messageContainer.style.display = 'block'; // Show message
        setTimeout(() => {
            this.messageContainer.style.display = 'none'; // Hide after 5 seconds
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const twoFactorAuth = new TwoFactorAuth();
});
