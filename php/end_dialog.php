<?php
// close_dialog.php
require_once 'config/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight запрос
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получаем данные
$input = json_decode(file_get_contents('php://input'), true);
$dialog_id = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;

if ($dialog_id <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Valid dialog_id required'
    ]);
    exit;
}

try {
    $pdo = getDB();
    
    // Проверяем существует ли диалог и открыт ли он
    $stmt = $pdo->prepare("
        SELECT id, status 
        FROM dialogs 
        WHERE id = ? AND status = 'open'
        LIMIT 1
    ");
    $stmt->execute([$dialog_id]);
    $dialog = $stmt->fetch();
    
    if (!$dialog) {
        // Диалог не найден или уже закрыт
        echo json_encode([
            'success' => false,
            'dialog_id' => $dialog_id,
            'status' => 'not_found_or_already_closed'
        ]);
        exit;
    }
    
    // Обновляем статус на 'closed'
    $stmt = $pdo->prepare("UPDATE dialogs SET status = 'closed' WHERE id = ?");
    $result = $stmt->execute([$dialog_id]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'dialog_id' => $dialog_id,
            'status' => 'closed'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'dialog_id' => $dialog_id,
            'error' => 'Failed to update status'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'dialog_id' => $dialog_id
    ]);
}
?>