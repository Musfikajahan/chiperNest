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

// Fetch user ID from session
$user_id = $_SESSION['id'];

// Calculate average password strength
$sql = "SELECT AVG(strength_checker) as avg_strength FROM password_c WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$avg_strength = round($row['avg_strength'], 2);

// Determine the strength level
$strength_label = "Weak";
if ($avg_strength > 75) {
    $strength_label = "Strong";
} elseif ($avg_strength > 50) {
    $strength_label = "Moderate";
} elseif ($avg_strength > 25) {
    $strength_label = "Weak";
}

// Fetch counts for stats
$strong_count = $weak_count = $outdated_count = $recent_count = 0;

// Fetch strong passwords count (strength_checker >= 75)
$sql = "SELECT COUNT(*) as count FROM password_c WHERE id = ? AND strength_checker >= 75";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$strong_count = $row['count'];

// Fetch weak passwords count (strength_checker < 75)
$sql = "SELECT COUNT(*) as count FROM password_c WHERE id = ? AND strength_checker < 75";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$weak_count = $row['count'];

// Fetch outdated passwords count (saved more than a month ago)
$sql = "SELECT COUNT(*) as count FROM password_c WHERE id = ? AND time_stamp < NOW() - INTERVAL 1 MONTH";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$outdated_count = $row['count'];

// Fetch recent passwords count (saved within the last 7 days)
$sql = "SELECT COUNT(*) as count FROM password_c WHERE id = ? AND time_stamp >= NOW() - INTERVAL 7 DAY";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$recent_count = $row['count'];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics - CypherNest</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="analytics.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <i class="fas fa-shield-alt"></i>
                <h1>CypherNest</h1>
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
                <a href="Securitycheck.html" class="nav-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>Security Check</span>
                </a>
                <a href="analytics.php" class="nav-item active">
                    <i class="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </a>
                <a href="notifications.html" class="nav-item">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                </a>
                <a href="settings.php" class="nav-item ">
                    <i class="fas fa-shield-alt"></i>
                    <span>Settings</span>
                </a>
            </nav>
            <button class="logout-btn">
                <a href="logout.php">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </button>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="analytics-header">
                <div>
                    <h1>Password Analytics</h1>
                    <p>Monitor and improve your password security</p>
                </div>
            </div>

            <div class="analytics-grid">
                <!-- Security Score Card -->
                <div class="analytics-card score-card">
                    <div class="score-circle">
                        <svg viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" stroke-width="3"/>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" stroke-width="3" stroke-dasharray="<?php echo $avg_strength; ?>, 100"/>
                        </svg>
                        <div class="score-text">
                            <span class="score-value"><?php echo $avg_strength; ?>%</span>
                            <span class="score-label"><?php echo $strength_label; ?> Security</span>
                        </div>
                    </div>
                </div>
                <div class="analytics-card stats-grid">
                    <div class="stat-item success">
                        <i class="fas fa-shield-alt"></i>
                        <div class="stat-info">
                            <span class="stat-value"><?php echo $strong_count; ?></span>
                            <span class="stat-label">Strong Passwords</span>
                        </div>
                    </div>

                    <!-- Weak Passwords -->
                    <div class="stat-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div class="stat-info">
                            <span class="stat-value"><?php echo $weak_count; ?></span>
                            <span class="stat-label">Weak Passwords</span>
                        </div>
                    </div>

                    <!-- Outdated Passwords -->
                    <div class="stat-item danger">
                        <i class="fas fa-history"></i>
                        <div class="stat-info">
                            <span class="stat-value"><?php echo $outdated_count; ?></span>
                            <span class="stat-label">Outdated</span>
                        </div>
                    </div>

                    <!-- Recently Updated Passwords -->
                    <div class="stat-item success">
                        <i class="fas fa-check-circle"></i>
                        <div class="stat-info">
                            <span class="stat-value"><?php echo $recent_count; ?></span>
                            <span class="stat-label">Recently Updated</span>
                        </div>
                    </div>
                </div>
                <!-- Action Items -->
                <!-- <div class="analytics-card action-items">
                    <h3>Recommended Actions</h3>
                    <div class="action-list">
                        <a href="vault.html" class="action-item warning">
                            <div class="action-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="action-info">
                                <h4>Update Weak Passwords</h4>
                                <p>5 passwords need strengthening</p>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        <a href="vault.html" class="action-item danger">
                            <div class="action-icon">
                                <i class="fas fa-history"></i>
                            </div>
                            <div class="action-info">
                                <h4>Review Outdated Passwords</h4>
                                <p>3 passwords are over 90 days old</p>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                        <a href="2fa-setup.html" class="action-item">
                            <div class="action-icon">
                                <i class="fas fa-lock"></i>
                            </div>
                            <div class="action-info">
                                <h4>Enable 2FA</h4>
                                <p>Add an extra layer of security</p>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </div>
                </div> -->

                <!-- Password Age Chart -->
                <!-- <div class="analytics-card password-age">
                    <h3>Password Age Distribution</h3>
                    <div class="age-chart">
                        <div class="chart-bar">
                            <div class="bar-fill" style="height: 60%"></div>
                            <span class="bar-label">0-30 days</span>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-fill" style="height: 40%"></div>
                            <span class="bar-label">31-60 days</span>
                        </div>
                        <div class="chart-bar">
                            <div class="bar-fill" style="height: 20%"></div>
                            <span class="bar-label">61-90 days</span>
                        </div>
                        <div class="chart-bar warning">
                            <div class="bar-fill" style="height: 15%"></div>
                            <span class="bar-label">90+ days</span>
                        </div>
                    </div>
                </div> -->
            </div>
        </main>
    </div>
    <script src="analytic.js"></script>
</body>
</html>