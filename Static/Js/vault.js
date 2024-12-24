document.addEventListener("DOMContentLoaded", () => {
    const passwordGrid = document.querySelector(".password-grid");
    const addPasswordModal = document.getElementById("addPasswordModal");
    const addPasswordBtn = document.getElementById("addPasswordBtn");
    const closeModalBtn = document.querySelector(".close-modal");
    const saveBtn = document.querySelector(".save-btn");

    // Fetch and display passwords from the backend
    async function fetchPasswords() {
        try {
            const response = await fetch("/api/passwords");
            if (!response.ok) throw new Error("Failed to fetch passwords.");
            const passwords = await response.json();
            displayPasswords(passwords);
        } catch (error) {
            console.error(error);
            alert("Error fetching passwords.");
        }
    }

    function displayPasswords(passwords) {
        passwordGrid.innerHTML = ""; // Clear existing passwords
        passwords.forEach((password) => {
            const card = document.createElement("div");
            card.className = "password-card";
            card.innerHTML = `
                <div class="card-header">
                    <img src="${password.logo_url}" alt="${password.website}">
                    <div class="card-title">
                        <h3>${password.website}</h3>
                        <p>${password.username}</p>
                    </div>
                    <button class="more-btn">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <div class="card-actions">
                    <span class="last-updated">${password.last_updated}</span>
                    <div class="action-buttons">
                        <button title="Copy password" onclick="copyToClipboard('${password.password}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button title="Visit website">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>`;
            passwordGrid.appendChild(card);
        });
    }

    // Show/Hide modal
    addPasswordBtn.addEventListener("click", () => addPasswordModal.classList.add("active"));
    closeModalBtn.addEventListener("click", () => addPasswordModal.classList.remove("active"));

    // Save a new password
    saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const website = document.getElementById("website").value;
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/api/passwords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ website, username, password }),
            });
            if (!response.ok) throw new Error("Failed to save password.");
            alert("Password added successfully!");
            addPasswordModal.classList.remove("active");
            fetchPasswords();
        } catch (error) {
            console.error(error);
            alert("Error adding password.");
        }
    });

    // Utility to copy password to clipboard
    window.copyToClipboard = (password) => {
        navigator.clipboard.writeText(password).then(() => {
            alert("Password copied to clipboard!");
        });
    };

    // Fetch passwords on page load
    fetchPasswords();
});
