-- --------------------------------------------------------
-- Host:                         mysql-363305a8-restygonzales749-a379.i.aivencloud.com
-- Server version:               8.4.8 - Source distribution
-- Server OS:                    Linux
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for defaultdb
CREATE DATABASE IF NOT EXISTS `defaultdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `defaultdb`;

-- Dumping structure for table defaultdb.attendance_logs
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `log_date` date NOT NULL,
  `clock_in` timestamp NOT NULL,
  `clock_out` timestamp NULL DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `late_minutes` int unsigned NOT NULL DEFAULT '0',
  `overtime_hours` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('on_time','late','overtime','incomplete','absent') NOT NULL DEFAULT 'on_time',
  `method` enum('rfid','manual','pin') NOT NULL DEFAULT 'rfid',
  `rfid_card_uid_used` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `att_logs_employee_idx` (`employee_id`),
  CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.attendance_logs: ~0 rows (approximately)

-- Dumping structure for table defaultdb.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_idx` (`user_id`),
  KEY `audit_logs_entity_idx` (`entity_type`,`entity_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.audit_logs: ~0 rows (approximately)

-- Dumping structure for table defaultdb.branches
CREATE TABLE IF NOT EXISTS `branches` (
  `id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `code` varchar(30) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'branch',
  `address` text,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.branches: ~1 rows (approximately)
INSERT INTO `branches` (`id`, `name`, `code`, `type`, `address`, `contact_number`, `email`, `is_main`, `is_active`, `created_at`, `updated_at`) VALUES
	('00000000-0000-4000-8000-000000000201', 'Main Branch', 'MAIN', 'main', 'Bayanan I, Calapan City Oriental Mindoro', '+639551834091', 'padrs@gmail.com', 1, 1, '2026-10-01 22:27:32', '2026-10-02 12:12:16');

-- Dumping structure for table defaultdb.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.categories: ~1 rows (approximately)
INSERT INTO `categories` (`id`, `name`, `sort_order`, `is_active`, `created_at`) VALUES
	('610672fc-2643-914f-55ac-0e6012e6951b', 'Rice', 1, 1, '2026-09-29 05:40:50'),
	('f522e279-d754-b1de-031a-31d96b9bf1e8', 'Ulam', 0, 1, '2026-09-29 02:06:57');

-- Dumping structure for table defaultdb.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` char(36) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `loyalty_points_balance` int unsigned NOT NULL DEFAULT '0',
  `is_guest` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `pwd_id_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `customers_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.customers: ~5 rows (approximately)
INSERT INTO `customers` (`id`, `email`, `password`, `name`, `contact_number`, `loyalty_points_balance`, `is_guest`, `created_at`, `updated_at`, `date_of_birth`, `pwd_id_number`) VALUES
	('00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'rieljohnmichael026@gmail.com', '$2y$12$c.qLKqRf7JX/1keAhwYKfOpqWsem.dIFZo/dqtNZRR/EvgaUD782m', 'Jhon Michael Riel', '09513657032', 2340, 0, '2026-10-03 12:54:43', '2026-10-03 12:54:43', NULL, NULL),
	('5632331d-601c-1d63-0ecb-1e1702a9ab42', 'angelo.baee@gmail.com', '$2y$12$eewZNc9ADSLQCxgLXwxB5uMYreuK2yS4vLXGSsM1wqtj43hK1Som2', 'rapi', '09637322372', 1188, 0, '2026-10-03 19:20:47', '2026-10-03 19:20:47', '2005-02-24', NULL),
	('8c9801c4-5364-504b-305b-4b82794cde66', 'lasackelly2@gmail.com', '$2y$12$dMvNqvsw3R6WcbrK15Sjwe.6gzIO3PUWHlUGtnyq.fdnnSenvOloS', 'Kelly Anne', '09383496554', 0, 0, '2026-10-03 08:03:52', '2026-10-03 08:03:52', NULL, NULL),
	('f7f3c463-d0b1-833f-d10a-bf2f2df2b555', 'customer@gmail.com', '$2y$12$32k2otquFkPpHClsTCPdQ.bA8mVIj8kNQgQP4RnlpN7/v5gTFSjSq', 'Pedro Penduko', '+639551834091', 0, 0, '2026-10-03 16:36:16', '2026-10-03 16:36:16', '2000-07-11', NULL),
	('fd44ec60-5aca-b3f4-90b4-80aa32332367', 'restygonzales749@gmail.com', '$2y$12$eDLxtjKEHkU2HmSlOkSLa.jFL12q3jVs/B6Hn9hL52Lum01bRK2Qi', 'Resty Gonzales', '+639551834091', 4503, 0, '2026-10-02 10:36:08', '2026-10-02 10:36:08', NULL, NULL);

-- Dumping structure for table defaultdb.deduction_types
CREATE TABLE IF NOT EXISTS `deduction_types` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.deduction_types: ~0 rows (approximately)

-- Dumping structure for table defaultdb.discount_types
CREATE TABLE IF NOT EXISTS `discount_types` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `requires_id_verification` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.discount_types: ~0 rows (approximately)
INSERT INTO `discount_types` (`id`, `name`, `percentage`, `requires_id_verification`, `is_active`) VALUES
	('02100000-0000-4000-8000-000000000002', 'PWD', 20.00, 1, 1),
	('587a5c40-195e-05bf-f3fd-cff57dc2767b', 'Senior Citezen', 20.00, 1, 1);

-- Dumping structure for table defaultdb.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `employee_number` varchar(20) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `rfid_card_uid` varchar(50) DEFAULT NULL,
  `date_hired` date NOT NULL,
  `date_terminated` date DEFAULT NULL,
  `employment_status` enum('active','on_leave','terminated') NOT NULL DEFAULT 'active',
  `basic_salary` decimal(10,2) NOT NULL,
  `salary_type` enum('daily','monthly') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `rfid_card_uid` (`rfid_card_uid`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.employees: ~0 rows (approximately)

-- Dumping structure for table defaultdb.employee_schedules
CREATE TABLE IF NOT EXISTS `employee_schedules` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `shift_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `emp_sched_user_idx` (`user_id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  CONSTRAINT `employee_schedules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `employee_schedules_ibfk_2` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.employee_schedules: ~0 rows (approximately)

-- Dumping structure for table defaultdb.expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `receipt_reference` varchar(100) DEFAULT NULL,
  `notes` text,
  `recorded_by_staff_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_category_idx` (`category_id`),
  KEY `expenses_cat_date_idx` (`category_id`,`expense_date`),
  KEY `recorded_by_staff_id` (`recorded_by_staff_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.expenses: ~0 rows (approximately)

-- Dumping structure for table defaultdb.expense_categories
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.expense_categories: ~0 rows (approximately)

-- Dumping structure for table defaultdb.inventory_categories
CREATE TABLE IF NOT EXISTS `inventory_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.inventory_categories: ~0 rows (approximately)

-- Dumping structure for table defaultdb.inventory_items
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` char(36) NOT NULL,
  `category_id` char(36) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `stock_quantity` decimal(10,3) NOT NULL DEFAULT '0.000',
  `reorder_threshold` decimal(10,3) DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(150) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_items_category_idx` (`category_id`),
  KEY `inventory_cat_active_idx` (`category_id`,`is_active`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.inventory_items: ~2 rows (approximately)

-- Dumping structure for table defaultdb.inventory_stock_logs
CREATE TABLE IF NOT EXISTS `inventory_stock_logs` (
  `id` char(36) NOT NULL,
  `item_type` enum('ingredient','menu_item') NOT NULL,
  `inventory_item_id` char(36) DEFAULT NULL,
  `menu_item_id` char(36) DEFAULT NULL,
  `type` enum('stock_in','adjustment','waste','consumed') NOT NULL,
  `quantity_change` decimal(10,3) NOT NULL,
  `quantity_after` decimal(10,3) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `performed_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `inv_stock_logs_item_idx` (`inventory_item_id`,`created_at`),
  KEY `inv_stock_logs_menu_idx` (`menu_item_id`,`created_at`),
  KEY `performed_by_staff_id` (`performed_by_staff_id`),
  CONSTRAINT `inventory_stock_logs_ibfk_1` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_stock_logs_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_stock_logs_ibfk_3` FOREIGN KEY (`performed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.inventory_stock_logs: ~0 rows (approximately)
INSERT INTO `inventory_stock_logs` (`id`, `item_type`, `inventory_item_id`, `menu_item_id`, `type`, `quantity_change`, `quantity_after`, `note`, `performed_by_staff_id`, `created_at`) VALUES
	('3b05a8a4-9a24-47c3-85cc-1bb7445ae7a2', 'menu_item', NULL, '52dff508-d054-1df7-901f-c1d7cb851f6e', 'adjustment', 1.000, 2308.000, 'Restored: Order voided (#ORD-261005160810-4F2A)', 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-05 16:48:07');

-- Dumping structure for table defaultdb.loyalty_rewards
CREATE TABLE IF NOT EXISTS `loyalty_rewards` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `points_cost` int unsigned NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.loyalty_rewards: ~0 rows (approximately)
INSERT INTO `loyalty_rewards` (`id`, `name`, `points_cost`, `description`, `is_active`) VALUES
	('83fc0138-1c3b-e156-bcec-1ac558f66f44', 'Pards', 390, NULL, 1);

-- Dumping structure for table defaultdb.loyalty_settings
CREATE TABLE IF NOT EXISTS `loyalty_settings` (
  `id` char(36) NOT NULL,
  `points_per_peso` decimal(5,2) NOT NULL DEFAULT '1.00',
  `peso_value_per_point` decimal(5,2) NOT NULL DEFAULT '0.50',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.loyalty_settings: ~0 rows (approximately)
INSERT INTO `loyalty_settings` (`id`, `points_per_peso`, `peso_value_per_point`, `updated_at`) VALUES
	('6bcbece1-1079-9b85-6432-4fb996a1c0a2', 1.00, 0.50, NULL);

-- Dumping structure for table defaultdb.loyalty_transactions
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `order_id` char(36) DEFAULT NULL,
  `type` enum('earn','redeem') NOT NULL,
  `points` int NOT NULL,
  `balance_after` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reward_id` char(36) DEFAULT NULL,
  `reward_name` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loyalty_tx_customer_idx` (`customer_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `loyalty_transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `loyalty_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.loyalty_transactions: ~11 rows (approximately)
INSERT INTO `loyalty_transactions` (`id`, `customer_id`, `order_id`, `type`, `points`, `balance_after`, `created_at`, `reward_id`, `reward_name`) VALUES
	('09c22f36-f33c-4c08-87ec-3c5cb68a040d', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '8177a6a4-8ece-4144-b8e0-913b54d773ca', 'earn', 420, 2013, '2026-10-04 01:54:51', NULL, NULL),
	('0d63bf2b-ef8f-48e9-9e27-f04cf2a8c85f', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', 'earn', 1200, 1203, '2026-10-03 04:10:52', NULL, NULL),
	('1d21987e-4eea-4a8a-a735-373dce0e2413', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'cbe6ebb6-6427-45fc-8a62-eee93b8f10c4', 'earn', 420, 4083, '2026-10-05 08:03:02', NULL, NULL),
	('1fdcad7b-cde6-467b-8a72-f57edc4672a7', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '356a81b2-bd4d-43a9-89e6-5d87f9654a2a', 'earn', 390, 1593, '2026-10-04 01:49:28', NULL, NULL),
	('5a02b25d-cc96-43ec-8f8d-b039c201a4fa', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '652a7430-4b12-444d-a777-33abf35b8d90', 'earn', 390, 3663, '2026-10-05 07:54:18', NULL, NULL),
	('5e84a1bf-8165-4e79-8fbc-d095184d6b88', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'a0975b2f-c402-4ba7-b504-6f1e8632ced5', 'earn', 420, 2340, '2026-10-03 05:51:28', NULL, NULL),
	('5fcdd2a0-f65a-4dac-bb63-3056fe5c7a20', '5632331d-601c-1d63-0ecb-1e1702a9ab42', '4383612e-1ac2-4c5f-be1a-ad90575a3d27', 'earn', 1188, 1188, '2026-10-04 01:47:28', NULL, NULL),
	('64d65a22-c0a5-4800-a33e-d04eaf9e7366', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '80ecc642-1703-4ab1-b0bf-1f01135a8943', 'earn', 420, 2853, '2026-10-04 02:02:57', NULL, NULL),
	('7e247791-f575-4b46-b490-ee195ca1351c', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', '0f00be20-41bb-4f4e-aa67-bb5ac1f2fca3', 'earn', 450, 840, '2026-10-03 05:22:29', NULL, NULL),
	('7ec68b43-da17-7673-63f6-13d87983b196', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', NULL, 'redeem', -390, 3, '2026-10-02 05:25:37', NULL, NULL),
	('83e965a3-7ab0-4c38-9b86-54717aa4e41a', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'fffcbea7-30a1-4ee5-9bab-2485d88f744c', 'earn', 390, 390, '2026-10-03 05:07:27', NULL, NULL),
	('90f9971b-b0d9-4a4a-9c13-9272900be2bf', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '9896300e-e00c-44b0-9c0f-4bf59985c2c6', 'earn', 420, 3273, '2026-10-04 02:14:28', NULL, NULL),
	('b780201c-92b7-429c-b756-41818b4b6515', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'ce31c2eb-70db-4fa1-82e7-b2a982c06322', 'earn', 393, 393, '2026-10-02 05:12:49', NULL, NULL),
	('c440046f-52ed-4c71-bb93-84d1b2f6c63b', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '4f2ac180-6e49-4976-a1c3-846d5390e99c', 'earn', 420, 4503, '2026-10-05 08:09:20', NULL, NULL),
	('ed4404c2-6ba1-45b4-af73-708534f92fd4', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'b1fea719-d5d2-47a3-ac2e-7b24a6f2094e', 'earn', 420, 2433, '2026-10-04 02:01:48', NULL, NULL),
	('ff8ed5be-1329-4094-8517-74e00c01b30b', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', '54e41ed6-07de-4748-852f-04bdbdc18ab6', 'earn', 1080, 1920, '2026-10-03 05:34:38', NULL, NULL);

-- Dumping structure for table defaultdb.menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `stock_quantity` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_items_category_idx` (`category_id`),
  KEY `menu_items_is_available_idx` (`is_available`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.menu_items: ~2 rows (approximately)
INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `price`, `image_url`, `is_available`, `stock_quantity`, `created_at`, `updated_at`) VALUES
	('52dff508-d054-1df7-901f-c1d7cb851f6e', 'f522e279-d754-b1de-031a-31d96b9bf1e8', 'Pards', 'Pards Litson Manok', 390.00, '/uploads/menu/2c0e8e54b7f4b1adaf7fb7477c6dfe666c30b4b3.jpg', 1, 2308, '2026-09-30 06:44:24', '2026-10-05 16:48:07'),
	('6a38817a-1b9e-4987-a57a-eb7d371d5790', '610672fc-2643-914f-55ac-0e6012e6951b', 'White Rice', 'Denorado Rice', 30.00, '/uploads/menu/818979bb32a6eab6bf8867d3a9303a36c3728030.jpg', 1, NULL, '2026-09-30 17:29:25', '2026-10-03 07:01:49');

-- Dumping structure for table defaultdb.menu_item_ingredients
CREATE TABLE IF NOT EXISTS `menu_item_ingredients` (
  `menu_item_id` char(36) NOT NULL,
  `inventory_item_id` char(36) NOT NULL,
  `quantity_used` decimal(10,3) NOT NULL,
  PRIMARY KEY (`menu_item_id`,`inventory_item_id`),
  KEY `menu_ingredients_menu_idx` (`menu_item_id`),
  KEY `menu_ingredients_inv_idx` (`inventory_item_id`),
  CONSTRAINT `menu_item_ingredients_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `menu_item_ingredients_ibfk_2` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.menu_item_ingredients: ~0 rows (approximately)

-- Dumping structure for table defaultdb.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration` int NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_unique` (`migration`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table defaultdb.migrations: ~13 rows (approximately)
INSERT INTO `migrations` (`id`, `migration`, `applied_at`) VALUES
	(1, 0, '2026-09-29 01:57:52'),
	(2, 1, '2026-09-29 01:57:53'),
	(3, 2, '2026-09-29 01:57:54'),
	(4, 3, '2026-09-29 01:58:09'),
	(5, 4, '2026-09-29 01:58:09'),
	(6, 5, '2026-09-29 01:58:10'),
	(7, 6, '2026-09-29 01:58:11'),
	(8, 7, '2026-09-29 01:58:20'),
	(9, 8, '2026-09-29 01:58:20'),
	(10, 9, '2026-09-29 01:58:21'),
	(11, 10, '2026-09-29 01:58:22'),
	(12, 11, '2026-09-29 01:58:23'),
	(13, 12, '2026-09-29 01:58:25'),
	(14, 13, '2026-10-01 22:27:32'),
	(15, 14, '2026-10-01 22:35:24'),
	(16, 15, '2026-10-02 02:56:58'),
	(17, 16, '2026-10-02 03:05:48'),
	(18, 17, '2026-10-02 03:30:45'),
	(19, 18, '2026-10-02 05:35:30'),
	(20, 19, '2026-10-02 05:36:10'),
	(21, 20, '2026-10-02 20:30:52'),
	(22, 21, '2026-10-03 07:31:05');

-- Dumping structure for table defaultdb.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) NOT NULL,
  `order_number` varchar(30) NOT NULL,
  `table_id` char(36) DEFAULT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `order_type` enum('qr','counter') NOT NULL,
  `status` enum('pending','preparing','ready','served','completed','cancelled') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `payment_status` varchar(32) NOT NULL DEFAULT 'not_required',
  `payment_method` varchar(20) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `guest_ip_hash` char(64) DEFAULT NULL,
  `admin_hidden_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_created_at_idx` (`created_at`),
  KEY `orders_table_id_idx` (`table_id`),
  KEY `customer_id` (`customer_id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.orders: ~16 rows (approximately)
INSERT INTO `orders` (`id`, `order_number`, `table_id`, `customer_id`, `order_type`, `status`, `subtotal`, `discount`, `tax`, `total`, `created_by_staff_id`, `created_at`, `updated_at`, `payment_status`, `payment_method`, `payment_reference`, `guest_ip_hash`, `admin_hidden_at`) VALUES
	('0f00be20-41bb-4f4e-aa67-bb5ac1f2fca3', 'ORD-261003132129-0F00', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'qr', 'completed', 450.00, 0.00, 0.00, 450.00, NULL, '2026-10-03 13:21:29', '2026-10-03 13:31:45', 'paid', 'cash', NULL, NULL, NULL),
	('0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', 'ORD-261003081322-0F79', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 1200.00, 0.00, 0.00, 1200.00, NULL, '2026-10-03 08:13:22', '2026-10-03 12:11:10', 'paid', 'cash', NULL, NULL, NULL),
	('1b174bf4-f401-4e35-81ef-991142ee26cb', 'ORD-261002212202-1B17', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', NULL, 'qr', 'completed', 390.00, 0.00, 0.00, 390.00, NULL, '2026-10-02 21:22:02', '2026-10-03 12:10:43', 'paid', 'cash', NULL, 'f767e44ac946e185d2925d11c14bf41b11ebc77fb820d9aaf37b2262030b94ff', NULL),
	('356a81b2-bd4d-43a9-89e6-5d87f9654a2a', 'ORD-261003154648-356A', 'e8b8c579-02e7-43ff-d108-b8c9aead91b0', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 390.00, 0.00, 41.79, 390.00, NULL, '2026-10-03 15:46:48', '2026-10-05 16:04:18', 'paid', NULL, NULL, NULL, NULL),
	('4383612e-1ac2-4c5f-be1a-ad90575a3d27', 'ORD-261003192456-4383', '9c3a3c57-7220-43cc-0326-227d516b6e48', '5632331d-601c-1d63-0ecb-1e1702a9ab42', 'qr', 'completed', 1350.00, 162.00, 127.29, 1188.00, NULL, '2026-10-03 19:24:56', '2026-10-05 16:04:16', 'paid', NULL, NULL, NULL, NULL),
	('4f2ac180-6e49-4976-a1c3-846d5390e99c', 'ORD-261005160810-4F2A', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'cancelled', 420.00, 0.00, 45.00, 420.00, NULL, '2026-10-05 16:08:10', '2026-10-05 16:48:06', 'paid', 'cash', NULL, NULL, NULL),
	('54e41ed6-07de-4748-852f-04bdbdc18ab6', 'ORD-261003133311-54E4', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'qr', 'completed', 1080.00, 0.00, 0.00, 1080.00, NULL, '2026-10-03 13:33:11', '2026-10-03 13:37:48', 'paid', 'cash', NULL, NULL, NULL),
	('652a7430-4b12-444d-a777-33abf35b8d90', 'ORD-261005155306-652A', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 390.00, 0.00, 41.79, 390.00, NULL, '2026-10-05 15:53:06', '2026-10-05 16:03:55', 'paid', NULL, NULL, NULL, NULL),
	('80ecc642-1703-4ab1-b0bf-1f01135a8943', 'ORD-261003145327-80EC', 'eb9e1257-cbb8-dcd1-c453-145b447186ba', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 420.00, 0.00, 0.00, 420.00, NULL, '2026-10-03 14:53:27', '2026-10-05 16:03:59', 'paid', 'cash', NULL, NULL, NULL),
	('8177a6a4-8ece-4144-b8e0-913b54d773ca', 'ORD-261004095246-8177', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 420.00, 0.00, 45.00, 420.00, NULL, '2026-10-04 09:52:46', '2026-10-05 16:04:14', 'paid', NULL, NULL, NULL, NULL),
	('9896300e-e00c-44b0-9c0f-4bf59985c2c6', 'ORD-261003145313-9896', 'eb9e1257-cbb8-dcd1-c453-145b447186ba', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 420.00, 0.00, 0.00, 420.00, NULL, '2026-10-03 14:53:13', '2026-10-05 16:04:01', 'paid', 'cash', NULL, NULL, NULL),
	('a0975b2f-c402-4ba7-b504-6f1e8632ced5', 'ORD-261003134248-A097', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'qr', 'completed', 420.00, 0.00, 0.00, 420.00, NULL, '2026-10-03 13:42:48', '2026-10-03 13:51:48', 'paid', 'cash', NULL, NULL, NULL),
	('b1fea719-d5d2-47a3-ac2e-7b24a6f2094e', 'ORD-261004095938-B1FE', NULL, 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 420.00, 0.00, 45.00, 420.00, NULL, '2026-10-04 09:59:38', '2026-10-05 16:03:43', 'paid', 'gcash', '95093752375092375', NULL, NULL),
	('cbe6ebb6-6427-45fc-8a62-eee93b8f10c4', 'ORD-261005160101-CBE6', 'de4f97db-db11-4a14-9052-41593064a38b', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 420.00, 0.00, 45.00, 420.00, NULL, '2026-10-05 16:01:01', '2026-10-05 16:03:25', 'paid', 'cash', NULL, NULL, NULL),
	('ce31c2eb-70db-4fa1-82e7-b2a982c06322', 'ORD-261002130713-CE31', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'qr', 'completed', 393.00, 0.00, 0.00, 393.00, NULL, '2026-10-02 13:07:13', '2026-10-02 13:12:56', 'paid', 'cash', NULL, NULL, NULL),
	('fffcbea7-30a1-4ee5-9bab-2485d88f744c', 'ORD-261003130607-FFFC', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'qr', 'completed', 390.00, 0.00, 0.00, 390.00, NULL, '2026-10-03 13:06:07', '2026-10-03 13:17:18', 'paid', 'cash', NULL, NULL, NULL);

-- Dumping structure for table defaultdb.order_discounts
CREATE TABLE IF NOT EXISTS `order_discounts` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `discount_type_id` char(36) NOT NULL,
  `id_number` varchar(50) DEFAULT NULL,
  `holder_name` varchar(100) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_discounts_order_idx` (`order_id`),
  KEY `discount_type_id` (`discount_type_id`),
  KEY `applied_by_staff_id` (`applied_by_staff_id`),
  CONSTRAINT `order_discounts_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_discounts_ibfk_2` FOREIGN KEY (`discount_type_id`) REFERENCES `discount_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_discounts_ibfk_3` FOREIGN KEY (`applied_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.order_discounts: ~0 rows (approximately)

-- Dumping structure for table defaultdb.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `menu_item_id` char(36) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.order_items: ~27 rows (approximately)
INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `subtotal`, `notes`) VALUES
	('079b02b7-a984-4180-91e4-3d1cbcf7eb44', '0f00be20-41bb-4f4e-aa67-bb5ac1f2fca3', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('0eb1a0c9-5586-4b3d-a2ad-320ea9cfadee', '54e41ed6-07de-4748-852f-04bdbdc18ab6', '52dff508-d054-1df7-901f-c1d7cb851f6e', 2, 390.00, 780.00, NULL),
	('12f7dac8-1bf1-4903-afe6-db733c1411d0', '80ecc642-1703-4ab1-b0bf-1f01135a8943', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('1becafa2-72ce-4ad0-b63a-b8e3b3c3ab44', 'a0975b2f-c402-4ba7-b504-6f1e8632ced5', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('2030565b-57db-4c39-8384-d825d1975e40', '4f2ac180-6e49-4976-a1c3-846d5390e99c', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('2456fc06-5048-49e0-ad54-fbbb1474cbe3', '4383612e-1ac2-4c5f-be1a-ad90575a3d27', '52dff508-d054-1df7-901f-c1d7cb851f6e', 3, 390.00, 1170.00, NULL),
	('32f37993-309c-4e0f-84ed-abef5e59adf5', 'b1fea719-d5d2-47a3-ac2e-7b24a6f2094e', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('3d516ece-addd-4950-9f62-bb6d6d94c38d', '4f2ac180-6e49-4976-a1c3-846d5390e99c', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('462ca9ee-c420-4cd6-90fb-8c7f05c04909', 'cbe6ebb6-6427-45fc-8a62-eee93b8f10c4', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('491843a4-04c8-44fc-a9a6-d5719c2768ca', 'cbe6ebb6-6427-45fc-8a62-eee93b8f10c4', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('561231a2-2e8a-4cd4-9574-87cd6c4eb38a', '80ecc642-1703-4ab1-b0bf-1f01135a8943', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('5f96b6af-8cbb-44c2-a318-41d719bf1be0', '652a7430-4b12-444d-a777-33abf35b8d90', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('62cd7622-7d2a-444d-8450-d3e5040996f8', '8177a6a4-8ece-4144-b8e0-913b54d773ca', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('638949d2-45a3-4626-9c54-80d3e85c5cca', '9896300e-e00c-44b0-9c0f-4bf59985c2c6', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('6d166d6c-c96b-4667-ae4b-32d18daa4a6f', 'ce31c2eb-70db-4fa1-82e7-b2a982c06322', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('98a747de-3e8d-4fe4-8dc8-40dcd2581606', 'a0975b2f-c402-4ba7-b504-6f1e8632ced5', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('9a0ae284-eadc-4038-8581-0445f802690c', '0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('9ce08187-1222-4bc1-a4e2-ae5bac19eab1', '9896300e-e00c-44b0-9c0f-4bf59985c2c6', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 30.00, 30.00, NULL),
	('b0c5e179-6307-4789-bc18-c447ab84ee62', '8177a6a4-8ece-4144-b8e0-913b54d773ca', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('c0309458-7b1b-42f7-8cf2-dcf1c3f40390', '0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', '52dff508-d054-1df7-901f-c1d7cb851f6e', 3, 390.00, 1170.00, NULL),
	('cad665d6-7857-43c4-b483-8aea0cac4f12', 'fffcbea7-30a1-4ee5-9bab-2485d88f744c', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('cc67926b-db9b-452a-b8bc-51f6ed39a549', '4383612e-1ac2-4c5f-be1a-ad90575a3d27', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 6, 30.00, 180.00, NULL),
	('d81d93c4-8b15-4489-91e0-2f97c0adc7c7', '0f00be20-41bb-4f4e-aa67-bb5ac1f2fca3', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 2, 30.00, 60.00, NULL),
	('db429567-c5b6-4a18-85d0-294b557f99b9', '356a81b2-bd4d-43a9-89e6-5d87f9654a2a', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('ea3bda26-6fa1-4ade-874e-cf83ae4a8b64', '1b174bf4-f401-4e35-81ef-991142ee26cb', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('eadb8181-2774-4200-a0ce-314aa47ab921', 'ce31c2eb-70db-4fa1-82e7-b2a982c06322', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 1, 3.00, 3.00, NULL),
	('f43736d5-15a0-4eaa-957f-b8f9a9ae04e7', 'b1fea719-d5d2-47a3-ac2e-7b24a6f2094e', '52dff508-d054-1df7-901f-c1d7cb851f6e', 1, 390.00, 390.00, NULL),
	('fabc2e78-8cae-42f7-b2ad-9a5a8b5cb4c3', '54e41ed6-07de-4748-852f-04bdbdc18ab6', '6a38817a-1b9e-4987-a57a-eb7d371d5790', 10, 30.00, 300.00, NULL);

-- Dumping structure for table defaultdb.order_promotions
CREATE TABLE IF NOT EXISTS `order_promotions` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `promotion_id` char(36) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `promotion_id` (`promotion_id`),
  CONSTRAINT `order_promotions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_promotions_ibfk_2` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.order_promotions: ~0 rows (approximately)
INSERT INTO `order_promotions` (`id`, `order_id`, `promotion_id`, `discount_amount`, `applied_at`) VALUES
	('e2f2de66-7503-4db7-be70-ba60128064e1', '4383612e-1ac2-4c5f-be1a-ad90575a3d27', '922b0cac-b0be-d225-0f68-3f6bf874b8f0', 162.00, '2026-10-03 11:24:58');

-- Dumping structure for table defaultdb.order_status_history
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `status` varchar(30) NOT NULL,
  `changed_by_staff_id` char(36) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_status_history_order_idx` (`order_id`),
  KEY `changed_by_staff_id` (`changed_by_staff_id`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`changed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.order_status_history: ~0 rows (approximately)

-- Dumping structure for table defaultdb.order_voids
CREATE TABLE IF NOT EXISTS `order_voids` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `requested_by_staff_id` char(36) DEFAULT NULL,
  `approved_by_staff_id` char(36) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text,
  PRIMARY KEY (`id`),
  KEY `order_voids_order_idx` (`order_id`),
  KEY `requested_by_staff_id` (`requested_by_staff_id`),
  KEY `approved_by_staff_id` (`approved_by_staff_id`),
  CONSTRAINT `order_voids_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_voids_ibfk_2` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_voids_ibfk_3` FOREIGN KEY (`approved_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.order_voids: ~1 rows (approximately)
INSERT INTO `order_voids` (`id`, `order_id`, `requested_by_staff_id`, `approved_by_staff_id`, `reason`, `status`, `requested_at`, `resolved_at`, `resolution_notes`) VALUES
	('8528d8e0-b10e-81fd-f720-dfbb49aac691', '4f2ac180-6e49-4976-a1c3-846d5390e99c', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', 'dsfsd', 'approved', '2026-10-05 08:38:38', '2026-10-05 16:48:05', 'kjl');

-- Dumping structure for table defaultdb.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_type` varchar(16) NOT NULL,
  `account_id` char(36) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash_unique` (`token_hash`),
  KEY `password_reset_account_idx` (`account_type`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.password_reset_tokens: ~0 rows (approximately)

-- Dumping structure for table defaultdb.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `receipt_number` varchar(30) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','gcash','maya','card','other') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `processed_by_staff_id` char(36) NOT NULL,
  `paid_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `payments_order_idx` (`order_id`),
  KEY `processed_by_staff_id` (`processed_by_staff_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.payments: ~10 rows (approximately)
INSERT INTO `payments` (`id`, `order_id`, `receipt_number`, `amount_paid`, `payment_method`, `reference_number`, `processed_by_staff_id`, `paid_at`) VALUES
	('0a730a7a-2555-4646-b972-a9ded93269b0', '0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', 'RCT-261003121049-805B', 1200.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 04:10:49'),
	('3245303d-4e46-4f53-af69-96b06360d6e8', 'cbe6ebb6-6427-45fc-8a62-eee93b8f10c4', 'RCT-261005160304-3211', 1000.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-05 08:03:01'),
	('4662dfc7-9522-4628-b578-6baf1a9d20c5', '0f79c7e7-4d18-4ab7-9e9d-602bc13c501c', 'RCT-261003121101-E23A', 1200.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 04:11:01'),
	('56833d9e-d504-4c5f-92da-2a2695f76bcc', '80ecc642-1703-4ab1-b0bf-1f01135a8943', 'RCT-261004100254-74C0', 420.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-04 02:02:54'),
	('63d183ba-63d5-49b7-a238-a4d22a1a3856', 'a0975b2f-c402-4ba7-b504-6f1e8632ced5', 'RCT-261003135125-A894', 420.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 05:51:25'),
	('88f348ef-b52f-4c4e-a09a-5250ed6fec33', '9896300e-e00c-44b0-9c0f-4bf59985c2c6', 'RCT-261004101444-3A34', 420.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-04 02:14:45'),
	('bf157160-baf6-445d-8b55-6a4f4fb51d6d', '80ecc642-1703-4ab1-b0bf-1f01135a8943', 'RCT-261004100309-E2BA', 420.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-04 02:03:09'),
	('c18cb269-b843-4973-88c5-dee099911c30', '0f00be20-41bb-4f4e-aa67-bb5ac1f2fca3', 'RCT-261003132226-38CC', 450.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 05:22:27'),
	('d01f0165-a564-4fe7-8c1c-b2f38a657d9a', 'ce31c2eb-70db-4fa1-82e7-b2a982c06322', 'RCT-261002131248-F799', 393.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-02 05:12:48'),
	('d5714ddd-8df2-496d-be06-088dfd375c11', '1b174bf4-f401-4e35-81ef-991142ee26cb', 'RCT-261002212436-052F', 390.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-02 13:24:37'),
	('e812b7ad-7212-4d38-9eda-6625ada32c26', '54e41ed6-07de-4748-852f-04bdbdc18ab6', 'RCT-261003133435-9846', 1080.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 05:34:35'),
	('e93235de-bd8c-4eda-924d-afae68600b82', '9896300e-e00c-44b0-9c0f-4bf59985c2c6', 'RCT-261004101424-F67D', 420.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-04 02:14:25'),
	('eb15c433-906f-48a0-94db-c09d32c295ea', 'fffcbea7-30a1-4ee5-9bab-2485d88f744c', 'RCT-261003130724-42F4', 390.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-03 05:07:24'),
	('f1f7173f-70ab-46da-9730-6abb73378a13', '4f2ac180-6e49-4976-a1c3-846d5390e99c', 'RCT-261005160921-E8E3', 1000.00, 'cash', NULL, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2026-10-05 08:09:19');

-- Dumping structure for table defaultdb.payroll_deductions
CREATE TABLE IF NOT EXISTS `payroll_deductions` (
  `id` char(36) NOT NULL,
  `payroll_record_id` char(36) NOT NULL,
  `deduction_type_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_record_id` (`payroll_record_id`),
  KEY `deduction_type_id` (`deduction_type_id`),
  CONSTRAINT `payroll_deductions_ibfk_1` FOREIGN KEY (`payroll_record_id`) REFERENCES `payroll_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payroll_deductions_ibfk_2` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.payroll_deductions: ~0 rows (approximately)

-- Dumping structure for table defaultdb.payroll_periods
CREATE TABLE IF NOT EXISTS `payroll_periods` (
  `id` char(36) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('open','processing','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.payroll_periods: ~0 rows (approximately)

-- Dumping structure for table defaultdb.payroll_records
CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `payroll_period_id` char(36) NOT NULL,
  `gross_pay` decimal(10,2) NOT NULL,
  `total_deductions` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(10,2) NOT NULL,
  `processed_by_staff_id` char(36) NOT NULL,
  `processed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payroll_rec_emp_period_idx` (`employee_id`,`payroll_period_id`),
  KEY `payroll_period_id` (`payroll_period_id`),
  KEY `processed_by_staff_id` (`processed_by_staff_id`),
  CONSTRAINT `payroll_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payroll_records_ibfk_2` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payroll_records_ibfk_3` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.payroll_records: ~0 rows (approximately)

-- Dumping structure for table defaultdb.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.permissions: ~23 rows (approximately)
INSERT INTO `permissions` (`id`, `code`, `module`, `description`) VALUES
	('00000000-0000-4000-8000-000000000001', 'orders:create', 'orders', 'Take counter orders and dine-in table requests'),
	('00000000-0000-4000-8000-000000000002', 'orders:view', 'orders', 'Access live order queues and status boards'),
	('00000000-0000-4000-8000-000000000003', 'orders:settle_payment', 'orders', 'Collect cash, card, and GCash payments'),
	('00000000-0000-4000-8000-000000000004', 'orders:reprint_receipt', 'orders', 'Reprint customer receipts and order stubs'),
	('00000000-0000-4000-8000-000000000005', 'voids:approve', 'voids', 'Authorize item cancellations and whole order refunds'),
	('00000000-0000-4000-8000-000000000006', 'discounts:senior_pwd', 'voids', 'Apply statutory Senior and PWD discounts'),
	('00000000-0000-4000-8000-000000000007', 'discounts:custom', 'voids', 'Apply promotional or manager price overrides'),
	('00000000-0000-4000-8000-000000000008', 'menu:view', 'menu', 'Browse food and beverage offerings'),
	('00000000-0000-4000-8000-000000000009', 'menu:manage', 'menu', 'Create and edit dishes, pricing, and descriptions'),
	('00000000-0000-4000-8000-000000000010', 'menu:toggle_availability', 'menu', 'Mark menu items as unavailable'),
	('00000000-0000-4000-8000-000000000011', 'inventory:view', 'inventory', 'Inspect ingredient inventory and reorder alerts'),
	('00000000-0000-4000-8000-000000000012', 'inventory:stock_in', 'inventory', 'Record deliveries and warehouse restocks'),
	('00000000-0000-4000-8000-000000000013', 'inventory:waste', 'inventory', 'Record spoilage and expired supplies'),
	('00000000-0000-4000-8000-000000000014', 'reports:sales_view', 'reports', 'Access revenue and sales trends'),
	('00000000-0000-4000-8000-000000000015', 'reports:expenses_manage', 'reports', 'Manage operational expenses'),
	('00000000-0000-4000-8000-000000000016', 'reports:export', 'reports', 'Export financial reports'),
	('00000000-0000-4000-8000-000000000017', 'employees:view', 'employees', 'View staff profiles'),
	('00000000-0000-4000-8000-000000000018', 'employees:manage', 'employees', 'Hire and manage employee profiles'),
	('00000000-0000-4000-8000-000000000019', 'employees:rfid_attendance', 'employees', 'Monitor RFID attendance'),
	('00000000-0000-4000-8000-000000000020', 'employees:payroll', 'employees', 'Process payroll and deductions'),
	('00000000-0000-4000-8000-000000000021', 'settings:view', 'settings', 'View store and printer settings'),
	('00000000-0000-4000-8000-000000000022', 'settings:manage', 'settings', 'Configure POS and hardware'),
	('00000000-0000-4000-8000-000000000023', 'settings:rbac', 'settings', 'Manage roles and permissions'),
	('00000000-0000-4000-8000-000000000024', 'inventory:manage', 'inventory', 'Create and edit inventory items, categories, and stock counts');

-- Dumping structure for table defaultdb.printers
CREATE TABLE IF NOT EXISTS `printers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` enum('kitchen','counter') NOT NULL,
  `connection_type` enum('network','usb','bluetooth') NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.printers: ~0 rows (approximately)
INSERT INTO `printers` (`id`, `name`, `location`, `connection_type`, `ip_address`, `is_active`) VALUES
	('d57ca8e7-3e7c-6df6-009f-29fdfcc71aa3', 'dadas', 'kitchen', 'network', '192.168.1.200', 1);

-- Dumping structure for table defaultdb.promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `promo_type` enum('percentage','fixed_amount','buy_x_get_y') NOT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `min_spend` decimal(10,2) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `usage_limit` int unsigned DEFAULT NULL,
  `usage_count` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.promotions: ~0 rows (approximately)
INSERT INTO `promotions` (`id`, `name`, `description`, `promo_type`, `discount_value`, `min_spend`, `start_date`, `end_date`, `usage_limit`, `usage_count`, `is_active`, `created_by_staff_id`, `created_at`) VALUES
	('922b0cac-b0be-d225-0f68-3f6bf874b8f0', 'Friday Specials', 'Come and Dine in with us with Friday Specials', 'percentage', 12.00, 500.00, '2026-09-29', '2026-10-29', NULL, 1, 1, NULL, '2026-09-29 05:03:03');

-- Dumping structure for table defaultdb.promotion_items
CREATE TABLE IF NOT EXISTS `promotion_items` (
  `promotion_id` char(36) NOT NULL,
  `menu_item_id` char(36) NOT NULL,
  PRIMARY KEY (`promotion_id`,`menu_item_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `promotion_items_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `promotion_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.promotion_items: ~0 rows (approximately)

-- Dumping structure for table defaultdb.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `jti` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id_idx` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.refresh_tokens: ~21 rows (approximately)
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `jti`) VALUES
	(31, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '1b4fc43ee43145fe8ab18f5143a467eb0d76c3665eb1a172ff379aabdb6d15bf', '2026-10-07 15:07:25', 'e497fe6e71ce5b2d62c843b4423e4b1a'),
	(32, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '1486be1fa533a1e99397894f0c48d9032804cca0d60105ba168193924d9fdc7d', '2026-10-07 15:07:25', 'edb16c0b363f9a25a6f5bfbee84ad100'),
	(33, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '5d9140f6522b92a5e9a05f1feaced6c91dc1eb45931543a009bb138b820640d5', '2026-10-07 15:07:25', 'eb496e88ed3675df77101a4e9df69ec7'),
	(36, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '583ca681151b455e3818a88ba1d05407056b587fb532fa6e780f402c312e0650', '2026-10-07 16:04:33', '2c0db887a8b4b4cd4df707c17d59e8da'),
	(37, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '994804612778f09fb816956eb3887ea7a5949335170913b25df0a5fd85592b9c', '2026-10-07 16:04:33', '149ffe27815273cc93bea1d9c20fb38c'),
	(38, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '9d60ac0371bbc33f6e5797c2bd854fdfd970d01a2f0c283e81e337207be87587', '2026-10-07 16:04:33', '7522c62887d460c9c5fb472b6212a065'),
	(39, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', 'c3b356ce18de121c7468fb0c067baaad5e3f105ca07b99ea59e5dc5e4b8b3f83', '2026-10-07 16:04:33', '07aa47ae813dbbd79ba169fa04b46d6e'),
	(40, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '9ad1d47caee54c5c1e6d897f5bf663b8933bce7c669248f68407ef6c34bd6df9', '2026-10-09 11:25:46', 'd0ec36c107d30258ad543ccfcb5f899f'),
	(50, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '3ab30c5f60954604262a390c4431bd7789e0cec399c1327792e8083088456324', '2026-10-09 13:47:09', '6d7ea88e1fd25434f1633273f0493ca4'),
	(53, 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '2c7431233fe64b44b9869c3c1fc6771749d796f224227f47a01f386034ea9735', '2026-10-09 14:12:33', '2d9555cb673b4bd53f859ad29eb1224a'),
	(54, 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '26a891e8c9cce64630c61b6a90291e0bd3bf2f4cfde5bc77f9cbb8c9bda84af8', '2026-10-09 14:13:19', 'f864df8ac45e27f8de4a18378cbfe839'),
	(55, 'fd44ec60-5aca-b3f4-90b4-80aa32332367', 'dfd2e6391be932900bcd9d73cdfaf111c26db9306ccb2ee359806240d8dcd1aa', '2026-10-09 16:26:33', '85e05c99987adfa2982ebea1d6aa8bde'),
	(58, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '2ec4f7c79f7baa8b198c7c69d8080929781f8b98afcf06500a85d3d853ec8f3c', '2026-10-09 17:03:48', '62713ee4ae660cf00e1d293b2c63a0fe'),
	(59, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', 'dfca7bedc176e318d678b3853311ea85f532372d4ef823862d77302ea79afb27', '2026-10-09 17:05:03', '60df348e8aead98471edfe03646ca945'),
	(60, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', 'b8a30cadd48f829616537ab59b5db78a9e3768fcf865492c86081ae548cd8ea1', '2026-10-09 17:41:56', '1841a80c710e59c0898de9b034b32b7f'),
	(83, '8c9801c4-5364-504b-305b-4b82794cde66', '62ddaa238f2dd4a35044660b36be02877cf8db8364ad3e8ef34a22ab15eaf8ce', '2026-10-10 08:03:52', 'a95e2981a93aa364098859c5b4247d6d'),
	(86, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '8b8f6e5de0638b2cad0d7f5184d9a7aec2fad215c551657d958b1614fcaf0a89', '2026-10-10 12:08:19', 'd09beb4ad71cbfe4efd7a89d8eb6b43c'),
	(105, '5632331d-601c-1d63-0ecb-1e1702a9ab42', 'f49ccabc69aa11939a6555ac99d9f70dd2bec426722be49e99b445fdf11d992e', '2026-10-10 19:20:47', '26efad5af07d8b90a75cb634aec86163'),
	(106, '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'f67645691b785595a02c5ce489dcff11aef59aa44ca5324d46f8af5b427ec7fb', '2026-10-10 21:00:05', '7d2e085c54b26643c5f2fbf41b926e06'),
	(127, 'e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', 'ee5bf621b4818f6dd1f34239c5a56d2091e205f1fbfb6e21c0e6a80af7b68299', '2026-10-14 11:48:05', 'f30a378a7611810518a681a62c29d92d'),
	(128, 'fd44ec60-5aca-b3f4-90b4-80aa32332367', '4ae9ac0de8056664e28e366dc19d6dc98eee0626f3e7c8e6d98358713930f32b', '2026-10-14 18:47:36', '76c099fd35a4efcdb3a5ce2d6d0de6a1');

-- Dumping structure for table defaultdb.reservations
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `table_id` char(36) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `number_of_guests` int unsigned NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
  `notes` text,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reservations_date_time_idx` (`reservation_date`,`reservation_time`),
  KEY `customer_id` (`customer_id`),
  KEY `table_id` (`table_id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.reservations: ~2 rows (approximately)
INSERT INTO `reservations` (`id`, `customer_id`, `customer_name`, `contact_number`, `email`, `table_id`, `reservation_date`, `reservation_time`, `number_of_guests`, `status`, `notes`, `created_by_staff_id`, `created_at`) VALUES
	('533019c2-5096-6db2-9096-fa78e2159460', '00587de7-e1f1-66f6-78fb-151b1d2db3b7', 'Jhon Michael Riel', '09513657032', 'rieljohnmichael026@gmail.com', 'cbe77fc8-2959-e998-bf72-41da2aa8a496', '2026-10-05', '00:11:00', 2, 'completed', 'for lambingan only', NULL, '2026-10-03 05:11:31'),
	('b9b2b468-087e-3b33-3918-47fef18ce1c0', NULL, 'Resty Gonzales', '09551834091', 'restygonzales749@gmail.com', NULL, '2026-10-02', '18:00:00', 2, 'completed', NULL, NULL, '2026-10-01 22:45:47');

-- Dumping structure for table defaultdb.restaurant_tables
CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `id` char(36) NOT NULL,
  `table_number` varchar(20) NOT NULL,
  `capacity` int unsigned NOT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `status` enum('available','occupied','reserved') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `occupied_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_number` (`table_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.restaurant_tables: ~8 rows (approximately)
INSERT INTO `restaurant_tables` (`id`, `table_number`, `capacity`, `qr_code_url`, `status`, `created_at`, `occupied_at`) VALUES
	('0486c1eb-8aef-28e4-986d-c5f680f631ce', 'Table 7', 2, NULL, 'available', '2026-10-03 06:15:06', NULL),
	('416c6236-abd8-4552-ba0c-665b777d27c0', 'Table 6', 2, NULL, 'available', '2026-10-03 06:14:53', NULL),
	('7e55cdc8-d4c1-893b-75ef-50b5ec58104a', 'Table 9', 2, NULL, 'available', '2026-10-03 06:15:32', NULL),
	('9c3a3c57-7220-43cc-0326-227d516b6e48', 'Table 2', 2, NULL, 'available', '2026-10-03 06:13:25', NULL),
	('cbe77fc8-2959-e998-bf72-41da2aa8a496', 'Table 1', 2, NULL, 'available', '2026-10-01 07:48:04', NULL),
	('de4f97db-db11-4a14-9052-41593064a38b', 'Table 4', 2, NULL, 'available', '2026-10-03 06:13:44', NULL),
	('e8b8c579-02e7-43ff-d108-b8c9aead91b0', 'Table 5', 2, NULL, 'available', '2026-10-03 06:14:39', NULL),
	('eb9e1257-cbb8-dcd1-c453-145b447186ba', 'Table 3', 2, NULL, 'available', '2026-10-03 06:13:34', NULL),
	('f06ca9f1-2310-f529-484a-aea308fcdd1a', 'Table 10', 2, NULL, 'available', '2026-10-06 01:45:52', NULL),
	('f72f47c7-ecca-94a5-8a71-560aaf66d348', 'Table 8', 2, NULL, 'available', '2026-10-03 06:15:19', NULL);

-- Dumping structure for table defaultdb.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.roles: ~0 rows (approximately)
INSERT INTO `roles` (`id`, `name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
	('00000000-0000-4000-8000-000000000100', 'Staff', 'Default role for restaurant employees.', 1, '2026-09-29 01:58:19', NULL),
	('2065125d-f889-40cc-9577-5f94eb1447e0', 'Administrator', 'Built-in PRIME administrator role', 1, '2026-09-29 01:59:35', '2026-09-29 01:59:35');

-- Dumping structure for table defaultdb.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.role_permissions: ~24 rows (approximately)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000001'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000002'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000003'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000004'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000005'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000006'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000007'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000008'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000009'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000010'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000011'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000012'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000013'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000014'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000015'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000016'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000017'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000018'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000019'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000020'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000021'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000022'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000023'),
	('2065125d-f889-40cc-9577-5f94eb1447e0', '00000000-0000-4000-8000-000000000024');

-- Dumping structure for table defaultdb.system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` char(36) NOT NULL,
  `restaurant_name` varchar(150) NOT NULL DEFAULT 'PRIME Roast & Grill',
  `branch_name` varchar(100) NOT NULL DEFAULT 'Main Branch - Manila',
  `contact_number` varchar(50) NOT NULL DEFAULT '+63 917 123 4567',
  `email` varchar(100) NOT NULL DEFAULT 'contact@primerestaurant.ph',
  `address` text NOT NULL,
  `tin_number` varchar(50) DEFAULT NULL,
  `bir_min` varchar(50) DEFAULT NULL,
  `currency_symbol` varchar(10) NOT NULL DEFAULT '₱',
  `currency_code` varchar(10) NOT NULL DEFAULT 'PHP',
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Manila',
  `vat_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '12.00',
  `vat_inclusive` tinyint(1) NOT NULL DEFAULT '1',
  `service_charge_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `service_charge_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `senior_pwd_discount_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `order_number_prefix` varchar(20) NOT NULL DEFAULT 'ORD-',
  `auto_accept_qr_orders` tinyint(1) NOT NULL DEFAULT '0',
  `require_table_selection` tinyint(1) NOT NULL DEFAULT '1',
  `manager_approval_for_voids` tinyint(1) NOT NULL DEFAULT '1',
  `low_stock_threshold_alert` int unsigned NOT NULL DEFAULT '10',
  `receipt_header` text,
  `receipt_footer` text,
  `print_receipt_auto` tinyint(1) NOT NULL DEFAULT '1',
  `print_kot_auto` tinyint(1) NOT NULL DEFAULT '1',
  `show_wifi_on_receipt` tinyint(1) NOT NULL DEFAULT '1',
  `wifi_ssid` varchar(100) DEFAULT NULL,
  `wifi_password` varchar(100) DEFAULT NULL,
  `opening_time` varchar(10) NOT NULL DEFAULT '08:00',
  `closing_time` varchar(10) NOT NULL DEFAULT '22:00',
  `cash_drawer_opening_balance_required` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT NULL,
  `gcash_qr_image` longtext,
  `maya_qr_image` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.system_settings: ~1 rows (approximately)
INSERT INTO `system_settings` (`id`, `restaurant_name`, `branch_name`, `contact_number`, `email`, `address`, `tin_number`, `bir_min`, `currency_symbol`, `currency_code`, `timezone`, `vat_enabled`, `vat_rate`, `vat_inclusive`, `service_charge_enabled`, `service_charge_rate`, `senior_pwd_discount_enabled`, `order_number_prefix`, `auto_accept_qr_orders`, `require_table_selection`, `manager_approval_for_voids`, `low_stock_threshold_alert`, `receipt_header`, `receipt_footer`, `print_receipt_auto`, `print_kot_auto`, `show_wifi_on_receipt`, `wifi_ssid`, `wifi_password`, `opening_time`, `closing_time`, `cash_drawer_opening_balance_required`, `updated_at`, `gcash_qr_image`, `maya_qr_image`) VALUES
	('4573a459-c78c-e7bb-0c20-a77814294209', 'Pards Litson Manok At Tsibugan', 'Main Branch - Bayanan I, Calapan City', '+63 917 123 4567', 'pards@gmail.com', 'Bayanan I, Calapan City, Oriental Minodror', NULL, NULL, '₱', 'PHP', 'Asia/Manila', 1, 12.00, 1, 0, 5.00, 1, 'ORD-', 0, 1, 1, 10, NULL, 'Thank you for dining with us!!!', 1, 1, 1, NULL, NULL, '08:00', '22:00', 1, NULL, 'data:image/png;base64,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', '');

-- Dumping structure for table defaultdb.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `users_role_idx` (`role_id`),
  KEY `users_email_idx` (`email`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table defaultdb.users: ~1 rows (approximately)
INSERT INTO `users` (`id`, `role_id`, `email`, `password`, `name`, `contact_number`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
	('e0ffff79-85d3-45ea-8f1b-8acf38cd0a14', '00000000-0000-4000-8000-000000000100', 'admin@gmail.com', '$2y$12$m2rABzqfv09NhS9RFFF0Iefg8qKapbmeFvourp5Rli1lfpzD7xk7S', 'Resty Gonzales', NULL, 1, '2026-10-07 11:48:06', '2026-09-29 01:59:36', '2026-09-29 01:59:36');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
