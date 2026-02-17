-- Database Schema for PlantShield (Updated)
-- Import this file into MySQL

CREATE DATABASE IF NOT EXISTS `plant_disease`;
USE `plant_disease`;

-- --------------------------------------------------------
-- Users Table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `support_tickets`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `shop_inventory`;
DROP TABLE IF EXISTS `disease_product_link`;
DROP TABLE IF EXISTS `fertilizers`;
DROP TABLE IF EXISTS `disease_info`;
DROP TABLE IF EXISTS `predictions`;
DROP TABLE IF EXISTS `plant_images`;
DROP TABLE IF EXISTS `chatbot_logs`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hashed_password` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'farmer', -- farmer, shop_owner, admin
  `is_admin` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `upi_id` varchar(50) DEFAULT NULL, -- For Shop Owners
  `license_number` varchar(100) DEFAULT NULL, -- For Shop Owners
  `location` varchar(255) DEFAULT NULL, -- For Farmers/Shop Owners
  `crops_grown` text DEFAULT NULL, -- For Farmers (JSON or CST)
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping default admin
INSERT INTO `users` (`name`, `email`, `hashed_password`, `role`, `is_admin`) VALUES
('System Admin', 'admin@plant.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6LpoGG.3wcja.1rl', 'admin', 1);

-- --------------------------------------------------------
-- Plant Images & Predictions
-- --------------------------------------------------------
CREATE TABLE `plant_images` (
  `image_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `plant_images_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `predictions` (
  `prediction_id` int(11) NOT NULL AUTO_INCREMENT,
  `image_id` int(11) DEFAULT NULL,
  `disease_name` varchar(255) DEFAULT NULL,
  `confidence` float DEFAULT NULL,
  `is_healthy` tinyint(1) DEFAULT NULL,
  `severity` varchar(50) DEFAULT 'Low', -- Low, Medium, High
  PRIMARY KEY (`prediction_id`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `predictions_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `plant_images` (`image_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Disease Info
-- --------------------------------------------------------
CREATE TABLE `disease_info` (
  `disease_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `crop_name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `symptoms` text DEFAULT NULL,
  `treatment` text DEFAULT NULL,
  `preventive_measures` text DEFAULT NULL,
  PRIMARY KEY (`disease_id`),
  UNIQUE KEY `ix_disease_info_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `disease_info` (`name`, `crop_name`, `description`, `treatment`) VALUES
('Apple___Apple_scab', 'Apple', 'Fungal disease causing dull black lesions.', 'Apply Captan or Myclobutanil. Remove fallen leaves.'),
('Apple___Black_rot', 'Apple', 'Causes fruit rot and cankers.', 'Prune dead wood. Use copper fungicides.'),
('Tomato___Bacterial_spot', 'Tomato', 'Water-soaked spots on leaves.', 'Copper-based bactericides.'),
('Tomato___Early_blight', 'Tomato', 'Concentric rings on leaves.', 'Chlorothalonil or Copper fungicides.'),
('Tomato___Late_blight', 'Tomato', 'Rapidly expanding lesions.', 'Mancozeb or Chlorothalonil.'),
('Tomato___Leaf_Mold', 'Tomato', 'Pale green spots on leaves.', 'Improve air circulation. Fungicides.'),
('Tomato___Septoria_leaf_spot', 'Tomato', 'Circular spots with dark borders.', 'Remove infected leaves. Fungicides.'),
('Tomato___Target_Spot', 'Tomato', 'Brown lesions with rings.', 'Fungicides and reduce humidity.'),
('Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato', 'Viral disease transmitted by whiteflies.', 'Control whiteflies. Remove plants.'),
('Tomato___Tomato_mosaic_virus', 'Tomato', 'Mottling and mosaic patterns.', 'No cure. Remove plants.'),
('Potato___Early_blight', 'Potato', 'Target-like spots.', 'Fungicides, crop rotation.'),
('Potato___Late_blight', 'Potato', 'Serious blight causing rot.', 'Fungicides, resistant varieties.'),
('Corn___Common_rust', 'Corn', 'Reddish-brown pustules.', 'Fungicides and resistant hybrids.'),
('Corn___Northern_Leaf_Blight', 'Corn', 'Gray-green lesions.', 'Resistant hybrids.'),
('Grape___Black_rot', 'Grape', 'Affects fruit and leaves.', 'Fungicides and sanitation.'),
('Grape___Esca_(Black_Measles)', 'Grape', 'Tiger stripes on leaves.', 'Protect pruning wounds.'),
('Pepper__bell___Bacterial_spot', 'Pepper', 'Spots on leaves and fruit.', 'Copper sprays.');

-- --------------------------------------------------------
-- Fertilizers & Inventory
-- --------------------------------------------------------
CREATE TABLE `fertilizers` (
  `fertilizer_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT 'Fertilizer', -- Fertilizer, Pesticide
  `description` varchar(500) DEFAULT NULL,
  `usage_instructions` varchar(500) DEFAULT NULL,
  `safety_precautions` varchar(500) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`fertilizer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `fertilizers` (`name`, `type`, `category`, `description`, `usage_instructions`, `safety_precautions`) VALUES
('Neem Oil', 'Organic', 'Pesticide', 'Natural pesticide.', 'Mix 5ml/L water.', 'Avoid eye contact.'),
('Copper Fungicide', 'Chemical', 'Fungicide', 'Broad-spectrum fungicide.', 'Spray every 7 days.', 'Toxic to aquatic life.'),
('NPK 19-19-19', 'Chemical', 'Fertilizer', 'Balanced growth.', 'Apply to soil.', 'Wear gloves.'),
('Urea', 'Chemical', 'Fertilizer', 'Nitrogen rich.', 'Top dress on soil.', 'Do not overuse.');

-- Many-to-Many Linking Disease to Recommended Products
CREATE TABLE `disease_product_link` (
  `disease_id` int(11) NOT NULL,
  `fertilizer_id` int(11) NOT NULL,
  PRIMARY KEY (`disease_id`, `fertilizer_id`),
  FOREIGN KEY (`disease_id`) REFERENCES `disease_info` (`disease_id`) ON DELETE CASCADE,
  FOREIGN KEY (`fertilizer_id`) REFERENCES `fertilizers` (`fertilizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `shop_inventory` (
  `inventory_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL, -- Shop Owner
  `fertilizer_id` int(11) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `price` float DEFAULT 0,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `ix_inventory_user_item` (`user_id`, `fertilizer_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`fertilizer_id`) REFERENCES `fertilizers` (`fertilizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Orders & Payments
-- --------------------------------------------------------
CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `buyer_id` int(11) NOT NULL,
  `shop_owner_id` int(11) NOT NULL,
  `total_amount` float NOT NULL,
  `status` varchar(50) DEFAULT 'Pending', -- Pending, Shipped, Delivered, Cancelled
  `payment_status` varchar(50) DEFAULT 'Unpaid',
  `payment_method` varchar(50) DEFAULT 'UPI',
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`shop_owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `order_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_at_purchase` float NOT NULL,
  PRIMARY KEY (`item_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`inventory_id`) REFERENCES `shop_inventory` (`inventory_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Notifications & Support
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT 'Info', -- Alert, Order, Info
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `support_tickets` (
  `ticket_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Open', -- Open, Resolved
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `chatbot_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `query` text DEFAULT NULL,
  `response` text DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
