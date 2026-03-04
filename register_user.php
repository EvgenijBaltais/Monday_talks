<?php
// register_user.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Для CORS если нужно
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || empty(trim($data['name']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Name is required']);
    exit;
}

$pdo = getDB();

try {
    // Очищаем имя
    $name = trim($data['name']);
    $cleanName = preg_replace('/[^a-zA-Zа-яА-Я0-9\s]/u', '', $name);
    $cleanName = str_replace(' ', '_', $cleanName);
    
    // Генерируем уникальный идентификатор
    $timestamp = round(microtime(true) * 1000);
    $random = substr(md5(uniqid()), 0, 6); // Добавляем случайность для гарантии уникальности
    $chatIdentifier = $cleanName . '_' . $timestamp . '_' . $random;
    
    // Вставляем пользователя
    $stmt = $pdo->prepare("
        INSERT INTO chat_users (chat_identifier, name, ip_address, user_agent) 
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $chatIdentifier,
        $name,
        $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Отправляем данные клиенту - он сам будет хранить свой ID
    echo json_encode([
        'success' => true,
        'user_id' => $userId,
        'chat_identifier' => $chatIdentifier,
        'name' => $name
    ]);
    
} catch (PDOException $e) {
    // Проверяем, не уникальность ли это нарушена
    if ($e->errorInfo[1] == 1062) { // MySQL duplicate entry error
        // Пробуем еще раз с новым random
        $chatIdentifier = $cleanName . '_' . $timestamp . '_' . substr(md5(uniqid()), 0, 8);
        
        $stmt = $pdo->prepare("
            INSERT INTO chat_users (chat_identifier, name, ip_address, user_agent) 
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $chatIdentifier,
            $name,
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
        
        $userId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'user_id' => $userId,
            'chat_identifier' => $chatIdentifier,
            'name' => $name
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>