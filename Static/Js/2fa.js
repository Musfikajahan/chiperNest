class TwoFactorAuth {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentStep = 1;
    }

    initializeElements() {
        // Step elements
        this.steps = Array.from(document.querySelectorAll('.step'));
        
        // QR code elements
        this.qrImage = document.querySelector(".qr-container img");
        this.manualKeyBtn = document.querySelector(".manual-key-btn");
        
        // Verification elements
        this.verifyButton = document.querySelector(".verify-btn");
        this.otpInput = document.querySelector(".code-input input");
        
        // Other elements
        this.backupCodesContainer = document.querySelector(".codes-grid");
        this.messageContainer = document.querySelector(".message-container");
        this.downloadCodesButton = document.querySelector(".download-btn");
        this.printCodesButton = document.querySelector(".print-btn");
        
        // Store the secret key when generated
        this.secretKey = null;
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
        
        // Backup code buttons
        this.downloadCodesButton?.addEventListener("click", () => this.downloadBackupCodes());
        this.printCodesButton?.addEventListener("click", () => this.printBackupCodes());
    }

    updateSteps(stepNumber) {
        this.steps.forEach((step, index) => {
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        this.currentStep = stepNumber;
    }

    async generate2FA() {
    try {
        // Existing code...
        if (data.error) {
            throw new Error(data.error);
        }
    } catch (error) {
        // More detailed error logging
        console.error("2FA Generation Error:", error);
        this.displayMessage(
            error.message || "Failed to generate 2FA", 
            true
        );
    }
}
    async generate2FA() {
        const BASE_URL = "http://127.0.0.1:5000";

        try {
            // Get email from session or use a default for testing
            const email = sessionStorage.getItem('userEmail') || 'user@example.com';

            const response = await fetch(`${BASE_URL}/api/2fa/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to generate 2FA.");

            this.secretKey = data.secret;
            this.updateQRCode(data.qr_code);
            this.updateBackupCodes(data.backup_codes);
            this.updateSteps(2); // Move to QR code step
            
        } catch (error) {
            console.error("Error generating 2FA:", error);
            this.displayMessage(error.message, true);
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
            keyElement.textContent = this.secretKey;
            keyElement.style.margin = '1rem 0';
            keyElement.style.padding = '0.5rem';
            keyElement.style.backgroundColor = '#f0f0f0';
            keyElement.style.borderRadius = '4px';
            keyElement.style.textAlign = 'center';
            this.qrImage.parentNode.insertBefore(keyElement, this.qrImage.nextSibling);
            this.manualKeyBtn.textContent = "Hide Manual Key";
        }
    }

    updateQRCode(qrCodeBase64) {
        if (this.qrImage && qrCodeBase64) {
            this.qrImage.src = `data:image/png;base64,${qrCodeBase64}`;
            this.qrImage.style.display = 'block';
            this.qrImage.style.margin = '1rem auto';
            this.qrImage.style.maxWidth = '200px';
        }
    }

    async verifyOTP() {
        const BASE_URL = "http://127.0.0.1:5000";
        
        try {
            const otp = this.otpInput.value.trim();
            const email = sessionStorage.getItem('userEmail') || 'user@example.com';

            if (otp.length !== 6) {
                this.displayMessage("Please enter a 6-digit code", true);
                return;
            }

            this.verifyButton.disabled = true;
            this.verifyButton.textContent = "Verifying...";

            const response = await fetch(`${BASE_URL}/api/2fa/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Verification failed");

            this.displayMessage("2FA verification successful!");
            this.updateSteps(3); // Move to final step
            this.otpInput.value = '';
        } catch (error) {
            if (error instanceof TypeError) {
                // Network error
                this.displayMessage(
                    "Network error. Please check your connection.", 
                    true
                );
            } else {
                this.displayMessage(error.message, true);

        } 
        } finally {
            this.verifyButton.disabled = false;
            this.verifyButton.textContent = "Verify & Enable 2FA";
        }
    }

    updateBackupCodes(codes) {
        // Add additional validation
        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            this.displayMessage("No backup codes generated", true);
            return;
        }
        this.backupCodesContainer.innerHTML = "";
        codes.forEach(code => {
            const codeElement = document.createElement("div");
            codeElement.className = "code-item";
            codeElement.textContent = code;
            this.backupCodesContainer.appendChild(codeElement);
        });
    }

    downloadBackupCodes() {
        const codes = Array.from(this.backupCodesContainer.children)
            .map(item => item.textContent)
            .filter(Boolean);

        if (codes.length === 0) {
            this.displayMessage("No backup codes available", true);
            return;
        }

        const content = "2FA Backup Codes\n\n" + codes.join("\n");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "2fa-backup-codes.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    printBackupCodes() {
        const codes = Array.from(this.backupCodesContainer.children)
            .map(item => item.textContent)
            .filter(Boolean);

        if (codes.length === 0) {
            this.displayMessage("No backup codes available", true);
            return;
        }

        const printWindow = window.open("", "", "height=600,width=800");
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>2FA Backup Codes</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        h1 {
                            text-align: center;
                            color: #333;
                        }
                        .code {
                            background: #f5f5f5;
                            padding: 10px;
                            margin: 10px 0;
                            border-radius: 4px;
                            font-family: monospace;
                            font-size: 16px;
                            text-align: center;
                        }
                        .warning {
                            color: #721c24;
                            background: #f8d7da;
                            padding: 10px;
                            border-radius: 4px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>2FA Backup Codes</h1>
                    <div class="warning">
                        Keep these codes safe and secure. Each code can only be used once.
                    </div>
                    ${codes.map(code => `<div class="code">${code}</div>`).join("")}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    displayMessage(message, isError = false) {
        if (!this.messageContainer) return;

        this.messageContainer.textContent = message;
        this.messageContainer.className = `message-container ${isError ? 'error' : 'success'}`;
        this.messageContainer.style.display = 'block';
        this.messageContainer.style.padding = '1rem';
        this.messageContainer.style.margin = '1rem 0';
        this.messageContainer.style.borderRadius = '4px';
        this.messageContainer.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        this.messageContainer.style.color = isError ? '#c62828' : '#2e7d32';

        setTimeout(() => {
            this.messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const twoFactorAuth = new TwoFactorAuth();
});
