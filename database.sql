-- Создание базы данных monday_talks, если она не существует
CREATE DATABASE IF NOT EXISTS monday_talks 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Выбираем базу данных для работы
USE monday_talks;

-- Таблица сообщений (обновленная структура)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin TINYINT DEFAULT 0 COMMENT '1 - сообщение от админа, 0 - сообщение от клиента',
    message TEXT,
    file_path VARCHAR(500) NULL,
    direction TINYINT NOT NULL COMMENT '1 - сообщение от клиента, 2 - ответ менеджера',
    is_read BOOLEAN DEFAULT FALSE,
    fingerprint VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fingerprint (fingerprint),
    INDEX idx_created (created_at),
    INDEX idx_direction (direction)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица для админов
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    email VARCHAR(191) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Показать результат
SELECT 'Готово! Таблицы созданы в базе monday_talks' as 'Статус';