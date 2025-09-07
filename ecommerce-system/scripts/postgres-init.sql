-- PostgreSQL 初始化腳本
-- 創建電商系統交易資料庫

-- 設置時區
SET timezone = 'Asia/Taipei';

-- 創建擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 創建自定義類型
CREATE TYPE order_status AS ENUM (
    'PENDING',
    'PAID', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE payment_method AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'DIGITAL_WALLET',
    'CASH_ON_DELIVERY'
);

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'MERCHANT',
    'STAFF',
    'CUSTOMER',
    'GUEST'
);

CREATE TYPE membership_level AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'VIP'
);

-- 設置搜索路徑
SET search_path TO public;
