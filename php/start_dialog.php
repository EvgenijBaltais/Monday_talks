<?php
// start_dialog.php
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
$fingerprint = $input['fingerprint'] ?? '';
$dialog_id = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;

if (empty($fingerprint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Fingerprint required']);
    exit;
}

try {
    $pdo = getDB();
    
    // Если передан dialog_id, проверяем его валидность
    if ($dialog_id > 0) {
        $stmt = $pdo->prepare("
            SELECT id, status 
            FROM dialogs 
            WHERE id = ? AND fingerprint = ? AND status = 'open'
            LIMIT 1
        ");
        $stmt->execute([$dialog_id, $fingerprint]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Диалог существует, открыт и принадлежит этому пользователю
            echo json_encode([
                'success' => true,
                'dialog_id' => (int)$existing['id'],
                'status' => $existing['status']
            ]);
            exit;
        } else {
            // Диалог с таким ID не найден или не принадлежит пользователю или закрыт
            echo json_encode([
                'success' => false,
                'dialog_id' => $dialog_id,
                'status' => 'invalid'
            ]);
            exit;
        }
    }
    
    // Если dialog_id не передан или равен 0, ищем любой открытый диалог для этого fingerprint
    $stmt = $pdo->prepare("
        SELECT id, status 
        FROM dialogs 
        WHERE fingerprint = ? AND status = 'open' 
        ORDER BY created_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$fingerprint]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Нашли открытый диалог
        echo json_encode([
            'success' => true,
            'dialog_id' => (int)$existing['id'],
            'status' => $existing['status']
        ]);
        exit;
    }
    
    // Создаем новый диалог
    $stmt = $pdo->prepare("INSERT INTO dialogs (fingerprint, status, created_at) VALUES (?, 'open', NOW())");
    $stmt->execute([$fingerprint]);
    
    $newDialogId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'dialog_id' => (int)$newDialogId,
        'status' => 'open'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'dialog_id' => $dialog_id,
        'status' => 'error'
    ]);
}
?>