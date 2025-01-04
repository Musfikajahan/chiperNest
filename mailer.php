<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . "/vendor/autoload.php";

$mail = new PHPMailer(true);

try {

    // Use SMTP
    $mail->isSMTP();
    $mail->SMTPAuth = true;

    // Set Gmail SMTP server
    $mail->Host = "smtp.gmail.com";
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // Set Gmail account credentials
    $mail->Username = "musfika.jahan@g.bracu.ac.bd";  // Replace with your Gmail address
    $mail->Password = "fuvk wgmr sfmo uunw";       // Replace with your Gmail App Password

    // Set email format to HTML
    $mail->isHTML(true);

    // Return the configured PHPMailer instance
    return $mail;

} catch (Exception $e) {
    echo "Mailer Error: " . $mail->ErrorInfo;
    exit;
}
