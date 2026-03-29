<?php
// restore_dialog.php
require_once 'config/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Функция для логирования (опционально, для отладки)
function debug_log($message) {
    $logFile = __DIR__ . '/restore_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

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

if ($dialog_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid dialog_id required']);
    exit;
}

try {
    $pdo = getDB();
    
    // 1. Проверяем существование открытого диалога
    $stmt = $pdo->prepare("
        SELECT id, status, created_at 
        FROM dialogs 
        WHERE id = ? AND fingerprint = ? AND status = 'open'
        LIMIT 1
    ");
    $stmt->execute([$dialog_id, $fingerprint]);
    $dialog = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$dialog) {
        // Диалог не найден или закрыт
        echo json_encode([
            'success' => false,
            'error' => 'Dialog not found or not open',
            'dialog_id' => $dialog_id,
            'status' => 'closed_or_not_found'
        ]);
        exit;
    }
    
    // 2. Получаем все сообщения этого диалога
    $stmt = $pdo->prepare("
        SELECT 
            id,
            message,
            direction,
            is_read,
            created_at,
            DATE_FORMAT(created_at, '%d.%m.%Y %H:%i') as formatted_date,
            UNIX_TIMESTAMP(created_at) as timestamp
        FROM chat_messages 
        WHERE dialog_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$dialog_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Форматируем сообщения для отправки
    $formattedMessages = array_map(function($msg) {
        return [
            'id' => (int)$msg['id'],
            'text' => $msg['message'],
            'direction' => (int)$msg['direction'], // 1 - клиент, 2 - менеджер
            'is_read' => (bool)$msg['is_read'],
            'created_at' => $msg['created_at'],
            'formatted_date' => $msg['formatted_date'],
            'timestamp' => (int)$msg['timestamp'],
            'type' => $msg['direction'] == 2 ? 'manager' : 'client'
        ];
    }, $messages);
    
    // 4. Отправляем успешный ответ со всеми данными
    echo json_encode([
        'success' => true,
        'dialog' => [
            'id' => (int)$dialog['id'],
            'status' => $dialog['status'],
            'created_at' => $dialog['created_at'],
            'formatted_date' => date('d.m.Y H:i', strtotime($dialog['created_at']))
        ],
        'messages' => $formattedMessages,
        'messages_count' => count($formattedMessages),
        'dialog_id' => (int)$dialog['id'],
        'fingerprint' => $fingerprint
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage() // Убрать на продакшене
    ]);
}
?>