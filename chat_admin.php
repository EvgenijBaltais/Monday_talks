<?php
// close_dialog.php
require_once 'config.php';

try {
    $pdo = getDB();
    
    $stmt_open = $pdo->query("
        SELECT * FROM dialogs 
        WHERE status = 'open' 
        ORDER BY updated_at DESC
    ");

    $stmt_closed = $pdo->query("
        SELECT * FROM dialogs 
        WHERE status = 'closed' 
        ORDER BY updated_at DESC
    ");

    $opened_dialogs = $stmt_open->fetchAll();
    $closed_dialogs = $stmt_closed->fetchAll();
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

?>


<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Список чатов</title>
</head>
<body>
	
	<div class = "admin-dialog">
		<p>
			<b>Открытые диалоги:</b>
		</p>
		<?php foreach ($opened_dialogs as $dialog): ?>
		    <a class="admin-dialog-item opened" data-fingerprint = "<?= htmlspecialchars($dialog['fingerprint']) ?>">
		        <div>Новый диалог ID: <?= $dialog['id'] ?></div>
		        <div>Создан: <?= $dialog['created_at'] ?></div>
		        <div>Обновлен: <?= $dialog['updated_at'] ?></div>
		    </a>
		<?php endforeach; ?>
	</div>

	<div class = "admin-dialog">
		<p>
			<b>Закрытые диалоги:</b>
		</p>
		<?php foreach ($closed_dialogs as $dialog): ?>
		    <a class="admin-dialog-item closed" data-fingerprint = "<?= htmlspecialchars($dialog['fingerprint']) ?>">
		        <div>Новый диалог ID: <?= $dialog['id'] ?></div>
		        <div>Создан: <?= $dialog['created_at'] ?></div>
		        <div>Обновлен: <?= $dialog['updated_at'] ?></div>
		    </a>
		<?php endforeach; ?>
	</div>
	<style>
		* {
			outline: 0;
			border: 0;
			box-sizing: border-box;
			font-family: Arial;
		}
		.admin-dialog {
			width: 350px;
			display: flex;
			flex-wrap: wrap;
			margin-bottom: 50px;
		}
		.admin-dialog-item {
			width: 100%;
			margin-bottom: 10px;
			border-radius: 10px;
			padding: 10px;
			border: 1px solid blue;
			cursor: pointer;
		}

		.admin-dialog-item.opened {
			background: #51BF03;
		}
		.admin-dialog-item.closed {
			background: #eee;
		}
		.admin-dialog-item:last-child {
			margin-bottom: 0
		}

/* Общие стили для контейнеров */
.admin-dialog {
    padding: 10px;
    margin-bottom: 32px;
}

.admin-dialog p {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #1e293b;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 12px;
}

.admin-dialog p b {
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Базовые стили для всех элементов диалогов */
.admin-dialog-item {
    display: block;
    text-decoration: none;
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

/* Эффект свечения при наведении */
.admin-dialog-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.admin-dialog-item:hover::before {
    opacity: 1;
}

/* Индикатор статуса слева */
.admin-dialog-item::after {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    height: 80%;
    width: 4px;
    border-radius: 0 4px 4px 0;
    transition: all 0.3s ease;
}

/* Открытые диалоги - зеленый индикатор */
.admin-dialog-item.opened::after {
    background: linear-gradient(135deg, #10b981, #34d399);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

/* Закрытые диалоги - серый индикатор */
.admin-dialog-item.closed::after {
    background: linear-gradient(135deg, #94a3b8, #cbd5e1);
}

/* Стили для текста внутри */
.admin-dialog-item div {
    color: #475569;
    font-size: 14px;
    line-height: 1.6;
    transition: color 0.2s ease;
    position: relative;
    z-index: 1;
}

.admin-dialog-item:hover div {
    color: #1e293b;
}

.admin-dialog-item div:first-child {
    font-weight: 600;
    color: #0f172a;
    font-size: 16px;
    margin-bottom: 8px;
}

/* Иконка для открытых диалогов */
.admin-dialog-item.opened div:first-child::before {
    content: '💬 ';
    font-size: 18px;
    margin-right: 8px;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}

/* Иконка для закрытых диалогов */
.admin-dialog-item.closed div:first-child::before {
    content: '📁 ';
    font-size: 18px;
    margin-right: 8px;
    opacity: 0.7;
}

/* Дата создания - добавляем иконку часов */
.admin-dialog-item div:nth-child(2)::before {
    content: '📅 ';
    margin-right: 6px;
    opacity: 0.6;
    font-size: 13px;
}

/* Дата обновления - добавляем иконку обновления */
.admin-dialog-item div:nth-child(3)::before {
    content: '🔄 ';
    margin-right: 6px;
    opacity: 0.6;
    font-size: 13px;
}

/* Анимация при наведении */
.admin-dialog-item:hover {
    transform: translateX(8px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Убираем нижний отступ у последнего элемента */
.admin-dialog-item:last-child {
    margin-bottom: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
    .admin-dialog {
        padding: 16px;
        border-radius: 12px;
    }
    
    .admin-dialog-item {
        padding: 14px 16px;
    }
    
    .admin-dialog-item:hover {
        transform: translateX(4px);
    }
}

/* Темная тема (если нужно) */
@media (prefers-color-scheme: dark) {
    .admin-dialog {
        background: #1e293b;
    }
    
    .admin-dialog p {
        color: #e2e8f0;
        border-bottom-color: #334155;
    }
    
    .admin-dialog-item {
        background: #0f172a;
    }
    
    .admin-dialog-item div {
        color: #94a3b8;
    }
    
    .admin-dialog-item:hover div {
        color: #f1f5f9;
    }
    
    .admin-dialog-item div:first-child {
        color: #f8fafc;
    }
}
	</style>
    <div id="app"></div>
</body>
</html>