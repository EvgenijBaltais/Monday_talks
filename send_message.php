<?php
// send_message.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

// Валидация
if (!isset($data['fingerprint']) || empty($data['fingerprint'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fingerprint is required']);
    exit;
}

if (!isset($data['message']) || empty(trim($data['message']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

if (!isset($data['direction']) || !in_array($data['direction'], [1, 2])) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid direction is required (1 for client, 2 for admin)']);
    exit;
}

if (strlen($data['message']) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is too long (max 5000 characters)']);
    exit;
}

$pdo = getDB();

try {
    $pdo->beginTransaction();
    
    // Получаем IP и User-Agent
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    
    // Определяем admin (1 если админ, 0 если клиент)
    $admin = isset($data['admin']) ? (int)$data['admin'] : 0;
    
    // Вставляем сообщение со всеми данными
    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (
            admin,
            message,
            file_path,
            direction,
            is_read,
            fingerprint,
            ip_address,
            user_agent
        ) VALUES (?, ?, ?, ?, FALSE, ?, ?, ?)
    ");
    
    $stmt->execute([
        $admin,
        trim($data['message']),
        $data['file_path'] ?? null,
        $data['direction'],
        $data['fingerprint'],
        $ip,
        $userAgent
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
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
            CASE 
                WHEN direction = 1 THEN 'client'
                WHEN direction = 2 THEN 'admin'
            END as sender_type
        FROM chat_messages 
        WHERE id = ?
    ");
    $messageStmt->execute([$messageId]);
    $message = $messageStmt->fetch(PDO::FETCH_ASSOC);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'timestamp' => time()
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Send message error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    $pdo->rollBack();
    error_log('Send message error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>