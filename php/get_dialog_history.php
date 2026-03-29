<?php
// get_dialog_history.php
header('Content-Type: application/json');

// Разрешаем CORS для разработки
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Обрабатываем preflight запросы OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

require_once 'config.php';

// Получаем данные из тела запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

$dialog_id = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
$fingerprint = isset($input['fingerprint']) ? $input['fingerprint'] : '';

if (!$dialog_id) {
    http_response_code(400);
    echo json_encode(['error' => 'dialog_id is required']);
    exit();
}

if (!$fingerprint) {
    http_response_code(400);
    echo json_encode(['error' => 'fingerprint is required']);
    exit();
}

try {
    $pdo = getDB();
    
    // Проверяем, существует ли диалог и принадлежит ли он этому fingerprint
    $stmt = $pdo->prepare("SELECT id FROM dialogs WHERE id = ? AND fingerprint = ?");
    $stmt->execute([$dialog_id, $fingerprint]);
    $dialog = $stmt->fetch();
    
    if (!$dialog) {
        http_response_code(404);
        echo json_encode(['error' => 'Dialog not found or access denied']);
        exit();
    }
    
    // Получаем историю сообщений из таблицы chat_messages
    $stmt = $pdo->prepare("
        SELECT 
            id,
            message as text,
            direction,
            admin,
            file_path,
            is_read,
            UNIX_TIMESTAMP(created_at) as created_at
        FROM chat_messages 
        WHERE dialog_id = ? 
        ORDER BY created_at ASC
    ");
    $stmt->execute([$dialog_id]);
    $messages = $stmt->fetchAll();
    
    // Форматируем сообщения для отправки
    $formatted_messages = array_map(function($msg) {
        return [
            'id' => (int)$msg['id'],
            'text' => $msg['text'],
            'direction' => (int)$msg['direction'], // 1 - от клиента, 2 - от менеджера
            'admin' => (int)$msg['admin'], // 1 - админ, 0 - клиент
            'file_path' => $msg['file_path'],
            'is_read' => (bool)$msg['is_read'],
            'created_at' => (int)$msg['created_at']
        ];
    }, $messages);
    
    // Отмечаем сообщения как прочитанные (для админа)
    if (!empty($messages)) {
        $stmt = $pdo->prepare("
            UPDATE chat_messages 
            SET is_read = TRUE 
            WHERE dialog_id = ? AND direction = 1 AND is_read = FALSE
        ");
        $stmt->execute([$dialog_id]);
    }
    
    echo json_encode([
        'success' => true,
        'dialog_id' => $dialog_id,
        'fingerprint' => $fingerprint,
        'messages' => $formatted_messages,
        'count' => count($formatted_messages)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>