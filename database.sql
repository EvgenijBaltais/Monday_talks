-- Создание базы данных monday_talks, если она не существует
CREATE DATABASE IF NOT EXISTS monday_talks 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Выбираем базу данных для работы
USE monday_talks;

-- Таблица пользователей чата
CREATE TABLE IF NOT EXISTS chat_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chat_identifier VARCHAR(191) UNIQUE,
    name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_last_activity (last_activity),
    INDEX idx_name (name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    admin_id INT NULL,
    message TEXT,
    message_type ENUM('text', 'file', 'system') DEFAULT 'text',
    file_path VARCHAR(500) NULL,
    direction ENUM('user_to_admin', 'admin_to_user') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_created (created_at)
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