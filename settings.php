<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root"; // Replace with your database username
$password = ""; // Replace with your database password
$dbname = "chipernest";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if the session is set
if (!isset($_SESSION['id'])) {
    header('Location: login.php'); // Redirect to login page if session is not set
    exit();
}

$session_id = $_SESSION['id'];

// Fetch user data
$query = "SELECT name, email FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $session_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $name = $user['name'];
    $email = $user['email'];
} else {
    $name = "Default Name"; // Provide a fallback
    $email = "default@example.com"; // Provide a fallback
    echo "<script>alert('User not found.');</script>";
}

// Update user data if form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $new_name = $_POST['name'];
    $new_email = $_POST['email'];
    $new_password = $_POST['password'];

    // Update name and email
    $update_query = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_query);
    $update_stmt->bind_param("ssi", $new_name, $new_email, $session_id);

    if ($update_stmt->execute()) {
        $name = $new_name;
        $email = $new_email;
        echo "<script>alert('Profile updated successfully.');</script>";
    } else {
        echo "<script>alert('Failed to update profile.');</script>";
    }

    // Update password if provided
    if (!empty($new_password)) {
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $password_query = "UPDATE users SET password_hash = ? WHERE id = ?";
        $password_stmt = $conn->prepare($password_query);
        $password_stmt->bind_param("si", $hashed_password, $session_id);

        if ($password_stmt->execute()) {
            echo "<script>alert('Password updated successfully.');</script>";
        } else {
            echo "<script>alert('Failed to update password.');</script>";
        }
        $password_stmt->close();
    }

    $update_stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_profile'])) {
    // Delete from password_c table
    $delete_password_query = "DELETE FROM password_c WHERE id = ?";
    $delete_password_stmt = $conn->prepare($delete_password_query);
    $delete_password_stmt->bind_param("i", $session_id);

    // Delete user from users table
    $delete_user_query = "DELETE FROM users WHERE id = ?";
    $delete_user_stmt = $conn->prepare($delete_user_query);
    $delete_user_stmt->bind_param("i", $session_id);

    if ($delete_password_stmt->execute() && $delete_user_stmt->execute()) {
        // Logout the user by destroying the session and redirecting to login page
        session_unset();
        session_destroy();
        header("Location: login.php");
        exit();
    } else {
        echo "<script>alert('Failed to delete profile.');</script>";
    }

    $delete_password_stmt->close();
    $delete_user_stmt->close();
}


$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - CypherNest</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="settings.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <i class="fas fa-shield-alt"></i>
                <h1>ChiperNest</h1>
            </div>
            <a href="password_form.php">
                <button class="add-password-btn">
                    <i class="fas fa-plus"></i>
                    <span>Add Password</span>
                </button>
            </a>

            <nav class="nav-menu">
                <a href="index.php" class="nav-item">
                    <i class="fas fa-home"></i>
                    <span>Dashboard</span>
                </a>
                <a href="vault.html" class="nav-item">
                    <i class="fas fa-key"></i>
                    <span>Password Vault</span>
                </a>
                <a href="generator.html" class="nav-item">
                    <i class="fas fa-random"></i>
                    <span>Generator</span>
                </a>
                <a href="Securitycheck.html" class="nav-item ">
                    <i class="fas fa-shield-alt"></i>
                    <span>Security Check</span>
                </a>
                <a href="analytics.php" class="nav-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </a>
                <a href="notifications.html" class="nav-item">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                </a>
                <a href="settings.html" class="nav-item active">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </a>
            </nav>
            <button class="logout-btn"><a href="logout.html">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </button>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="settings-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account and security preferences</p>
                </div>
            </div>

            <div class="settings-container">
                <!-- Account Settings -->
                <section class="settings-section">
                    <h2>Account Settings</h2>
                    <form method="POST" class="settings-card">
                        <div class="profile-info">
                            <div class="profile-avatar">
                                <img src="https://ui-avatars.com/api/?name=<?php echo urlencode($name); ?>&background=3b82f6&color=fff" alt="Profile">
                                <button class="change-avatar" type="button">
                                    <i class="fas fa-camera"></i>
                                </button>
                            </div>
                            <div class="profile-details">
                                <div class="form-group">
                                    <label for="name">Display Name</label>
                                    <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($name); ?>" required>
                                </div>
                                <div class="form-group">
                                    <label for="email">Email Address</label>
                                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" required>
                                </div>
                                <div class="form-group">
                                    <label for="password">New Password</label>
                                    <input type="password" id="password" name="password" placeholder="Enter new password">
                                </div>
                            </div>
                        </div>
                        <button class="save-btn" type="submit">Save Changes</button>
                    </form>
                </section>
                <section class="settings-section">
                    <h2>Security Settings</h2>
                    <div class="settings-grid">
                        <div class="settings-card">
                            <div class="setting-header">
                                <div class="setting-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="setting-info">
                                    <h3>Two-Factor Authentication</h3>
                                    <p>Add an extra layer of security</p>
                                </div>
                            </div>
                            <a href="2fa-setup.html" class="setup-btn">Set up 2FA</a>
                        </div>

                        <div class="settings-card">
                            <div class="setting-header">
                                <div class="setting-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <div class="setting-info">
                                    <h3>Login History</h3>
                                    <p>View recent login attempts</p>
                                </div>
                            </div>
                            <button class="view-btn">View History</button>
                        </div>

                        <div class="settings-card">
                            <div class="setting-header">
                                <div class="setting-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="setting-info">
                                    <h3>Security Alerts</h3>
                                    <p>Manage notification preferences</p>
                                </div>
                            </div>
                            <button class="manage-btn">Manage Alerts</button>
                        </div>
                    </div>
                </section>

                <!-- Preferences -->
                <section class="settings-section">
                    <h2>Preferences</h2>
                    <div class="settings-card">
                        <div class="preferences-list">
                            <label class="preference-item">
                                <span class="preference-label">Auto-lock vault after inactivity</span>
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                            <label class="preference-item">
                                <span class="preference-label">Clear clipboard after copying</span>
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                            <label class="preference-item">
                                <span class="preference-label">Show password strength indicator</span>
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                            <label class="preference-item">
                                <span class="preference-label">Enable dark mode</span>
                                <input type="checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Danger Zone -->
                <section class="settings-section danger-zone">
                    <h2>Danger Zone</h2>
                    <div class="settings-card">
                        <div class="danger-actions">
                            <div class="danger-action">
                                <div class="danger-info">
                                    <h3>Export Data</h3>
                                    <p>Download all your stored passwords and data</p>
                                </div>
                                <button class="danger-btn">Export</button>
                            </div>
                            <div class="danger-action">
                                <div class="danger-info">
                                    <h3>Delete Account</h3>
                                    <p>Permanently delete your account and all data</p>
                                </div>
                                <form method="POST">
                                    <button class="danger-btn delete" type="submit" name="delete_profile" id="delete-profile">Delete Profile</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
