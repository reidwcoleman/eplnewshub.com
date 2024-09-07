<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get the posted email
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $email = $data['email'];

    // Save the email (for example, in a file or database)
    file_put_contents('emails.txt', $email . PHP_EOL, FILE_APPEND);

    // Respond back to the client
    echo json_encode(["success" => true]);
}
?>
