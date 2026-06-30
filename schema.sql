-- ═══════════════════════════════════════════════════════════
--  AAAS BAKERY — MySQL Schema
--  Run this once to set up the database.
--  mysql -u root -p < schema.sql
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS aaas_bakery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aaas_bakery;

-- ── Admin users (supports multiple admins) ──────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(60)     NOT NULL UNIQUE,
  password    VARCHAR(255)    NOT NULL,          -- bcrypt hash
  display_name VARCHAR(100)   DEFAULT NULL,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  last_login  TIMESTAMP       DEFAULT NULL
);

-- ── Cake flavours ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flavours (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)    NOT NULL UNIQUE,
  emoji       VARCHAR(10)     DEFAULT '🎂',
  available   TINYINT(1)      DEFAULT 1,         -- 0 = hidden / out of stock
  sort_order  INT             DEFAULT 0,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ── Gallery photos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  filename    VARCHAR(512)    NOT NULL,          -- local file or full URL
  label       VARCHAR(255)    NOT NULL,
  category    ENUM('birthday','anniversary','theme','special') DEFAULT 'birthday',
  span_class  VARCHAR(10)     DEFAULT 'g1',      -- bento grid slot
  sort_order  INT             DEFAULT 0,
  visible     TINYINT(1)      DEFAULT 1,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ── Customer orders ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  order_ref       VARCHAR(20)     NOT NULL UNIQUE,  -- e.g. ORD-20240601-0001
  customer_name   VARCHAR(120)    NOT NULL,
  customer_phone  VARCHAR(20)     NOT NULL,
  customer_email  VARCHAR(160)    DEFAULT NULL,
  flavour         VARCHAR(100)    NOT NULL,
  weight_kg       DECIMAL(4,2)    DEFAULT NULL,
  shape           VARCHAR(60)     DEFAULT NULL,     -- round, square, heart, etc.
  tier_count      TINYINT         DEFAULT 1,
  delivery_date   DATE            NOT NULL,
  delivery_time   TIME            DEFAULT NULL,
  delivery_type   ENUM('pickup','delivery') DEFAULT 'pickup',
  delivery_address TEXT           DEFAULT NULL,
  message_on_cake VARCHAR(255)    DEFAULT NULL,
  special_notes   TEXT            DEFAULT NULL,
  photo_ref       VARCHAR(512)    DEFAULT NULL,     -- reference image URL/filename
  -- pricing
  quoted_price    DECIMAL(10,2)   DEFAULT NULL,
  advance_paid    DECIMAL(10,2)   DEFAULT 0.00,
  balance_due     DECIMAL(10,2)   GENERATED ALWAYS AS (
                    IFNULL(quoted_price, 0) - IFNULL(advance_paid, 0)
                  ) STORED,
  -- payment
  razorpay_payment_id  VARCHAR(100)  DEFAULT NULL,
  razorpay_order_id    VARCHAR(100)  DEFAULT NULL,
  payment_status  ENUM('pending','partial','paid','refunded') DEFAULT 'pending',
  -- status
  status          ENUM('new','confirmed','baking','ready','delivered','cancelled') DEFAULT 'new',
  internal_notes  TEXT            DEFAULT NULL,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_delivery_date (delivery_date),
  INDEX idx_status        (status),
  INDEX idx_phone         (customer_phone)
);

-- ── Payments ledger ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED    NOT NULL,
  razorpay_payment_id VARCHAR(100) NOT NULL,
  amount          DECIMAL(10,2)  NOT NULL,
  currency        CHAR(3)        DEFAULT 'INR',
  method          VARCHAR(40)    DEFAULT NULL,    -- upi, card, netbanking, etc.
  status          ENUM('captured','failed','refunded') DEFAULT 'captured',
  captured_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
);

-- ── Testimonials / Reviews ───────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  customer_name   VARCHAR(120)    NOT NULL,
  order_id        INT UNSIGNED    DEFAULT NULL,
  rating          TINYINT         DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message         TEXT            NOT NULL,
  visible         TINYINT(1)      DEFAULT 1,      -- admin toggles visibility
  featured        TINYINT(1)      DEFAULT 0,      -- shown on homepage slider
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ── Site settings (key-value config) ────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  `key`       VARCHAR(80)     PRIMARY KEY,
  `value`     TEXT            DEFAULT NULL,
  updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════

-- Default admin (password: aaas2024  — CHANGE THIS IMMEDIATELY)
INSERT IGNORE INTO admins (username, password, display_name) VALUES
  ('admin', '$2a$12$K8GpH1QNzL2mX3vR7tY9uO4wE6fA0bC5dI8jM2nP3qS1hT7lV4xZe', 'AAAS Admin');
-- Note: the hash above = 'aaas2024'. Run  node -e "const b=require('bcryptjs');b.hash('yournewpass',12).then(console.log)"  to generate a new one.

-- Default flavours
INSERT IGNORE INTO flavours (name, emoji, available, sort_order) VALUES
  ('Vanilla',             '🍦', 1, 1),
  ('Chocolate',           '🍫', 1, 2),
  ('Red Velvet',          '❤️',  1, 3),
  ('Butterscotch',        '🧈', 1, 4),
  ('Black Forest',        '🍒', 1, 5),
  ('Strawberry',          '🍓', 1, 6),
  ('Pineapple',           '🍍', 1, 7),
  ('Oreo',                '🍪', 1, 8),
  ('Lotus Biscoff',       '🌸', 1, 9),
  ('Mango',               '🥭', 1, 10),
  ('Blueberry',           '🫐', 1, 11),
  ('Taro',                '💜', 0, 12),
  ('Other (mention below)','✏️', 1, 99);

-- Default gallery
INSERT IGNORE INTO gallery (filename, label, category, span_class, sort_order) VALUES
  ('WhatsApp_Image_2026-04-03_at_18_21_36__1_.jpeg', 'Birthday Ombre Cake',    'birthday',    'g1', 1),
  ('WhatsApp_Image_2026-04-03_at_18_21_36__2_.jpeg', 'Melody Candy Bouquet',   'special',     'g2', 2),
  ('WhatsApp_Image_2026-04-03_at_18_21_36.jpeg',     'Calendar Birthday Cake', 'birthday',    'g3', 3),
  ('WhatsApp_Image_2026-04-03_at_18_21_37__1_.jpeg', 'Minion Theme Cake',      'theme',       'g4', 4),
  ('WhatsApp_Image_2026-04-03_at_18_21_37__2_.jpeg', 'Lotus & Oreo Cheesecake','special',     'g5', 5),
  ('WhatsApp_Image_2026-04-03_at_18_21_37.jpeg',     'Anniversary Love Cake',  'anniversary', 'g6', 6),
  ('WhatsApp_Image_2026-04-03_at_18_21_38__1_.jpeg', '3D Car Cake',            'theme',       'g7', 7),
  ('WhatsApp_Image_2026-04-03_at_18_21_38.jpeg',     'Heart Birthday Cake',    'birthday',    'g8', 8);

-- Default settings
INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('razorpay_key_id',     ''),
  ('razorpay_key_secret', ''),
  ('business_name',       'AAAS Bakery'),
  ('contact_phone',       ''),
  ('contact_email',       ''),
  ('instagram_handle',    'aaas_bakery_'),
  ('min_order_advance_pct','50'),
  ('currency',            'INR');
