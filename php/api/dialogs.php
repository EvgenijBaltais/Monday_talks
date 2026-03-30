<?php
// api/dialogs.php
header('Content-Type: application/json');

require_once '../config/config.php';

$pdo = getDB();

class DialogsAPI {
    private $db;
    
    public function __construct($pdo) {
        $this->db = $pdo;
    }
    
    public function getDialogs() {
        try {
            // Получаем все диалоги с количеством сообщений и непрочитанными сообщениями
            $stmt = $this->db->query("
                SELECT 
                    d.id, 
                    d.fingerprint, 
                    d.status, 
                    UNIX_TIMESTAMP(d.created_at) as created_at, 
                    UNIX_TIMESTAMP(d.updated_at) as updated_at,
                    COUNT(cm.id) as message_count,
                    SUM(CASE WHEN cm.is_read = 0 AND cm.direction = 1 THEN 1 ELSE 0 END) as unread_messages
                FROM dialogs d
                LEFT JOIN chat_messages cm ON d.id = cm.dialog_id
                GROUP BY d.id
                ORDER BY d.created_at DESC
            ");
            
            $dialogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [
                'opened_dialogs' => [],
                'closed_dialogs' => []
            ];
            
            foreach ($dialogs as $dialog) {
                // Формируем данные диалога
                $dialogData = [
                    'id' => $dialog['id'],
                    'fingerprint' => $dialog['fingerprint'],
                    'status' => $dialog['status'],
                    'message_count' => (int)$dialog['message_count'],
                    'unread_messages' => (int)$dialog['unread_messages'],
                    'created_at' => $dialog['created_at'],
                    'updated_at' => $dialog['updated_at']
                ];
                
                if ($dialog['status'] === 'open') {
                    $result['opened_dialogs'][] = $dialogData;
                } else {
                    $result['closed_dialogs'][] = $dialogData;
                }
            }
            
            return $result;
            
        } catch (PDOException $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }
}

$api = new DialogsAPI($pdo);
echo json_encode($api->getDialogs());