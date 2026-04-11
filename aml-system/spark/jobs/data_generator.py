"""
AML 反洗钱系统 - 交易数据生成器
生成模拟交易数据用于学习各种 AML 检测场景
"""
import random
import string
import json
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('zh_CN')

# ============ 配置 ============
NUM_NORMAL = 5000          # 正常交易
NUM_SUSPICIOUS = 200       # 可疑交易
OUTPUT_DIR = '/data'       # 输出目录

# 可疑场景类型
SUSPICIOUS_SCENARIOS = [
    'STRUCTURING',         # 分拆交易
    'RAPID_FLOW',          # 快进快出
    'CIRCULAR',            # 闭环转账
    'LARGE_AMOUNT',        # 大额异常
    'CROSS_BORDER',        # 跨境异常
    'SHELL_COMPANY',       # 壳公司
    'NIGHT_TIME',          # 夜间交易
    'LAYERING',            # 分层洗钱
]

# 账户映射
ACCOUNTS = {
    'A001': ('C001', 'SAVINGS', 'CNY'),
    'A002': ('C002', 'BUSINESS', 'CNY'),
    'A003': ('C002', 'OFFSHORE', 'USD'),
    'A004': ('C003', 'SAVINGS', 'CNY'),
    'A005': ('C004', 'BUSINESS', 'CNY'),
    'A006': ('C004', 'BUSINESS', 'USD'),
    'A007': ('C005', 'SAVINGS', 'CNY'),
    'A008': ('C006', 'OFFSHORE', 'USD'),
    'A009': ('C007', 'SAVINGS', 'CNY'),
    'A010': ('C008', 'BUSINESS', 'CNY'),
}

CHANNELS = ['ONLINE', 'ATM', 'COUNTER', 'MOBILE', 'SWIFT']
CURRENCIES = ['CNY', 'USD', 'EUR', 'HKD']

def gen_tx_id():
    return 'TX' + ''.join(random.choices(string.digits, k=14))

def gen_normal_transaction(base_date):
    """生成正常交易"""
    acc_id = random.choice(list(ACCOUNTS.keys()))
    counter_acc = random.choice(list(ACCOUNTS.keys()))
    while counter_acc == acc_id:
        counter_acc = random.choice(list(ACCOUNTS.keys()))

    tx_type = random.choice(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'TRANSFER'])
    amount = round(random.uniform(100, 50000), 2)
    channel = random.choice(CHANNELS)
    is_cross = random.random() < 0.05
    tx_date = base_date + timedelta(
        days=random.randint(0, 89),
        hours=random.randint(8, 22),
        minutes=random.randint(0, 59)
    )

    return {
        'transaction_id': gen_tx_id(),
        'account_id': acc_id,
        'counterparty_account_id': counter_acc if tx_type == 'TRANSFER' else None,
        'transaction_type': tx_type,
        'amount': amount,
        'currency': ACCOUNTS[acc_id][2],
        'transaction_date': tx_date.strftime('%Y-%m-%d %H:%M:%S'),
        'booking_date': (tx_date + timedelta(hours=random.randint(0, 4))).strftime('%Y-%m-%d %H:%M:%S'),
        'channel': channel,
        'purpose': random.choice(['工资', '生活费', '购物', '还款', '投资', '货款', '服务费', '租金', '分红', '借款']),
        'country_origin': 'CN',
        'country_destination': random.choice(['CN', 'CN', 'CN', 'US', 'HK', 'SG', 'AE']) if is_cross else 'CN',
        'is_cross_border': is_cross,
        'is_suspicious': False,
        'scenario_type': None
    }

def gen_structuring_transactions(base_date):
    """场景1: 分拆交易 (Structuring/Smurfing)
    将大额交易拆分为多笔略低于报告阈值的交易
    例如: 报告阈值 50,000 → 拆成多笔 49,000 左右
    """
    transactions = []
    acc_id = random.choice(['A002', 'A004', 'A009'])
    counter_acc = random.choice(['A005', 'A010'])
    base_time = base_date + timedelta(days=random.randint(0, 89), hours=random.randint(9, 17))

    num_splits = random.randint(3, 8)
    for i in range(num_splits):
        tx_time = base_time + timedelta(hours=i * random.randint(1, 4))
        amount = round(random.uniform(48000, 49999), 2)
        transactions.append({
            'transaction_id': gen_tx_id(),
            'account_id': acc_id,
            'counterparty_account_id': counter_acc,
            'transaction_type': 'TRANSFER',
            'amount': amount,
            'currency': 'CNY',
            'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'channel': random.choice(['ONLINE', 'MOBILE', 'ATM']),
            'purpose': random.choice(['货款', '服务费', '咨询费', '合作款']),
            'country_origin': 'CN',
            'country_destination': 'CN',
            'is_cross_border': False,
            'is_suspicious': True,
            'scenario_type': 'STRUCTURING'
        })
    return transactions

def gen_rapid_flow_transactions(base_date):
    """场景2: 快进快出 (Rapid Flow)
    资金到账后极短时间内转出
    例如: 收到100万，2小时内转出95万
    """
    transactions = []
    acc_id = random.choice(['A002', 'A004', 'A009'])
    counter_in = random.choice(['A005', 'A010', 'A008'])
    counter_out = random.choice(['A003', 'A006', 'A008'])

    in_time = base_date + timedelta(days=random.randint(0, 89), hours=random.randint(9, 15))
    in_amount = round(random.uniform(500000, 5000000), 2)
    out_amount = round(in_amount * random.uniform(0.85, 0.98), 2)
    out_time = in_time + timedelta(minutes=random.randint(5, 120))

    transactions.append({
        'transaction_id': gen_tx_id(),
        'account_id': acc_id,
        'counterparty_account_id': counter_in,
        'transaction_type': 'TRANSFER',
        'amount': in_amount,
        'currency': 'CNY',
        'transaction_date': in_time.strftime('%Y-%m-%d %H:%M:%S'),
        'booking_date': in_time.strftime('%Y-%m-%d %H:%M:%S'),
        'channel': 'ONLINE',
        'purpose': '收款',
        'country_origin': 'CN',
        'country_destination': 'CN',
        'is_cross_border': False,
        'is_suspicious': True,
        'scenario_type': 'RAPID_FLOW'
    })

    transactions.append({
        'transaction_id': gen_tx_id(),
        'account_id': acc_id,
        'counterparty_account_id': counter_out,
        'transaction_type': 'TRANSFER',
        'amount': out_amount,
        'currency': 'CNY',
        'transaction_date': out_time.strftime('%Y-%m-%d %H:%M:%S'),
        'booking_date': out_time.strftime('%Y-%m-%d %H:%M:%S'),
        'channel': 'ONLINE',
        'purpose': random.choice(['投资', '采购', '还款', '转账']),
        'country_origin': 'CN',
        'country_destination': 'CN',
        'is_cross_border': False,
        'is_suspicious': True,
        'scenario_type': 'RAPID_FLOW'
    })
    return transactions

def gen_circular_transactions(base_date):
    """场景3: 闭环转账 (Circular Flow)
    资金经过多个账户流转后回到起点
    A → B → C → D → A
    """
    transactions = []
    chain = random.sample(['A002', 'A004', 'A005', 'A009', 'A010'], 4)
    chain.append(chain[0])  # 闭环回到起点

    base_time = base_date + timedelta(days=random.randint(0, 89), hours=random.randint(9, 15))
    amount = round(random.uniform(100000, 1000000), 2)

    for i in range(len(chain) - 1):
        tx_time = base_time + timedelta(hours=i * random.randint(1, 6))
        fee_ratio = random.uniform(0.95, 1.0)
        actual_amount = round(amount * fee_ratio, 2)

        transactions.append({
            'transaction_id': gen_tx_id(),
            'account_id': chain[i],
            'counterparty_account_id': chain[i + 1],
            'transaction_type': 'TRANSFER',
            'amount': actual_amount,
            'currency': 'CNY',
            'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'channel': random.choice(['ONLINE', 'COUNTER']),
            'purpose': random.choice(['货款', '服务费', '借款', '还款', '投资']),
            'country_origin': 'CN',
            'country_destination': 'CN',
            'is_cross_border': False,
            'is_suspicious': True,
            'scenario_type': 'CIRCULAR'
        })
    return transactions

def gen_large_amount_transactions(base_date):
    """场景4: 大额异常交易
    与客户身份/收入不符的大额交易
    """
    transactions = []
    # 低收入客户的大额交易
    acc_id = random.choice(['A001', 'A007', 'A009'])  # 普通收入客户
    counter_acc = random.choice(['A005', 'A008', 'A010'])

    tx_time = base_date + timedelta(days=random.randint(0, 89), hours=random.randint(9, 17))
    amount = round(random.uniform(500000, 5000000), 2)

    transactions.append({
        'transaction_id': gen_tx_id(),
        'account_id': acc_id,
        'counterparty_account_id': counter_acc,
        'transaction_type': 'TRANSFER',
        'amount': amount,
        'currency': 'CNY',
        'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
        'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
        'channel': random.choice(['COUNTER', 'ONLINE']),
        'purpose': random.choice(['投资', '借款', '货款']),
        'country_origin': 'CN',
        'country_destination': 'CN',
        'is_cross_border': False,
        'is_suspicious': True,
        'scenario_type': 'LARGE_AMOUNT'
    })
    return transactions

def gen_cross_border_transactions(base_date):
    """场景5: 跨境异常交易
    高频跨境转账，特别是涉及高风险国家
    """
    transactions = []
    acc_id = random.choice(['A003', 'A006', 'A008'])  # 离岸/外币账户
    high_risk_countries = ['VG', 'KY', 'PA', 'AE', 'SC', 'BZ']

    for i in range(random.randint(3, 8)):
        tx_time = base_date + timedelta(days=random.randint(0, 30), hours=random.randint(8, 20))
        amount = round(random.uniform(50000, 500000), 2)
        dest_country = random.choice(high_risk_countries)

        transactions.append({
            'transaction_id': gen_tx_id(),
            'account_id': acc_id,
            'counterparty_account_id': 'FOREIGN_' + ''.join(random.choices(string.ascii_uppercase, k=6)),
            'transaction_type': 'TRANSFER',
            'amount': amount,
            'currency': random.choice(['USD', 'EUR', 'HKD']),
            'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'channel': 'SWIFT',
            'purpose': random.choice(['投资', '服务费', '咨询费', '管理费']),
            'country_origin': 'CN',
            'country_destination': dest_country,
            'is_cross_border': True,
            'is_suspicious': True,
            'scenario_type': 'CROSS_BORDER'
        })
    return transactions

def gen_shell_company_transactions(base_date):
    """场景6: 壳公司特征交易
    无工资支出、无日常消费、只有大额进出的公司账户
    """
    transactions = []
    acc_id = 'A008'  # 离岸投资控股公司

    for i in range(random.randint(5, 15)):
        tx_time = base_date + timedelta(days=random.randint(0, 60), hours=random.randint(10, 16))
        amount = round(random.uniform(200000, 10000000), 2)
        is_in = random.random() < 0.5

        transactions.append({
            'transaction_id': gen_tx_id(),
            'account_id': acc_id,
            'counterparty_account_id': random.choice(['A005', 'A006', 'A010', 'FOREIGN_SHELL_' + str(random.randint(1,5))]),
            'transaction_type': 'TRANSFER',
            'amount': amount,
            'currency': random.choice(['USD', 'CNY']),
            'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'channel': random.choice(['SWIFT', 'ONLINE', 'COUNTER']),
            'purpose': random.choice(['投资', '管理费', '服务费', '咨询费', '分红']),
            'country_origin': random.choice(['CN', 'VG', 'HK']),
            'country_destination': random.choice(['VG', 'HK', 'SG', 'AE']),
            'is_cross_border': True,
            'is_suspicious': True,
            'scenario_type': 'SHELL_COMPANY'
        })
    return transactions

def gen_night_time_transactions(base_date):
    """场景7: 夜间异常交易
    凌晨时段的大额交易（正常客户很少在凌晨交易）
    """
    transactions = []
    acc_id = random.choice(['A002', 'A004', 'A009'])

    for i in range(random.randint(2, 5)):
        tx_time = base_date + timedelta(
            days=random.randint(0, 89),
            hours=random.randint(0, 5),
            minutes=random.randint(0, 59)
        )
        amount = round(random.uniform(100000, 2000000), 2)

        transactions.append({
            'transaction_id': gen_tx_id(),
            'account_id': acc_id,
            'counterparty_account_id': random.choice(['A005', 'A008', 'A010']),
            'transaction_type': 'TRANSFER',
            'amount': amount,
            'currency': 'CNY',
            'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
            'channel': random.choice(['ONLINE', 'MOBILE']),
            'purpose': random.choice(['转账', '投资', '还款']),
            'country_origin': 'CN',
            'country_destination': 'CN',
            'is_cross_border': False,
            'is_suspicious': True,
            'scenario_type': 'NIGHT_TIME'
        })
    return transactions

def gen_layering_transactions(base_date):
    """场景8: 分层洗钱 (Layering)
    资金经过多层转账隐藏来源
    A → B1 → B2 → C1 → C2 → D
    """
    transactions = []
    base_time = base_date + timedelta(days=random.randint(0, 89), hours=random.randint(10, 16))
    original_amount = round(random.uniform(1000000, 5000000), 2)

    layers = [
        [('A002', 'A004'), ('A002', 'A009')],
        [('A004', 'A005'), ('A004', 'A010'), ('A009', 'A010')],
        [('A005', 'A008'), ('A010', 'A006')],
        [('A008', 'A003'), ('A006', 'A003')],
    ]

    current_amount = original_amount
    for layer_idx, layer in enumerate(layers):
        layer_amount = current_amount / len(layer)
        for from_acc, to_acc in layer:
            tx_time = base_time + timedelta(hours=layer_idx * random.randint(2, 8))
            fee = layer_amount * random.uniform(0.02, 0.05)
            actual_amount = round(layer_amount - fee, 2)

            transactions.append({
                'transaction_id': gen_tx_id(),
                'account_id': from_acc,
                'counterparty_account_id': to_acc,
                'transaction_type': 'TRANSFER',
                'amount': actual_amount,
                'currency': random.choice(['CNY', 'USD']),
                'transaction_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
                'booking_date': tx_time.strftime('%Y-%m-%d %H:%M:%S'),
                'channel': random.choice(['ONLINE', 'SWIFT', 'COUNTER']),
                'purpose': random.choice(['投资', '货款', '服务费', '咨询费']),
                'country_origin': 'CN',
                'country_destination': random.choice(['CN', 'HK', 'VG']),
                'is_cross_border': random.random() < 0.4,
                'is_suspicious': True,
                'scenario_type': 'LAYERING'
            })
        current_amount = layer_amount

    return transactions


def generate_all_data():
    """生成所有数据"""
    import os
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    base_date = datetime(2025, 1, 1)
    all_transactions = []

    print(f"生成 {NUM_NORMAL} 条正常交易...")
    for _ in range(NUM_NORMAL):
        all_transactions.append(gen_normal_transaction(base_date))

    print(f"生成 {NUM_SUSPICIOUS} 条可疑交易 (8种场景)...")
    suspicious_generators = {
        'STRUCTURING': gen_structuring_transactions,
        'RAPID_FLOW': gen_rapid_flow_transactions,
        'CIRCULAR': gen_circular_transactions,
        'LARGE_AMOUNT': gen_large_amount_transactions,
        'CROSS_BORDER': gen_cross_border_transactions,
        'SHELL_COMPANY': gen_shell_company_transactions,
        'NIGHT_TIME': gen_night_time_transactions,
        'LAYERING': gen_layering_transactions,
    }

    for scenario, generator in suspicious_generators.items():
        count = NUM_SUSPICIOUS // len(suspicious_generators)
        for _ in range(count):
            txs = generator(base_date)
            all_transactions.extend(txs)
        print(f"  场景 {scenario}: 生成完成")

    random.shuffle(all_transactions)

    # 保存为 JSON
    json_path = os.path.join(OUTPUT_DIR, 'transactions.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_transactions, f, ensure_ascii=False, indent=2)
    print(f"\nJSON 已保存: {json_path}")

    # 保存为 CSV
    csv_path = os.path.join(OUTPUT_DIR, 'transactions.csv')
    if all_transactions:
        keys = all_transactions[0].keys()
        with open(csv_path, 'w', encoding='utf-8') as f:
            f.write(','.join(keys) + '\n')
            for tx in all_transactions:
                f.write(','.join(str(tx.get(k, '')) for k in keys) + '\n')
    print(f"CSV 已保存: {csv_path}")

    # 统计
    suspicious_count = sum(1 for t in all_transactions if t.get('is_suspicious'))
    print(f"\n总计: {len(all_transactions)} 条交易")
    print(f"  正常: {len(all_transactions) - suspicious_count}")
    print(f"  可疑: {suspicious_count}")
    for scenario in suspicious_generators:
        cnt = sum(1 for t in all_transactions if t.get('scenario_type') == scenario)
        print(f"    {scenario}: {cnt}")

if __name__ == '__main__':
    generate_all_data()
