document.addEventListener("DOMContentLoaded", () => {
    const passwordGrid = document.querySelector(".password-grid");
    const addPasswordModal = document.getElementById("addPasswordModal");
    const addPasswordBtn = document.getElementById("addPasswordBtn");
    const closeModalBtn = document.querySelector(".close-modal");
    const saveBtn = document.querySelector(".save-btn");

    // Check authentication first
    async function checkAuth() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });
            if (!response.ok) {
                window.location.href = '/login.php';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login.php';
            return false;
        }
    }

    // Fetch and display passwords
    async function fetchPasswords() {
        try {
            const response = await fetch("/api/passwords", {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.php';
                    return;
                }
                throw new Error("Failed to fetch passwords");
            }

            const data = await response.json();
            if (data.passwords) {
                displayPasswords(data.passwords);
            } else {
                passwordGrid.innerHTML = '<p class="no-passwords">No passwords saved yet.</p>';
            }
        } catch (error) {
            console.error("Error fetching passwords:", error);
            passwordGrid.innerHTML = '<p class="error-message">Error loading passwords.</p>';
        }
    }

    function displayPasswords(passwords) {
        if (!passwords || passwords.length === 0) {
            passwordGrid.innerHTML = '<p class="no-passwords">No passwords saved yet.</p>';
            return;
        }

        passwordGrid.innerHTML = passwords.map(password => `
            <div class="password-card" data-id="${password.id}">
                <div class="card-header">
                    <div class="card-title">
                        <h3>${escapeHtml(password.website)}</h3>
                        <p>${escapeHtml(password.username)}</p>
                    </div>
                    <div class="card-actions">
                        <button onclick="copyToClipboard('${escapeHtml(password.password)}')" title="Copy password">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="deletePassword(${password.id})" title="Delete password">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-footer">
                    <span class="last-updated">Updated: ${new Date(password.last_updated).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    // Add security function to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add password function
    async function addPassword(formData) {
        try {
            const response = await fetch("/api/passwords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.php';
                    return;
                }
                throw new Error("Failed to save password");
            }
            
            await fetchPasswords(); // Refresh the list
            return true;
        } catch (error) {
            console.error(error);
            alert("Error adding password");
            return false;
        }
    }

    // Delete password function
    window.deletePassword = async (passwordId) => {
        if (!confirm("Are you sure you want to delete this password?")) return;
        
        try {
            const response = await fetch(`/api/passwords/${passwordId}`, {
                method: "DELETE",
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.php';
                    return;
                }
                throw new Error("Failed to delete password");
            }
            
            await fetchPasswords(); // Refresh the list
        } catch (error) {
            console.error(error);
            alert("Error deleting password");
        }
    };

    // Copy to clipboard function
    window.copyToClipboard = async (password) => {
        try {
            await navigator.clipboard.writeText(password);
            alert("Password copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
            alert("Failed to copy password");
        }
    };

    // Event Listeners
    addPasswordBtn?.addEventListener("click", () => addPasswordModal.classList.add("active"));
    closeModalBtn?.addEventListener("click", () => addPasswordModal.classList.remove("active"));

    saveBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        const formData = {
            website: document.getElementById("website").value,
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        };

        if (await addPassword(formData)) {
            addPasswordModal.classList.remove("active");
            document.getElementById("addPasswordForm").reset();
        }
    });

    // Initialize
    checkAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            fetchPasswords();
            
            // Add search functionality
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const cards = document.querySelectorAll('.password-card');
                    
                    cards.forEach(card => {
                        const website = card.querySelector('h3').textContent.toLowerCase();
                        const username = card.querySelector('p').textContent.toLowerCase();
                        
                        if (website.includes(searchTerm) || username.includes(searchTerm)) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            }
        }
    });
});
