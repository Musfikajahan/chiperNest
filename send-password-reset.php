<?php

$email = $_POST["email"];

$token = bin2hex(random_bytes(16));

$token_hash = hash("sha256", $token);

$expiry = date("Y-m-d H:i:s", time() + 60 * 30);

$mysqli = require __DIR__ . "/database.php";

$sql = "UPDATE users
        SET reset_token_hash = ?,
            reset_token_expires_at = ?
        WHERE email = ?";

$stmt = $mysqli->prepare($sql);

$stmt->bind_param("sss", $token_hash, $expiry, $email);

$stmt->execute();

if ($mysqli->affected_rows) {

    $mail = require __DIR__ . "/mailer.php";

    $mail->setFrom("noreply@gmail.com");
    $mail->addAddress($email);
    $mail->Subject = "Password Reset";
    $mail->Body = <<<END
    <html>
    <body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
        <p>Dear User,</p>
        
        <p>We received a request to reset the password for your account on <strong>EduFlow</strong>. If you did not request this change, please disregard this email.</p>
        
        <p>To reset your password, please click the link below:</p>
        <p><a href="http://localhost/Website chipernest/fp/reset-password.php?token=$token" style="color: #1a73e8; text-decoration: none; font-weight: bold;">Reset Your Password</a></p>
        
        <p>If you need any assistance or have questions, feel free to contact our support team at support@eduflow.com.</p>
        
        <p>Best regards,</p>
        <p><strong>The EduFlow Support Team</strong></p>
    </body>
    </html>
END;



    try {

        $mail->send();

    } catch (Exception $e) {

        echo "Message could not be sent. Mailer error: {$mail->ErrorInfo}";

    }

}

echo "Message sent, please check your inbox.";