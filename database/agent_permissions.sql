-- ============================================================================
-- ROOTTECH TELEPHONY & CRM - AGENT PERMISSIONS TABLE SCHEMA
-- Database: root_cms
-- Target Table: agent_permissions
-- ============================================================================

USE `root_cms`;

CREATE TABLE IF NOT EXISTS `agent_permissions` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `agent_code` VARCHAR(50) NOT NULL,
  `allowed_modules` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`allowed_modules`)),
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_permissions_agent_code_unique` (`agent_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed Data for standard agents (Default Allowed Modules: Dashboard, Call, Agents, Recordings)
INSERT INTO `agent_permissions` (`agent_code`, `allowed_modules`)
VALUES 
  ('1001', '["dashboard","call","agents","recordings"]'),
  ('1002', '["dashboard","call","agents","recordings"]'),
  ('1003', '["dashboard","call","agents","recordings"]'),
  ('1004', '["dashboard","call","agents","recordings"]'),
  ('1005', '["dashboard","call","agents","recordings"]')
ON DUPLICATE KEY UPDATE `allowed_modules` = VALUES(`allowed_modules`);
