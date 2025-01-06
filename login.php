<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "chipernest";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error_message = '';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    if (empty($email) || empty($password)) {
        $error_message = 'All fields are required';
    } else {
        // Prepare SQL statement to prevent SQL injection
        $stmt = $conn->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
        
        if (!$stmt) {
            die("SQL error: " . $conn->error); // Debugging SQL error
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password_hash'])) {
                $_SESSION['id'] = $user['id'];
                $_SESSION['email'] = $user['email'];

                // Redirect to the dashboard on successful login
                header('Location: index.php');
                exit();
            } else {
                $error_message = 'Invalid password';
            }
        } else {
            $error_message = 'Email not found';
        }
        $stmt->close();
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div class="login-page">
        <div class="login-container">
            <h2>Welcome !</h2>
            <?php if (!empty($error_message)): ?>
                <div class="error-message" style="color: red;"><?= htmlspecialchars($error_message) ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="input-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="input-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">Login</button>
            </form>
            <div class="links">
                <a href="forget.html">Forgot your password?</a><br>
                <a href="Register.php">New user? Register here</a>
            </div>
        </div>
    </div>
</body>
</html>
