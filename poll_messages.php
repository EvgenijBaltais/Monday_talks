<?php
// poll_messages.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, must-revalidate');

// Только GET запросы
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получаем параметры из URL
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$lastId = isset($_GET['last_id']) ? (int)$_GET['last_id'] : 0;

// Валидация
if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

// Максимальное время polling (25 секунд)
$timeout = 25;
$startTime = time();

$pdo = getDB();

// Long polling цикл
while (time() - $startTime < $timeout) {
    try {
        // Получаем новые сообщения для пользователя
        // Используем индекс idx_user_created для быстрого поиска
        $stmt = $pdo->prepare("
            SELECT 
                cm.id,
                cm.user_id,
                cm.admin_id,
                cm.message,
                cm.message_type,
                cm.direction,
                cm.is_read,
                cm.created_at,
                DATE_FORMAT(cm.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
                UNIX_TIMESTAMP(cm.created_at) as timestamp,
                cu.name as user_name,
                a.name as admin_name
            FROM chat_messages cm
            INNER JOIN chat_users cu ON cm.user_id = cu.id
            LEFT JOIN admins a ON cm.admin_id = a.id
            WHERE cm.user_id = ? AND cm.id > ?
            ORDER BY cm.created_at ASC
        ");
        
        $stmt->execute([$userId, $lastId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Если есть новые сообщения
        if (!empty($messages)) {
            // Отмечаем сообщения от админа как прочитанные
            $adminMessages = array_filter($messages, function($msg) {
                return $msg['direction'] === 'admin_to_user' && !$msg['is_read'];
            });
            
            if (!empty($adminMessages)) {
                $ids = array_column($adminMessages, 'id');
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                
                $updateStmt = $pdo->prepare("
                    UPDATE chat_messages 
                    SET is_read = TRUE 
                    WHERE id IN ($placeholders)
                ");
                $updateStmt->execute($ids);
            }
            
            // Форматируем ответ
            $response = [
                'success' => true,
                'messages' => array_map(function($msg) {
                    return [
                        'id' => (int)$msg['id'],
                        'user_id' => (int)$msg['user_id'],
                        'admin_id' => $msg['admin_id'] ? (int)$msg['admin_id'] : null,
                        'message' => $msg['message'],
                        'message_type' => $msg['message_type'],
                        'direction' => $msg['direction'],
                        'is_read' => (bool)$msg['is_read'],
                        'created_at' => $msg['created_at'],
                        'formatted_date' => $msg['formatted_date'],
                        'timestamp' => (int)$msg['timestamp'],
                        'sender_name' => $msg['direction'] === 'user_to_admin' 
                            ? $msg['user_name'] 
                            : ($msg['admin_name'] ?? 'Admin'),
                        'sender_type' => $msg['direction'] === 'user_to_admin' ? 'user' : 'admin'
                    ];
                }, $messages),
                'last_id' => (int)end($messages)['id'],
                'count' => count($messages)
            ];
            
            echo json_encode($response);
            exit;
        }
        
    } catch (PDOException $e) {
        // Логируем ошибку, но продолжаем polling
        error_log("Polling error: " . $e->getMessage());
    }
    
    // Проверяем, не закрыл ли клиент соединение
    if (connection_aborted()) {
        exit;
    }
    
    // Ждем 1 секунду перед следующей проверкой
    sleep(1);
}

// Таймаут - нет новых сообщений
echo json_encode([
    'success' => true,
    'messages' => [],
    'last_id' => $lastId,
    'count' => 0,
    'timeout' => true
]);