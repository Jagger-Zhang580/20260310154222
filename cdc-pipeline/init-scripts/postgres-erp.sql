-- ============================================================
--  PostgreSQL ERP 系统 - 初始化脚本
--  CDC 前提: wal_level=logical, 创建 publication
-- ============================================================

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    city VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 采购订单
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    warehouse VARCHAR(50),
    quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    last_restock_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 财务凭证
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    voucher_no VARCHAR(30) UNIQUE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    booking_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO suppliers (name, contact_name, contact_phone, city) VALUES
('供应商A', '李经理', '021-12345678', '上海'),
('供应商B', '王经理', '010-87654321', '北京'),
('供应商C', '赵经理', '0755-11223344', '深圳');

INSERT INTO inventory (product_name, warehouse, quantity, unit_cost) VALUES
('芯片X100', '华东仓', 5000, 25.50),
('屏幕Y200', '华南仓', 3000, 180.00),
('电池Z300', '华北仓', 10000, 45.00);

-- 创建 CDC publication (PostgreSQL 逻辑复制)
CREATE PUBLICATION cdc_publication FOR ALL TABLES;

-- 创建 CDC 复制槽 (Debezium 会自动创建, 手动创建备用)
-- SELECT pg_create_logical_replication_slot('debezium_slot', 'pgoutput');

-- 授权
GRANT USAGE ON SCHEMA public TO cdc_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cdc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO cdc_user;
