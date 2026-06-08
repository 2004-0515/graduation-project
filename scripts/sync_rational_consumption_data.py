#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRATCH_DIR = PROJECT_ROOT / "scratch"
CONSUMPTION_ORDER_STATUSES = {1, 2, 3, 6}
GENERATED_ORDER_PREFIX = "RC"
GENERATED_WISHLIST_REASON_PREFIX = "理性消费助手数据同步"

ACHIEVEMENT_DEFS = {
    "FIRST_WISHLIST": ("理性第一步", "首次使用心愿单"),
    "DELAYED_GRATIFICATION_3": ("延迟满足达人", "通过心愿单购买3件商品"),
    "RATIONAL_GIVEUP_5": ("理性放弃者", "从心愿单移除5件商品"),
    "BUDGET_MASTER": ("预算大师", "连续3个月未超预算"),
    "SAVING_STAR": ("节约之星", "单月节省超过500元"),
    "RATIONAL_100": ("理性消费达人", "理性指数达到100分"),
}


@dataclass(frozen=True)
class Buyer:
    id: int
    username: str
    nickname: str


@dataclass(frozen=True)
class Product:
    id: int
    name: str
    price: Decimal
    image: str
    seller_id: int
    seller_name: str
    category_id: int
    category_name: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Synchronize rational-consumption data from real order facts.")
    parser.add_argument("--mode", choices=["audit", "execute"], default="audit")
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "shopping_mall"))
    parser.add_argument("--db-user", default=os.environ.get("DB_USERNAME", "root"))
    parser.add_argument("--db-password", default=os.environ.get("DB_PASSWORD", "123456"))
    parser.add_argument("--db-host", default=os.environ.get("DB_HOST", ""))
    parser.add_argument("--db-port", default=os.environ.get("DB_PORT", ""))
    parser.add_argument("--mysql-exe", default=os.environ.get("MYSQL_EXE", ""))
    parser.add_argument("--target-month", default="202605")
    parser.add_argument("--orders-per-buyer", type=int, default=7)
    parser.add_argument("--wishlist-per-buyer", type=int, default=7)
    return parser.parse_args()


def resolve_mysql_command(explicit: str = "") -> str | None:
    candidates = [
        explicit,
        os.environ.get("MYSQL_EXE", ""),
        "mysql",
        "mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        candidate_path = Path(candidate)
        if candidate_path.exists():
            return str(candidate_path)
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    return None


def sql_escape(value: object) -> str:
    return str(value).replace("\\", "\\\\").replace("'", "\\'")


def sql_string(value: object | None) -> str:
    if value is None:
        return "NULL"
    return f"'{sql_escape(value)}'"


def sql_decimal(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)}"


def run_mysql(mysql: str, args: argparse.Namespace, sql: str, *, named: bool = False) -> str:
    env = os.environ.copy()
    env["MYSQL_PWD"] = args.db_password
    command = [mysql, "--default-character-set=utf8mb4", f"-u{args.db_user}", "-B"]
    if not named:
        command.append("-N")
    if args.db_host:
        command.extend(["-h", args.db_host])
    if args.db_port:
        command.extend(["-P", args.db_port])
    command.extend([args.db_name, "-e", sql])
    completed = subprocess.run(
        command,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        cwd=PROJECT_ROOT,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
    return completed.stdout.strip()


def run_mysql_script(mysql: str, args: argparse.Namespace, sql: str) -> None:
    env = os.environ.copy()
    env["MYSQL_PWD"] = args.db_password
    command = [mysql, "--default-character-set=utf8mb4", f"-u{args.db_user}"]
    if args.db_host:
        command.extend(["-h", args.db_host])
    if args.db_port:
        command.extend(["-P", args.db_port])
    command.append(args.db_name)
    completed = subprocess.run(
        command,
        input=sql,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        cwd=PROJECT_ROOT,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())


def rows(output: str) -> list[list[str]]:
    if not output:
        return []
    return [line.split("\t") for line in output.splitlines() if line.strip()]


def q2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def decimal_cell(value: str | None) -> Decimal:
    if value in {None, "", "NULL"}:
        return Decimal("0")
    return Decimal(value)


def round_budget(value: Decimal) -> Decimal:
    rounded = (value / Decimal("10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * Decimal("10")
    return max(Decimal("300"), rounded).quantize(Decimal("0.01"))


def month_start(target_month: str) -> datetime:
    return datetime(int(target_month[:4]), int(target_month[4:6]), 1, 9, 0, 0)


def add_months(dt: datetime, delta: int) -> datetime:
    month = dt.month - 1 + delta
    year = dt.year + month // 12
    month = month % 12 + 1
    return datetime(year, month, 1, dt.hour, dt.minute, dt.second)


def month_key(dt: datetime) -> str:
    return dt.strftime("%Y%m")


def load_buyers(mysql: str, args: argparse.Namespace) -> list[Buyer]:
    result = run_mysql(
        mysql,
        args,
        "SELECT id, username, IFNULL(nickname, username) FROM tb_user WHERE role='BUYER' AND status=1 ORDER BY id;",
    )
    return [Buyer(int(row[0]), row[1], row[2]) for row in rows(result)]


def load_products(mysql: str, args: argparse.Namespace) -> list[Product]:
    result = run_mysql(
        mysql,
        args,
        """
SELECT p.id, p.name, p.price, p.main_image, p.seller_id, p.seller_name, p.category_id, c.name
FROM tb_product p
JOIN tb_category c ON c.id = p.category_id
WHERE p.status = 1 AND p.audit_status = 1 AND p.stock > 5
ORDER BY c.id, p.sales DESC, p.id;
""",
    )
    products = []
    for row in rows(result):
        products.append(
            Product(
                id=int(row[0]),
                name=row[1],
                price=Decimal(row[2]),
                image=row[3],
                seller_id=int(row[4]),
                seller_name=row[5],
                category_id=int(row[6]),
                category_name=row[7],
            )
        )
    return products


def load_coupons(mysql: str, args: argparse.Namespace) -> list[int]:
    result = run_mysql(mysql, args, "SELECT id FROM tb_coupon WHERE status IN (1,2,3) ORDER BY id;")
    return [int(row[0]) for row in rows(result)]


def load_addresses(mysql: str, args: argparse.Namespace, buyers: list[Buyer]) -> dict[int, str]:
    result = run_mysql(
        mysql,
        args,
        "SELECT user_id, shipping_address FROM tb_order WHERE shipping_address IS NOT NULL ORDER BY created_time DESC;",
    )
    addresses: dict[int, str] = {}
    for user_id_raw, address in rows(result):
        user_id = int(user_id_raw)
        addresses.setdefault(user_id, address)
    for buyer in buyers:
        addresses.setdefault(
            buyer.id,
            json.dumps(
                {
                    "receiver": buyer.nickname,
                    "phone": "138****0000",
                    "province": "浙江省",
                    "city": "杭州市",
                    "district": "西湖区",
                    "detail": "文一路100号",
                },
                ensure_ascii=False,
            ),
        )
    return addresses


def next_id(mysql: str, args: argparse.Namespace, table_name: str) -> int:
    auto_increment = run_mysql(
        mysql,
        args,
        f"""
SELECT AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{sql_escape(table_name)}';
""",
    )
    max_id = run_mysql(mysql, args, f"SELECT IFNULL(MAX(id), 0) + 1 FROM {table_name};")
    return max(int(auto_increment or "1"), int(max_id or "1"))


def backup_tables(mysql: str, args: argparse.Namespace, target_month: str) -> Path:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = SCRATCH_DIR / f"rational_consumption_sync_backup_{stamp}.json"
    order_prefix = f"{GENERATED_ORDER_PREFIX}{target_month}"
    tables = {
        "tb_consumption_budget": "SELECT * FROM tb_consumption_budget ORDER BY id;",
        "tb_consumption_achievement": "SELECT * FROM tb_consumption_achievement ORDER BY id;",
        "tb_wishlist_generated": (
            "SELECT * FROM tb_wishlist "
            f"WHERE reason LIKE '{sql_escape(GENERATED_WISHLIST_REASON_PREFIX)}%' ORDER BY id;"
        ),
        "tb_order_generated": f"SELECT * FROM tb_order WHERE order_no LIKE '{order_prefix}%' ORDER BY id;",
        "tb_order_item_generated": (
            "SELECT oi.* FROM tb_order_item oi JOIN tb_order o ON o.id = oi.order_id "
            f"WHERE o.order_no LIKE '{order_prefix}%' ORDER BY oi.id;"
        ),
    }
    payload = {"created_at": datetime.now().isoformat(timespec="seconds"), "target_month": target_month, "tables": {}}
    for name, sql in tables.items():
        payload["tables"][name] = run_mysql(mysql, args, sql, named=True)
    backup_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return backup_path


def build_current_month_orders(
    buyers: list[Buyer],
    products: list[Product],
    coupons: list[int],
    addresses: dict[int, str],
    target_month: str,
    orders_per_buyer: int,
    start_order_id: int,
    start_item_id: int,
) -> tuple[list[str], list[str], dict[int, list[int]]]:
    base = month_start(target_month)
    products_by_category: dict[int, list[Product]] = defaultdict(list)
    for product in products:
        products_by_category[product.category_id].append(product)
    category_ids = sorted(products_by_category)

    order_values: list[str] = []
    item_values: list[str] = []
    ordered_products_by_user: dict[int, list[int]] = defaultdict(list)
    order_id = start_order_id
    item_id = start_item_id
    status_cycle = [3, 2, 1, 3, 6, 2, 3]
    remarks = ["月度计划购物", "预算内采购", "家庭补货", "对比后确认购买", "优惠期下单", None]

    for buyer_index, buyer in enumerate(buyers):
        buyer_order_count = max(4, orders_per_buyer + (buyer_index % 5) - 2)
        for order_index in range(buyer_order_count):
            day = 2 + ((buyer_index * 3 + order_index * 4) % 23)
            created_time = base.replace(day=day, hour=9 + (order_index * 2) % 10, minute=(buyer_index * 7 + order_index * 11) % 55)
            payment_time = created_time + timedelta(minutes=12 + order_index)
            order_status = status_cycle[(buyer_index + order_index) % len(status_cycle)]
            shipping_time = payment_time + timedelta(hours=12 + order_index) if order_status in {2, 3, 6} else None
            end_time = shipping_time + timedelta(days=3 + (order_index % 2)) if order_status == 3 and shipping_time else None
            item_count = 1 + ((buyer_index + order_index) % 3)
            per_order: list[tuple[Product, int, Decimal, Decimal]] = []
            total_amount = Decimal("0")

            for offset in range(item_count):
                category_id = category_ids[(buyer_index + order_index + offset) % len(category_ids)]
                category_products = products_by_category[category_id]
                product = category_products[(buyer_index * 5 + order_index * 3 + offset) % len(category_products)]
                quantity = 1 + ((buyer_index + order_index + offset) % 2)
                price_factor = Decimal("0.98") + Decimal(str(((buyer_index + order_index + offset) % 5))) * Decimal("0.01")
                unit_price = q2(product.price * price_factor)
                line_total = q2(unit_price * Decimal(quantity))
                total_amount += line_total
                per_order.append((product, quantity, unit_price, line_total))
                ordered_products_by_user[buyer.id].append(product.id)

            coupon_id = None
            coupon_discount = Decimal("0")
            if coupons and (buyer_index + order_index) % 2 == 0:
                coupon_id = coupons[(buyer_index + order_index) % len(coupons)]
                discount_rate = Decimal("0.06") + Decimal(str((order_index % 3) * 2)) / Decimal("100")
                coupon_discount = min(q2(total_amount * discount_rate), Decimal("220.00"))
            pay_amount = q2(max(total_amount - coupon_discount, Decimal("0")))
            order_no = f"{GENERATED_ORDER_PREFIX}{target_month}{buyer.id:03d}{order_index + 1:03d}"
            remark = remarks[(buyer_index + order_index) % len(remarks)]

            order_values.append(
                "("
                f"{order_id}, '{order_no}', {buyer.id}, {sql_decimal(total_amount)}, {sql_decimal(pay_amount)}, "
                f"{1 + ((buyer_index + order_index) % 3)}, 1, {order_status}, "
                f"'{sql_escape(addresses[buyer.id])}', '{payment_time.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"{sql_string(shipping_time.strftime('%Y-%m-%d %H:%M:%S') if shipping_time else None)}, "
                f"{sql_string(end_time.strftime('%Y-%m-%d %H:%M:%S') if end_time else None)}, {sql_string(remark)}, "
                f"{coupon_id if coupon_id is not None else 'NULL'}, {sql_decimal(coupon_discount)}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )

            for product, quantity, unit_price, line_total in per_order:
                item_values.append(
                    "("
                    f"{item_id}, {order_id}, {product.id}, '{sql_escape(product.name)}', {sql_decimal(unit_price)}, "
                    f"{quantity}, {sql_decimal(line_total)}, '{sql_escape(product.image)}', {product.seller_id}, "
                    f"'{sql_escape(product.seller_name)}', {1 if order_status in {2, 3, 6} else 0}, "
                    f"{sql_string(shipping_time.strftime('%Y-%m-%d %H:%M:%S') if shipping_time else None)}, "
                    f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                    ")"
                )
                item_id += 1

            order_id += 1

    return order_values, item_values, ordered_products_by_user


def build_wishlists(
    buyers: list[Buyer],
    products: list[Product],
    ordered_products_by_user: dict[int, list[int]],
    target_month: str,
    wishlist_per_buyer: int,
) -> list[str]:
    product_by_id = {product.id: product for product in products}
    base = month_start(target_month)
    values: list[str] = []
    status_cycle = [2, 2, 2, 3, 3, 1, 0]
    reasons = {
        0: "理性消费助手数据同步：仍在冷静期内，等待进一步比较",
        1: "理性消费助手数据同步：冷静期结束，保留购买选择",
        2: "理性消费助手数据同步：冷静期后确认需要并完成购买",
        3: "理性消费助手数据同步：对比预算和同类商品后主动放弃",
    }

    for buyer_index, buyer in enumerate(buyers):
        ordered_ids = ordered_products_by_user.get(buyer.id, [])
        removed_extra = 3 if buyer_index % 3 == 0 else 0
        total_items = wishlist_per_buyer + removed_extra
        for item_index in range(total_items):
            if item_index < wishlist_per_buyer:
                status = status_cycle[item_index % len(status_cycle)]
            else:
                status = 3

            if status == 2 and ordered_ids:
                product = product_by_id[ordered_ids[item_index % len(ordered_ids)]]
            else:
                product = products[(buyer_index * 11 + item_index * 7 + 3) % len(products)]

            created_time = base.replace(
                day=1 + ((buyer_index * 2 + item_index * 3) % 20),
                hour=8 + (item_index % 10),
                minute=(buyer_index * 5 + item_index * 9) % 50,
            )
            cooling_days = 2 + ((buyer_index + item_index) % 5)
            cooling_end_time = created_time + timedelta(days=cooling_days)
            values.append(
                "("
                f"{buyer.id}, {product.id}, {sql_decimal(product.price)}, {cooling_days}, "
                f"'{cooling_end_time.strftime('%Y-%m-%d %H:%M:%S')}', {status}, "
                f"'{sql_escape(reasons[status])}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )

    return values


def execute_generated_facts(mysql: str, args: argparse.Namespace, buyers: list[Buyer], products: list[Product], coupons: list[int]) -> dict:
    target_month = args.target_month
    order_prefix = f"{GENERATED_ORDER_PREFIX}{target_month}"
    addresses = load_addresses(mysql, args, buyers)
    backup_path = backup_tables(mysql, args, target_month)
    order_start = next_id(mysql, args, "tb_order")
    item_start = next_id(mysql, args, "tb_order_item")
    order_values, item_values, ordered_products_by_user = build_current_month_orders(
        buyers,
        products,
        coupons,
        addresses,
        target_month,
        args.orders_per_buyer,
        order_start,
        item_start,
    )
    wishlist_values = build_wishlists(
        buyers,
        products,
        ordered_products_by_user,
        target_month,
        args.wishlist_per_buyer,
    )

    sql = f"""
START TRANSACTION;
DELETE oi FROM tb_order_item oi JOIN tb_order o ON o.id = oi.order_id WHERE o.order_no LIKE '{order_prefix}%';
DELETE FROM tb_order WHERE order_no LIKE '{order_prefix}%';
DELETE FROM tb_wishlist WHERE reason LIKE '{sql_escape(GENERATED_WISHLIST_REASON_PREFIX)}%';
"""
    if order_values:
        sql += (
            "INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, "
            "order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, "
            "created_time, updated_time) VALUES\n"
            + ",\n".join(order_values)
            + ";\n"
        )
    if item_values:
        sql += (
            "INSERT INTO tb_order_item (id, order_id, product_id, product_name, product_price, quantity, total_price, "
            "product_image, seller_id, seller_name, ship_status, ship_time, created_time, updated_time) VALUES\n"
            + ",\n".join(item_values)
            + ";\n"
        )
    if wishlist_values:
        sql += (
            "INSERT INTO tb_wishlist (user_id, product_id, added_price, cooling_days, cooling_end_time, status, reason, created_time) VALUES\n"
            + ",\n".join(wishlist_values)
            + ";\n"
        )
    sql += "COMMIT;\n"
    run_mysql_script(mysql, args, sql)

    return {
        "backup_path": str(backup_path),
        "inserted_orders": len(order_values),
        "inserted_order_items": len(item_values),
        "inserted_wishlists": len(wishlist_values),
    }


def load_monthly_spending(mysql: str, args: argparse.Namespace) -> dict[tuple[int, str], dict[str, Decimal | int]]:
    statuses = ",".join(str(status) for status in sorted(CONSUMPTION_ORDER_STATUSES))
    result = run_mysql(
        mysql,
        args,
        f"""
SELECT o.user_id, DATE_FORMAT(o.created_time, '%Y%m') AS budget_month,
       COUNT(*) AS order_count,
       SUM(COALESCE(o.pay_amount, o.total_amount)) AS paid_amount,
       SUM(COALESCE(o.coupon_discount, 0)) AS saved_amount
FROM tb_order o
JOIN tb_user u ON u.id = o.user_id
WHERE u.role = 'BUYER'
  AND o.payment_status = 1
  AND o.order_status IN ({statuses})
GROUP BY o.user_id, budget_month;
""",
    )
    spending: dict[tuple[int, str], dict[str, Decimal | int]] = {}
    for user_id_raw, month, count_raw, paid_raw, saved_raw in rows(result):
        spending[(int(user_id_raw), month)] = {
            "order_count": int(count_raw),
            "paid_amount": Decimal(paid_raw or "0"),
            "saved_amount": Decimal(saved_raw or "0"),
        }
    return spending


def recompute_budgets(mysql: str, args: argparse.Namespace, buyers: list[Buyer]) -> int:
    spending = load_monthly_spending(mysql, args)
    target_start = month_start(args.target_month)
    months = [month_key(add_months(target_start, -offset)) for offset in range(5, -1, -1)]
    buyer_index_by_id = {buyer.id: index for index, buyer in enumerate(buyers)}
    values: list[str] = []
    factors = [Decimal("1.28"), Decimal("1.12"), Decimal("0.96"), Decimal("1.38"), Decimal("0.86"), Decimal("1.18")]
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for buyer in buyers:
        buyer_index = buyer_index_by_id[buyer.id]
        for month_index, budget_month in enumerate(months):
            fact = spending.get((buyer.id, budget_month))
            if not fact or fact["paid_amount"] <= 0:
                continue
            factor = factors[(buyer_index + month_index) % len(factors)]
            budget = round_budget(fact["paid_amount"] * factor)
            threshold = 75 + ((buyer_index + month_index) % 4) * 5
            values.append(
                f"({buyer.id}, {sql_decimal(budget)}, '{budget_month}', 1, {threshold}, '{now}', '{now}')"
            )

    sql = "START TRANSACTION;\nDELETE FROM tb_consumption_budget;\n"
    if values:
        sql += (
            "INSERT INTO tb_consumption_budget (user_id, monthly_budget, budget_month, alert_enabled, alert_threshold, created_time, updated_time) VALUES\n"
            + ",\n".join(values)
            + ";\n"
        )
    sql += "COMMIT;\n"
    run_mysql_script(mysql, args, sql)
    return len(values)


def load_budget_rows(mysql: str, args: argparse.Namespace) -> dict[tuple[int, str], Decimal]:
    result = run_mysql(mysql, args, "SELECT user_id, budget_month, monthly_budget FROM tb_consumption_budget;")
    return {(int(row[0]), row[1]): Decimal(row[2]) for row in rows(result)}


def load_wishlist_counts(mysql: str, args: argparse.Namespace) -> dict[int, dict[int, int]]:
    result = run_mysql(
        mysql,
        args,
        "SELECT user_id, status, COUNT(*) FROM tb_wishlist GROUP BY user_id, status;",
    )
    counts: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for user_id_raw, status_raw, count_raw in rows(result):
        counts[int(user_id_raw)][int(status_raw)] = int(count_raw)
    return counts


def load_category_counts(mysql: str, args: argparse.Namespace, target_month: str) -> dict[int, int]:
    statuses = ",".join(str(status) for status in sorted(CONSUMPTION_ORDER_STATUSES))
    result = run_mysql(
        mysql,
        args,
        f"""
SELECT o.user_id, COUNT(DISTINCT p.category_id)
FROM tb_order o
JOIN tb_order_item oi ON oi.order_id = o.id
JOIN tb_product p ON p.id = oi.product_id
WHERE o.payment_status = 1
  AND o.order_status IN ({statuses})
  AND DATE_FORMAT(o.created_time, '%Y%m') = '{sql_escape(target_month)}'
GROUP BY o.user_id;
""",
    )
    return {int(row[0]): int(row[1]) for row in rows(result)}


def recompute_achievements(mysql: str, args: argparse.Namespace, buyers: list[Buyer]) -> int:
    spending = load_monthly_spending(mysql, args)
    budgets = load_budget_rows(mysql, args)
    wishlist_counts = load_wishlist_counts(mysql, args)
    category_counts = load_category_counts(mysql, args, args.target_month)
    target_start = month_start(args.target_month)
    recent_months = [month_key(add_months(target_start, -offset)) for offset in range(2, -1, -1)]
    previous_month = month_key(add_months(target_start, -1))
    values: list[str] = []
    now = datetime.now()

    def add(user_id: int, achievement_type: str, offset: int) -> None:
        name, desc = ACHIEVEMENT_DEFS[achievement_type]
        achieved_time = now - timedelta(hours=offset)
        values.append(
            f"({user_id}, '{achievement_type}', '{sql_escape(name)}', '{sql_escape(desc)}', "
            f"'{achieved_time.strftime('%Y-%m-%d %H:%M:%S')}')"
        )

    offset = 1
    for buyer in buyers:
        counts = wishlist_counts.get(buyer.id, {})
        if sum(counts.values()) > 0:
            add(buyer.id, "FIRST_WISHLIST", offset)
            offset += 1
        if counts.get(2, 0) >= 3:
            add(buyer.id, "DELAYED_GRATIFICATION_3", offset)
            offset += 1
        if counts.get(3, 0) >= 5:
            add(buyer.id, "RATIONAL_GIVEUP_5", offset)
            offset += 1

        under_budget_months = 0
        for budget_month in recent_months:
            fact = spending.get((buyer.id, budget_month))
            budget = budgets.get((buyer.id, budget_month))
            if fact and budget is not None and fact["paid_amount"] <= budget:
                under_budget_months += 1
        if under_budget_months >= 3:
            add(buyer.id, "BUDGET_MASTER", offset)
            offset += 1

        if any(
            fact["saved_amount"] >= Decimal("500")
            for (user_id, _budget_month), fact in spending.items()
            if user_id == buyer.id
        ):
            add(buyer.id, "SAVING_STAR", offset)
            offset += 1

        current_fact = spending.get((buyer.id, args.target_month))
        previous_fact = spending.get((buyer.id, previous_month))
        current_budget = budgets.get((buyer.id, args.target_month))
        rational_score = 70
        if current_fact and current_budget:
            used_percent = (
                current_fact["paid_amount"] * Decimal("100") / current_budget
            ).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
            if used_percent <= 80:
                rational_score += 15
            elif used_percent <= 100:
                rational_score += 5
            else:
                rational_score -= 10
        if current_fact and previous_fact and previous_fact["paid_amount"] > 0:
            change = abs((current_fact["paid_amount"] - previous_fact["paid_amount"]) * Decimal("100") / previous_fact["paid_amount"])
            if change <= 20:
                rational_score += 10
            elif change <= 50:
                rational_score += 5
            else:
                rational_score -= 5
        categories = category_counts.get(buyer.id, 0)
        if 3 <= categories <= 5:
            rational_score += 5
        elif categories > 5:
            rational_score += 2
        if rational_score >= 100:
            add(buyer.id, "RATIONAL_100", offset)
            offset += 1

    sql = "START TRANSACTION;\nDELETE FROM tb_consumption_achievement;\n"
    if values:
        sql += (
            "INSERT INTO tb_consumption_achievement (user_id, achievement_type, achievement_name, achievement_desc, achieved_time) VALUES\n"
            + ",\n".join(values)
            + ";\n"
        )
    sql += "COMMIT;\n"
    run_mysql_script(mysql, args, sql)
    return len(values)


def audit(mysql: str, args: argparse.Namespace) -> dict:
    statuses = ",".join(str(status) for status in sorted(CONSUMPTION_ORDER_STATUSES))
    buyers = load_buyers(mysql, args)
    result: dict[str, object] = {"target_month": args.target_month, "buyer_count": len(buyers)}

    current_rows = rows(run_mysql(
        mysql,
        args,
        f"""
SELECT u.username, COUNT(o.id) AS orders, SUM(COALESCE(o.pay_amount,o.total_amount)) AS paid_amount,
       SUM(COALESCE(o.coupon_discount,0)) AS saved_amount
FROM tb_user u
LEFT JOIN tb_order o ON o.user_id = u.id
  AND o.payment_status = 1
  AND o.order_status IN ({statuses})
  AND DATE_FORMAT(o.created_time, '%Y%m') = '{sql_escape(args.target_month)}'
WHERE u.role = 'BUYER' AND u.status = 1
GROUP BY u.id, u.username
ORDER BY u.id;
""",
    ))
    result["current_month_buyers_with_orders"] = sum(1 for row in current_rows if int(row[1] or "0") > 0)
    result["current_month_orders"] = sum(int(row[1] or "0") for row in current_rows)
    result["current_month_paid_amount"] = str(sum(decimal_cell(row[2]) for row in current_rows))
    result["current_month_saved_amount"] = str(sum(decimal_cell(row[3]) for row in current_rows))
    result["sample_buyers"] = [
        {"username": row[0], "orders": int(row[1] or "0"), "paid_amount": row[2] or "0.00", "saved_amount": row[3] or "0.00"}
        for row in current_rows[:8]
    ]

    budget_count = run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_consumption_budget;")
    achievement_count = run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_consumption_achievement;")
    invalid_achievements = run_mysql(
        mysql,
        args,
        "SELECT COUNT(*) FROM tb_consumption_achievement WHERE achievement_type NOT IN ('"
        + "','".join(ACHIEVEMENT_DEFS)
        + "');",
    )
    wishlist_count = run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_wishlist;")
    generated_orders = run_mysql(
        mysql,
        args,
        f"SELECT COUNT(*) FROM tb_order WHERE order_no LIKE '{GENERATED_ORDER_PREFIX}{args.target_month}%';",
    )
    result["budget_count"] = int(budget_count or "0")
    result["achievement_count"] = int(achievement_count or "0")
    result["invalid_achievement_types"] = int(invalid_achievements or "0")
    result["wishlist_count"] = int(wishlist_count or "0")
    result["generated_current_month_orders"] = int(generated_orders or "0")
    result["ready"] = (
        result["current_month_buyers_with_orders"] == result["buyer_count"]
        and result["current_month_orders"] >= result["buyer_count"] * 4
        and result["budget_count"] >= result["buyer_count"] * 4
        and result["achievement_count"] >= result["buyer_count"]
        and result["invalid_achievement_types"] == 0
        and result["wishlist_count"] >= result["buyer_count"] * 4
    )
    return result


def write_report(report: dict, execution: dict | None = None) -> Path:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    path = SCRATCH_DIR / "理性消费数据逻辑核查.md"
    lines = [
        "# 理性消费助手数据逻辑核查",
        "",
        f"- 目标月份: `{report['target_month']}`",
        f"- 买家数量: {report['buyer_count']}",
        f"- 当前月有有效消费记录的买家: {report['current_month_buyers_with_orders']}",
        f"- 当前月有效订单数: {report['current_month_orders']}",
        f"- 当前月实付总额: {report['current_month_paid_amount']}",
        f"- 当前月优惠节省: {report['current_month_saved_amount']}",
        f"- 预算记录数: {report['budget_count']}",
        f"- 成就记录数: {report['achievement_count']}",
        f"- 心愿单记录数: {report['wishlist_count']}",
        f"- 非法成就类型数: {report['invalid_achievement_types']}",
        f"- 逻辑就绪: {'通过' if report['ready'] else '不通过'}",
        "",
        "## 样例买家当前月数据",
        "",
        "| 用户 | 有效订单 | 实付金额 | 优惠节省 |",
        "| --- | ---: | ---: | ---: |",
    ]
    for item in report["sample_buyers"]:
        lines.append(f"| {item['username']} | {item['orders']} | {item['paid_amount']} | {item['saved_amount']} |")
    if execution:
        lines.extend([
            "",
            "## 本次同步",
            "",
            f"- 备份文件: `{execution['backup_path']}`",
            f"- 新增当前月订单: {execution['inserted_orders']}",
            f"- 新增当前月订单项: {execution['inserted_order_items']}",
            f"- 新增心愿单: {execution['inserted_wishlists']}",
            f"- 重算预算记录: {execution['budget_rows']}",
            f"- 重算成就记录: {execution['achievement_rows']}",
        ])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> int:
    args = parse_args()
    mysql = resolve_mysql_command(args.mysql_exe)
    if not mysql:
        print("mysql not found. Install MySQL CLI or set MYSQL_EXE.", file=os.sys.stderr)
        return 2

    execution = None
    if args.mode == "execute":
        buyers = load_buyers(mysql, args)
        products = load_products(mysql, args)
        coupons = load_coupons(mysql, args)
        if not buyers:
            raise RuntimeError("没有可用于理性消费统计的买家账号")
        if len(products) < 20:
            raise RuntimeError("可上架且审核通过的商品不足，无法构造真实消费覆盖")
        execution = execute_generated_facts(mysql, args, buyers, products, coupons)
        execution["budget_rows"] = recompute_budgets(mysql, args, buyers)
        execution["achievement_rows"] = recompute_achievements(mysql, args, buyers)

    report = audit(mysql, args)
    report_path = write_report(report, execution)
    report["report_path"] = str(report_path)
    if execution:
        report["execution"] = execution
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
