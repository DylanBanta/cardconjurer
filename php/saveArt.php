<?php
header('Content-Type: application/json');

// Define the target directory
$targetDir = __DIR__ . '/local_art/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

try {
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['image']['tmp_name'];
        $fileName = basename($_FILES['image']['name']);
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Validate the file extension
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($fileExtension, $allowedExtensions)) {
            throw new Exception('Unsupported file type.');
        }

        // Generate a unique file name
        $newFileName = uniqid('art_', true) . '.' . $fileExtension;
        $targetFilePath = $targetDir . $newFileName;

        // Move the file to the target directory
        if (move_uploaded_file($fileTmpPath, $targetFilePath)) {
            echo json_encode(['success' => true, 'filePath' => '/local_art/' . $newFileName]);
        } else {
            throw new Exception('Failed to move the uploaded file.');
        }
    } else {
        throw new Exception('No valid file uploaded.');
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
