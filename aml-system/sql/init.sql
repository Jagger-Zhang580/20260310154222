-- ============================================
-- AML 反洗钱系统 - 数据库初始化
-- ============================================

-- 1. 客户信息表
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_type VARCHAR(20) NOT NULL,  -- PERSON / COMPANY
    id_number VARCHAR(50),
    nationality VARCHAR(50),
    risk_level VARCHAR(10) DEFAULT 'LOW',  -- LOW / MEDIUM / HIGH / CRITICAL
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    onboarding_date TIMESTAMP,
    country VARCHAR(50),
    city VARCHAR(50),
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    pep_flag BOOLEAN DEFAULT FALSE,  -- 政治公众人物
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 账户信息表
CREATE TABLE IF NOT EXISTS accounts (
    account_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) REFERENCES customers(customer_id),
    account_type VARCHAR(20),  -- SAVINGS / CHECKING / BUSINESS / OFFSHORE
    currency VARCHAR(3) DEFAULT 'CNY',
    open_date TIMESTAMP,
    close_date TIMESTAMP,
    status VARCHAR(10) DEFAULT 'ACTIVE',
    branch_code VARCHAR(20),
    balance DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 交易记录表（核心表）
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(32) REFERENCES accounts(account_id),
    counterparty_account_id VARCHAR(32),
    transaction_type VARCHAR(20),  -- TRANSFER / DEPOSIT / WITHDRAWAL / CASH / CROSS_BORDER
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    transaction_date TIMESTAMP NOT NULL,
    booking_date TIMESTAMP,
    channel VARCHAR(20),  -- ONLINE / ATM / COUNTER / MOBILE / SWIFT
    purpose VARCHAR(200),
    country_origin VARCHAR(50),
    country_destination VARCHAR(50),
    is_cross_border BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 可疑交易报告表
CREATE TABLE IF NOT EXISTS suspicious_reports (
    report_id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) REFERENCES transactions(transaction_id),
    scenario_type VARCHAR(50),  -- 触发的场景类型
    risk_score DECIMAL(5,2),    -- 0-100
    alert_level VARCHAR(10),    -- LOW / MEDIUM / HIGH / CRITICAL
    detection_method VARCHAR(30), -- RULE / ML / GRAPH / HYBRID
    description TEXT,
    status VARCHAR(20) DEFAULT 'NEW',  -- NEW / IN_REVIEW / CONFIRMED / DISMISSED
    assigned_analyst VARCHAR(50),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 规则引擎配置表
CREATE TABLE IF NOT EXISTS aml_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    scenario_type VARCHAR(50),
    rule_description TEXT,
    rule_condition JSONB,       -- 规则条件（JSON格式）
    risk_weight DECIMAL(3,2),   -- 权重
    is_active BOOLEAN DEFAULT TRUE,
    threshold_amount DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 客户风险评分表
CREATE TABLE IF NOT EXISTS customer_risk_scores (
    score_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(32) REFERENCES customers(customer_id),
    overall_score DECIMAL(5,2),
    rule_score DECIMAL(5,2),
    ml_score DECIMAL(5,2),
    graph_score DECIMAL(5,2),
    behavior_score DECIMAL(5,2),
    score_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20)
);

-- 7. 数据接入日志表（模拟 DataWorks 调度）
CREATE TABLE IF NOT EXISTS data_ingestion_logs (
    log_id SERIAL PRIMARY KEY,
    source_system VARCHAR(50),
    table_name VARCHAR(100),
    records_loaded INTEGER,
    load_status VARCHAR(20),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引加速查询
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_cross_border ON transactions(is_cross_border) WHERE is_cross_border = TRUE;
CREATE INDEX idx_suspicious_status ON suspicious_reports(status);
CREATE INDEX idx_suspicious_scenario ON suspicious_reports(scenario_type);
CREATE INDEX idx_customers_risk ON customers(risk_level);
CREATE INDEX idx_accounts_customer ON accounts(customer_id);

-- 插入初始规则配置
INSERT INTO aml_rules (rule_name, scenario_type, rule_description, risk_weight, threshold_amount, rule_condition) VALUES
('大额交易监测', 'LARGE_AMOUNT', '单笔交易超过阈值', 0.80, 500000.00, '{"field": "amount", "operator": ">", "value": 500000}'),
('频繁小额分散转账', 'STRUCTURING', '短时间内多笔略低于阈值的交易', 0.90, 45000.00, '{"field": "amount", "operator": "<", "count": 5, "window_hours": 24}'),
('快进快出', 'RAPID_FLOW', '资金到账后短时间内转出', 0.85, 0, '{"in_window_hours": 2, "out_ratio": 0.9}'),
('跨境异常', 'CROSS_BORDER', '高频跨境交易', 0.75, 100000.00, '{"cross_border_count": 3, "window_days": 7}'),
('夜间交易', 'NIGHT_TIME', '凌晨时段异常交易', 0.60, 100000.00, '{"hours": [0,1,2,3,4,5], "min_amount": 100000}'),
('新账户大额交易', 'NEW_ACCOUNT', '新开账户短期内大额交易', 0.85, 300000.00, '{"account_age_days": 30, "min_amount": 300000}'),
('闭环交易', 'CIRCULAR', '资金经过多个账户回流到起点', 0.95, 0, '{"min_hops": 3, "time_window_hours": 48}'),
('壳公司特征', 'SHELL_COMPANY', '公司账户异常交易模式', 0.80, 0, '{"no_salary": true, "high_volume": true}');

-- 插入示例客户数据
INSERT INTO customers (customer_id, customer_name, customer_type, id_number, nationality, risk_level, kyc_status, onboarding_date, country, city, occupation, annual_income, pep_flag) VALUES
('C001', '张伟', 'PERSON', '110101199001011234', 'CN', 'LOW', 'VERIFIED', '2020-01-15', 'CN', '北京', '软件工程师', 350000.00, FALSE),
('C002', '李明', 'PERSON', '310101198505052345', 'CN', 'MEDIUM', 'VERIFIED', '2023-06-01', 'CN', '上海', '贸易公司老板', 1200000.00, FALSE),
('C003', '王芳', 'PERSON', '440101199203033456', 'CN', 'HIGH', 'ENHANCED', '2024-01-10', 'CN', '深圳', '投资顾问', 800000.00, TRUE),
('C004', '鸿运国际贸易有限公司', 'COMPANY', '91110000MA12345678', 'CN', 'HIGH', 'VERIFIED', '2024-03-15', 'CN', '北京', '国际贸易', 50000000.00, FALSE),
('C005', '陈强', 'PERSON', '330101198808084567', 'CN', 'LOW', 'VERIFIED', '2019-07-20', 'CN', '杭州', '教师', 180000.00, FALSE),
('C006', '离岸投资控股公司', 'COMPANY', '91440300MA87654321', 'VG', 'CRITICAL', 'ENHANCED', '2024-02-28', 'VG', '深圳(注册地:英属维尔京群岛)', '投资控股', 100000000.00, FALSE),
('C007', '赵雪', 'PERSON', '510101199507075678', 'CN', 'MEDIUM', 'VERIFIED', '2023-11-05', 'CN', '成都', '自由职业', 250000.00, FALSE),
('C008', '快捷支付科技有限公司', 'COMPANY', '91310000MA98765432', 'CN', 'MEDIUM', 'VERIFIED', '2022-08-15', 'CN', '上海', '支付服务', 30000000.00, FALSE);

-- 插入示例账户
INSERT INTO accounts (account_id, customer_id, account_type, currency, open_date, status, branch_code, balance) VALUES
('A001', 'C001', 'SAVINGS', 'CNY', '2020-01-15', 'ACTIVE', 'BJ001', 150000.00),
('A002', 'C002', 'BUSINESS', 'CNY', '2023-06-01', 'ACTIVE', 'SH001', 8500000.00),
('A003', 'C002', 'OFFSHORE', 'USD', '2023-09-15', 'ACTIVE', 'SH001', 2000000.00),
('A004', 'C003', 'SAVINGS', 'CNY', '2024-01-10', 'ACTIVE', 'SZ001', 3200000.00),
('A005', 'C004', 'BUSINESS', 'CNY', '2024-03-15', 'ACTIVE', 'BJ002', 150000000.00),
('A006', 'C004', 'BUSINESS', 'USD', '2024-03-15', 'ACTIVE', 'BJ002', 80000000.00),
('A007', 'C005', 'SAVINGS', 'CNY', '2019-07-20', 'ACTIVE', 'HZ001', 85000.00),
('A008', 'C006', 'OFFSHORE', 'USD', '2024-02-28', 'ACTIVE', 'SZ002', 50000000.00),
('A009', 'C007', 'SAVINGS', 'CNY', '2023-11-05', 'ACTIVE', 'CD001', 120000.00),
('A010', 'C008', 'BUSINESS', 'CNY', '2022-08-15', 'ACTIVE', 'SH002', 25000000.00);
