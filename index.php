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

// Fetch user details
$user_id = $_SESSION['id'];
$sql = "SELECT * FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // If user not found, destroy session and redirect to login
    session_destroy();
    header('Location: login.php');
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChiperNest - Password Manager</title>
    <link rel="stylesheet" href="styles.css">
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
            </button></a>

            <nav class="nav-menu">
                <a href="#" class="nav-item active">
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
                <a href="analytics.php" class="nav-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </a>
                <a href="notifications.html" class="nav-item">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                </a>
                <a href="settings.php" class="nav-item">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </a>
            </nav>

            <button class="logout-btn">
              <a href="logout.html">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </button>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="dashboard-header">
                <div class="welcome-section">
                    <h2>Welcome back ,<?php echo htmlspecialchars($user['name']); ?></h2>
                    <p>Here's what's happening with your passwords</p>
                </div>
                 <!-- <div class="profile-dropdown">
                    <div class="profile-menu">
                        <div class="profile-header">
                            <img src="https://ui-avatars.com/api/?name=<?php echo urlencode($user['name']); ?>&background=3b82f6&color=fff" alt="Profile" class="profile-image-large">
                            <div class="profile-info">
                                <h3></h3>
                                <p><?php echo htmlspecialchars($user['email']); ?></p>
                            </div>
                        </div>
                        <div class="profile-body">
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-value">23</span>
                                    <span class="stat-label">Passwords</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">85%</span>
                                    <span class="stat-label">Security Score</span>
                                </div>
                            </div>
                        </div>
                        <div class="profile-footer">
                            <a href="settings.php" class="profile-link">
                                <i class="fas fa-user-cog"></i>
                                <span>Account Settings</span>
                            </a>
                            <a href="logout.html" class="profile-link text-red">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Sign Out</span>
                            </a>
                        </div>
                    </div> -->
            </header>

            <section class="quick-actions">
                <div class="action-card blue">
                   <a href="vault.html" class="nav-item active">
                     <div class="action-icon">
                        <i class="fas fa-key"></i>
                     </div>
                     <h3>Password Vault</h3>
                     <p>Access your secure passwords</p>
                    </a>
                </div>
                <div class="action-card green">
                  <div class="action-icon">
                    <a href="generator.html" class="nav-item active">
                        <i class="fas fa-random"></i>
                  </div>
                     <h3>Password Generator</h3>
                     <p>Create strong passwords</p>
                    </a>
                </div>
                <div class="action-card purple">
                    <div class="action-icon">
                     <a href="Securitycheck.html" class="nav-item active">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Security Check</h3>
                    <p>Analyze password strength</p>
                    </a>
                </div>
                <div class="action-card orange">
                <a href="analytics.php" class="nav-item active">
                    <div class="action-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Analytics</h3>
                    <p>View security insights</p>
                </a>
                </div>
                <div class="action-card red">
                    <a href="notifications.html" class="nav-item active">
                        <div class="action-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <h3>Notifications</h3>
                        <p>Get your Updates</p>
                    </a>
                </div>
            </section>

            <!-- <div class="dashboard-grid">
                <section class="recent-activities">
                    <div class="section-header">
                        <h2>Recent Activities</h2>
                        <button class="view-all">View All <i class="fas fa-arrow-right"></i></button>
                    </div>
                    <div class="activity-list">
                        <div class="activity-item success">
                            <div class="activity-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="activity-details">
                                <h3>Password Update</h3>
                                <p>Netflix</p>
                            </div>
                            <span class="activity-time">2 hours ago</span>
                        </div>
                        <div class="activity-item warning">
                            <div class="activity-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="activity-details">
                                <h3>Login Attempt</h3>
                                <p>Gmail</p>
                            </div>
                            <span class="activity-time">5 hours ago</span>
                        </div>
                        <div class="activity-item success">
                            <div class="activity-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="activity-details">
                                <h3>New Password Added</h3>
                                <p>GitHub</p>
                            </div>
                            <span class="activity-time">1 day ago</span>
                        </div>
                    </div>
                </section>

                <section class="notifications-panel">
                    <div class="section-header">
                        <h2>Notifications</h2>
                        <button class="view-all">View All</button>
                    </div>
                    <div class="notification-list">
                        <div class="notification-item warning">
                            <div class="notification-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="notification-content">
                                <h3>Security Alert</h3>
                                <p>Weak password detected for Netflix account</p>
                                <span class="notification-time">2 hours ago</span>
                            </div>
                        </div>
                        <div class="notification-item success">
                            <div class="notification-icon">
                                <i class="fas fa-bell"></i>
                            </div>
                            <div class="notification-content">
                                <h3>Password Updated</h3>
                                <p>Successfully updated GitHub password</p>
                                <span class="notification-time">5 hours ago</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div> -->
        </main>
    </div>

    <script src="sessionManagement.js"></script>
</body>
</html>
