#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

from sync_rational_consumption_data import (
    CONSUMPTION_ORDER_STATUSES,
    PROJECT_ROOT,
    SCRATCH_DIR,
    load_addresses,
    load_buyers,
    load_coupons,
    load_products,
    next_id,
    q2,
    resolve_mysql_command,
    rows,
    run_mysql,
    run_mysql_script,
    sql_decimal,
    sql_escape,
    sql_string,
)


HQ_ORDER_PREFIX = "HQ"
HQ_NOTIFICATION_MARKER = "数据增强:"
HQ_WISHLIST_REASON_PREFIX = "高质量演示数据"
HQ_PRICE_HISTORY_SECOND = 17

SEARCH_KEYWORDS = [
    "机械键盘", "降噪耳机", "佳能 EOS", "北欧客厅落地灯", "奶油风餐具",
    "通勤帆布包", "香薰机", "挂耳咖啡", "瑜伽垫", "桌面收纳",
    "护肤乳液", "复古板鞋", "便携吸尘器", "露营折叠椅", "珍珠耳钉",
    "空气炸锅", "床头灯", "无线鼠标", "保温杯", "积木摆件",
]

REVIEW_TEXTS = [
    "实物质感比预期更稳，包装也完整，和页面图片一致。",
    "用了几天再来评价，功能和做工都比较扎实，适合日常使用。",
    "颜色和材质都很耐看，放在家里或桌面上不会突兀。",
    "物流速度正常，细节处理不错，整体符合这个价位。",
    "对比了几款后选的这件，实际体验比较均衡。",
    "尺寸刚好，使用起来顺手，商品描述没有夸张成分。",
    "家里人也觉得不错，后续有活动会考虑再买同类商品。",
    "图片和实物匹配度高，主体清楚，没有踩雷。",
]

REVIEW_REPLIES = [
    "感谢认真反馈，后续我们会继续保持商品质量。",
    "谢谢支持，使用中有问题可以随时联系售后。",
    "感谢评价，您的体验对后续选品很有参考价值。",
    "收到反馈了，祝您使用愉快。",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Add high-quality, multi-dimensional demo data.")
    parser.add_argument("--mode", choices=["audit", "execute"], default="audit")
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "shopping_mall"))
    parser.add_argument("--db-user", default=os.environ.get("DB_USERNAME", "root"))
    parser.add_argument("--db-password", default=os.environ.get("DB_PASSWORD", "123456"))
    parser.add_argument("--db-host", default=os.environ.get("DB_HOST", ""))
    parser.add_argument("--db-port", default=os.environ.get("DB_PORT", ""))
    parser.add_argument("--mysql-exe", default=os.environ.get("MYSQL_EXE", ""))
    parser.add_argument("--target-month", default="202605")
    return parser.parse_args()


def chunked(items: list[str], size: int = 160):
    for index in range(0, len(items), size):
        yield items[index:index + size]


def add_months(dt: datetime, delta: int) -> datetime:
    month = dt.month - 1 + delta
    year = dt.year + month // 12
    month = month % 12 + 1
    return datetime(year, month, 1, dt.hour, dt.minute, dt.second)


def month_start(target_month: str) -> datetime:
    return datetime(int(target_month[:4]), int(target_month[4:6]), 1, 9, 0, 0)


def order_count_for_month(buyer_index: int, month_index: int) -> int:
    base_by_month = [1, 2, 3, 3, 2]
    return base_by_month[month_index] + ((buyer_index + month_index) % 3)


def backup_tables(mysql: str, args: argparse.Namespace) -> Path:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = SCRATCH_DIR / f"high_quality_demo_data_backup_{stamp}.json"
    payload = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "tables": {
            "tb_order_hq": run_mysql(mysql, args, f"SELECT * FROM tb_order WHERE order_no LIKE '{HQ_ORDER_PREFIX}%';", named=True),
            "tb_order_item_hq": run_mysql(
                mysql,
                args,
                f"SELECT oi.* FROM tb_order_item oi JOIN tb_order o ON o.id=oi.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';",
                named=True,
            ),
            "tb_review_hq": run_mysql(
                mysql,
                args,
                f"SELECT r.* FROM tb_review r JOIN tb_order o ON o.id=r.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';",
                named=True,
            ),
            "tb_price_history_hq": run_mysql(
                mysql,
                args,
                f"SELECT * FROM tb_price_history WHERE SECOND(recorded_time) = {HQ_PRICE_HISTORY_SECOND};",
                named=True,
            ),
            "notifications_hq": run_mysql(
                mysql,
                args,
                f"SELECT * FROM notifications WHERE message LIKE '{HQ_NOTIFICATION_MARKER}%';",
                named=True,
            ),
        },
    }
    backup_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return backup_path


def sync_order_items_to_current_products(mysql: str, args: argparse.Namespace) -> int:
    before = run_mysql(
        mysql,
        args,
        """
SELECT COUNT(*)
FROM tb_order_item oi
JOIN tb_product p ON p.id = oi.product_id
WHERE oi.product_name <> p.name
   OR IFNULL(oi.product_image, '') <> IFNULL(p.main_image, '')
   OR oi.seller_id <> p.seller_id
   OR oi.seller_name <> p.seller_name;
""",
    )
    run_mysql_script(
        mysql,
        args,
        """
UPDATE tb_order_item oi
JOIN tb_product p ON p.id = oi.product_id
SET oi.product_name = p.name,
    oi.product_image = p.main_image,
    oi.seller_id = p.seller_id,
    oi.seller_name = p.seller_name,
    oi.updated_time = NOW();
""",
    )
    return int(before or "0")


def build_hq_orders(mysql: str, args: argparse.Namespace) -> tuple[list[str], list[str], list[dict], dict[int, set[int]]]:
    buyers = load_buyers(mysql, args)
    products = load_products(mysql, args)
    coupons = load_coupons(mysql, args)
    addresses = load_addresses(mysql, args, buyers)
    products_by_category: dict[int, list] = defaultdict(list)
    for product in products:
        products_by_category[product.category_id].append(product)
    category_ids = sorted(products_by_category)
    base = month_start(args.target_month)
    months = [add_months(base, -offset) for offset in range(4, -1, -1)]
    order_id = next_id(mysql, args, "tb_order")
    item_id = next_id(mysql, args, "tb_order_item")
    order_values: list[str] = []
    item_values: list[str] = []
    review_candidates: list[dict] = []
    ordered_products_by_user: dict[int, set[int]] = defaultdict(set)
    status_cycle = [3, 2, 1, 3, 6, 4, 3, 5, 0, 2, 1]
    remarks = [
        "对比价格后下单",
        "家里日常补货",
        "工作日白天配送",
        "活动期间购买",
        "送家人使用",
        "预算内计划采购",
        None,
    ]

    for buyer_index, buyer in enumerate(buyers):
        for month_index, month in enumerate(months):
            count = order_count_for_month(buyer_index, month_index)
            for order_index in range(count):
                day = 2 + ((buyer_index * 5 + month_index * 3 + order_index * 4) % 24)
                created_time = month.replace(
                    day=day,
                    hour=8 + ((buyer_index + order_index * 2) % 12),
                    minute=(buyer_index * 7 + month_index * 13 + order_index * 11) % 58,
                )
                order_status = status_cycle[(buyer_index + month_index + order_index) % len(status_cycle)]
                payment_status = 0 if order_status == 0 else 1
                payment_time = created_time + timedelta(minutes=10 + order_index * 3) if payment_status == 1 else None
                shipping_time = payment_time + timedelta(hours=10 + (buyer_index + order_index) % 18) if order_status in {2, 3, 5, 6} and payment_time else None
                end_time = shipping_time + timedelta(days=2 + (buyer_index + order_index) % 4) if order_status == 3 and shipping_time else None
                item_count = 1 + ((buyer_index + month_index + order_index) % 3)
                total_amount = Decimal("0")
                per_order = []

                for offset in range(item_count):
                    category_id = category_ids[(buyer_index + month_index * 2 + order_index + offset) % len(category_ids)]
                    pool = products_by_category[category_id]
                    product = pool[(buyer_index * 7 + month_index * 5 + order_index * 3 + offset) % len(pool)]
                    quantity = 1 + ((buyer_index + month_index + offset) % 2)
                    factor = Decimal("0.97") + Decimal((buyer_index + order_index + offset) % 7) / Decimal("100")
                    unit_price = q2(product.price * factor)
                    line_total = q2(unit_price * Decimal(quantity))
                    total_amount += line_total
                    per_order.append((product, quantity, unit_price, line_total))
                    ordered_products_by_user[buyer.id].add(product.id)

                coupon_id = None
                coupon_discount = Decimal("0")
                if coupons and payment_status == 1 and (buyer_index + month_index + order_index) % 3 == 0:
                    coupon_id = coupons[(buyer_index + month_index + order_index) % len(coupons)]
                    coupon_discount = min(q2(total_amount * Decimal("0.07")), Decimal("160.00"))
                pay_amount = q2(max(total_amount - coupon_discount, Decimal("0")))
                order_no = f"{HQ_ORDER_PREFIX}{created_time.strftime('%Y%m%d')}{buyer.id:03d}{order_index + 1:02d}{month_index}"
                remark = remarks[(buyer_index + month_index + order_index) % len(remarks)]

                order_values.append(
                    "("
                    f"{order_id}, '{order_no}', {buyer.id}, {sql_decimal(total_amount)}, {sql_decimal(pay_amount)}, "
                    f"{1 + ((buyer_index + month_index + order_index) % 3)}, {payment_status}, {order_status}, "
                    f"'{sql_escape(addresses[buyer.id])}', {sql_string(payment_time.strftime('%Y-%m-%d %H:%M:%S') if payment_time else None)}, "
                    f"{sql_string(shipping_time.strftime('%Y-%m-%d %H:%M:%S') if shipping_time else None)}, "
                    f"{sql_string(end_time.strftime('%Y-%m-%d %H:%M:%S') if end_time else None)}, {sql_string(remark)}, "
                    f"{coupon_id if coupon_id is not None else 'NULL'}, {sql_decimal(coupon_discount)}, "
                    f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                    ")"
                )

                for item_index, (product, quantity, unit_price, line_total) in enumerate(per_order):
                    item_values.append(
                        "("
                        f"{item_id}, {order_id}, {product.id}, '{sql_escape(product.name)}', {sql_decimal(unit_price)}, "
                        f"{quantity}, {sql_decimal(line_total)}, '{sql_escape(product.image)}', {product.seller_id}, "
                        f"'{sql_escape(product.seller_name)}', {1 if order_status in {2, 3, 5, 6} else 0}, "
                        f"{sql_string(shipping_time.strftime('%Y-%m-%d %H:%M:%S') if shipping_time else None)}, "
                        f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                        ")"
                    )
                    if order_status == 3 and item_index == 0 and (buyer_index + month_index + order_index) % 4 != 0:
                        review_candidates.append(
                            {
                                "product_id": product.id,
                                "user_id": buyer.id,
                                "order_id": order_id,
                                "order_item_id": item_id,
                                "created_time": (end_time or created_time) + timedelta(days=1, hours=(buyer_index + order_index) % 8),
                                "seller_name": product.seller_name,
                                "rating": 5 if (buyer_index + order_index) % 5 else 4,
                            }
                        )
                    item_id += 1

                order_id += 1

    return order_values, item_values, review_candidates, ordered_products_by_user


def build_reviews(review_candidates: list[dict]) -> list[str]:
    values: list[str] = []
    for index, item in enumerate(review_candidates):
        reply = REVIEW_REPLIES[index % len(REVIEW_REPLIES)] if index % 3 != 0 else None
        reply_time = item["created_time"] + timedelta(hours=6) if reply else None
        values.append(
            "("
            f"{item['product_id']}, {item['user_id']}, {item['order_id']}, {item['order_item_id']}, {item['rating']}, "
            f"'{sql_escape(REVIEW_TEXTS[index % len(REVIEW_TEXTS)])}', '[]', {1 if index % 9 == 0 else 0}, "
            f"{sql_string(reply)}, {sql_string(reply_time.strftime('%Y-%m-%d %H:%M:%S') if reply_time else None)}, "
            f"'{item['created_time'].strftime('%Y-%m-%d %H:%M:%S')}'"
            ")"
        )
    return values


def build_price_history(mysql: str, args: argparse.Namespace) -> list[str]:
    products = load_products(mysql, args)
    base = month_start(args.target_month)
    values: list[str] = []
    for index, product in enumerate(products):
        original = product.price * Decimal("1.18")
        price_points = [
            (add_months(base, -3).replace(day=3 + index % 20, hour=6, minute=7, second=HQ_PRICE_HISTORY_SECOND), original, "INITIAL"),
            (add_months(base, -2).replace(day=5 + index % 18, hour=6, minute=19, second=HQ_PRICE_HISTORY_SECOND), product.price * Decimal("1.08"), "DECREASE"),
            (add_months(base, -1).replace(day=4 + index % 20, hour=6, minute=31, second=HQ_PRICE_HISTORY_SECOND), product.price * Decimal("1.03"), "DECREASE"),
            (base.replace(day=2 + index % 24, hour=6, minute=43, second=HQ_PRICE_HISTORY_SECOND), product.price, "DECREASE"),
        ]
        previous = None
        for recorded_time, raw_price, change_type in price_points:
            price = q2(raw_price)
            change_amount = None if previous is None else q2(price - previous)
            change_rate = None
            if previous is not None and previous != 0:
                change_rate = q2((change_amount / previous) * Decimal("100"))
            values.append(
                "("
                f"{product.id}, {sql_decimal(price)}, {sql_decimal(q2(original))}, "
                f"'{recorded_time.strftime('%Y-%m-%d %H:%M:%S')}', '{change_type}', "
                f"{sql_decimal(change_amount) if change_amount is not None else 'NULL'}, "
                f"{sql_decimal(change_rate) if change_rate is not None else 'NULL'}"
                ")"
            )
            previous = price
    return values


def build_search_data(mysql: str, args: argparse.Namespace) -> tuple[list[str], list[str]]:
    buyers = load_buyers(mysql, args)
    base = month_start(args.target_month)
    history_values: list[str] = []
    stats: dict[tuple[str, str], int] = defaultdict(int)
    for buyer_index, buyer in enumerate(buyers):
        count = 6 + buyer_index % 5
        for item_index in range(count):
            keyword = SEARCH_KEYWORDS[(buyer_index * 3 + item_index) % len(SEARCH_KEYWORDS)]
            search_time = base - timedelta(days=(buyer_index * 2 + item_index * 3) % 45, hours=item_index % 9, minutes=buyer_index % 17)
            history_values.append(
                "("
                f"'{sql_escape(keyword)}', {buyer.id}, '{search_time.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"'{search_time.strftime('%Y-%m-%d %H:%M:%S')}', '{search_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
            stats[(keyword, search_time.strftime("%Y-%m-%d"))] += 12 + ((buyer_index + item_index) % 18)

    stats_values = [
        "("
        f"'{sql_escape(keyword)}', {count}, '{search_date}', '{search_date} 10:00:00', '{search_date} 10:00:00'"
        ")"
        for (keyword, search_date), count in sorted(stats.items())
    ]
    return history_values, stats_values


def build_notifications(mysql: str, args: argparse.Namespace) -> list[str]:
    buyers = load_buyers(mysql, args)
    products = load_products(mysql, args)
    base = month_start(args.target_month)
    values: list[str] = []
    for buyer_index, buyer in enumerate(buyers):
        product = products[(buyer_index * 5) % len(products)]
        specs = [
            ("order", "订单状态更新", f"{HQ_NOTIFICATION_MARKER}您购买的「{product.name}」订单状态已有更新，请留意物流进度。", product.id),
            ("price_alert", "关注商品价格提醒", f"{HQ_NOTIFICATION_MARKER}您关注的「{product.name}」近期价格有变化，可进入商品详情查看走势。", product.id),
            ("system", "本周精选清单", f"{HQ_NOTIFICATION_MARKER}根据近期浏览和购买记录，系统为您整理了更匹配的精选商品。", None),
        ]
        for spec_index, (notice_type, title, message, related_id) in enumerate(specs):
            created_time = base - timedelta(days=(buyer_index * 2 + spec_index * 5) % 35, hours=spec_index * 3)
            values.append(
                "("
                f"{buyer.id}, '{notice_type}', '{sql_escape(title)}', '{sql_escape(message)}', "
                f"{1 if (buyer_index + spec_index) % 3 == 0 else 0}, {related_id if related_id else 'NULL'}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
    return values


def build_user_coupons(mysql: str, args: argparse.Namespace) -> list[str]:
    coupons = load_coupons(mysql, args)
    if not coupons:
        return []
    result = run_mysql(
        mysql,
        args,
        f"SELECT id, user_id, coupon_id, created_time FROM tb_order WHERE order_no LIKE '{HQ_ORDER_PREFIX}%' AND coupon_id IS NOT NULL ORDER BY id;",
    )
    values: list[str] = []
    for order_id_raw, user_id_raw, coupon_id_raw, created_time_raw in rows(result):
        used_time = datetime.strptime(created_time_raw, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=22)
        values.append(
            "("
            f"{user_id_raw}, {coupon_id_raw}, 1, {order_id_raw}, "
            f"'{used_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time_raw}'"
            ")"
        )
    return values


def build_price_alerts(mysql: str, args: argparse.Namespace) -> list[str]:
    buyers = load_buyers(mysql, args)
    products = load_products(mysql, args)
    base = month_start(args.target_month)
    values: list[str] = []
    seen: set[tuple[int, int]] = set()
    for buyer_index, buyer in enumerate(buyers):
        for item_index in range(2 + buyer_index % 2):
            product = products[(buyer_index * 9 + item_index * 11) % len(products)]
            key = (buyer.id, product.id)
            if key in seen:
                continue
            seen.add(key)
            target_price = q2(product.price * (Decimal("0.86") + Decimal(item_index) / Decimal("100")))
            current_price = product.price
            status = [0, 1, 2][(buyer_index + item_index) % 3]
            triggered_time = base - timedelta(days=(buyer_index + item_index * 3) % 20) if status == 1 else None
            triggered_price = target_price if status == 1 else None
            created_time = base - timedelta(days=35 - (buyer_index + item_index) % 18)
            values.append(
                "("
                f"{buyer.id}, {product.id}, {sql_decimal(target_price)}, {sql_decimal(current_price)}, {status}, "
                f"{sql_string(triggered_time.strftime('%Y-%m-%d %H:%M:%S') if triggered_time else None)}, "
                f"{sql_decimal(triggered_price) if triggered_price is not None else 'NULL'}, {1 if status == 1 else 0}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
    return values


def build_carts(mysql: str, args: argparse.Namespace) -> list[str]:
    buyers = load_buyers(mysql, args)
    products = load_products(mysql, args)
    values: list[str] = []
    seen: set[tuple[int, int]] = set()
    base = month_start(args.target_month)
    for buyer_index, buyer in enumerate(buyers):
        for item_index in range(2 + buyer_index % 3):
            product = products[(buyer_index * 13 + item_index * 17) % len(products)]
            key = (buyer.id, product.id)
            if key in seen:
                continue
            seen.add(key)
            created_time = base - timedelta(days=(buyer_index + item_index) % 14, hours=item_index)
            values.append(
                "("
                f"{buyer.id}, {product.id}, {1 + (buyer_index + item_index) % 3}, {0 if item_index == 0 and buyer_index % 4 == 0 else 1}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
    return values


def execute(mysql: str, args: argparse.Namespace) -> dict:
    backup_path = backup_tables(mysql, args)
    updated_order_items = sync_order_items_to_current_products(mysql, args)
    order_values, item_values, review_candidates, _ordered_products = build_hq_orders(mysql, args)
    review_values = build_reviews(review_candidates)
    price_history_values = build_price_history(mysql, args)
    search_history_values, search_stats_values = build_search_data(mysql, args)
    notification_values = build_notifications(mysql, args)
    price_alert_values = build_price_alerts(mysql, args)
    cart_values = build_carts(mysql, args)

    cleanup_sql = f"""
START TRANSACTION;
DELETE r FROM tb_review r JOIN tb_order o ON o.id = r.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';
DELETE uc FROM tb_user_coupon uc JOIN tb_order o ON o.id = uc.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';
DELETE oi FROM tb_order_item oi JOIN tb_order o ON o.id = oi.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';
DELETE FROM tb_order WHERE order_no LIKE '{HQ_ORDER_PREFIX}%';
DELETE FROM tb_price_history WHERE SECOND(recorded_time) = {HQ_PRICE_HISTORY_SECOND};
DELETE FROM notifications WHERE message LIKE '{HQ_NOTIFICATION_MARKER}%';
DELETE FROM tb_search_history WHERE keyword IN ('{"','".join(sql_escape(item) for item in SEARCH_KEYWORDS)}');
DELETE FROM tb_search_stats WHERE keyword IN ('{"','".join(sql_escape(item) for item in SEARCH_KEYWORDS)}');
COMMIT;
"""
    run_mysql_script(mysql, args, cleanup_sql)

    insert_batches(mysql, args, "tb_order", "INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time, updated_time) VALUES ", order_values)
    insert_batches(mysql, args, "tb_order_item", "INSERT INTO tb_order_item (id, order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time, created_time, updated_time) VALUES ", item_values)
    insert_batches(mysql, args, "tb_review", "INSERT INTO tb_review (product_id, user_id, order_id, order_item_id, rating, content, images, is_anonymous, reply, reply_time, created_time) VALUES ", review_values)
    user_coupon_values = build_user_coupons(mysql, args)
    insert_batches(mysql, args, "tb_user_coupon", "INSERT INTO tb_user_coupon (user_id, coupon_id, status, order_id, used_time, created_time) VALUES ", user_coupon_values)
    insert_batches(mysql, args, "tb_price_history", "INSERT INTO tb_price_history (product_id, price, original_price, recorded_time, change_type, change_amount, change_rate) VALUES ", price_history_values)
    insert_batches(mysql, args, "tb_search_history", "INSERT INTO tb_search_history (keyword, user_id, search_time, created_time, updated_time) VALUES ", search_history_values)
    insert_batches(mysql, args, "tb_search_stats", "INSERT INTO tb_search_stats (keyword, search_count, search_date, created_time, updated_time) VALUES ", search_stats_values)
    insert_batches(mysql, args, "notifications", "INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_time) VALUES ", notification_values)
    insert_batches(
        mysql,
        args,
        "tb_price_alert",
        "INSERT INTO tb_price_alert (user_id, product_id, target_price, current_price, status, triggered_time, triggered_price, notified, created_time, updated_time) VALUES ",
        price_alert_values,
        " ON DUPLICATE KEY UPDATE target_price=VALUES(target_price), current_price=VALUES(current_price), status=VALUES(status), triggered_time=VALUES(triggered_time), triggered_price=VALUES(triggered_price), notified=VALUES(notified), updated_time=VALUES(updated_time)",
    )
    insert_batches(
        mysql,
        args,
        "tb_cart",
        "INSERT INTO tb_cart (user_id, product_id, quantity, selected, created_time, updated_time) VALUES ",
        cart_values,
        " ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), selected=VALUES(selected), updated_time=VALUES(updated_time)",
    )

    refresh_coupon_counts(mysql, args)
    return {
        "backup_path": str(backup_path),
        "updated_order_items": updated_order_items,
        "inserted_orders": len(order_values),
        "inserted_order_items": len(item_values),
        "inserted_reviews": len(review_values),
        "inserted_user_coupons": len(user_coupon_values),
        "inserted_price_history": len(price_history_values),
        "inserted_search_history": len(search_history_values),
        "inserted_search_stats": len(search_stats_values),
        "inserted_notifications": len(notification_values),
        "inserted_price_alerts": len(price_alert_values),
        "inserted_carts": len(cart_values),
    }


def insert_batches(mysql: str, args: argparse.Namespace, table_name: str, prefix: str, values: list[str], suffix: str = "") -> None:
    if not values:
        return
    for batch in chunked(values):
        run_mysql_script(mysql, args, prefix + ",\n".join(batch) + suffix + ";")


def refresh_coupon_counts(mysql: str, args: argparse.Namespace) -> None:
    run_mysql_script(
        mysql,
        args,
        """
UPDATE tb_coupon c
LEFT JOIN (
    SELECT coupon_id, COUNT(*) AS claimed
    FROM tb_user_coupon
    GROUP BY coupon_id
) uc ON uc.coupon_id = c.id
SET c.claimed_count = COALESCE(uc.claimed, 0),
    c.updated_time = NOW();
""",
    )


def count_rows(mysql: str, args: argparse.Namespace, sql: str) -> list[dict]:
    return [{"name": row[0], "count": int(row[1])} for row in rows(run_mysql(mysql, args, sql))]


def category_rows(mysql: str, args: argparse.Namespace) -> list[dict]:
    result = run_mysql(
        mysql,
        args,
        """
SELECT c.name, COUNT(DISTINCT oi.order_id), COUNT(*), SUM(oi.quantity), ROUND(SUM(oi.total_price), 2)
FROM tb_order_item oi
JOIN tb_product p ON p.id = oi.product_id
JOIN tb_category c ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY COUNT(*) DESC, c.id;
""",
    )
    return [
        {
            "category": row[0],
            "orders": int(row[1]),
            "items": int(row[2]),
            "quantity": int(row[3]),
            "amount": row[4],
        }
        for row in rows(result)
    ]


def audit(mysql: str, args: argparse.Namespace) -> dict:
    mismatch = int(run_mysql(
        mysql,
        args,
        """
SELECT COUNT(*)
FROM tb_order_item oi
JOIN tb_product p ON p.id = oi.product_id
WHERE oi.product_name <> p.name
   OR IFNULL(oi.product_image, '') <> IFNULL(p.main_image, '')
   OR oi.seller_id <> p.seller_id
   OR oi.seller_name <> p.seller_name;
""",
    ) or "0")
    orders_by_month = rows(run_mysql(
        mysql,
        args,
        "SELECT DATE_FORMAT(created_time,'%Y-%m'), COUNT(*) FROM tb_order GROUP BY 1 ORDER BY 1;",
    ))
    active_products_in_orders = int(run_mysql(
        mysql,
        args,
        "SELECT COUNT(DISTINCT oi.product_id) FROM tb_order_item oi JOIN tb_product p ON p.id=oi.product_id WHERE p.status=1 AND p.audit_status=1;",
    ) or "0")
    hq_orders = int(run_mysql(mysql, args, f"SELECT COUNT(*) FROM tb_order WHERE order_no LIKE '{HQ_ORDER_PREFIX}%';") or "0")
    hq_reviews = int(run_mysql(
        mysql,
        args,
        f"SELECT COUNT(*) FROM tb_review r JOIN tb_order o ON o.id=r.order_id WHERE o.order_no LIKE '{HQ_ORDER_PREFIX}%';",
    ) or "0")
    valid_consumption_orders = int(run_mysql(
        mysql,
        args,
        f"SELECT COUNT(*) FROM tb_order WHERE payment_status=1 AND order_status IN ({','.join(str(item) for item in sorted(CONSUMPTION_ORDER_STATUSES))});",
    ) or "0")
    category_coverage = int(run_mysql(
        mysql,
        args,
        "SELECT COUNT(DISTINCT p.category_id) FROM tb_order_item oi JOIN tb_product p ON p.id=oi.product_id;",
    ) or "0")
    active_product_categories = int(run_mysql(
        mysql,
        args,
        "SELECT COUNT(DISTINCT category_id) FROM tb_product WHERE status=1 AND audit_status=1;",
    ) or "0")
    search_history = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_search_history;") or "0")
    search_keywords = int(run_mysql(mysql, args, "SELECT COUNT(DISTINCT keyword) FROM tb_search_history;") or "0")
    notifications = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM notifications;") or "0")
    price_history = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_price_history;") or "0")
    price_alerts = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_price_alert;") or "0")
    carts = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_cart;") or "0")
    user_coupons = int(run_mysql(mysql, args, "SELECT COUNT(*) FROM tb_user_coupon;") or "0")
    months = [row[0] for row in orders_by_month]
    report = {
        "order_item_product_mismatch": mismatch,
        "order_months": [{"month": row[0], "count": int(row[1])} for row in orders_by_month],
        "order_status_distribution": count_rows(mysql, args, "SELECT order_status, COUNT(*) FROM tb_order GROUP BY order_status ORDER BY order_status;"),
        "payment_method_distribution": count_rows(mysql, args, "SELECT payment_method, COUNT(*) FROM tb_order GROUP BY payment_method ORDER BY payment_method;"),
        "review_rating_distribution": count_rows(mysql, args, "SELECT rating, COUNT(*) FROM tb_review GROUP BY rating ORDER BY rating;"),
        "category_order_coverage": category_rows(mysql, args),
        "active_products_in_orders": active_products_in_orders,
        "category_coverage": category_coverage,
        "active_product_categories": active_product_categories,
        "hq_orders": hq_orders,
        "hq_reviews": hq_reviews,
        "valid_consumption_orders": valid_consumption_orders,
        "search_history": search_history,
        "search_keywords": search_keywords,
        "notifications": notifications,
        "price_history": price_history,
        "price_alerts": price_alerts,
        "carts": carts,
        "user_coupons": user_coupons,
        "ready": (
            mismatch == 0
            and hq_orders >= 250
            and hq_reviews >= 60
            and active_products_in_orders >= 100
            and category_coverage >= active_product_categories
            and len(months) >= 6
            and search_history >= 120
            and search_keywords >= 18
            and notifications >= 240
            and price_history >= 900
            and price_alerts >= 24
            and carts >= 30
            and user_coupons >= 36
        ),
    }
    write_report(report)
    return report


def write_report(report: dict) -> Path:
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    path = SCRATCH_DIR / "高质量演示数据核查.md"
    lines = [
        "# 高质量演示数据核查",
        "",
        f"- 订单项与最新商品信息不一致: {report['order_item_product_mismatch']}",
        f"- 高质量补充订单: {report['hq_orders']}",
        f"- 高质量补充评价: {report['hq_reviews']}",
        f"- 订单覆盖上架商品数: {report['active_products_in_orders']}",
        f"- 订单覆盖分类数: {report['category_coverage']} / {report['active_product_categories']}",
        f"- 已支付且仍有效订单数: {report['valid_consumption_orders']}",
        f"- 搜索历史记录数: {report['search_history']}",
        f"- 搜索关键词数: {report['search_keywords']}",
        f"- 通知记录数: {report['notifications']}",
        f"- 价格历史记录数: {report['price_history']}",
        f"- 降价提醒记录数: {report['price_alerts']}",
        f"- 购物车记录数: {report['carts']}",
        f"- 用户优惠券记录数: {report['user_coupons']}",
        f"- 数据质量就绪: {'通过' if report['ready'] else '不通过'}",
        "",
        "## 订单月份分布",
        "",
        "| 月份 | 订单数 |",
        "| --- | ---: |",
    ]
    for item in report["order_months"]:
        lines.append(f"| {item['month']} | {item['count']} |")
    lines.extend([
        "",
        "## 订单状态分布",
        "",
        "| 状态 | 数量 |",
        "| --- | ---: |",
    ])
    for item in report["order_status_distribution"]:
        lines.append(f"| {item['name']} | {item['count']} |")
    lines.extend([
        "",
        "## 支付方式分布",
        "",
        "| 支付方式 | 数量 |",
        "| --- | ---: |",
    ])
    for item in report["payment_method_distribution"]:
        lines.append(f"| {item['name']} | {item['count']} |")
    lines.extend([
        "",
        "## 评价星级分布",
        "",
        "| 星级 | 数量 |",
        "| --- | ---: |",
    ])
    for item in report["review_rating_distribution"]:
        lines.append(f"| {item['name']} | {item['count']} |")
    lines.extend([
        "",
        "## 分类订单覆盖",
        "",
        "| 分类 | 覆盖订单 | 明细数 | 商品件数 | 金额 |",
        "| --- | ---: | ---: | ---: | ---: |",
    ])
    for item in report["category_order_coverage"]:
        lines.append(f"| {item['category']} | {item['orders']} | {item['items']} | {item['quantity']} | {item['amount']} |")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> int:
    args = parse_args()
    mysql = resolve_mysql_command(args.mysql_exe)
    if not mysql:
        print("mysql not found. Install MySQL CLI or set MYSQL_EXE.", file=os.sys.stderr)
        return 2
    execution = execute(mysql, args) if args.mode == "execute" else None
    report = audit(mysql, args)
    if execution:
        report["execution"] = execution
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
