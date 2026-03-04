<?php
// send_message.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка preflight запросов CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Валидация входных данных
if (!isset($data['user_id']) || !is_numeric($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid user_id is required']);
    exit;
}

if (!isset($data['message']) || empty(trim($data['message']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

// Проверка длины сообщения
if (strlen($data['message']) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is too long (max 5000 characters)']);
    exit;
}

$pdo = getDB();

try {
    // Начинаем транзакцию
    $pdo->beginTransaction();
    
    // Проверяем, существует ли пользователь и получаем его данные
    $userStmt = $pdo->prepare("
        SELECT id, name, chat_identifier 
        FROM chat_users 
        WHERE id = ?
    ");
    $userStmt->execute([$data['user_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Определяем направление сообщения (от пользователя)
    $direction = 'user_to_admin';
    $adminId = null; // Админ пока не назначен, сообщение идет в общую очередь
    
    // Вставляем сообщение
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (
            user_id, 
            admin_id, 
            message, 
            message_type, 
            direction, 
            is_read,
            created_at
        ) VALUES (?, ?, ?, ?, ?, FALSE, NOW())
    ");
    
    $stmt->execute([
        $data['user_id'],
        $adminId,
        trim($data['message']),
        $data['type'] ?? 'text',
        $direction
    ]);
    
    $messageId = $pdo->lastInsertId();
    
    // Обновляем last_activity пользователя
    $updateStmt = $pdo->prepare("
        UPDATE chat_users 
        SET last_activity = NOW() 
        WHERE id = ?
    ");
    $updateStmt->execute([$data['user_id']]);
    
    // Получаем сохраненное сообщение со всеми связанными данными
    $messageStmt = $pdo->prepare("
        SELECT 
            cm.id,
            cm.user_id,
            cm.admin_id,
            cm.message,
            cm.message_type,
            cm.direction,
            cm.is_read,
            cm.created_at,
            cu.name as user_name,
            cu.chat_identifier,
            a.name as admin_name,
            DATE_FORMAT(cm.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
        FROM chat_messages cm
        INNER JOIN chat_users cu ON cm.user_id = cu.id
        LEFT JOIN admins a ON cm.admin_id = a.id
        WHERE cm.id = ?
    ");
    $messageStmt->execute([$messageId]);
    $message = $messageStmt->fetch(PDO::FETCH_ASSOC);
    
    // Добавляем имя отправителя для удобства
    $message['sender_name'] = $message['user_name'];
    $message['sender_type'] = 'user';
    $message['sender_id'] = $message['user_id'];
    
    $pdo->commit();
    
    // Успешный ответ
    echo json_encode([
        'success' => true,
        'message' => $message,
        'timestamp' => time()
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    
    // Логируем ошибку
    error_log('Send message PDO error: ' . $e->getMessage());
    error_log('Error code: ' . $e->getCode());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error occurred',
        'error_code' => $e->getCode()
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    
    error_log('Send message general error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error occurred'
    ]);
}
?>