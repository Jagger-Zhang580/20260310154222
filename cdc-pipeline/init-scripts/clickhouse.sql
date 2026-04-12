-- ============================================================
--  ClickHouse - OLAP 分析目标表
--  作为 CDC Sink 端，接收全量+增量数据
-- ============================================================

CREATE DATABASE IF NOT EXISTS analytics;

-- 电商订单分析宽表 (ReplacingMergeTree 去重)
CREATE TABLE IF NOT EXISTS analytics.order_analytics
(
    order_id      UInt64,
    user_id       UInt64,
    username      Nullable(String),
    product_id    Nullable(UInt64),
    product_name  Nullable(String),
    category      Nullable(String),
    quantity      Nullable(UInt32),
    unit_price    Nullable(Decimal64(2)),
    total_amount  Decimal64(2),
    order_status  Nullable(String),
    payment_method Nullable(String),
    order_date    Nullable(DateTime),
    created_at    DateTime DEFAULT now(),
    updated_at    DateTime DEFAULT now(),
    _version      UInt64 DEFAULT 1
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY (order_id, order_date)
PARTITION BY toYYYYMM(order_date);

-- 采购分析表
CREATE TABLE IF NOT EXISTS analytics.purchase_analytics
(
    po_id         UInt64,
    supplier_id   Nullable(UInt64),
    supplier_name Nullable(String),
    total_amount  Nullable(Decimal64(2)),
    status        Nullable(String),
    order_date    Nullable(Date),
    created_at    DateTime DEFAULT now(),
    _version      UInt64 DEFAULT 1
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY (po_id, order_date);

-- 物料视图 (用于实时监控)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.order_realtime
ENGINE = SummingMergeTree()
ORDER BY (order_date, category)
AS SELECT
    toDate(order_date) AS order_date,
    category,
    count() AS order_count,
    sum(total_amount) AS total_revenue
FROM analytics.order_analytics
WHERE order_status != 'cancelled'
GROUP BY order_date, category;
