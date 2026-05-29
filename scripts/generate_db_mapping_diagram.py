from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "thesis-diagrams"
DRAWIO_PATH = OUT_DIR / "数据库映射图.drawio"
PNG_PATH = OUT_DIR / "数据库映射图.png"
SVG_PATH = OUT_DIR / "数据库映射图.svg"

CANVAS_W = 1800
CANVAS_H = 960
HEADER_H = 30
ROW_H = 18


TABLES: dict[str, dict] = {
    "user": {
        "title": "tb_user（用户表）",
        "x": 80,
        "y": 60,
        "w": 260,
        "rows": [
            "id: BIGINT",
            "username: VARCHAR(50)",
            "password: VARCHAR(100)",
            "email: VARCHAR(100)",
            "phone: VARCHAR(20)",
            "avatar: VARCHAR(200)",
            "nickname: VARCHAR(50)",
            "points: INT",
            "growth_value: INT",
            "status: TINYINT",
            "role: VARCHAR(20)",
            "created_time: DATETIME",
        ],
    },
    "address": {
        "title": "addresses（地址表）",
        "x": 80,
        "y": 400,
        "w": 260,
        "rows": [
            "id: BIGINT",
            "user_id: BIGINT",
            "name: VARCHAR(50)",
            "phone: VARCHAR(20)",
            "province: VARCHAR(50)",
            "city: VARCHAR(50)",
            "district: VARCHAR(50)",
            "detail: VARCHAR(200)",
            "is_default: BOOLEAN",
        ],
    },
    "budget": {
        "title": "tb_consumption_budget（消费预算表）",
        "x": 80,
        "y": 695,
        "w": 300,
        "rows": [
            "id: BIGINT",
            "user_id: BIGINT",
            "monthly_budget: DECIMAL(10,2)",
            "budget_month: VARCHAR(6)",
            "alert_enabled: TINYINT",
            "alert_threshold: INT",
            "created_time: DATETIME",
            "updated_time: DATETIME",
        ],
    },
    "category": {
        "title": "tb_category（分类表）",
        "x": 410,
        "y": 60,
        "w": 270,
        "rows": [
            "id: BIGINT",
            "name: VARCHAR(50)",
            "description: VARCHAR(200)",
            "parent_id: BIGINT",
            "sort_order: INT",
            "icon: VARCHAR(100)",
            "status: TINYINT",
        ],
    },
    "product": {
        "title": "tb_product（商品表）",
        "x": 410,
        "y": 315,
        "w": 285,
        "rows": [
            "id: BIGINT",
            "name: VARCHAR(100)",
            "category_id: BIGINT",
            "seller_id: BIGINT",
            "price: DECIMAL(10,2)",
            "original_price: DECIMAL(10,2)",
            "pending_price: DECIMAL(10,2)",
            "stock: INT",
            "sales: INT",
            "status: TINYINT",
            "audit_status: TINYINT",
            "main_image: VARCHAR(200)",
        ],
    },
    "cart": {
        "title": "tb_cart（购物车表）",
        "x": 410,
        "y": 735,
        "w": 270,
        "rows": [
            "id: BIGINT",
            "user_id: BIGINT",
            "product_id: BIGINT",
            "quantity: INT",
            "selected: TINYINT",
            "created_time: DATETIME",
        ],
    },
    "price_history": {
        "title": "tb_price_history（价格历史表）",
        "x": 765,
        "y": 315,
        "w": 300,
        "rows": [
            "id: BIGINT",
            "product_id: BIGINT",
            "price: DECIMAL(10,2)",
            "original_price: DECIMAL(10,2)",
            "recorded_time: DATETIME",
            "change_type: VARCHAR(20)",
            "change_amount: DECIMAL(10,2)",
            "change_rate: DECIMAL(5,2)",
        ],
    },
    "wishlist": {
        "title": "tb_wishlist（想要清单表）",
        "x": 765,
        "y": 675,
        "w": 300,
        "rows": [
            "id: BIGINT",
            "user_id: BIGINT",
            "product_id: BIGINT",
            "added_price: DECIMAL(10,2)",
            "cooling_days: INT",
            "cooling_end_time: DATETIME",
            "status: TINYINT",
            "reason: VARCHAR(500)",
        ],
    },
    "order": {
        "title": "tb_order（订单表）",
        "x": 1125,
        "y": 60,
        "w": 300,
        "rows": [
            "id: BIGINT",
            "order_no: VARCHAR(50)",
            "user_id: BIGINT",
            "total_amount: DECIMAL(10,2)",
            "pay_amount: DECIMAL(10,2)",
            "payment_method: TINYINT",
            "payment_status: TINYINT",
            "order_status: TINYINT",
            "shipping_address: TEXT",
            "coupon_id: BIGINT",
            "coupon_discount: DECIMAL(10,2)",
            "created_time: DATETIME",
        ],
    },
    "order_item": {
        "title": "tb_order_item（订单项表）",
        "x": 1125,
        "y": 435,
        "w": 300,
        "rows": [
            "id: BIGINT",
            "order_id: BIGINT",
            "product_id: BIGINT",
            "product_name: VARCHAR(100)",
            "product_price: DECIMAL(10,2)",
            "quantity: INT",
            "total_price: DECIMAL(10,2)",
            "seller_id: BIGINT",
            "ship_status: TINYINT",
            "created_time: DATETIME",
        ],
    },
    "coupon": {
        "title": "tb_coupon（优惠券表）",
        "x": 1500,
        "y": 60,
        "w": 255,
        "rows": [
            "id: BIGINT",
            "name: VARCHAR(100)",
            "type: TINYINT",
            "discount_amount: DECIMAL(10,2)",
            "discount_rate: DECIMAL(3,2)",
            "min_amount: DECIMAL(10,2)",
            "total_count: INT",
            "claimed_count: INT",
            "status: TINYINT",
        ],
    },
    "user_coupon": {
        "title": "tb_user_coupon（用户优惠券表）",
        "x": 1500,
        "y": 435,
        "w": 255,
        "rows": [
            "id: BIGINT",
            "user_id: BIGINT",
            "coupon_id: BIGINT",
            "status: TINYINT",
            "order_id: BIGINT",
            "used_time: DATETIME",
            "created_time: DATETIME",
        ],
    },
    "review": {
        "title": "tb_review（评价表）",
        "x": 1500,
        "y": 695,
        "w": 255,
        "rows": [
            "id: BIGINT",
            "product_id: BIGINT",
            "user_id: BIGINT",
            "order_id: BIGINT",
            "rating: INT",
            "content: VARCHAR(500)",
            "images: TEXT",
            "is_anonymous: TINYINT",
            "created_time: DATETIME",
        ],
    },
}


def table_height(table: dict) -> int:
    return HEADER_H + 12 + len(table["rows"]) * ROW_H + 10


for table in TABLES.values():
    table["h"] = table_height(table)


def anchor(key: str, side: str, frac: float = 0.5) -> tuple[float, float]:
    table = TABLES[key]
    x, y, w, h = table["x"], table["y"], table["w"], table["h"]
    if side == "left":
        return x, y + h * frac
    if side == "right":
        return x + w, y + h * frac
    if side == "top":
        return x + w * frac, y
    if side == "bottom":
        return x + w * frac, y + h
    raise ValueError(side)


def anchor_at_y(key: str, side: str, y_coord: float) -> tuple[float, float]:
    table = TABLES[key]
    return anchor(key, side, (y_coord - table["y"]) / table["h"])


def anchor_at_x(key: str, side: str, x_coord: float) -> tuple[float, float]:
    table = TABLES[key]
    return anchor(key, side, (x_coord - table["x"]) / table["w"])


RELATIONS = [
    ("r_user_address", [anchor_at_x("user", "bottom", 145), anchor_at_x("address", "top", 145)], "1", "N"),
    ("r_user_budget", [anchor_at_y("user", "left", 240), (45, 240), (45, 783), anchor_at_y("budget", "left", 783)], "1", "N"),
    ("r_user_order", [anchor("user", "top", 0.65), (249, 30), (1275, 30), anchor("order", "top", 0.50)], "1", "N"),
    ("r_category_product", [anchor("category", "bottom", 0.50), anchor_at_x("product", "top", 545)], "1", "N"),
    ("r_product_price_history", [anchor_at_y("product", "right", 382), anchor_at_y("price_history", "left", 382)], "1", "N"),
    ("r_product_cart", [anchor_at_x("product", "bottom", 530), anchor_at_x("cart", "top", 530)], "1", "N"),
    ("r_product_wishlist", [anchor_at_y("product", "right", 535), (730, 535), (730, 757), anchor_at_y("wishlist", "left", 757)], "1", "N"),
    ("r_product_order_item", [anchor_at_y("product", "right", 480), (730, 480), (730, 540), anchor_at_y("order_item", "left", 540)], "1", "N"),
    ("r_order_order_item", [anchor("order", "bottom", 0.50), anchor("order_item", "top", 0.50)], "1", "N"),
    ("r_coupon_order", [anchor_at_y("coupon", "left", 220), anchor_at_y("order", "right", 220)], "1", "N"),
    ("r_coupon_user_coupon", [anchor("coupon", "bottom", 0.50), anchor("user_coupon", "top", 0.50)], "1", "N"),
    ("r_order_review", [anchor_at_y("order", "right", 301), (1455, 301), (1455, 802), anchor_at_y("review", "left", 802)], "1", "N"),
]

LABEL_OVERRIDES = {
    "r_user_address": ((156, 333), (156, 370)),
    "r_user_budget": ((52, 216), (55, 758)),
    "r_user_order": ((254, 18), (1294, 34)),
    "r_category_product": ((535, 242), (508, 274)),
    "r_product_price_history": ((704, 372), (740, 354)),
    "r_product_cart": ((540, 591), (540, 710)),
    "r_product_wishlist": ((704, 525), (738, 739)),
    "r_product_order_item": ((704, 470), (1092, 519)),
    "r_order_order_item": ((1286, 336), (1286, 409)),
    "r_coupon_order": ((1474, 200), (1438, 228)),
    "r_coupon_user_coupon": ((1634, 281), (1634, 410)),
    "r_order_review": ((1436, 292), (1472, 785)),
}


def mx_cell(
    cell_id: str,
    value: str,
    style: str,
    vertex: bool,
    parent: str = "1",
    geometry: str = "",
) -> str:
    attr = ' vertex="1"' if vertex else ' edge="1"'
    return f'<mxCell id="{cell_id}" value="{escape(value)}" style="{escape(style)}" parent="{parent}"{attr}>{geometry}</mxCell>'


def geom_rect(x: float, y: float, w: float, h: float) -> str:
    return f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/>'


def table_cells(key: str, table: dict) -> list[str]:
    x, y, w, h = table["x"], table["y"], table["w"], table["h"]
    rows = "<br>".join(table["rows"])
    return [
        mx_cell(
            f"{key}_box",
            "",
            "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.1;",
            True,
            geometry=geom_rect(x, y, w, h),
        ),
        mx_cell(
            f"{key}_header",
            "",
            "endArrow=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1.1;",
            False,
            geometry=(
                '<mxGeometry relative="1" as="geometry">'
                f'<mxPoint x="{x:.0f}" y="{y + HEADER_H:.0f}" as="sourcePoint"/>'
                f'<mxPoint x="{x + w:.0f}" y="{y + HEADER_H:.0f}" as="targetPoint"/>'
                "</mxGeometry>"
            ),
        ),
        mx_cell(
            f"{key}_title",
            f"<b>{table['title']}</b>",
            "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;"
            "whiteSpace=wrap;rounded=0;fontFamily=Microsoft YaHei;fontSize=13;",
            True,
            geometry=geom_rect(x + 4, y + 3, w - 8, HEADER_H - 6),
        ),
        mx_cell(
            f"{key}_rows",
            rows,
            "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;"
            "whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=12;spacingLeft=6;spacingTop=3;",
            True,
            geometry=geom_rect(x + 8, y + HEADER_H + 8, w - 16, h - HEADER_H - 12),
        ),
    ]


def edge_geometry(points: list[tuple[float, float]]) -> str:
    source = points[0]
    target = points[-1]
    mids = points[1:-1]
    mx_points = "".join(f'<mxPoint x="{x:.0f}" y="{y:.0f}"/>' for x, y in mids)
    return (
        '<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{source[0]:.0f}" y="{source[1]:.0f}" as="sourcePoint"/>'
        f'<mxPoint x="{target[0]:.0f}" y="{target[1]:.0f}" as="targetPoint"/>'
        f'<Array as="points">{mx_points}</Array>'
        "</mxGeometry>"
    )


def label_cell(cell_id: str, value: str, x: float, y: float) -> str:
    return mx_cell(
        cell_id,
        value,
        "text;html=1;strokeColor=none;fillColor=none;fontFamily=Arial;fontSize=12;fontStyle=0;"
        "align=center;verticalAlign=middle;",
        True,
        geometry=geom_rect(x, y, 20, 18),
    )


def line_cell(cell_id: str, start: tuple[float, float], end: tuple[float, float], width: float = 1.1) -> str:
    return mx_cell(
        cell_id,
        "",
        "edgeStyle=none;curved=0;endArrow=none;startArrow=none;html=1;rounded=0;strokeColor=#000000;"
        f"strokeWidth={width};startSize=10;endSize=10;jettySize=auto;orthogonalLoop=1;",
        False,
        geometry=(
            '<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{start[0]:.0f}" y="{start[1]:.0f}" as="sourcePoint"/>'
            f'<mxPoint x="{end[0]:.0f}" y="{end[1]:.0f}" as="targetPoint"/>'
            "</mxGeometry>"
        ),
    )


def bar_cell(cell_id: str, x: float, y: float, w: float, h: float) -> str:
    return mx_cell(
        cell_id,
        "",
        "rounded=0;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;strokeWidth=0;",
        True,
        geometry=geom_rect(x, y, w, h),
    )


def ellipse_cell(cell_id: str, center: tuple[float, float], radius: float = 7) -> str:
    x, y = center[0] - radius, center[1] - radius
    return mx_cell(
        cell_id,
        "",
        "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.1;",
        True,
        geometry=geom_rect(x, y, radius * 2, radius * 2),
    )


def unit_vector(start: tuple[float, float], end: tuple[float, float]) -> tuple[float, float]:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if abs(dx) >= abs(dy):
        return (1 if dx >= 0 else -1, 0)
    return (0, 1 if dy >= 0 else -1)


def add_one_symbol(cells: list[str], edge_id: str, source: tuple[float, float], next_point: tuple[float, float]) -> None:
    dx, dy = unit_vector(source, next_point)
    bar_len = 18
    bar_thick = 2
    for index, offset in enumerate((6, 14), start=1):
        cx = source[0] + dx * offset
        cy = source[1] + dy * offset
        if dx:
            cells.append(bar_cell(f"{edge_id}_one_bar_{index}", cx - bar_thick / 2, cy - bar_len / 2, bar_thick, bar_len))
        else:
            cells.append(bar_cell(f"{edge_id}_one_bar_{index}", cx - bar_len / 2, cy - bar_thick / 2, bar_len, bar_thick))


def add_many_symbol(cells: list[str], edge_id: str, previous: tuple[float, float], target: tuple[float, float]) -> None:
    dx, dy = unit_vector(previous, target)
    px, py = -dy, dx
    root = (target[0] - dx * 18, target[1] - dy * 18)
    tip = (target[0] - dx * 3, target[1] - dy * 3)
    circle = (target[0] - dx * 31, target[1] - dy * 31)
    cells.append(ellipse_cell(f"{edge_id}_many_circle", circle, 7))
    cells.append(line_cell(f"{edge_id}_many_mid", root, tip, 1.3))
    cells.append(line_cell(f"{edge_id}_many_top", root, (tip[0] + px * 9, tip[1] + py * 9), 1.3))
    cells.append(line_cell(f"{edge_id}_many_bottom", root, (tip[0] - px * 9, tip[1] - py * 9), 1.3))


def assert_orthogonal(edge_id: str, points: list[tuple[float, float]]) -> None:
    for start, end in zip(points, points[1:]):
        if round(start[0]) != round(end[0]) and round(start[1]) != round(end[1]):
            raise ValueError(f"{edge_id} has a diagonal segment: {start} -> {end}")


def label_positions(points: list[tuple[float, float]]) -> tuple[tuple[float, float], tuple[float, float]]:
    source, next_point = points[0], points[1]
    previous, target = points[-2], points[-1]
    sdx, sdy = unit_vector(source, next_point)
    tdx, tdy = unit_vector(previous, target)
    spx, spy = -sdy, sdx
    tpx, tpy = -tdy, tdx
    one = (source[0] + sdx * 26 + spx * 12 - 10, source[1] + sdy * 26 + spy * 12 - 9)
    many = (target[0] - tdx * 50 + tpx * 12 - 10, target[1] - tdy * 50 + tpy * 12 - 9)
    return one, many


def edge_cells(edge_id: str, points: list[tuple[float, float]], one: str, many: str) -> list[str]:
    assert_orthogonal(edge_id, points)
    source = points[0]
    target = points[-1]
    cells = []
    for index, (start, end) in enumerate(zip(points, points[1:]), start=1):
        cells.append(line_cell(f"{edge_id}_segment_{index}", start, end, 1.1))
    add_one_symbol(cells, edge_id, source, points[1])
    add_many_symbol(cells, edge_id, points[-2], target)
    one_pos, many_pos = LABEL_OVERRIDES.get(edge_id, label_positions(points))
    cells.append(label_cell(f"{edge_id}_one", one, one_pos[0], one_pos[1]))
    cells.append(label_cell(f"{edge_id}_many", many, many_pos[0], many_pos[1]))
    return cells


def build_drawio() -> str:
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for key, table in TABLES.items():
        cells.extend(table_cells(key, table))
    for edge_id, points, one, many in RELATIONS:
        cells.extend(edge_cells(edge_id, points, one, many))
    model = (
        f'<mxGraphModel dx="1600" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" '
        f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{CANVAS_W}" '
        f'pageHeight="{CANVAS_H}" math="0" shadow="0"><root>{"".join(cells)}</root></mxGraphModel>'
    )
    return (
        '<mxfile host="Electron" modified="2026-05-25T00:00:00.000Z" agent="Codex" '
        'version="24.7.17" type="device">'
        f'<diagram id="database-mapping-clean" name="数据库映射图">{model}</diagram>'
        "</mxfile>"
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DRAWIO_PATH.write_text(build_drawio(), encoding="utf-8")
    print(DRAWIO_PATH)
    print(PNG_PATH)
    print(SVG_PATH)


if __name__ == "__main__":
    main()
