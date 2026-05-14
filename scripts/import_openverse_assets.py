from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOADS_ROOT = PROJECT_ROOT / "uploads"
MANIFEST_PATH = PROJECT_ROOT / "scripts" / "openverse-asset-manifest.json"
MYSQL = Path(r"C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe")
DB_NAME = os.environ.get("SHOPPING_MALL_DB", "shopping_mall")
DB_PASSWORD = os.environ.get("SHOPPING_MALL_DB_PASSWORD", "123456")
OPENVERSE_BASE = "https://api.openverse.org/v1"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
DEFAULT_HEADERS = {"User-Agent": USER_AGENT}
ALLOWED_LICENSES = {"by", "by-sa", "cc0", "pdm"}
ALLOWED_AUDIO_LICENSES = {"by", "cc0", "pdm", "by-sa"}

CATEGORY_NAMES = {
    7: "运动户外",
    8: "母婴玩具",
    9: "家居家纺",
    10: "汽车用品",
    11: "医药保健",
    12: "珠宝配饰",
}

PRODUCT_SPECS = [
    {"name": "城市篮球 7号耐磨训练款", "description": "室内外通用训练篮球，耐磨表皮与稳定颗粒手感，适合日常对抗和投篮练习。", "category_id": 7, "price": "129.00", "original_price": "169.00", "stock": 260, "sales": 128, "seller_id": 10, "seller_name": "xiaoming", "query": "basketball"},
    {"name": "轻量双人露营帐篷", "description": "双层防泼水结构，折叠后便携，适合周末露营、音乐节和短途户外出行。", "category_id": 7, "price": "399.00", "original_price": "499.00", "stock": 86, "sales": 39, "seller_id": 7, "seller_name": "zhouba", "query": "camping tent"},
    {"name": "高景观婴儿推车", "description": "可坐可躺，折叠收车方便，适合城市通勤和周末家庭出行。", "category_id": 8, "price": "899.00", "original_price": "1099.00", "stock": 74, "sales": 26, "seller_id": 11, "seller_name": "xiaohong", "query": "baby stroller"},
    {"name": "PPSU宽口径奶瓶套装", "description": "宽口径设计更易冲泡和清洗，配防胀气奶嘴，适合新生儿到学饮期过渡。", "category_id": 8, "price": "139.00", "original_price": "179.00", "stock": 180, "sales": 58, "seller_id": 11, "seller_name": "xiaohong", "query": "baby bottle"},
    {"name": "全棉简约四件套", "description": "全棉亲肤面料，透气舒适，适合春夏秋三季卧室日常使用。", "category_id": 9, "price": "259.00", "original_price": "329.00", "stock": 132, "sales": 77, "seller_id": 12, "seller_name": "daming", "query": "duvet cover"},
    {"name": "北欧风客厅落地灯", "description": "暖光氛围照明，适合沙发阅读角、卧室角落和客厅氛围补光。", "category_id": 9, "price": "319.00", "original_price": "399.00", "stock": 65, "sales": 31, "seller_id": 12, "seller_name": "daming", "query": "floor lamp"},
    {"name": "车载应急启动电源", "description": "支持汽车应急搭电和移动设备补电，适合长途自驾和日常备用。", "category_id": 10, "price": "469.00", "original_price": "569.00", "stock": 91, "sales": 22, "seller_id": 9, "seller_name": "zhengshi", "query": "car jump starter"},
    {"name": "磁吸车载手机支架", "description": "适合导航和免提通话使用，小巧不挡视线，安装拆卸方便。", "category_id": 10, "price": "79.00", "original_price": "99.00", "stock": 240, "sales": 113, "seller_id": 9, "seller_name": "zhengshi", "query": "car phone holder"},
    {"name": "维生素C咀嚼片", "description": "日常营养补充，便于携带，适合忙碌工作节奏下的基础维生素补给。", "category_id": 11, "price": "89.00", "original_price": "119.00", "stock": 320, "sales": 141, "seller_id": 14, "seller_name": "laowang", "query": "vitamin c supplement"},
    {"name": "家用电子血压计", "description": "大屏数字显示，操作简单，适合家庭日常健康监测与记录。", "category_id": 11, "price": "229.00", "original_price": "289.00", "stock": 118, "sales": 63, "seller_id": 14, "seller_name": "laowang", "query": "blood pressure monitor"},
    {"name": "925银简约项链", "description": "简约日常款，适合通勤与约会搭配，送礼也较稳妥。", "category_id": 12, "price": "199.00", "original_price": "259.00", "stock": 145, "sales": 46, "seller_id": 13, "seller_name": "xiaoli", "query": "silver necklace"},
    {"name": "轻奢手链礼盒装", "description": "风格偏轻奢简洁，适合节日赠礼或日常叠戴搭配。", "category_id": 12, "price": "239.00", "original_price": "299.00", "stock": 126, "sales": 42, "seller_id": 13, "seller_name": "xiaoli", "query": "bracelet jewelry"},
    {"name": "户外徒步登山包 35L", "description": "多仓位分区，适合一日徒步、轻量露营和城市周边短线出行。", "category_id": 7, "price": "289.00", "original_price": "359.00", "stock": 97, "sales": 28, "seller_id": 10, "seller_name": "xiaoming", "query": "hiking backpack"},
    {"name": "木质小火车积木玩具", "description": "适合低龄儿童的启蒙积木玩具，结构简单，便于抓握与拼搭。", "category_id": 8, "price": "99.00", "original_price": "129.00", "stock": 165, "sales": 44, "seller_id": 11, "seller_name": "xiaohong", "query": "toy train"},
    {"name": "编织收纳篮双件套", "description": "适合客厅、卧室和衣柜整理，收纳零碎物件时更整洁顺手。", "category_id": 9, "price": "119.00", "original_price": "159.00", "stock": 143, "sales": 53, "seller_id": 12, "seller_name": "daming", "query": "storage basket"},
    {"name": "便携车载打气泵", "description": "适合轿车日常补气和自驾备用，小体积更方便放在后备箱常备。", "category_id": 10, "price": "169.00", "original_price": "219.00", "stock": 109, "sales": 37, "seller_id": 9, "seller_name": "zhengshi", "query": "tire inflator"},
    {"name": "深海鱼油软胶囊", "description": "适合日常营养补充，软胶囊形态便于吞咽和随身携带。", "category_id": 11, "price": "139.00", "original_price": "179.00", "stock": 186, "sales": 69, "seller_id": 14, "seller_name": "laowang", "query": "fish oil capsules"},
    {"name": "珍珠耳饰礼盒", "description": "偏轻礼服和通勤两用风格，适合节日送礼与日常搭配。", "category_id": 12, "price": "219.00", "original_price": "279.00", "stock": 118, "sales": 35, "seller_id": 13, "seller_name": "xiaoli", "query": "pearl earrings"},
]

MUSIC_SPECS = [
    {"query": "ambient instrumental", "label": "氛围电子"},
    {"query": "piano instrumental", "label": "钢琴纯音"},
    {"query": "lofi beat instrumental", "label": "Lo-fi 节拍"},
    {"query": "corporate motivational", "label": "轻快动机"},
    {"query": "acoustic folk instrumental", "label": "木吉他"},
    {"query": "chillout instrumental", "label": "Chillout"},
    {"query": "upbeat ukulele", "label": "尤克里里"},
    {"query": "electronic background music", "label": "电子背景"},
    {"query": "ambient voyager", "label": "环境航行"},
    {"query": "emotional piano instrumental", "label": "情绪钢琴"},
    {"query": "road in the forest", "label": "森林公路"},
    {"query": "motivational day", "label": "活力日常"},
]


@dataclass
class DownloadedAsset:
    source_url: str
    foreign_landing_url: str | None
    title: str
    creator: str
    license_code: str
    license_version: str | None
    local_temp_path: Path
    content_hash: str
    size: int
    extension: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Openverse demo asset importer with audit, migration and verification.")
    parser.add_argument("--mode", choices=["dry-run", "execute", "migrate", "verify"], default="dry-run")
    parser.add_argument("--batch-id", default=f"openverse-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    parser.add_argument("--limit-products", type=int, default=len(PRODUCT_SPECS))
    parser.add_argument("--limit-music", type=int, default=len(MUSIC_SPECS))
    return parser.parse_args()


def mysql_cmd() -> list[str]:
    return [str(MYSQL), "--default-character-set=utf8mb4", "-uroot", f"-p{DB_PASSWORD}", "-N", "-B", DB_NAME]


def run_mysql(sql: str) -> str:
    completed = subprocess.run(
        mysql_cmd(),
        input=sql,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="ignore",
        check=True,
    )
    return completed.stdout


def ensure_import_audit_schema() -> None:
    run_mysql(
        """
        CREATE TABLE IF NOT EXISTS demo_import_batch (
            id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
            batch_id VARCHAR(64) NOT NULL UNIQUE COMMENT '批次标识',
            batch_type VARCHAR(50) NOT NULL COMMENT '批次类型',
            status VARCHAR(20) NOT NULL COMMENT '状态',
            summary VARCHAR(500) DEFAULT NULL COMMENT '摘要',
            created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
            INDEX idx_demo_import_batch_type (batch_type),
            INDEX idx_demo_import_batch_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='演示数据导入批次表';

        CREATE TABLE IF NOT EXISTS demo_imported_asset (
            id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
            asset_type VARCHAR(30) NOT NULL COMMENT '资产类型',
            business_type VARCHAR(30) NOT NULL COMMENT '业务类型',
            business_id BIGINT DEFAULT NULL COMMENT '业务ID',
            source_platform VARCHAR(50) NOT NULL COMMENT '来源平台',
            source_url VARCHAR(1000) NOT NULL COMMENT '源资源URL',
            foreign_landing_url VARCHAR(1000) DEFAULT NULL COMMENT '来源落地页',
            license_code VARCHAR(40) DEFAULT NULL COMMENT '授权代码',
            license_version VARCHAR(20) DEFAULT NULL COMMENT '授权版本',
            creator_name VARCHAR(200) DEFAULT NULL COMMENT '作者/创作者',
            content_hash VARCHAR(64) NOT NULL COMMENT '内容哈希',
            file_path VARCHAR(500) NOT NULL COMMENT '本地文件路径',
            file_size BIGINT DEFAULT NULL COMMENT '文件大小',
            batch_id VARCHAR(64) NOT NULL COMMENT '导入批次',
            status VARCHAR(20) NOT NULL COMMENT '导入状态',
            failure_reason VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
            created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
            UNIQUE KEY uk_demo_asset_source_hash (source_url(255), content_hash),
            INDEX idx_demo_asset_business (business_type, business_id),
            INDEX idx_demo_asset_batch (batch_id),
            INDEX idx_demo_asset_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='演示导入资产审计表';
        """
    )


def sql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def fetch_json(url: str) -> dict:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            req = Request(url, headers=DEFAULT_HEADERS)
            with urlopen(req, timeout=60) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError, ssl.SSLError) as exc:
            last_error = exc
            if attempt == 2:
                break
            time.sleep(2 * (attempt + 1))
    if last_error:
        raise last_error
    raise RuntimeError(f"failed to fetch json: {url}")


def fetch_bytes(url: str) -> tuple[bytes, str | None]:
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            req = Request(url, headers=DEFAULT_HEADERS)
            with urlopen(req, timeout=120) as response:
                return response.read(), response.headers.get_content_type()
        except (HTTPError, URLError, TimeoutError, ssl.SSLError) as exc:
            last_error = exc
            if attempt == 3:
                break
            time.sleep(2 * (attempt + 1))
    if last_error:
        raise last_error
    raise RuntimeError(f"failed to fetch bytes: {url}")


def openverse_search(media_type: str, query: str, page_size: int = 8) -> list[dict]:
    params = {"q": query, "page_size": page_size, "license_type": "commercial"}
    payload = fetch_json(f"{OPENVERSE_BASE}/{media_type}/?{urlencode(params)}")
    return payload.get("results", [])


def choose_assets(results: Iterable[dict], limit: int, media_type: str) -> list[dict]:
    chosen: list[dict] = []
    seen_urls: set[str] = set()
    allowed = ALLOWED_LICENSES if media_type == "images" else ALLOWED_AUDIO_LICENSES
    pattern = r"\.(jpg|jpeg|png|webp)(?:$|\?)" if media_type == "images" else r"\.(mp3|ogg|opus|wav|m4a)(?:$|\?)"
    for item in results:
        asset_url = item.get("url")
        license_code = (item.get("license") or "").lower()
        if not asset_url or asset_url in seen_urls or license_code not in allowed:
            continue
        if not re.search(pattern, asset_url, re.I):
            continue
        seen_urls.add(asset_url)
        chosen.append(item)
        if len(chosen) >= limit:
            break
    return chosen


def file_extension(url: str, content_type: str | None, fallback: str) -> str:
    path = urlparse(url).path
    ext = Path(path).suffix.lower()
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".mp3", ".ogg", ".opus", ".wav", ".m4a"}:
        return ext
    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guessed:
            return ".jpg" if guessed == ".jpe" else guessed
    return fallback


def sha256_hex(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {"generated_at": None, "batches": [], "products": [], "music": []}


def write_manifest(manifest: dict) -> None:
    manifest["generated_at"] = datetime.now().isoformat(timespec="seconds")
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def product_folder(category_id: int) -> Path:
    now = datetime.now()
    return UPLOADS_ROOT / "products" / CATEGORY_NAMES[category_id] / f"{now.year}" / f"{now.month:02d}"


def music_folder() -> Path:
    now = datetime.now()
    return UPLOADS_ROOT / "music" / f"{now.year}" / f"{now.month:02d}"


def existing_product_names() -> set[str]:
    rows = run_mysql("SELECT name FROM tb_product;")
    return {line.strip() for line in rows.splitlines() if line.strip()}


def existing_music_keys() -> set[str]:
    rows = run_mysql("SELECT CONCAT(title, '||', IFNULL(artist, '')) FROM music;")
    return {line.strip() for line in rows.splitlines() if line.strip()}


def next_music_sort_order() -> int:
    value = run_mysql("SELECT COALESCE(MAX(sort_order), 0) FROM music;").strip()
    return int(value or "0")


def existing_asset_keys() -> set[tuple[str, str]]:
    ensure_import_audit_schema()
    rows = run_mysql("SELECT source_url, content_hash FROM demo_imported_asset;")
    keys: set[tuple[str, str]] = set()
    for line in rows.splitlines():
        parts = line.split("\t")
        if len(parts) == 2:
            keys.add((parts[0], parts[1]))
    return keys


def fetch_downloaded_asset(item: dict, fallback_ext: str) -> DownloadedAsset:
    payload, content_type = fetch_bytes(item["url"])
    extension = file_extension(item["url"], content_type, fallback_ext)
    temp_dir = Path(tempfile.mkdtemp(prefix="openverse-import-", dir=PROJECT_ROOT / ".tmp"))
    temp_file = temp_dir / f"{uuid.uuid4()}{extension}"
    temp_file.write_bytes(payload)
    return DownloadedAsset(
        source_url=item["url"],
        foreign_landing_url=item.get("foreign_landing_url"),
        title=(item.get("title") or "").strip(),
        creator=(item.get("creator") or "").strip(),
        license_code=(item.get("license") or "").lower(),
        license_version=item.get("license_version"),
        local_temp_path=temp_file,
        content_hash=sha256_hex(payload),
        size=len(payload),
        extension=extension,
    )


def move_into_place(temp_file: Path, target_folder: Path) -> str:
    target_folder.mkdir(parents=True, exist_ok=True)
    target = target_folder / f"{uuid.uuid4()}{temp_file.suffix.lower()}"
    shutil.move(str(temp_file), str(target))
    shutil.rmtree(temp_file.parent, ignore_errors=True)
    return "/" + target.relative_to(PROJECT_ROOT).as_posix()


def hash_for_repo_path(relative_path: str) -> str:
    absolute = PROJECT_ROOT / relative_path.lstrip("/")
    return sha256_hex(absolute.read_bytes())


def ensure_audit_row_from_manifest(
    batch_id: str,
    asset_type: str,
    business_type: str,
    business_id: int,
    asset_entry: dict,
    file_path: str,
) -> None:
    ensure_import_audit_schema()
    content_hash = asset_entry.get("content_hash")
    if not content_hash and file_path.startswith("/uploads/") and (PROJECT_ROOT / file_path.lstrip("/")).exists():
        content_hash = hash_for_repo_path(file_path)
        asset_entry["content_hash"] = content_hash

    source_url = asset_entry.get("source_url")
    if not content_hash or not source_url:
        return

    sql = (
        "INSERT INTO demo_imported_asset "
        "(asset_type, business_type, business_id, source_platform, source_url, foreign_landing_url, license_code, license_version, creator_name, content_hash, file_path, file_size, batch_id, status, failure_reason, created_time, updated_time) VALUES "
        "("
        f"'{sql_escape(asset_type)}',"
        f"'{sql_escape(business_type)}',"
        f"{business_id},"
        "'openverse',"
        f"'{sql_escape(source_url)}',"
        f"{'NULL' if not asset_entry.get('foreign_landing_url') else "'" + sql_escape(asset_entry['foreign_landing_url']) + "'"},"
        f"{'NULL' if not asset_entry.get('license') else "'" + sql_escape(asset_entry['license']) + "'"},"
        f"{'NULL' if not asset_entry.get('license_version') else "'" + sql_escape(asset_entry['license_version']) + "'"},"
        f"{'NULL' if not asset_entry.get('creator') else "'" + sql_escape(asset_entry['creator']) + "'"},"
        f"'{sql_escape(content_hash)}',"
        f"'{sql_escape(file_path)}',"
        f"{int(asset_entry.get('size') or 0)},"
        f"'{sql_escape(batch_id)}',"
        "'COMPLETED',"
        "NULL,"
        "NOW(), NOW()) "
        "ON DUPLICATE KEY UPDATE "
        f"business_type = VALUES(business_type), business_id = VALUES(business_id), file_path = VALUES(file_path), file_size = VALUES(file_size), batch_id = VALUES(batch_id), status = VALUES(status), failure_reason = NULL, updated_time = NOW();"
    )
    run_mysql(sql)


def upsert_batch(batch_id: str, status: str, summary: str) -> None:
    ensure_import_audit_schema()
    run_mysql(
        "INSERT INTO demo_import_batch (batch_id, batch_type, status, summary, created_time, updated_time) VALUES "
        f"('{sql_escape(batch_id)}', 'openverse', '{sql_escape(status)}', '{sql_escape(summary)}', NOW(), NOW()) "
        "ON DUPLICATE KEY UPDATE "
        f"status = VALUES(status), summary = VALUES(summary), updated_time = NOW();"
    )


def insert_asset_record(
    batch_id: str,
    asset_type: str,
    business_type: str,
    business_id: int,
    downloaded: DownloadedAsset,
    file_path: str,
    status: str = "IMPORTED",
) -> None:
    ensure_import_audit_schema()
    sql = (
        "INSERT INTO demo_imported_asset "
        "(asset_type, business_type, business_id, source_platform, source_url, foreign_landing_url, license_code, license_version, creator_name, content_hash, file_path, file_size, batch_id, status, created_time, updated_time) VALUES "
        "("
        f"'{sql_escape(asset_type)}',"
        f"'{sql_escape(business_type)}',"
        f"{business_id},"
        "'openverse',"
        f"'{sql_escape(downloaded.source_url)}',"
        f"{'NULL' if not downloaded.foreign_landing_url else "'" + sql_escape(downloaded.foreign_landing_url) + "'"},"
        f"'{sql_escape(downloaded.license_code)}',"
        f"{'NULL' if not downloaded.license_version else "'" + sql_escape(downloaded.license_version) + "'"},"
        f"{'NULL' if not downloaded.creator else "'" + sql_escape(downloaded.creator) + "'"},"
        f"'{downloaded.content_hash}',"
        f"'{sql_escape(file_path)}',"
        f"{downloaded.size},"
        f"'{sql_escape(batch_id)}',"
        f"'{sql_escape(status)}',"
        "NOW(), NOW()) "
        "ON DUPLICATE KEY UPDATE "
        f"business_type = VALUES(business_type), business_id = VALUES(business_id), file_path = VALUES(file_path), file_size = VALUES(file_size), batch_id = VALUES(batch_id), status = VALUES(status), updated_time = NOW();"
    )
    run_mysql(sql)


def import_products(args: argparse.Namespace, manifest: dict) -> list[str]:
    existing_names = existing_product_names()
    existing_assets = existing_asset_keys()
    inserted: list[str] = []

    for spec in PRODUCT_SPECS[: args.limit_products]:
        if spec["name"] in existing_names:
            continue
        results = openverse_search("images", spec["query"], page_size=10)
        chosen = choose_assets(results, limit=2, media_type="images")
        if len(chosen) < 2:
            print(f"skip product {spec['name']}: not enough open images", file=sys.stderr)
            continue

        downloaded_assets = [fetch_downloaded_asset(item, ".jpg") for item in chosen]
        if args.mode == "dry-run":
            inserted.append(spec["name"])
            for asset in downloaded_assets:
                shutil.rmtree(asset.local_temp_path.parent, ignore_errors=True)
            continue

        final_paths: list[str] = []
        manifest_assets: list[dict] = []
        try:
            for asset in downloaded_assets:
                if (asset.source_url, asset.content_hash) in existing_assets:
                    print(f"skip duplicate asset for product {spec['name']}: {asset.source_url}")
                    continue
                final_path = move_into_place(asset.local_temp_path, product_folder(spec["category_id"]))
                final_paths.append(final_path)
                manifest_assets.append(
                    {
                        "query": spec["query"],
                        "title": asset.title,
                        "creator": asset.creator,
                        "license": asset.license_code,
                        "license_version": asset.license_version,
                        "foreign_landing_url": asset.foreign_landing_url,
                        "source_url": asset.source_url,
                        "local_path": final_path,
                        "content_hash": asset.content_hash,
                        "size": asset.size,
                    }
                )
            if len(final_paths) < 2:
                raise RuntimeError(f"product {spec['name']} did not retain enough unique assets")

            images_json = json.dumps(final_paths, ensure_ascii=False)
            insert_sql = (
                "INSERT INTO tb_product "
                "(name, description, category_id, price, original_price, stock, sales, status, main_image, images, seller_id, seller_name, audit_status, created_time, updated_time) VALUES "
                "("
                f"'{sql_escape(spec['name'])}',"
                f"'{sql_escape(spec['description'])}',"
                f"{spec['category_id']},"
                f"{spec['price']},"
                f"{spec['original_price']},"
                f"{spec['stock']},"
                f"{spec['sales']},"
                "1,"
                f"'{sql_escape(final_paths[0])}',"
                f"'{sql_escape(images_json)}',"
                f"{spec['seller_id']},"
                f"'{sql_escape(spec['seller_name'])}',"
                "1,"
                "NOW(), NOW());"
            )
            run_mysql(insert_sql)
            product_id = int(run_mysql(f"SELECT id FROM tb_product WHERE name='{sql_escape(spec['name'])}' ORDER BY id DESC LIMIT 1;").strip())
            for asset, path in zip(downloaded_assets, final_paths):
                insert_asset_record(args.batch_id, "IMAGE", "PRODUCT", product_id, asset, path)
            manifest["products"].append({"name": spec["name"], "category_id": spec["category_id"], "seller_name": spec["seller_name"], "assets": manifest_assets})
            inserted.append(spec["name"])
        except Exception:
            for path in final_paths:
                absolute = PROJECT_ROOT / path.lstrip("/")
                absolute.unlink(missing_ok=True)
            raise

    return inserted


def import_music(args: argparse.Namespace, manifest: dict) -> list[str]:
    existing_keys = existing_music_keys()
    existing_assets = existing_asset_keys()
    sort_order = next_music_sort_order()
    inserted: list[str] = []

    for spec in MUSIC_SPECS[: args.limit_music]:
        results = openverse_search("audio", spec["query"], page_size=8)
        chosen = choose_assets(results, limit=1, media_type="audio")
        if not chosen:
            print(f"skip music query {spec['query']}: no open audio", file=sys.stderr)
            continue

        asset = fetch_downloaded_asset(chosen[0], ".mp3")
        title = asset.title or spec["label"]
        artist = asset.creator or "Openverse"
        if f"{title}||{artist}" in existing_keys or (asset.source_url, asset.content_hash) in existing_assets:
            shutil.rmtree(asset.local_temp_path.parent, ignore_errors=True)
            continue

        if args.mode == "dry-run":
            inserted.append(title)
            shutil.rmtree(asset.local_temp_path.parent, ignore_errors=True)
            continue

        final_path = move_into_place(asset.local_temp_path, music_folder())
        try:
            sort_order += 1
            run_mysql(
                "INSERT INTO music (title, artist, url, cover, asset_source, license_code, license_version, sort_order, status, created_time, updated_time) VALUES "
                "("
                f"'{sql_escape(title)}',"
                f"'{sql_escape(artist)}',"
                f"'{sql_escape(final_path)}',"
                "NULL,"
                "'openverse',"
                f"'{sql_escape(asset.license_code)}',"
                f"{'NULL' if not asset.license_version else "'" + sql_escape(asset.license_version) + "'"},"
                f"{sort_order},"
                "1,"
                "NOW(), NOW());"
            )
            music_id = int(run_mysql(f"SELECT id FROM music WHERE title='{sql_escape(title)}' AND IFNULL(artist,'')='{sql_escape(artist)}' ORDER BY id DESC LIMIT 1;").strip())
            insert_asset_record(args.batch_id, "AUDIO", "MUSIC", music_id, asset, final_path)
            manifest["music"].append(
                {
                    "query": spec["query"],
                    "title": title,
                    "artist": artist,
                    "license": asset.license_code,
                    "license_version": asset.license_version,
                    "foreign_landing_url": asset.foreign_landing_url,
                    "source_url": asset.source_url,
                    "local_path": final_path,
                    "content_hash": asset.content_hash,
                    "size": asset.size,
                }
            )
            inserted.append(title)
        except Exception:
            (PROJECT_ROOT / final_path.lstrip("/")).unlink(missing_ok=True)
            raise

    return inserted


def migrate_existing_assets(batch_id: str, manifest: dict) -> dict:
    migrated_products = 0
    migrated_files = 0
    wrong_prefix = "/uploads/products/数码电子/"
    manifest_products = {
        entry.get("name"): {
            Path(asset.get("local_path", "")).name: asset
            for asset in entry.get("assets", [])
            if asset.get("local_path")
        }
        for entry in manifest.get("products", [])
        if entry.get("name")
    }

    rows = run_mysql(
        "SELECT id, name, category_id, main_image, images "
        "FROM tb_product WHERE main_image LIKE '/uploads/products/数码电子/%' ORDER BY id;"
    )
    for row in rows.splitlines():
        product_id_raw, product_name, category_id_raw, _, current_images_json = (row.split("\t") + ["", "", "", "", ""])[:5]
        category_id = int(category_id_raw)
        category_name = CATEGORY_NAMES.get(category_id)
        if not category_name:
            continue

        try:
            current_images = json.loads(current_images_json) if current_images_json else []
        except json.JSONDecodeError:
            current_images = [part for part in current_images_json.split(",") if part]

        updated_images: list[str] = []
        changed = False
        product_manifest_assets = manifest_products.get(product_name, {})
        for path in current_images:
            if not isinstance(path, str) or not path.startswith(wrong_prefix):
                updated_images.append(path)
                continue

            source = PROJECT_ROOT / path.lstrip("/")
            relative_parts = Path(path.lstrip("/")).parts
            if len(relative_parts) < 6:
                updated_images.append(path)
                continue

            year_part = relative_parts[3]
            month_part = relative_parts[4]
            target_dir = UPLOADS_ROOT / "products" / category_name / year_part / month_part
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / source.name

            if source.exists() and source != target:
                shutil.move(str(source), str(target))
            elif not source.exists() and not target.exists():
                matches = list(UPLOADS_ROOT.glob(f"products/*/{year_part}/{month_part}/{source.name}"))
                if matches:
                    target = matches[0]

            new_path = "/" + target.relative_to(PROJECT_ROOT).as_posix()
            asset_entry = product_manifest_assets.get(source.name)
            if asset_entry is not None:
                asset_entry["local_path"] = new_path
                ensure_audit_row_from_manifest(batch_id, "IMAGE", "PRODUCT", int(product_id_raw), asset_entry, new_path)
            updated_images.append(new_path)
            changed = True
            migrated_files += 1

        if changed and updated_images:
            images_json = json.dumps(updated_images, ensure_ascii=False)
            run_mysql(
                "UPDATE tb_product SET "
                f"main_image='{sql_escape(updated_images[0])}', images='{sql_escape(images_json)}', updated_time=NOW() WHERE id={int(product_id_raw)};"
            )
            migrated_products += 1

    repair_rows = run_mysql(
        "SELECT id, name, category_id, images "
        "FROM tb_product WHERE id >= 2347 ORDER BY id;"
    )
    for row in repair_rows.splitlines():
        product_id_raw, product_name, category_id_raw, current_images_json = (row.split("\t") + ["", "", "", ""])[:4]
        category_id = int(category_id_raw)
        category_name = CATEGORY_NAMES.get(category_id)
        if not category_name:
            continue

        try:
            current_images = json.loads(current_images_json) if current_images_json else []
        except json.JSONDecodeError:
            current_images = [part for part in current_images_json.split(",") if part]

        updated_images: list[str] = []
        changed = False
        product_manifest_assets = manifest_products.get(product_name, {})
        for path in current_images:
            if not isinstance(path, str) or not path.startswith("/uploads/products/"):
                updated_images.append(path)
                continue

            absolute = PROJECT_ROOT / path.lstrip("/")
            if absolute.exists():
                updated_images.append(path)
                continue

            filename = Path(path).name
            matches = list(UPLOADS_ROOT.glob(f"products/{category_name}/**/{filename}"))
            if not matches:
                updated_images.append(path)
                continue

            found = matches[0]
            parts = Path(path.lstrip("/")).parts
            year_part = parts[3] if len(parts) > 4 else f"{datetime.now().year}"
            month_part = parts[4] if len(parts) > 5 else f"{datetime.now().month:02d}"
            target_dir = UPLOADS_ROOT / "products" / category_name / year_part / month_part
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / filename
            if found != target:
                shutil.move(str(found), str(target))
            new_path = "/" + target.relative_to(PROJECT_ROOT).as_posix()
            asset_entry = product_manifest_assets.get(filename)
            if asset_entry is not None:
                asset_entry["local_path"] = new_path
                ensure_audit_row_from_manifest(batch_id, "IMAGE", "PRODUCT", int(product_id_raw), asset_entry, new_path)
            updated_images.append(new_path)
            changed = True

        if changed and updated_images:
            images_json = json.dumps(updated_images, ensure_ascii=False)
            run_mysql(
                "UPDATE tb_product SET "
                f"main_image='{sql_escape(updated_images[0])}', images='{sql_escape(images_json)}', updated_time=NOW() WHERE id={int(product_id_raw)};"
            )

    migrated_music = 0
    for entry in manifest.get("music", []):
        title = entry.get("title")
        artist = entry.get("artist", "")
        local_path = entry.get("local_path")
        if not title or not local_path:
            continue
        music_id_raw = run_mysql(
            f"SELECT id FROM music WHERE title='{sql_escape(title)}' AND IFNULL(artist,'')='{sql_escape(artist)}' ORDER BY id DESC LIMIT 1;"
        ).strip()
        if not music_id_raw:
            continue
        ensure_audit_row_from_manifest(batch_id, "AUDIO", "MUSIC", int(music_id_raw), entry, local_path)
        migrated_music += 1

    return {"migrated_products": migrated_products, "migrated_files": migrated_files, "audited_music": migrated_music}


def verify_state() -> dict:
    missing_files: list[str] = []
    wrong_product_paths: list[str] = []

    rows = run_mysql("SELECT id, name, main_image, images FROM tb_product WHERE id >= 2347 ORDER BY id;")
    for row in rows.splitlines():
        product_id, name, main_image, images_json = (row.split("\t") + ["", "", "", ""])[:4]
        if main_image and not Path(PROJECT_ROOT / main_image.lstrip("/")).exists():
            missing_files.append(f"product:{product_id}:{main_image}")
        if main_image and main_image.startswith("/uploads/products/数码电子/"):
            wrong_product_paths.append(f"{product_id}:{name}:{main_image}")
        try:
            images = json.loads(images_json) if images_json else []
        except json.JSONDecodeError:
            images = [part for part in images_json.split(",") if part]
        for image in images:
            if not Path(PROJECT_ROOT / image.lstrip("/")).exists():
                missing_files.append(f"product:{product_id}:{image}")

    rows = run_mysql("SELECT id, title, url, cover FROM music WHERE id >= 11 ORDER BY id;")
    for row in rows.splitlines():
        parts = (row.split("\t") + ["", "", "", ""])[:4]
        _, _, url, cover = parts
        if url and url.startswith("/uploads/") and not Path(PROJECT_ROOT / url.lstrip("/")).exists():
            missing_files.append(f"music:{url}")
        if cover and cover.startswith("/uploads/") and not Path(PROJECT_ROOT / cover.lstrip("/")).exists():
            missing_files.append(f"music-cover:{cover}")

    product_total = run_mysql("SELECT COUNT(*) FROM tb_product;").strip()
    music_total = run_mysql("SELECT COUNT(*) FROM music;").strip()
    asset_total = run_mysql("SELECT COUNT(*) FROM demo_imported_asset;").strip()
    return {
        "total_products": int(product_total or "0"),
        "total_music": int(music_total or "0"),
        "total_audited_assets": int(asset_total or "0"),
        "missing_files": missing_files,
        "wrong_product_paths": wrong_product_paths,
    }


def main() -> int:
    args = parse_args()
    if not MYSQL.exists():
        print(f"mysql not found: {MYSQL}", file=sys.stderr)
        return 1

    manifest = load_manifest()

    if args.mode == "verify":
        report = verify_state()
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if not report["missing_files"] and not report["wrong_product_paths"] else 2

    if args.mode == "migrate":
        summary = migrate_existing_assets(args.batch_id, manifest)
        manifest.setdefault("batches", []).append({"batch_id": args.batch_id, "mode": "migrate", **summary})
        write_manifest(manifest)
        upsert_batch(args.batch_id, "MIGRATED", json.dumps(summary, ensure_ascii=False))
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0

    inserted_products = import_products(args, manifest)
    inserted_music = import_music(args, manifest)
    summary = {
        "mode": args.mode,
        "inserted_products": inserted_products,
        "inserted_music": inserted_music,
    }
    manifest.setdefault("batches", []).append({"batch_id": args.batch_id, **summary})
    write_manifest(manifest)

    if args.mode == "execute":
        upsert_batch(args.batch_id, "COMPLETED", json.dumps({"products": len(inserted_products), "music": len(inserted_music)}, ensure_ascii=False))

    print(f"Inserted products: {len(inserted_products)}")
    for name in inserted_products:
        print(f"  - {name}")
    print(f"Inserted music: {len(inserted_music)}")
    for name in inserted_music:
        print(f"  - {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
