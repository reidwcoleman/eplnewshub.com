<?php
if ($_SERVER['REQUEST_URI'] == '/index.html') {
    header('Location: /', true, 301);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home</title>
</head>
<body>
    <!-- Your website content goes here -->
</body>
</html>
