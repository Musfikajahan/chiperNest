// class TwoFactorAuth {
//     constructor() {
//         this.initializeElements();
//         this.attachEventListeners();
//     }

//     initializeElements() {
//         // QR Code and Backup Codes
//         this.qrImage = document.querySelector(".qr-container img");
//         this.backupCodesContainer = document.querySelector(".codes-grid");
        
//         // Verification Elements
//         this.verifyButton = document.querySelector(".verify-btn");
//         this.otpInput = document.querySelector(".code-input input");
//         this.messageContainer = document.querySelector(".message-container");
        
//         // Email Input (added for dynamic email)
//         this.emailInput = document.querySelector("#email-input");
        
//         // Additional UI Elements
//         this.generateButton = document.querySelector("#generate-2fa-btn");
//         this.downloadCodesButton = document.querySelector(".download-btn");
//         this.printCodesButton = document.querySelector(".print-btn");
//     }

//     attachEventListeners() {
//         // Verify OTP
//         this.verifyButton?.addEventListener("click", () => this.verifyOTP());
        
//         // Generate 2FA
//         this.generateButton?.addEventListener("click", () => this.generate2FA());
        
//         // Download Backup Codes
//         this.downloadCodesButton?.addEventListener("click", () => this.downloadBackupCodes());
        
//         // Print Backup Codes
//         this.printCodesButton?.addEventListener("click", () => this.printBackupCodes());
//     }

//     displayMessage(message, isError = false) {
//         if (!this.messageContainer) return;

//         this.messageContainer.textContent = message;
//         this.messageContainer.className = `message-container ${isError ? 'error' : 'success'}`;
        
//         // Auto-clear message after 5 seconds
//         setTimeout(() => {
//             if (this.messageContainer) {
//                 this.messageContainer.textContent = '';
//                 this.messageContainer.className = 'message-container';
//             }
//         }, 5000);
//     }

//     validateEmail(email) {
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         return emailRegex.test(email);
//     }

//     async generate2FA() {
//         try {
//             // Get email from input
//             const email = this.emailInput?.value.trim();

//             // Validate email
//             if (!email) {
//                 this.displayMessage("Please enter an email address.", true);
//                 return;
//             }

//             if (!this.validateEmail(email)) {
//                 this.displayMessage("Please enter a valid email address.", true);
//                 return;
//             }
//             if (!data.qr_code) {
//                 throw new error("Failed to generate QR Code. Data missing from response.");
//             }
//             // Disable button during request
//             this.generateButton.disabled = true;
//             this.generateButton.textContent = "Generating...";

//             const response = await fetch("/api/2fa/generate", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ email }),
//             });

//             const data = await response.json();
//             if (!response.ok) {
//                 throw new Error(data.error || "Failed to generate 2FA.");
//             }

//             // Update UI
//             this.updateQRCode(data.qr_code);
//             this.updateBackupCodes(data.backup_codes);
//             this.displayMessage("2FA setup successful! Scan QR code and save backup codes.");
//         } catch (error) {
//             console.error("Error generating 2FA:", error);
//             this.displayMessage(error.message, true);
//         } finally {
//             // Re-enable button
//             if (this.generateButton) {
//                 this.generateButton.disabled = false;
//                 this.generateButton.textContent = "Generate 2FA";
//             }
//         }
//     }

//     async verifyOTP() {
//         try {
//             const otp = this.otpInput?.value.trim();
//             const email = this.emailInput?.value.trim();

//             // Validate inputs
//             if (!email) {
//                 this.displayMessage("Please enter your email.", true);
//                 return;
//             }

//             if (!otp) {
//                 this.displayMessage("Please enter the OTP.", true);
//                 return;
//             }

//             // Disable verify button during request
//             this.verifyButton.disabled = true;
//             this.verifyButton.textContent = "Verifying...";

//             const response = await fetch("/api/2fa/verify", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ email, otp }),
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 throw new Error(data.error || "Invalid OTP.");
//             }

//             this.displayMessage(data.message);
//             this.otpInput.value = ''; // Clear input on success
//         } catch (error) {
//             console.error("Error verifying OTP:", error);
//             this.displayMessage(error.message, true);
//         } finally {
//             // Re-enable verify button
//             if (this.verifyButton) {
//                 this.verifyButton.disabled = false;
//                 this.verifyButton.textContent = "Verify & Enable 2FA";
//             }
//         }
//     }

//     updateQRCode(qrCodeBase64) {
//         if (this.qrImage && qrCodeBase64) {
//             this.qrImage.src = `data:image/png;base64,${qrCodeBase64}`;
//         }
//     }

//     updateBackupCodes(codes) {
//         if (!Array.isArray(codes)) {
//             console.error("Invalid backup codes:", codes);
//             return;
//         }
//         if (!this.backupCodesContainer) return;
//         this.backupCodesContainer.innerHTML = "";
//         codes.forEach(code => {
//             const codeItem = document.createElement("div");
//             codeItem.classList.add("code-item");
//             codeItem.textContent = code;
//             this.backupCodesContainer.appendChild(codeItem);
//         });
//     }

//     // New methods for backup codes management
//     downloadBackupCodes() {
//         const codes = Array.from(this.backupCodesContainer.children)
//             .map(item => item.textContent);
        
//         if (codes.length === 0) {
//             this.displayMessage("No backup codes available.", true);
//             return;
//         }

//         const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'backup_codes.txt';
//         a.click();
//         URL.revokeObjectURL(url);
//     }

//     printBackupCodes() {
//         const codes = Array.from(this.backupCodesContainer.children)
//             .map(item => item.textContent);
        
//         if (codes.length === 0) {
//             this.displayMessage("No backup codes available.", true);
//             return;
//         }

//         const printWindow = window.open('', '', 'width=600,height=400');
//         printWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Backup Codes</title>
//                     <style>
//                         body { font-family: Arial, sans-serif; text-align: center; }
//                         .codes { display: flex; flex-direction: column; align-items: center; }
//                         .code { margin: 10px; padding: 10px; border: 1px solid #ccc; }
//                     </style>
//                 </head>
//                 <body>
//                     <h2>2FA Backup Codes</h2>
//                     <div class="codes">
//                         ${codes.map(code => `<div class="code">${code}</div>`).join('')}
//                     </div>
//                     <script>
//                         window.onload = function() { 
//                             window.print(); 
//                             window.close(); 
//                         }
//                     </script>
//                 </body>
//             </html>
//         `);
//         printWindow.document.close();
//     }
// }

// // Initialize when DOM is fully loaded
// document.addEventListener("DOMContentLoaded", () => {
//     const twoFactorAuth = new TwoFactorAuth();
// });
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
        this.emailInput = document.querySelector("#email-input") || null;
        this.generateButton = document.querySelector("#generate-2fa-btn");
        this.downloadCodesButton = document.querySelector(".download-btn");
        this.printCodesButton = document.querySelector(".print-btn");

        if (!this.emailInput) {
            console.error("Email input field is missing in the DOM.");
        }
    }

    attachEventListeners() {
        this.verifyButton?.addEventListener("click", () => this.verifyOTP());
        this.generateButton?.addEventListener("click", () => this.generate2FA());
        this.downloadCodesButton?.addEventListener("click", () => this.downloadBackupCodes());
        this.printCodesButton?.addEventListener("click", () => this.printBackupCodes());
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

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async generate2FA() {
        const BASE_URL = "http://127.0.0.1:5000"; // Backend URL

        try {
            const email = this.emailInput?.value.trim();
            if (!email) {
                this.displayMessage("Please enter an email address.", true);
                return;
            }
            if (!this.validateEmail(email)) {
                this.displayMessage("Please enter a valid email address.", true);
                return;
            }

            this.generateButton.disabled = true;
            this.generateButton.textContent = "Generating...";

            const response = await fetch(`${BASE_URL}/api/2fa/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to generate 2FA.");
            }
            if (!data.qr_code) {
                throw new Error("QR Code missing from response.");
            }

            this.updateQRCode(data.qr_code);
            this.updateBackupCodes(data.backup_codes);
            this.displayMessage("2FA setup successful! Scan QR code and save backup codes.");
        } catch (error) {
            console.error("Error generating 2FA:", error);
            this.displayMessage(error.message, true);
        } finally {
            this.generateButton.disabled = false;
            this.generateButton.textContent = "Generate 2FA";
        }
    }

    async verifyOTP() {
        const BASE_URL = "http://127.0.0.1:5000"; // Backend URL

        try {
            const otp = this.otpInput?.value.trim();
            const email = this.emailInput?.value.trim();

            if (!email) {
                this.displayMessage("Please enter your email.", true);
                return;
            }
            if (!otp) {
                this.displayMessage("Please enter the OTP.", true);
                return;
            }

            this.verifyButton.disabled = true;
            this.verifyButton.textContent = "Verifying...";

            const response = await fetch(`${BASE_URL}/api/2fa/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Invalid OTP.");
            }

            this.displayMessage(data.message);
            this.otpInput.value = '';
        } catch (error) {
            console.error("Error verifying OTP:", error);
            this.displayMessage(error.message, true);
        } finally {
            this.verifyButton.disabled = false;
            this.verifyButton.textContent = "Verify & Enable 2FA";
        }
    }

    updateQRCode(qrCodeBase64) {
        if (this.qrImage && qrCodeBase64) {
            this.qrImage.src = `data:image/png;base64,${qrCodeBase64}`;
        }
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
