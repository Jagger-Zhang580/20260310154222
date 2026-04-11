# AML 反洗钱端到端学习系统

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     数据可视化层                                  │
│   Grafana (监控)     Jupyter Notebook (学习分析)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     检测引擎层                                   │
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ 规则引擎  │    │ 图分析    │    │ 机器学习  │                 │
│   │ (40%)    │    │ (30%)    │    │ (30%)    │                 │
│   │ SQL/配置  │    │ Neo4j    │    │ Isolation │                │
│   │ 可解释    │    │ PageRank │    │ XGBoost  │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│         └────────────┼────────────────┘                        │
│                      ▼                                          │
│              风险评分融合 → 告警/报告                              │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     计算引擎层                                   │
│                                                                  │
│   ┌──────────────────────────────┐                              │
│   │      Spark ETL Pipeline      │                              │
│   │  Extract → Transform → Load  │                              │
│   │  数据清洗 | 特征工程 | 规则检测 │                              │
│   └──────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     数据存储层                                   │
│                                                                  │
│   PostgreSQL    Neo4j      Redis      MinIO                     │
│   (交易数据)   (关系图)   (实时缓存)  (数据湖/OSS)                │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     数据集成层                                   │
│                                                                  │
│   DataWorks 模拟器 → 定时抽取 | 数据写入 | 归档数据湖             │
└─────────────────────────────────────────────────────────────────┘
```

## 8 大反洗钱检测场景

| # | 场景 | 检测方法 | Notebook |
|---|------|----------|----------|
| 01 | 数据探索 | EDA | `01-data-exploration.ipynb` |
| 02 | 规则引擎 | 条件匹配 | `02-rule-engine.ipynb` |
| 03 | 分拆交易 | 规则+统计 | `03-structuring-detection.ipynb` |
| 04 | 快进快出 | 时序分析 | `04-rapid-flow-detection.ipynb` |
| 05 | 关系网络 | 图分析(Neo4j) | `05-graph-analysis.ipynb` |
| 06 | 机器学习 | IsolationForest/XGBoost | `06-ml-detection.ipynb` |
| 07 | 时序异常 | Prophet/统计 | `07-time-series-anomaly.ipynb` |
| 08 | 混合检测 | 规则+图+ML融合 | `08-hybrid-detection.ipynb` |

## 服务端口

| 服务 | 端口 | 用途 |
|------|------|------|
| Jupyter | 8888 | 交互式学习 (token: aml_learning) |
| PostgreSQL | 5432 | 交易数据存储 |
| Neo4j Browser | 7474 | 图数据库可视化 |
| Neo4j Bolt | 7687 | 图数据库连接 |
| MinIO Console | 9001 | 数据湖管理 |
| MinIO API | 9000 | 对象存储 |
| Spark Master | 8081 | Spark 集群管理 |
| Grafana | 3000 | 监控可视化 |
| Redis | 6379 | 实时缓存 |
| DataWorks Sim | 8082 | 数据集成调度模拟 |

## 快速开始

### 1. 启动所有服务

```bash
cd aml-system
docker compose up -d
```

### 2. 等待服务就绪 (~1分钟)

```bash
docker compose ps
```

### 3. 生成测试数据

```bash
# 进入 Spark 容器生成数据
docker exec -it aml-spark-master bash
pip install faker
python /opt/spark/jobs/data_generator.py
```

### 4. 运行 ETL Pipeline

```bash
# 在 Spark 容器中
spark-submit /opt/spark/jobs/etl_pipeline.py
```

### 5. 打开 Jupyter 学习

浏览器访问: **http://localhost:8888** (密码: `aml_learning`)

打开 `00-overview.ipynb` 开始学习！

### 6. 查看 DataWorks 调度

```bash
docker logs -f aml-dataworks
```

### 7. 查看 Neo4j 图数据

浏览器访问: **http://localhost:7474** (用户: neo4j / 密码: aml_neo4j123)

## 技术栈说明

| 技术 | 作用 | 类比真实系统 |
|------|------|-------------|
| DataWorks Simulator | 数据集成调度 | 阿里云 DataWorks |
| MinIO | 对象存储/数据湖 | 阿里云 OSS |
| PostgreSQL | 关系数据库 | 核心银行系统数据库 |
| Spark | 大数据计算 | 阿里云 MaxCompute/EMR |
| Neo4j | 图数据库 | 关系网络分析平台 |
| Redis | 实时缓存 | 实时规则引擎 |
| Jupyter | 学习分析 | 数据分析平台 |
| Grafana | 监控可视化 | 运维监控 |
| Isolation Forest | 无监督异常检测 | 反欺诈模型 |
| PageRank | 图算法 | 核心账户识别 |

## 停止服务

```bash
docker compose down
```
