class TwoFactorAuth {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.qrImage = document.querySelector(".qr-container img");
        this.backupCodesContainer = document.querySelector(".codes-grid");
        this.verifyButton = document.querySelector(".verify-btn");
        this.otpInput = document.querySelector(".code-input input");
        this.messageContainer = document.querySelector(".message-container");
        this.downloadCodesButton = document.querySelector(".download-btn");
        this.printCodesButton = document.querySelector(".print-btn");
        this.loadingSpinner = document.querySelector(".loading-spinner");
        this.manualKeyBtn = document.querySelector(".manual-key-btn");
        this.manualKeyContainer = document.querySelector(".manual-key-container");
        this.manualKeyInput = document.querySelector(".manual-key");
        this.copyKeyBtn = document.querySelector(".copy-key-btn");
        this.steps = document.querySelectorAll('.step');
        this.appOptions = document.querySelectorAll('.app-option');
    }
//====================================
    async setup2FA() {
        try {
            const response = await fetch('/api/2fa/setup', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Setup failed');
            }
    
            const data = await response.json();
            // Handle successful setup
            return data;
        } catch (error) {
            console.error('2FA setup failed:', error);
            throw error;
        }
    }
    selectAuthenticator(selectedOption) {
        this.appOptions.forEach(option => {
            option.classList.remove('selected');
        });
        selectedOption.classList.add('selected');
        this.generateQRCode().then(() => {
            this.moveToNextStep();
        }).catch(error => {
            this.displayMessage('Failed to generate QR code', true);
        });
    }

    moveToNextStep() {
        const currentStep = document.querySelector('.step.active');
        if (!currentStep) return;
        const nextStep = currentStep.nextElementSibling;
        if (nextStep) {
            currentStep.classList.remove('active');
            nextStep.classList.add('active');
        }
    }
    //====================================
    attachEventListeners() {
        this.verifyButton?.addEventListener("click", () => this.verifyOTP());
        this.downloadCodesButton?.addEventListener("click", () => this.downloadBackupCodes());
        this.printCodesButton?.addEventListener("click", () => this.printBackupCodes());
        this.manualKeyBtn?.addEventListener("click", () => this.toggleManualKey());
        this.copyKeyBtn?.addEventListener("click", () => this.copyManualKey());
        //=======================
        this.appOptions?.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent navigation
                this.selectAuthenticator(option);
            });
        });
    }

    displayMessage(message, isError = false) {
        if (!this.messageContainer) return;

        this.messageContainer.textContent = message;
        this.messageContainer.className = `message-container ${isError ? 'error' : 'success'}`;
        setTimeout(() => {
            if (this.messageContainer) {
                this.messageContainer.textContent = '';
                this.messageContainer.className = 'message-container';
            }
        }, 5000);
    }

    async generateQRCode() {
        try {
            this.loadingSpinner.style.display = 'block';
            const email = this.emailInput?.value.trim();
            const response = await fetch('http://127.0.0.1:5000/api/2fa/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email })
            }); 

            if (!response.ok) {
                throw new Error('Failed to generate 2FA setup');
            }
            const data = await response.json();
        
        if (!data.qr_code) {
            throw new Error('No QR code in response');
        }

        this.qrImage.src = `data:image/png;base64,${data.qr_code}`;
        this.qrImage.style.display = 'block';
        this.updateBackupCodes(data.backup_codes);
        
        if (data.secret) {
            this.manualKeyInput.value = data.secret;
            this.secret = data.secret;
        }

    } catch (error) {
        console.error('QR Generation error:', error);
        this.displayMessage('Failed to generate QR code', true);
    } finally {
        this.loadingSpinner.style.display = 'none';
    }
}

    toggleManualKey() {
        const isHidden = this.manualKeyContainer.style.display === 'none';
        this.manualKeyContainer.style.display = isHidden ? 'flex' : 'none';
        this.manualKeyBtn.querySelector('span').textContent = 
            isHidden ? 'Hide Manual Key' : 'Show Manual Key';
    }

    async copyManualKey() {
        try {
            await navigator.clipboard.writeText(this.manualKeyInput.value);
            this.displayMessage('Manual key copied to clipboard');
        } catch (error) {
            this.displayMessage('Failed to copy manual key', true);
        }
    }

    updateQRCode(qrCodeBase64) {
        const loadingSpinner = document.querySelector('.loading-spinner');
        
        if (!this.qrImage) {
            console.error('QR image element not found');
            return;
        }

        loadingSpinner.style.display = 'block';
        
        return new Promise((resolve, reject) => {
            this.qrImage.onload = () => {
                loadingSpinner.style.display = 'none';
                resolve();
            };
            
            this.qrImage.onerror = (error) => {
                loadingSpinner.style.display = 'none';
                this.displayMessage('Failed to load QR code', true);
                reject(error);
            };
            
            this.qrImage.src = `data:image/png;base64,${qrCodeBase64}`;
        });
    }

    updateBackupCodes(codes) {
        if (!Array.isArray(codes)) {
            console.error("Invalid backup codes:", codes);
            this.backupCodesContainer.innerHTML = "";
            return;
        }
        this.backupCodesContainer.innerHTML = "";
        codes.forEach(code => {
            const codeItem = document.createElement("div");
            codeItem.classList.add("code-item");
            codeItem.textContent = code;
            this.backupCodesContainer.appendChild(codeItem);
        });
    }

    downloadBackupCodes() {
        const codes = Array.from(this.backupCodesContainer.children).map(item => item.textContent);
        if (codes.length === 0) {
            this.displayMessage("No backup codes available.", true);
            return;
        }
        const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup_codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    printBackupCodes() {
        const codes = Array.from(this.backupCodesContainer.children).map(item => item.textContent);
        if (codes.length === 0) {
            this.displayMessage("No backup codes available.", true);
            return;
        }
        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Backup Codes</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; }
                        .codes { display: flex; flex-direction: column; align-items: center; }
                        .code { margin: 10px; padding: 10px; border: 1px solid #ccc; }
                    </style>
                </head>
                <body>
                    <h2>2FA Backup Codes</h2>
                    <div class="codes">
                        ${codes.map(code => `<div class="code">${code}</div>`).join('')}
                    </div>
                    <script>
                        window.onload = function() { 
                            window.print(); 
                            window.close(); 
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const twoFactorAuth = new TwoFactorAuth();
});
