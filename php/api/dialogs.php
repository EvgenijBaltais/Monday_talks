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
            $stmt = $this->db->query("SELECT id, fingerprint, status, UNIX_TIMESTAMP(created_at) as created_at, UNIX_TIMESTAMP(updated_at) as updated_at FROM dialogs ORDER BY created_at DESC");
            $dialogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [
                'opened_dialogs' => [],
                'closed_dialogs' => []
            ];
            
            foreach ($dialogs as $dialog) {
                if ($dialog['status'] === 'open') {
                    $result['opened_dialogs'][] = $dialog;
                } else {
                    $result['closed_dialogs'][] = $dialog;
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