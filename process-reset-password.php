<?php

$token = $_POST["token"];
$mysqli = require __DIR__ . "/database.php";

if (!$mysqli) {
    die("Database connection failed: " . $mysqli->connect_error);
}

// Hash the token
$token_hash = hash("sha256", $token);

// Select the user based on the token
$sql = "SELECT * FROM users WHERE reset_token_hash = ?";
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    die("Error preparing SELECT query: " . $mysqli->error);
}

$stmt->bind_param("s", $token_hash);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    die("Token not found or invalid.");
}

if (strtotime($user["reset_token_expires_at"]) <= time()) {
    die("Token has expired.");
}

// Validate the new password
if (strlen($_POST["password"]) < 8) {
    die("Password must be at least 8 characters.");
}

if (!preg_match("/[a-z]/i", $_POST["password"])) {
    die("Password must contain at least one letter.");
}

if (!preg_match("/[0-9]/", $_POST["password"])) {
    die("Password must contain at least one number.");
}

if ($_POST["password"] !== $_POST["password_confirmation"]) {
    die("Passwords do not match.");
}

// Hash the new password
$password_hash = password_hash($_POST["password"], PASSWORD_DEFAULT);

// Update the user's password and reset token fields
$sql = "UPDATE users
        SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL
        WHERE id = ?";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    die("Error preparing UPDATE query: " . $mysqli->error);
}

// Ensure id is treated as an integer
$stmt->bind_param("si", $password_hash, $user["id"]);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo "Password updated successfully. You can now log in.";
} else {
    echo "Error updating password. Please try again.";
}

// Clean up resources
$stmt->close();
$mysqli->close();

?>
