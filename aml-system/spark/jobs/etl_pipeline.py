"""
AML 反洗钱系统 - Spark ETL Pipeline
从数据源抽取交易数据 → 清洗转换 → 加载到分析库
模拟 DataWorks 数据集成 + Spark 计算流程
"""
import os
import json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

# ============ Spark Session ============
spark = SparkSession.builder \
    .appName("AML_ETL_Pipeline") \
    .master(os.getenv("SPARK_MASTER", "local[*]")) \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "4") \
    .getOrCreate()

print("=" * 60)
print("  AML ETL Pipeline 启动")
print("=" * 60)

# ============ Stage 1: Extract (数据抽取) ============
print("\n[Stage 1] Extract - 从数据源抽取交易数据...")

# 读取原始交易数据
DATA_PATH = os.getenv("DATA_PATH", "/data/transactions.json")

if os.path.exists(DATA_PATH):
    df_raw = spark.read.json(DATA_PATH)
    print(f"  读取 {df_raw.count()} 条原始交易记录")
else:
    print(f"  数据文件不存在: {DATA_PATH}")
    print("  请先运行 data_generator.py 生成测试数据")
    spark.stop()
    exit(1)

# ============ Stage 2: Transform (数据清洗与转换) ============
print("\n[Stage 2] Transform - 数据清洗与转换...")

# 2.1 数据清洗
df_clean = df_raw \
    .filter(F.col("transaction_id").isNotNull()) \
    .filter(F.col("amount") > 0) \
    .filter(F.col("account_id").isNotNull()) \
    .dropDuplicates(["transaction_id"])

print(f"  清洗后: {df_clean.count()} 条记录")

# 2.2 添加衍生字段
df_enriched = df_clean \
    .withColumn("transaction_date_ts", F.to_timestamp("transaction_date")) \
    .withColumn("transaction_hour", F.hour("transaction_date_ts")) \
    .withColumn("transaction_day", F.to_date("transaction_date_ts")) \
    .withColumn("transaction_month", F.date_format("transaction_date_ts", "yyyy-MM")) \
    .withColumn("is_night_time", F.col("transaction_hour").between(0, 5)) \
    .withColumn("amount_bucket",
        F.when(F.col("amount") < 10000, "SMALL")
         .when(F.col("amount") < 50000, "MEDIUM")
         .when(F.col("amount") < 500000, "LARGE")
         .otherwise("VERY_LARGE")
    ) \
    .withColumn("is_high_risk_country",
        F.col("country_destination").isin("VG", "KY", "PA", "AE", "SC", "BZ", "CY")
    ) \
    .withColumn("is_structuring_candidate",
        (F.col("amount") >= 45000) & (F.col("amount") < 50000)
    )

# 2.3 计算账户级别统计特征
df_account_stats = df_enriched.groupBy("account_id").agg(
    F.count("*").alias("tx_count"),
    F.sum("amount").alias("total_amount"),
    F.avg("amount").alias("avg_amount"),
    F.max("amount").alias("max_amount"),
    F.min("amount").alias("min_amount"),
    F.stddev("amount").alias("stddev_amount"),
    F.sum(F.col("is_cross_border").cast("int")).alias("cross_border_count"),
    F.sum(F.col("is_night_time").cast("int")).alias("night_tx_count"),
    F.countDistinct("counterparty_account_id").alias("counterparty_diversity"),
    F.countDistinct("transaction_day").alias("active_days"),
    F.sum(F.col("is_structuring_candidate").cast("int")).alias("structuring_candidates"),
    F.sum(F.col("is_high_risk_country").cast("int")).alias("high_risk_country_count"),
)

df_account_stats = df_account_stats \
    .withColumn("cross_border_ratio",
        F.col("cross_border_count") / F.col("tx_count")
    ) \
    .withColumn("night_tx_ratio",
        F.col("night_tx_count") / F.col("tx_count")
    ) \
    .withColumn("avg_daily_tx",
        F.col("tx_count") / F.col("active_days")
    )

# 2.4 计算时间窗口特征（24小时滑动窗口）
df_window_stats = df_enriched \
    .withWatermark("transaction_date_ts", "1 hour") \
    .groupBy(
        F.window("transaction_date_ts", "24 hours"),
        "account_id"
    ).agg(
        F.count("*").alias("window_tx_count"),
        F.sum("amount").alias("window_total_amount"),
        F.countDistinct("counterparty_account_id").alias("window_counterparty_count"),
    )

print(f"  账户统计: {df_account_stats.count()} 个账户")
print(f"  时间窗口: {df_window_stats.count()} 个窗口")

# ============ Stage 3: Rule-based Detection (规则引擎检测) ============
print("\n[Stage 3] Rule-based Detection - 规则引擎检测...")

alerts = []

# Rule 1: 大额交易
large_amount_alerts = df_enriched.filter(F.col("amount") > 500000) \
    .select(
        "transaction_id", "account_id", "amount",
        F.lit("LARGE_AMOUNT").alias("scenario_type"),
        F.lit("RULE").alias("detection_method"),
        F.lit("HIGH").alias("alert_level")
    )
alerts.append(large_amount_alerts)
print(f"  Rule 1 - 大额交易: {large_amount_alerts.count()} 条告警")

# Rule 2: 分拆交易嫌疑
structuring_alerts = df_enriched.filter(F.col("is_structuring_candidate")) \
    .select(
        "transaction_id", "account_id", "amount",
        F.lit("STRUCTURING").alias("scenario_type"),
        F.lit("RULE").alias("detection_method"),
        F.lit("HIGH").alias("alert_level")
    )
alerts.append(structuring_alerts)
print(f"  Rule 2 - 分拆交易: {structuring_alerts.count()} 条告警")

# Rule 3: 夜间大额交易
night_alerts = df_enriched.filter(
    (F.col("is_night_time")) & (F.col("amount") > 100000)
).select(
    "transaction_id", "account_id", "amount",
    F.lit("NIGHT_TIME").alias("scenario_type"),
    F.lit("RULE").alias("detection_method"),
    F.lit("MEDIUM").alias("alert_level")
)
alerts.append(night_alerts)
print(f"  Rule 3 - 夜间大额: {night_alerts.count()} 条告警")

# Rule 4: 高风险国家跨境
high_risk_alerts = df_enriched.filter(F.col("is_high_risk_country")) \
    .select(
        "transaction_id", "account_id", "amount",
        F.lit("CROSS_BORDER").alias("scenario_type"),
        F.lit("RULE").alias("detection_method"),
        F.lit("HIGH").alias("alert_level")
    )
alerts.append(high_risk_alerts)
print(f"  Rule 4 - 高风险国家: {high_risk_alerts.count()} 条告警")

# 合并所有规则告警
from functools import reduce
df_rule_alerts = reduce(lambda a, b: a.unionByName(b), alerts)
print(f"\n  规则引擎总告警: {df_rule_alerts.count()} 条")

# ============ Stage 4: Load (数据加载) ============
print("\n[Stage 4] Load - 数据加载到存储...")

# 保存清洗后的交易数据
OUTPUT_PATH = os.getenv("OUTPUT_PATH", "/data/output")
os.makedirs(OUTPUT_PATH, exist_ok=True)

df_enriched.write.mode("overwrite").json(f"{OUTPUT_PATH}/transactions_enriched")
print(f"  交易数据已保存: {OUTPUT_PATH}/transactions_enriched/")

df_account_stats.write.mode("overwrite").json(f"{OUTPUT_PATH}/account_stats")
print(f"  账户统计已保存: {OUTPUT_PATH}/account_stats/")

df_rule_alerts.write.mode("overwrite").json(f"{OUTPUT_PATH}/rule_alerts")
print(f"  规则告警已保存: {OUTPUT_PATH}/rule_alerts/")

# ============ Summary ============
print("\n" + "=" * 60)
print("  ETL Pipeline 完成!")
print("=" * 60)
print(f"  输入记录: {df_raw.count()}")
print(f"  清洗记录: {df_clean.count()}")
print(f"  增强记录: {df_enriched.count()}")
print(f"  规则告警: {df_rule_alerts.count()}")
print(f"  输出目录: {OUTPUT_PATH}/")
print("=" * 60)

spark.stop()
