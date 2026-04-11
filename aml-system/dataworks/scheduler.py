"""
DataWorks 数据集成调度模拟器
模拟阿里云 DataWorks 的数据集成和调度功能：
1. 定时从外部数据源抽取交易数据
2. 将数据写入 PostgreSQL + MinIO 数据湖
3. 触发 Spark ETL 任务
4. 记录数据接入日志
"""
import os
import sys
import json
import time
import random
import string
import logging
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values
from minio import Minio
from minio.error import S3Error

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('DataWorks-Sim')

# ============ 配置 ============
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', '5432'))
POSTGRES_DB = os.getenv('POSTGRES_DB', 'aml_db')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'aml_user')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'aml_pass123')

MINIO_HOST = os.getenv('MINIO_HOST', 'minio')
MINIO_PORT = int(os.getenv('MINIO_PORT', '9000'))
MINIO_USER = os.getenv('MINIO_USER', 'aml_admin')
MINIO_PASSWORD = os.getenv('MINIO_PASSWORD', 'aml_minio123')

SCHEDULE_INTERVAL = int(os.getenv('SCHEDULE_INTERVAL', '60'))  # 秒

ACCOUNTS = ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007', 'A008', 'A009', 'A010']
CHANNELS = ['ONLINE', 'ATM', 'COUNTER', 'MOBILE', 'SWIFT']
PURPOSES = ['工资', '生活费', '购物', '还款', '投资', '货款', '服务费', '租金', '分红', '借款']

def gen_tx_id():
    return 'TX' + ''.join(random.choices(string.digits, k=14))

def gen_batch_transactions(count=50):
    """生成一批模拟交易数据"""
    transactions = []
    now = datetime.now()

    for _ in range(count):
        acc_id = random.choice(ACCOUNTS)
        counter_acc = random.choice(ACCOUNTS)
        while counter_acc == acc_id:
            counter_acc = random.choice(ACCOUNTS)

        is_cross = random.random() < 0.05
        tx_date = now - timedelta(
            minutes=random.randint(0, 60),
            hours=random.randint(0, 2)
        )

        transactions.append((
            gen_tx_id(),
            acc_id,
            counter_acc,
            random.choice(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL']),
            round(random.uniform(100, 500000), 2),
            'CNY',
            tx_date,
            tx_date + timedelta(hours=random.randint(0, 2)),
            random.choice(CHANNELS),
            random.choice(PURPOSES),
            'CN',
            random.choice(['CN', 'CN', 'CN', 'US', 'HK']) if is_cross else 'CN',
            is_cross,
        ))
    return transactions

class DataWorksSimulator:
    """模拟 DataWorks 数据集成调度"""

    def __init__(self):
        self.pg_conn = None
        self.minio_client = None
        self.cycle_count = 0

    def connect_postgres(self):
        """连接 PostgreSQL"""
        try:
            self.pg_conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                dbname=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD
            )
            logger.info(f"PostgreSQL 连接成功: {POSTGRES_HOST}:{POSTGRES_PORT}")
            return True
        except Exception as e:
            logger.error(f"PostgreSQL 连接失败: {e}")
            return False

    def connect_minio(self):
        """连接 MinIO (数据湖)"""
        try:
            self.minio_client = Minio(
                f"{MINIO_HOST}:{MINIO_PORT}",
                access_key=MINIO_USER,
                secret_key=MINIO_PASSWORD,
                secure=False
            )
            # 创建 bucket
            if not self.minio_client.bucket_exists("aml-datalake"):
                self.minio_client.make_bucket("aml-datalake")
                logger.info("创建 MinIO bucket: aml-datalake")
            logger.info(f"MinIO 连接成功: {MINIO_HOST}:{MINIO_PORT}")
            return True
        except Exception as e:
            logger.error(f"MinIO 连接失败: {e}")
            return False

    def ingest_transactions(self, transactions):
        """数据集成: 将交易数据写入 PostgreSQL"""
        try:
            cursor = self.pg_conn.cursor()

            # 写入交易数据
            insert_sql = """
                INSERT INTO transactions 
                (transaction_id, account_id, counterparty_account_id, 
                 transaction_type, amount, currency, 
                 transaction_date, booking_date, channel, purpose,
                 country_origin, country_destination, is_cross_border)
                VALUES %s
                ON CONFLICT (transaction_id) DO NOTHING
            """
            execute_values(cursor, insert_sql, transactions)
            records_loaded = cursor.rowcount

            # 写入接入日志
            log_sql = """
                INSERT INTO data_ingestion_logs 
                (source_system, table_name, records_loaded, load_status, start_time, end_time)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(log_sql, (
                'CORE_BANKING',
                'transactions',
                records_loaded,
                'SUCCESS',
                datetime.now() - timedelta(seconds=5),
                datetime.now()
            ))

            self.pg_conn.commit()
            cursor.close()
            return records_loaded
        except Exception as e:
            logger.error(f"数据写入失败: {e}")
            self.pg_conn.rollback()
            return 0

    def upload_to_datalake(self, transactions):
        """将原始数据上传到 MinIO 数据湖"""
        try:
            # 转换为 JSON 格式
            data = []
            for tx in transactions:
                data.append({
                    'transaction_id': tx[0],
                    'account_id': tx[1],
                    'counterparty_account_id': tx[2],
                    'transaction_type': tx[3],
                    'amount': float(tx[4]),
                    'currency': tx[5],
                    'transaction_date': str(tx[6]),
                    'booking_date': str(tx[7]),
                    'channel': tx[8],
                    'purpose': tx[9],
                    'country_origin': tx[10],
                    'country_destination': tx[11],
                    'is_cross_border': tx[12],
                })

            json_data = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
            object_name = f"raw/transactions/{datetime.now().strftime('%Y%m%d')}/{datetime.now().strftime('%H%M%S')}.json"

            from io import BytesIO
            self.minio_client.put_object(
                "aml-datalake",
                object_name,
                BytesIO(json_data),
                len(json_data),
                content_type="application/json"
            )

            logger.info(f"数据已上传到数据湖: {object_name}")
            return object_name
        except Exception as e:
            logger.error(f"数据湖上传失败: {e}")
            return None

    def run_cycle(self):
        """执行一个调度周期"""
        self.cycle_count += 1
        cycle_start = datetime.now()

        logger.info(f"=" * 50)
        logger.info(f"调度周期 #{self.cycle_count} 开始")
        logger.info(f"=" * 50)

        # Step 1: 数据抽取 (模拟从核心银行系统获取新交易)
        logger.info("[Step 1] 数据抽取 - 模拟从核心银行系统获取交易数据...")
        tx_count = random.randint(20, 80)
        transactions = gen_batch_transactions(tx_count)
        logger.info(f"  抽取到 {len(transactions)} 条新交易")

        # Step 2: 数据写入 PostgreSQL
        logger.info("[Step 2] 数据集成 - 写入 PostgreSQL...")
        loaded = self.ingest_transactions(transactions)
        logger.info(f"  写入 {loaded} 条记录")

        # Step 3: 原始数据归档到数据湖
        logger.info("[Step 3] 数据归档 - 上传到 MinIO 数据湖...")
        obj_name = self.upload_to_datalake(transactions)

        # Step 4: 汇总
        cycle_end = datetime.now()
        duration = (cycle_end - cycle_start).total_seconds()

        logger.info(f"[完成] 周期 #{self.cycle_count} - 耗时 {duration:.1f}s")
        logger.info(f"  抽取: {tx_count} | 写入: {loaded} | 归档: {'✅' if obj_name else '❌'}")
        logger.info(f"  下一次调度: {SCHEDULE_INTERVAL}秒后")

    def start(self):
        """启动调度器"""
        logger.info("=" * 60)
        logger.info("  DataWorks 数据集成调度模拟器 启动")
        logger.info("=" * 60)
        logger.info(f"  PostgreSQL: {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
        logger.info(f"  MinIO:      {MINIO_HOST}:{MINIO_PORT}")
        logger.info(f"  调度间隔:   {SCHEDULE_INTERVAL}秒")
        logger.info("=" * 60)

        # 等待依赖服务就绪
        for attempt in range(30):
            if self.connect_postgres() and self.connect_minio():
                break
            logger.info(f"等待服务就绪... ({attempt + 1}/30)")
            time.sleep(5)
        else:
            logger.error("服务连接超时，退出")
            sys.exit(1)

        # 主循环
        while True:
            try:
                self.run_cycle()
            except Exception as e:
                logger.error(f"调度周期异常: {e}")

            time.sleep(SCHEDULE_INTERVAL)


if __name__ == '__main__':
    sim = DataWorksSimulator()
    sim.start()
