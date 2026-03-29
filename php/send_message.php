<?php
// send_message.php
require_once 'config/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Валидация
if (!isset($data['fingerprint']) || empty($data['fingerprint'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fingerprint is required']);
    exit;
}

if (!isset($data['message']) || $data['message'] === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

$trimmedMessage = trim($data['message']);
if ($trimmedMessage === '' && $trimmedMessage !== '0') {
    http_response_code(400);
    echo json_encode(['error' => 'Message cannot be empty']);
    exit;
}

if (!isset($data['dialog_id']) || empty($data['dialog_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dialog Id is required']);
    exit;
}

if (!isset($data['direction']) || !in_array($data['direction'], [1, 2])) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid direction is required (1 for client, 2 for admin)']);
    exit;
}

try {
    $pdo = getDB();
    $pdo->beginTransaction();
    
    // Получаем IP и User-Agent
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Определяем admin (1 если админ, 0 если клиент)
    $admin = isset($data['admin']) ? (int)$data['admin'] : 0;
    
    // Вставляем сообщение - ИСПРАВЛЕНО: явно указываем is_read = 0
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (
            dialog_id,
            admin,
            message,
            file_path,
            direction,
            is_read,
            fingerprint,
            ip_address,
            user_agent
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['dialog_id'],      // dialog_id
        $admin,                  // admin
        trim($data['message']),  // message
        $data['file_path'] ?? null, // file_path
        $data['direction'],      // direction
        // is_read - уже указан в запросе как 0
        $data['fingerprint'],    // fingerprint
        $ip,                     // ip_address
        $userAgent               // user_agent
    ]);
    
    $messageId = $pdo->lastInsertId();
    
    
    // Получаем сохраненное сообщение
    $messageStmt = $pdo->prepare("
        SELECT 
            id,
            admin,
            message,
            file_path,
            direction,
            is_read,
            fingerprint,
            created_at,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
        FROM chat_messages 
        WHERE id = ?
    ");
    $messageStmt->execute([$messageId]);
    $message = $messageStmt->fetch(PDO::FETCH_ASSOC);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message_id' => $messageId,
        'message' => $message,
        'timestamp' => time()
    ]);
    
} catch (PDOException $e) {
    if ($pdo) {
        $pdo->rollBack();
    }
    error_log('Send message error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo) {
        $pdo->rollBack();
    }
    error_log('Send message error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred: ' . $e->getMessage()]);
}
?>