/**
 * Flink CDC Pipeline - 实时数据处理
 * 
 * 学习要点:
 * 1. Flink CDC 2.x: 无需 Kafka，直接从数据库读 CDC
 * 2. YAML Pipeline: 声明式定义数据同步
 * 3. 支持: 全量快照 + 增量变更
 * 4. Schema Evolution: 自动处理表结构变更
 */

// ============ Pipeline 1: MySQL → ClickHouse ============
// 文件: mysql-to-clickhouse.yaml
/*
source:
  type: mysql
  hostname: mysql-ecom
  port: 3306
  username: cdc_user
  password: cdc_pass123
  tables: ecommerce\.\+
  server-id: 5400-5404
  server-time-zone: Asia/Shanghai
  
sink:
  type: clickhouse
  url: jdbc:clickhouse://clickhouse:9000/analytics
  username: default
  password: ch_pass123
  table.prefix: ods_
  table.suffix: _rt
  
pipeline:
  name: mysql-ecom-to-clickhouse
  parallelism: 2
*/

// ============ Pipeline 2: PostgreSQL → Doris ============
// 文件: postgres-to-doris.yaml
/*
source:
  type: postgres
  hostname: postgres-erp
  port: 5432
  username: cdc_user
  password: cdc_pass123
  tables: public\.\+
  slot.name: flink_cdc_erp
  decoder.plugin.name: pgoutput
  
sink:
  type: doris
  fenodes: doris-fe:8030
  username: root
  password: ""
  jdbc-url: jdbc:mysql://doris-fe:9030
  sink.properties.format: json
  sink.properties.read_json_by_line: true
  sink.label-prefix: flink_cdc
  
pipeline:
  name: postgres-erp-to-doris
  parallelism: 2
*/

// ============ Pipeline 3: MySQL + PostgreSQL → Elasticsearch (跨源Join) ============
// 文件: multi-source-to-es.yaml
/*
source:
  type: mysql
  hostname: mysql-ecom
  port: 3306
  username: cdc_user
  password: cdc_pass123
  tables: ecommerce.orders, ecommerce.order_items
  
transform:
  - source-table: ecommerce.orders
    projection: >
      id AS order_id,
      user_id,
      total_amount,
      status AS order_status,
      created_at AS order_time
  - source-table: ecommerce.order_items
    projection: >
      order_id,
      product_id,
      quantity,
      unit_price
      
sink:
  type: elasticsearch
  hosts: http://elasticsearch:9200
  index: orders_${now|mmyyyy}
  username: ""
  password: ""
  bulk.flush.max.actions: 1000
  bulk.flush.interval.ms: 5000
  
pipeline:
  name: orders-to-elasticsearch
  parallelism: 2
*/

// ============ Pipeline 4: MongoDB → S3 (数据湖归档) ============
// 文件: mongo-to-s3.yaml
/*
source:
  type: mongodb
  hosts: mongo-logs:27017
  username: cdc_user
  password: cdc_pass123
  database: app_logs
  collection: access_logs, error_logs, audit_logs
  connection.options: replicaSet=rs0&authSource=admin
  
sink:
  type: s3
  bucket: cdc-datalake
  endpoint: http://minio:9000
  access-key: cdc_admin
  secret-key: cdc_minio123
  path-style-access: true
  file.format: parquet
  partition.keys: _schema_name, _partition_date
  
pipeline:
  name: mongo-logs-to-datalake
  parallelism: 1
*/

module.exports = { /* placeholder for JS module */ }
