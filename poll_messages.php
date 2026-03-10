<?php
// poll_messages.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, must-revalidate');

// Включаем отображение ошибок для отладки (уберите на продакшене)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Функция для логирования ошибок
function debug_log($message) {
    $logFile = __DIR__ . '/poll_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

debug_log("=== Начало запроса ===");

// Обработка preflight запроса OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log("OPTIONS запрос");
    http_response_code(200);
    exit;
}

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debug_log("Неверный метод: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST']);
    exit;
}

// Получаем JSON из тела запроса
$rawInput = file_get_contents('php://input');
debug_log("Raw input: " . $rawInput);

$input = json_decode($rawInput, true);

if (!$input) {
    debug_log("Invalid JSON: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON data',
        'details' => json_last_error_msg()
    ]);
    exit;
}

debug_log("Parsed input: " . print_r($input, true));

// Получаем параметры из JSON
$fingerprint = isset($input['user_id']) ? $input['user_id'] : '';
$lastId = isset($input['last_id']) ? (int)$input['last_id'] : 0;

debug_log("Fingerprint: $fingerprint, Last ID: $lastId");

// Валидация
if (empty($fingerprint)) {
    debug_log("Missing user_id");
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

try {
    $pdo = getDB();
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    debug_log("Database connected successfully");
    
} catch (Exception $e) {
    debug_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit;
}

// Максимальное время polling (25 секунд)
$timeout = 25;
$startTime = time();

// Long polling цикл
while (time() - $startTime < $timeout) {
    try {
        debug_log("Checking messages for fingerprint: $fingerprint, last_id: $lastId");
        
        // Исправленный запрос в соответствии со структурой таблицы
        $stmt = $pdo->prepare("
            SELECT 
                id,
                message,
                direction,
                is_read,
                created_at,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
                UNIX_TIMESTAMP(created_at) as timestamp,
                fingerprint
            FROM chat_messages 
            WHERE fingerprint = ? AND id > ?
            ORDER BY created_at ASC
        ");
        
        $stmt->execute([$fingerprint, $lastId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        debug_log("Found " . count($messages) . " messages");
        
        // Если есть новые сообщения
        if (!empty($messages)) {
            debug_log("New messages: " . print_r($messages, true));
            
            // Отмечаем сообщения от админа как прочитанные (direction = 2)
            $adminMessages = array_filter($messages, function($msg) {
                return $msg['direction'] == 2 && !$msg['is_read'];
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
                debug_log("Marked as read: " . implode(", ", $ids));
            }
            
            // Форматируем ответ
            $response = [
                'success' => true,
                'messages' => array_map(function($msg) {
                    return [
                        'id' => (int)$msg['id'],
                        'message' => $msg['message'],
                        'direction' => (int)$msg['direction'], // 1 - клиент, 2 - админ
                        'is_read' => (bool)$msg['is_read'],
                        'created_at' => $msg['created_at'],
                        'formatted_date' => $msg['formatted_date'],
                        'timestamp' => (int)$msg['timestamp'],
                        'sender_type' => $msg['direction'] == 2 ? 'admin' : 'user'
                    ];
                }, $messages),
                'last_id' => (int)end($messages)['id'],
                'count' => count($messages)
            ];
            
            debug_log("Sending response with " . count($messages) . " messages");
            echo json_encode($response);
            exit;
        }
        
    } catch (PDOException $e) {
        debug_log("PDO Error: " . $e->getMessage());
        // Не выходим из цикла, продолжаем polling
    }
    
    // Проверяем, не закрыл ли клиент соединение
    if (connection_aborted()) {
        debug_log("Connection aborted by client");
        exit;
    }
    
    // Ждем 1 секунду перед следующей проверкой
    sleep(1);
}

// Таймаут - нет новых сообщений
debug_log("Timeout, no new messages");
echo json_encode([
    'success' => true,
    'messages' => [],
    'last_id' => $lastId,
    'count' => 0,
    'timeout' => true
]);