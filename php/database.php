<?php
header('Content-Type: application/json');

try {
    // Directory for database files
    $dbDir = __DIR__ . '/db';
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }

    // Default database
    $defaultDbFile = $dbDir . '/cards.db';

    // Get selected database or fallback to default
    $input = json_decode(file_get_contents('php://input'), true);
    $selectedDb = $_GET['database'] ?? $input['database'] ?? 'cards.db';
    $dbFile = $dbDir . '/' . basename($selectedDb);

    // Ensure the selected database exists
    if (!file_exists($dbFile)) {
        if ($selectedDb === 'cards.db') {
            $db = new SQLite3($defaultDbFile);
            $db->exec('CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                data TEXT
            )');
        } else {
            throw new Exception("Database '$selectedDb' not found.");
        }
    } else {
        $db = new SQLite3($dbFile);
    }

    $action = $_GET['action'] ?? $input['action'] ?? '';

    switch ($action) {
        case 'saveCard':
            if (!isset($input['name']) || !isset($input['data'])) {
                throw new Exception('Missing name or data.');
            }
            $name = $db->escapeString($input['name']);
            $data = $db->escapeString(json_encode($input['data']));
            $query = "INSERT OR REPLACE INTO cards (name, data) VALUES ('$name', '$data')";
            $result = $db->exec($query);
            echo json_encode(['success' => $result]);
            break;

        case 'listCards':
            $query = 'SELECT id, name FROM cards';
            $result = $db->query($query);
            $cards = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $cards[] = $row;
            }
            echo json_encode(['success' => true, 'cards' => $cards]);
            break;

        case 'loadCard':
            if (!isset($input['id'])) {
                throw new Exception('Missing card ID.');
            }
            $id = intval($input['id']);
            $query = "SELECT data FROM cards WHERE id = $id";
            $result = $db->querySingle($query, true);
            if ($result) {
                echo json_encode(['success' => true, 'data' => json_decode($result['data'], true)]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Card not found']);
            }
            break;

        case 'deleteDatabase':
            if (!isset($input['name'])) {
                throw new Exception('Missing database name.');
            }
        
            $dbName = basename($input['name'], '.db'); // Strip .db extension if included
            $dbFilePath = $dbDir . '/' . $dbName . '.db'; // Add .db extension
        
            if (!file_exists($dbFilePath)) {
                throw new Exception("Database '$dbName.db' does not exist.");
            }
        
            if (unlink($dbFilePath)) {
                echo json_encode(['success' => true, 'message' => "Database '$dbName.db' deleted successfully."]);
            } else {
                throw new Exception("Failed to delete database '$dbName.db'.");
            }
            break;            

        case 'listDatabases':
            $dbDirectory = __DIR__ . '/db/';
            if (!is_dir($dbDirectory)) {
                mkdir($dbDirectory, 0755, true);
            }
        
            $files = scandir($dbDirectory);
            $databases = array_filter($files, function ($file) use ($dbDirectory) {
                return is_file($dbDirectory . $file) && pathinfo($file, PATHINFO_EXTENSION) === 'db';
            });
        
            echo json_encode(['success' => true, 'databases' => array_values($databases)]);
            break;
            
        case 'createDatabase':
            if (!isset($input['name'])) {
                throw new Exception('Missing database name.');
            }
            $newDbName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $input['name']) . '.db';
            $newDbFile = $dbDir . '/' . $newDbName;

            if (file_exists($newDbFile)) {
                throw new Exception("Database '$newDbName' already exists.");
            }

            $newDb = new SQLite3($newDbFile);
            $newDb->exec('CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                data TEXT
            )');
            echo json_encode(['success' => true, 'message' => "Database '$newDbName' created successfully."]);
            break;

        case 'renameDatabase':
            if (!isset($input['currentName']) || !isset($input['newName'])) {
                throw new Exception('Missing current or new database name.');
            }
        
            $currentName = basename($input['currentName'], '.db'); // Get the current database name without the extension
            $newName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $input['newName']) . '.db'; // Sanitize and append .db extension
        
            $currentFilePath = $dbDir . '/' . $currentName . '.db'; // Add .db to the current file name
            $newFilePath = $dbDir . '/' . $newName;
        
            if (!file_exists($currentFilePath)) {
                throw new Exception("Database '$currentName.db' does not exist.");
            }
        
            if (file_exists($newFilePath)) {
                throw new Exception("Database '$newName' already exists.");
            }
        
            if (rename($currentFilePath, $newFilePath)) {
                echo json_encode(['success' => true, 'message' => "Database renamed to '$newName'."]);
            } else {
                throw new Exception("Failed to rename database '$currentName.db'.");
            }
            break;
            
        
        case 'deleteDatabase':
            if (!isset($input['name'])) {
                throw new Exception('Missing database name.');
            }
        
            $dbName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $input['name']);
            $filePath = $dbDir . '/' . basename($dbName);
        
            if (!file_exists($filePath)) {
                throw new Exception("Database '$dbName' does not exist.");
            }
        
            if (unlink($filePath)) {
                echo json_encode(['success' => true, 'message' => "Database '$dbName' deleted successfully."]);
            } else {
                throw new Exception("Failed to delete database '$dbName'.");
            }
            break;            

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
