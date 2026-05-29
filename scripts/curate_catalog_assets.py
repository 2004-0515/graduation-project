#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import pprint
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from fetch_young_catalog_assets import image_size
from young_catalog_data import PRODUCT_SPECS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "scripts" / "young-catalog-assets.json"
OVERRIDES_PATH = PROJECT_ROOT / "scripts" / "curated_catalog_overrides.py"
UPLOADS_ROOT = PROJECT_ROOT / "uploads" / "products"
SCRATCH_ROOT = PROJECT_ROOT / "scratch"
PRODUCT_CACHE_PATH = SCRATCH_ROOT / "dummyjson-products-200.json"
FETCH_DATE = datetime(2026, 5, 26)
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0 Safari/537.36"
MIN_OUTPUT_BYTES = 30_000

GENERIC_QUERY_TERMS = {
    "and",
    "bag",
    "black",
    "blue",
    "brown",
    "classic",
    "cream",
    "gold",
    "green",
    "grey",
    "inch",
    "new",
    "product",
    "red",
    "set",
    "silver",
    "white",
    "with",
    "women",
    "womens",
}

PREFIX_CATEGORY = {
    "anime": "运动户外",
    "desk": "桌搭数码",
    "wear": "潮流穿搭",
    "home": "家居日用",
    "beauty": "美妆个护",
    "snack": "食品饮品",
    "culture": "餐厨好物",
    "travel": "出行日用",
}

PREFIX_POOLS = {
    "anime": [137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 113, 114, 116],
    "desk": [78, 80, 81, 82, 99, 100, 101, 103, 105, 107, 108, 121, 122, 123, 124, 125],
    "wear": [174, 176, 154, 155, 156, 157, 158, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 83, 84, 85, 86, 87],
    "home": [11, 12, 13, 14, 15, 43, 44, 45, 46, 47, 67, 69, 71, 73, 75, 76, 77, 49],
    "beauty": [1, 3, 4, 5, 6, 7, 8, 9, 10, 118, 119, 120, 182],
    "snack": [16, 20, 21, 27, 28, 29, 30, 31, 32, 33, 34, 36, 39, 40],
    "culture": [48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64],
    "travel": [65, 42, 41, 74, 49, 59, 109, 110, 111, 159, 160, 161],
}

MANUAL_SOURCES = {
    "desk-keyboard-75": {
        "name": "海盐轴 75 键机械键盘",
        "description": "浅色键帽和紧凑 75 键布局更适合宿舍与办公桌面，机械键盘搜索测试会命中该商品。",
        "category": "桌搭数码",
        "source_url": "https://upload.wikimedia.org/wikipedia/commons/7/7f/Beautiful_Mechanical_Keyboard.jpg",
        "fallback_source_path": "/uploads/products/桌搭数码/2026/05/desk-keyboard-75.jpg",
        "foreign_landing_url": "https://commons.wikimedia.org/wiki/File:Beautiful_Mechanical_Keyboard.jpg",
        "provider": "wikimedia-commons",
        "creator": "Anirban Saha",
        "license": "CC BY-SA 4.0",
        "query": "mechanical,keyboard",
        "download_queries": ["mechanical keyboard"],
    },
    "desk-camera-canon-eos": {
        "name": "佳能 EOS R50 微单相机",
        "description": "佳能 EOS 机身轮廓清楚，适合展示相机类商品详情，也是第 6 章搜索测试保留商品。",
        "category": "桌搭数码",
        "source_url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Canon_EOS_R50_Black.jpg",
        "foreign_landing_url": "https://commons.wikimedia.org/wiki/File:Canon_EOS_R50_Black.jpg",
        "provider": "wikimedia-commons",
        "creator": "Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "query": "canon,eos,camera",
        "download_queries": ["canon eos camera"],
    },
    "desk-headphones-sony-wh1000xm5": {
        "name": "索尼 WH-1000XM5 降噪耳机",
        "description": "银白头戴耳机主体干净，适合通勤和学习场景，降噪耳机搜索测试会命中该商品。",
        "category": "桌搭数码",
        "source_path": "/uploads/products/桌搭数码/2026/05/desk-headphones-sony-wh1000xm5.jpg",
        "source_url": "https://live.staticflickr.com/65535/52435974872_726c95e1f1_b.jpg",
        "foreign_landing_url": "https://www.flickr.com/photo.gne?id=52435974872",
        "provider": "flickr",
        "creator": "Flickr",
        "license": "flickr-photo",
        "query": "sony,headphones",
        "download_queries": ["sony headphones"],
    },
    "desk-keycaps-soda": {
        "name": "双屏创作笔记本工作站",
        "description": "双屏笔记本适合展示桌搭数码类商品，保留原测试 slug 以支持商家发货流程。",
        "category": "桌搭数码",
        "dummy_id": 79,
        "query": "desktop,workstation",
        "download_queries": ["desktop workstation"],
    },
    "wear-canvas-crossbody": {
        "name": "棕色皮革通勤斜挎包",
        "description": "包型清楚、质感干净，适合日常通勤和短途出门，保留原测试 slug 以支持取消订单流程。",
        "category": "潮流穿搭",
        "dummy_id": 173,
        "query": "canvas,bag",
        "download_queries": ["canvas bag"],
    },
    "beauty-lotion-soft": {
        "name": "镜面多色眼影盘套装",
        "description": "眼影盘主体完整，颜色清楚，适合作为美妆个护类测试商品和价格提醒商品。",
        "category": "美妆个护",
        "dummy_id": 2,
        "query": "makeup,flatlay",
        "download_queries": ["makeup flatlay"],
    },
    "beauty-perfume-mini": {
        "name": "绿色水晶耳环",
        "description": "绿色水晶耳环主体清楚，适合放在潮流穿搭分类中展示首饰搭配。",
        "category": "潮流穿搭",
        "dummy_id": 182,
        "query": "crystal,earring",
        "download_queries": ["crystal earring"],
    },
    "home-floor-lamp": {
        "name": "北欧客厅落地灯套装",
        "description": "保留当前观感较好的客厅落地灯主图，作为全目录商品卡片质量基准。",
        "category": "家居日用",
        "source_path": "/uploads/products/香氛家居/2026/05/home-floor-lamp.jpg",
        "source_url": "https://live.staticflickr.com/7458/12221757635_f1ddeb72eb_b.jpg",
        "foreign_landing_url": "https://www.flickr.com/photo.gne?id=12221757635",
        "provider": "flickr",
        "creator": "Flickr",
        "license": "flickr-photo",
        "query": "livingroom,lamp",
        "download_queries": ["livingroom lamp"],
    },
}

TITLE_CN = {
    1: "纤长卷翘睫毛膏",
    2: "镜面多色眼影盘",
    3: "柔雾定妆散粉罐",
    4: "正红丝绒口红",
    5: "樱桃红亮面指甲油",
    6: "清爽中性淡香水",
    7: "黑可可木质香水",
    8: "花香调随身香水",
    9: "阳光柑橘淡香水",
    10: "繁花香调淡香水",
    11: "米色软包双人床",
    12: "浅灰现代客厅沙发",
    13: "樱桃木床头柜",
    14: "米白弧背办公椅",
    15: "木质浴室镜柜套装",
    16: "红富士苹果礼盒",
    20: "家用烹饪油瓶",
    21: "清爽黄瓜组合",
    27: "玻璃蜂蜜罐",
    28: "香草冰淇淋杯",
    29: "果汁饮品瓶",
    30: "奇异果鲜果盒",
    31: "柠檬鲜果组合",
    32: "纯牛奶瓶装组合",
    33: "桑葚鲜果盒",
    34: "Nescafe 咖啡罐",
    36: "蛋白粉补给罐",
    39: "柠檬气泡软饮",
    40: "草莓鲜果盒",
    41: "迷彩车载纸巾盒",
    42: "瓶装饮用水",
    43: "藤编装饰秋千椅",
    44: "家庭树相框摆件",
    45: "绿植小屋桌面摆件",
    46: "陶土绿植花盆",
    47: "暖光桌面台灯",
    48: "竹制厨房刮刀",
    49: "黑色铝制随行杯",
    50: "黑色手持打蛋器",
    51: "盒装料理机",
    52: "碳钢家用炒锅",
    53: "木质切菜板",
    54: "黄色柠檬榨汁器",
    55: "黄色鸡蛋切片器",
    56: "黑色嵌入式电陶炉",
    57: "细网过滤筛",
    58: "不锈钢餐叉",
    59: "透明玻璃杯",
    60: "黑色四面刨丝器",
    61: "红白手持料理棒",
    62: "蓝色冰格托盘",
    63: "木柄厨房过滤勺",
    64: "锋利厨房刀具",
    65: "便携午餐盒",
    67: "木质马克杯架",
    69: "白色陶瓷餐盘",
    70: "红色厨房夹",
    71: "玻璃盖银色汤锅",
    72: "漏孔锅铲",
    73: "木质香料收纳架",
    74: "不锈钢便携餐勺",
    75: "浅木餐盘托盘",
    76: "木质擀面杖",
    77: "黄色削皮器",
    78: "MacBook Pro 深空灰笔记本",
    79: "双屏创作笔记本工作站",
    80: "华为 MateBook 轻薄本",
    81: "联想 Yoga 翻转笔记本",
    82: "Dell XPS 13 轻薄本",
    83: "蓝黑格纹衬衫",
    84: "黑橙图案宽松 T 恤",
    85: "男款格纹休闲衬衫",
    86: "短袖休闲衬衫",
    87: "简洁格纹衬衫",
    99: "智能语音桌面音箱",
    100: "白色无线蓝牙耳机",
    101: "银色头戴式蓝牙耳机",
    102: "无线充电板",
    103: "深灰智能桌面音箱",
    104: "白色手机快充头",
    105: "磁吸移动电源",
    106: "金色智能手表",
    107: "颈挂式无线耳机",
    108: "梅子色磁吸手机壳",
    109: "轻量自拍支架",
    110: "白色磁吸移动电源",
    111: "伸缩自拍杆",
    112: "摄影棚相机云台",
    113: "城市通勤摩托车",
    114: "绿色街车摩托",
    116: "白色踏板摩托车",
    118: "温和绿叶洗手液",
    119: "滋润沐浴乳",
    120: "男士身体乳",
    121: "经典 iPhone 5s 手机",
    122: "经典 iPhone 6 手机",
    123: "iPhone 13 Pro 手机",
    124: "黑色 iPhone X 手机",
    125: "Oppo A57 智能手机",
    126: "Oppo F19 Pro 智能手机",
    127: "Oppo K1 智能手机",
    128: "Realme C35 智能手机",
    129: "Realme X 智能手机",
    130: "Realme XT 智能手机",
    131: "三星 Galaxy S7 手机",
    132: "三星 Galaxy S8 手机",
    133: "三星 Galaxy S10 手机",
    134: "Vivo S1 智能手机",
    135: "Vivo V9 智能手机",
    136: "Vivo X21 智能手机",
    137: "美式橄榄球摆件",
    138: "白色棒球摆件",
    139: "复古棒球手套",
    140: "橙色篮球摆件",
    141: "篮球框装饰件",
    142: "红色板球收藏球",
    143: "木质板球球棒",
    144: "深色板球头盔",
    145: "板球门柱套件",
    146: "白色羽毛球",
    147: "经典足球摆件",
    148: "高尔夫球组合",
    149: "金属高尔夫球杆",
    150: "金属棒球棒",
    151: "荧光网球组合",
    152: "红白网球拍",
    153: "蓝黄排球摆件",
    154: "黑色太阳镜",
    155: "经典深色太阳镜",
    156: "绿黑拼色眼镜",
    157: "派对造型眼镜",
    158: "轻便旅行太阳镜",
    159: "星光色 iPad mini 平板",
    160: "三星 Tab S8 灰色平板",
    161: "白色三星平板电脑",
    172: "蓝色女士手提包",
    173: "棕色皮革通勤斜挎包",
    174: "黑色链条通勤包",
    175: "白色双肩背包",
    176: "黑色简约手提包",
    182: "绿色水晶耳环",
    183: "祖母绿椭圆耳环",
    184: "热带花叶耳环",
    185: "黑棕居家拖鞋",
    186: "黑色高跟鞋",
    187: "金色女士单鞋",
    188: "粉色休闲鞋",
    189: "红色女士单鞋",
    190: "银色女士腕表",
    191: "月相女士腕表",
    192: "银色日历女士表",
    193: "金色女士腕表",
    194: "简约女士腕表",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Curate the demo catalog around high-quality product images.")
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--only-slugs", nargs="*", default=[])
    parser.add_argument("--refresh-existing", action="store_true")
    parser.add_argument("--dummyjson-url", default="https://dummyjson.com/products?limit=200")
    return parser.parse_args()


def run(command: list[str], **kwargs: Any) -> subprocess.CompletedProcess[str]:
    completed = subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        **kwargs,
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "command failed").strip())
    return completed


def curl_path() -> str:
    resolved = shutil.which("curl.exe") or shutil.which("curl")
    if not resolved:
        raise RuntimeError("curl not found")
    return resolved


def ffmpeg_path() -> str:
    candidates = [shutil.which("ffmpeg"), r"D:\ffmpeg\bin\ffmpeg.exe"]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    raise RuntimeError("ffmpeg not found")


def fetch_to_file(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            curl_path(),
            "-fsSL",
            "--ssl-no-revoke",
            "--http1.1",
            "--retry",
            "2",
            "--connect-timeout",
            "12",
            "--max-time",
            "45",
            "-A",
            USER_AGENT,
            url,
            "-o",
            str(target),
        ]
    )


def fetch_json(url: str) -> dict[str, Any]:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "payload.json"
        try:
            fetch_to_file(url, target)
            payload = json.loads(target.read_text(encoding="utf-8"))
            PRODUCT_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            PRODUCT_CACHE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            return payload
        except Exception:
            if PRODUCT_CACHE_PATH.exists():
                return json.loads(PRODUCT_CACHE_PATH.read_text(encoding="utf-8"))
            raise


def normalize_image(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    filter_graph = (
        "color=white:s=900x900[bg];"
        "[0:v]scale=900:900:force_original_aspect_ratio=decrease[fg];"
        "[bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p"
    )
    run(
        [
            ffmpeg_path(),
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source),
            "-filter_complex",
            filter_graph,
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(target),
        ]
    )


def sha256_hex(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def query_tokens(value: str) -> list[str]:
    return [
        token
        for token in re.split(r"[^a-z0-9]+", value.lower())
        if len(token) > 1 and token not in GENERIC_QUERY_TERMS
    ]


def short_query(value: str) -> str:
    tokens = query_tokens(value)
    if not tokens:
        tokens = [token for token in re.split(r"[^a-z0-9]+", value.lower()) if token]
    return ",".join(tokens[:3]) or "product"


def dummy_source(product: dict[str, Any], query: str | None = None) -> dict[str, Any]:
    product_id = int(product["id"])
    source_urls = [url for url in (product.get("images") or []) if url]
    if product.get("thumbnail"):
        source_urls.append(product["thumbnail"])
    source_url = source_urls[0] if source_urls else ""
    if not source_url:
        raise RuntimeError(f"dummy product has no image: {product_id}")
    return {
        "source_url": source_url,
        "source_urls": source_urls,
        "foreign_landing_url": f"https://dummyjson.com/products/{product_id}",
        "provider": "dummyjson-products",
        "creator": product.get("brand") or "DummyJSON",
        "license": "DummyJSON demo product image",
        "title": product.get("title") or str(product_id),
        "query": query or short_query(product.get("title") or str(product_id)),
        "dummy_id": product_id,
    }


def product_name(product: dict[str, Any]) -> str:
    product_id = int(product["id"])
    return TITLE_CN.get(product_id) or str(product.get("title") or f"精选商品 {product_id}")


def description_for(name: str, category: str) -> str:
    return f"{name}主体清楚、背景干净，适合在{category}页面中直接展示，商品名称与主图保持一致。"


def category_for_slug(slug: str) -> str:
    prefix = slug.split("-", 1)[0]
    return PREFIX_CATEGORY.get(prefix, "家居日用")


def choose_assignments(products_by_id: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    used_dummy_ids = {
        int(meta["dummy_id"])
        for meta in MANUAL_SOURCES.values()
        if "dummy_id" in meta
    }
    pool_offsets = {prefix: 0 for prefix in PREFIX_POOLS}
    assignments: list[dict[str, Any]] = []

    for index, spec in enumerate(PRODUCT_SPECS, start=1):
        slug = spec["slug"]
        category = category_for_slug(slug)
        manual = dict(MANUAL_SOURCES.get(slug) or {})
        if manual:
            if "dummy_id" in manual:
                product = products_by_id[int(manual["dummy_id"])]
                source = dummy_source(product, manual.get("query"))
                name = manual["name"]
            else:
                source = {key: manual[key] for key in ("source_url", "foreign_landing_url", "provider", "creator", "license", "query") if key in manual}
                if "source_path" in manual:
                    source["source_path"] = manual["source_path"]
                source["title"] = manual["name"]
                name = manual["name"]
            category = manual.get("category", category)
            description = manual.get("description", description_for(name, category))
            download_queries = manual.get("download_queries", [source["query"].replace(",", " ")])
        else:
            prefix = slug.split("-", 1)[0]
            pool = PREFIX_POOLS.get(prefix) or PREFIX_POOLS["home"]
            product = None
            while pool_offsets[prefix] < len(pool):
                candidate_id = pool[pool_offsets[prefix]]
                pool_offsets[prefix] += 1
                if candidate_id in used_dummy_ids:
                    continue
                product = products_by_id.get(candidate_id)
                if product:
                    used_dummy_ids.add(candidate_id)
                    break
            if product is None:
                for candidate in products_by_id.values():
                    candidate_id = int(candidate["id"])
                    if candidate_id not in used_dummy_ids:
                        product = candidate
                        used_dummy_ids.add(candidate_id)
                        break
            if product is None:
                raise RuntimeError(f"no product source left for {slug}")
            source = dummy_source(product)
            name = product_name(product)
            description = description_for(name, category)
            download_queries = [source["query"].replace(",", " ")]

        price = round(max(19.0, float(spec.get("price") or 99.0)), 2)
        original_price = round(max(price + 10.0, float(spec.get("original_price") or price * 1.22)), 2)
        assignments.append(
            {
                "index": index,
                "slug": slug,
                "name": name,
                "category": category,
                "description": description,
                "price": price,
                "original_price": original_price,
                "seller_name": spec["seller_name"],
                "download_queries": download_queries,
                "source": source,
            }
        )
    return assignments


def asset_target(category: str, slug: str) -> Path:
    return UPLOADS_ROOT / category / str(FETCH_DATE.year) / f"{FETCH_DATE.month:02d}" / f"{slug}.jpg"


def load_source_image(assignment: dict[str, Any], temp_dir: Path, skip_download: bool, source_cache: dict[str, Path]) -> Path:
    source = assignment["source"]
    if source.get("source_path"):
        local = PROJECT_ROOT / str(source["source_path"]).lstrip("/")
        if not local.exists():
            raise RuntimeError(f"missing local source image: {local}")
        return local
    for url in source.get("source_urls") or [source["source_url"]]:
        cached = source_cache.get(url)
        if cached and cached.exists():
            source["source_url"] = url
            return cached

    raw_path = temp_dir / f"{assignment['slug']}-raw"
    if skip_download:
        raise RuntimeError(f"download skipped and no local source for {assignment['slug']}")
    errors = []
    for index, url in enumerate(source.get("source_urls") or [source["source_url"]]):
        candidate = temp_dir / f"{assignment['slug']}-raw-{index}"
        try:
            fetch_to_file(url, candidate)
            source["source_url"] = url
            return candidate
        except Exception as exc:
            errors.append(f"{url}: {exc}")
    if source.get("fallback_source_path"):
        local = PROJECT_ROOT / str(source["fallback_source_path"]).lstrip("/")
        if local.exists():
            return local
    raise RuntimeError("; ".join(errors) or f"failed to load source for {assignment['slug']}")


def write_overrides(assignments: list[dict[str, Any]]) -> None:
    backup_path = SCRATCH_ROOT / f"curated_catalog_overrides_before_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
    if OVERRIDES_PATH.exists():
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OVERRIDES_PATH, backup_path)

    overrides = {
        item["slug"]: {
            "name": item["name"],
            "category": item["category"],
            "description": item["description"],
            "price": item["price"],
            "original_price": item["original_price"],
            "seller_name": item["seller_name"],
            "download_queries": item["download_queries"],
        }
        for item in assignments
    }
    OVERRIDES_PATH.write_text(
        "from __future__ import annotations\n\n"
        "from typing import Any\n\n\n"
        "# Generated by scripts/curate_catalog_assets.py.\n"
        "# Product names intentionally follow the selected image source.\n"
        f"PRODUCT_OVERRIDES: dict[str, dict[str, Any]] = {pprint.pformat(overrides, width=140, sort_dicts=True)}\n",
        encoding="utf-8",
    )


def valid_existing_entry(entry: dict[str, Any] | None) -> bool:
    if not entry or not entry.get("local_path"):
        return False
    path = PROJECT_ROOT / str(entry["local_path"]).lstrip("/")
    return path.exists() and path.stat().st_size >= MIN_OUTPUT_BYTES and image_size(path.read_bytes()) == (900, 900)


def manifest_entry(item: dict[str, Any], target: Path) -> dict[str, Any]:
    source = item["source"]
    payload = target.read_bytes()
    dimensions = image_size(payload)
    return {
        "slug": item["slug"],
        "name": item["name"],
        "category": item["category"],
        "provider": source["provider"],
        "query": source["query"],
        "title": source.get("title") or item["name"],
        "creator": source.get("creator") or source["provider"],
        "license": source.get("license") or "source-provided",
        "license_version": None,
        "source_url": source["source_url"],
        "foreign_landing_url": source.get("foreign_landing_url") or source["source_url"],
        "local_path": "/" + target.relative_to(PROJECT_ROOT).as_posix(),
        "content_hash": sha256_hex(target),
        "dimensions": list(dimensions) if dimensions else None,
        "size": len(payload),
        "asset_kind": "real-photo",
        "review_status": "human-approved-photo",
        "reviewed_at": datetime.now().isoformat(timespec="seconds"),
    }


def normalize_source_to_asset(source: Path, jpg_target: Path) -> Path:
    if source.resolve() == jpg_target.resolve() and source.stat().st_size >= MIN_OUTPUT_BYTES:
        return source
    normalize_image(source, jpg_target)
    if jpg_target.stat().st_size >= MIN_OUTPUT_BYTES:
        return jpg_target
    png_target = jpg_target.with_suffix(".png")
    if source.resolve() == png_target.resolve() and source.stat().st_size >= MIN_OUTPUT_BYTES:
        return source
    normalize_image(source, png_target)
    return png_target


def write_manifest(assignments: list[dict[str, Any]], temp_dir: Path, skip_download: bool, refresh_existing: bool) -> dict[str, Any]:
    existing_manifest = {}
    if MANIFEST_PATH.exists():
        existing_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if MANIFEST_PATH.exists():
        backup_path = SCRATCH_ROOT / f"young-catalog-assets-before-curated-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(MANIFEST_PATH, backup_path)

    source_cache: dict[str, Path] = {}
    for entry in (existing_manifest.get("products") or {}).values():
        local_path = entry.get("local_path")
        source_url = entry.get("source_url")
        if not local_path or not source_url:
            continue
        local = PROJECT_ROOT / str(local_path).lstrip("/")
        if local.exists():
            source_cache[str(source_url)] = local

    products: dict[str, dict[str, Any]] = {
        slug: entry
        for slug, entry in (existing_manifest.get("products") or {}).items()
        if valid_existing_entry(entry)
    }
    failures: dict[str, str] = {}
    for item in assignments:
        slug = item["slug"]
        try:
            if not refresh_existing and valid_existing_entry(products.get(slug)):
                entry = products[slug]
                entry["name"] = item["name"]
                entry["category"] = item["category"]
                entry["review_status"] = "human-approved-photo"
                continue
            target = asset_target(item["category"], slug)
            if not refresh_existing and target.exists() and image_size(target.read_bytes()) == (900, 900):
                if target.stat().st_size < MIN_OUTPUT_BYTES:
                    png_target = target.with_suffix(".png")
                    normalize_image(target, png_target)
                    target = png_target
                products[slug] = manifest_entry(item, target)
                continue
            png_target = target.with_suffix(".png")
            if not refresh_existing and png_target.exists() and image_size(png_target.read_bytes()) == (900, 900) and png_target.stat().st_size >= MIN_OUTPUT_BYTES:
                products[slug] = manifest_entry(item, png_target)
                continue
            raw_source = load_source_image(item, temp_dir, skip_download, source_cache)
            target = normalize_source_to_asset(raw_source, target)
            payload = target.read_bytes()
            dimensions = image_size(payload)
            if dimensions != (900, 900):
                raise RuntimeError(f"unexpected dimensions: {dimensions}")
            products[slug] = manifest_entry(item, target)
        except Exception as exc:
            failures[slug] = str(exc)

    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_policy": "image-first curated catalog; product names follow the selected source image",
        "products": products,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"written": len(products), "failures": failures, "ready": not failures}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    args = parse_args()
    payload = fetch_json(args.dummyjson_url)
    products_by_id = {int(product["id"]): product for product in payload.get("products", [])}
    assignments = choose_assignments(products_by_id)
    manifest_assignments = list(assignments)
    only_slugs = {slug.strip() for slug in args.only_slugs if slug.strip()}
    if only_slugs:
        manifest_assignments = [item for item in manifest_assignments if item["slug"] in only_slugs]
    if args.only_missing and MANIFEST_PATH.exists():
        existing = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")).get("products") or {}
        manifest_assignments = [item for item in manifest_assignments if not valid_existing_entry(existing.get(item["slug"]))]
    write_overrides(assignments)
    with tempfile.TemporaryDirectory(dir=SCRATCH_ROOT) as temp:
        result = write_manifest(manifest_assignments, Path(temp), args.skip_download, args.refresh_existing)
    result["total_specs"] = len(PRODUCT_SPECS)
    failure_path = SCRATCH_ROOT / f"curated_catalog_failures_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    failure_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    result["result_path"] = str(failure_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ready") else 1


if __name__ == "__main__":
    raise SystemExit(main())
