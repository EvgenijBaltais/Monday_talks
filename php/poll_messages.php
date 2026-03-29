<?php
// poll_messages.php
require_once 'config/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, must-revalidate');

// Включаем отображение ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Обработка preflight запроса OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST']);
    exit;
}

// Получаем JSON из тела запроса
$rawInput = file_get_contents('php://input');

$input = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON data',
        'details' => json_last_error_msg()
    ]);
    exit;
}

// Получаем параметры из JSON
$fingerprint = isset($input['user_id']) ? $input['user_id'] : '';
$dialog_id = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
// last_id ПОЛНОСТЬЮ УБРАН

// Валидация
if (empty($fingerprint)) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

if ($dialog_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid dialog_id is required']);
    exit;
}

try {
    $pdo = getDB();
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit;
}

// Проверяем, существует ли диалог
try {
    $checkStmt = $pdo->prepare("
        SELECT id, status FROM dialogs 
        WHERE id = ? AND fingerprint = ?
    ");
    $checkStmt->execute([$dialog_id, $fingerprint]);
    $dialog = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$dialog) {
        echo json_encode([
            'success' => false,
            'error' => 'Dialog not found or access denied',
            'messages' => []
        ]);
        exit;
    }

} catch (PDOException $e) {

}

// Максимальное время polling (25 секунд)
$timeout = 25;
$startTime = time();

// Long polling цикл
while (time() - $startTime < $timeout) {
    try {
        // УПРОЩЕННЫЙ ЗАПРОС - просто все сообщения по dialog_id
        $stmt = $pdo->prepare("
            SELECT 
                id,
                message,
                direction,
                is_read,
                created_at,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
                UNIX_TIMESTAMP(created_at) as timestamp,
                fingerprint,
                dialog_id
            FROM chat_messages 
            WHERE dialog_id = :dialog_id
            ORDER BY created_at ASC
        ");
        
        $stmt->execute([
            ':dialog_id' => $dialog_id
        ]);
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Форматируем ответ - ВСЕГДА возвращаем все сообщения
        $response = [
            'success' => true,
            'messages' => array_map(function($msg) {
                return [
                    'id' => (int)$msg['id'],
                    'message' => $msg['message'],
                    'direction' => (int)$msg['direction'],
                    'is_read' => (bool)$msg['is_read'],
                    'created_at' => $msg['created_at'],
                    'formatted_date' => $msg['formatted_date'],
                    'timestamp' => (int)$msg['timestamp'],
                    'sender_type' => $msg['direction'] == 2 ? 'admin' : 'user',
                    'dialog_id' => (int)$msg['dialog_id']
                ];
            }, $messages),
            'count' => count($messages),
            'dialog_id' => $dialog_id
        ];
        
        echo json_encode($response);
        exit;
        
    } catch (PDOException $e) {
        // При ошибке выходим с сообщением об ошибке
        echo json_encode([
            'success' => false,
            'error' => 'Database error',
            'details' => $e->getMessage()
        ]);
        exit;
    }
    
    // Проверяем, не закрыл ли клиент соединение
    if (connection_aborted()) {
        exit;
    }
    
    // Ждем 1 секунду перед следующей проверкой
    sleep(1);
}

// Таймаут - просто возвращаем пустой массив
echo json_encode([
    'success' => true,
    'messages' => [],
    'count' => 0,
    'timeout' => true,
    'dialog_id' => $dialog_id
]);
?>