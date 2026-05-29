#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from fetch_loremflickr_catalog_assets import query_variants
from fetch_young_catalog_assets import image_size
from young_catalog_data import CATEGORY_DEFINITIONS, CATEGORY_PAGE_SHOWCASE_SLUGS, PRODUCT_SPECS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "scripts" / "young-catalog-assets.json"
MIN_BYTES = 30_000
MIN_WIDTH = 500
MIN_HEIGHT = 500
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
REJECTED_PROVIDERS = {"generated-local"}
E2E_PRODUCT_SLUGS = {
    "smoke": "desk-keyboard-75",
    "shipping": "desk-keycaps-soda",
    "cancel": "wear-canvas-crossbody",
    "priceAlert": "beauty-lotion-soft",
}
NEWEST_SHOWCASE_SLUGS = [
    "anime-badge-book",
    "desk-keycaps-soda",
    "wear-canvas-crossbody",
    "home-floor-lamp",
    "beauty-lotion-soft",
    "snack-sparkling",
    "culture-vinyl-decor",
    "travel-vacuum",
    "anime-display-rack",
    "desk-headphones-shell",
    "wear-sneaker-retro",
    "home-side-table",
]
HOT_SHOWCASE_SLUGS = [
    "desk-watch-softlight",
    "wear-denim-soft",
    "home-throw-pillows",
    "beauty-lotion-soft",
    "anime-badge-book",
    "travel-vacuum",
    "culture-vinyl-decor",
    "wear-canvas-crossbody",
]
STRICT_REVIEW_SLUGS = set(E2E_PRODUCT_SLUGS.values()) | set(CATEGORY_PAGE_SHOWCASE_SLUGS) | set(NEWEST_SHOWCASE_SLUGS) | set(HOT_SHOWCASE_SLUGS)
APPROVED_REVIEW_STATUSES = {"rule-approved-photo", "human-approved-photo"}
LEGACY_CATEGORY_NAMES = {
    "运动户外": "动漫周边",
    "家居日用": "香氛家居",
    "食品饮品": "零食饮品",
    "餐厨好物": "文创书影音",
    "出行日用": "出行配件",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit and repair product catalog photos.")
    parser.add_argument("--mode", choices=["audit", "execute", "manifest"], default="audit")
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "shopping_mall"))
    parser.add_argument("--db-user", default=os.environ.get("DB_USERNAME", "root"))
    parser.add_argument("--db-password", default=os.environ.get("DB_PASSWORD", "123456"))
    parser.add_argument("--db-host", default=os.environ.get("DB_HOST", ""))
    parser.add_argument("--db-port", default=os.environ.get("DB_PORT", ""))
    parser.add_argument("--mysql-exe", default=os.environ.get("MYSQL_EXE", ""))
    parser.add_argument("--no-sync-order-items", action="store_true")
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


def sql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def run_mysql(mysql: str, args: argparse.Namespace, sql: str) -> str:
    env = os.environ.copy()
    env["MYSQL_PWD"] = args.db_password
    command = [mysql, "--default-character-set=utf8mb4", f"-u{args.db_user}", "-N", "-B"]
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


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        raise RuntimeError(f"缺少素材清单: {MANIFEST_PATH}")
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def write_manifest(manifest: dict) -> None:
    manifest["generated_at"] = datetime.now().isoformat(timespec="seconds")
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def read_product_rows(mysql: str, args: argparse.Namespace) -> list[dict]:
    rows = run_mysql(
        mysql,
        args,
        """
SELECT p.id, p.name, IFNULL(c.name,''), IFNULL(p.main_image,''), IFNULL(p.images,''), IFNULL(p.seller_name,''), p.status, p.audit_status, p.stock, p.price
FROM tb_product p
LEFT JOIN tb_category c ON c.id = p.category_id
ORDER BY p.id;
""",
    )
    products = []
    for row in rows.splitlines():
        if not row.strip():
            continue
        product_id, name, category, main_image, images, seller_name, status, audit_status, stock, price = (row.split("\t") + [""] * 10)[:10]
        products.append(
            {
                "id": int(product_id),
                "name": name,
                "category": category,
                "main_image": main_image,
                "images": images,
                "seller_name": seller_name,
                "status": int(status or "0"),
                "audit_status": int(audit_status or "0"),
                "stock": int(stock or "0"),
                "price": float(price or "0"),
            }
        )
    return products


def read_category_rows(mysql: str, args: argparse.Namespace) -> list[dict]:
    rows = run_mysql(
        mysql,
        args,
        """
SELECT id, name, IFNULL(description,''), parent_id, sort_order, IFNULL(icon,''), status
FROM tb_category
ORDER BY id;
""",
    )
    categories = []
    for row in rows.splitlines():
        if not row.strip():
            continue
        category_id, name, description, parent_id, sort_order, icon, status = (row.split("\t") + [""] * 7)[:7]
        categories.append(
            {
                "id": int(category_id),
                "name": name,
                "description": description,
                "parent_id": int(parent_id or "0"),
                "sort_order": int(sort_order or "0"),
                "icon": icon,
                "status": int(status or "0"),
            }
        )
    return categories


def read_order_item_image_rows(mysql: str, args: argparse.Namespace) -> list[dict]:
    rows = run_mysql(
        mysql,
        args,
        """
SELECT id, product_id, IFNULL(product_image,'')
FROM tb_order_item
ORDER BY id;
""",
    )
    items = []
    for row in rows.splitlines():
        if not row.strip():
            continue
        item_id, product_id, product_image = (row.split("\t") + [""] * 3)[:3]
        items.append({"id": int(item_id), "product_id": int(product_id or "0"), "product_image": product_image})
    return items


def ensure_categories(mysql: str, args: argparse.Namespace) -> None:
    rows = read_category_rows(mysql, args)
    by_name = {row["name"]: row for row in rows}
    statements = ["START TRANSACTION;"]
    for index, (name, description) in enumerate(CATEGORY_DEFINITIONS, start=1):
        row = by_name.get(name)
        if row:
            statements.append(
                "UPDATE tb_category SET "
                f"description='{sql_escape(description)}', sort_order={index}, status=1, updated_time=NOW() "
                f"WHERE id={row['id']};"
            )
            continue
        legacy_name = LEGACY_CATEGORY_NAMES.get(name, "")
        legacy_row = by_name.get(legacy_name)
        if legacy_row:
            statements.append(
                "UPDATE tb_category SET "
                f"name='{sql_escape(name)}', description='{sql_escape(description)}', sort_order={index}, status=1, updated_time=NOW() "
                f"WHERE id={legacy_row['id']};"
            )
            by_name[name] = {**legacy_row, "name": name, "description": description}
            continue
        statements.append(
            "INSERT INTO tb_category "
            "(name, description, parent_id, sort_order, icon, status, created_time, updated_time) "
            "VALUES "
            f"('{sql_escape(name)}', '{sql_escape(description)}', 0, {index}, NULL, 1, NOW(), NOW());"
        )
    statements.append("COMMIT;")
    run_mysql_script(mysql, args, "\n".join(statements))


def read_id_map(mysql: str, args: argparse.Namespace, table: str, name_column: str) -> dict[str, int]:
    rows = run_mysql(mysql, args, f"SELECT id, {name_column} FROM {table};")
    result = {}
    for row in rows.splitlines():
        if not row.strip():
            continue
        item_id, name = (row.split("\t") + [""])[:2]
        result[name] = int(item_id)
    return result


def spec_key(spec: dict) -> tuple[str, str]:
    return spec["name"], spec["category"]


def slug_from_image_path(image_path: str) -> str | None:
    stem = Path(str(image_path or "")).stem
    if not stem:
        return None
    if stem.endswith("-catalog"):
        stem = stem[: -len("-catalog")]
    return stem or None


def query_tokens(value: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", str(value or "").lower()) if token]


def canonical_query(value: str) -> str:
    return ",".join(query_tokens(value))


def semantic_reasons_for_manifest(spec: dict, entry: dict) -> list[str]:
    reasons: list[str] = []
    if entry.get("asset_kind") != "real-photo":
        reasons.append("not_marked_real_photo")
    if entry.get("review_status") not in APPROVED_REVIEW_STATUSES:
        reasons.append("photo_not_approved")
    if not entry.get("creator"):
        reasons.append("missing_creator")

    source_url = str(entry.get("source_url") or "")
    provider = str(entry.get("provider") or "")
    if provider == "loremflickr-flickr" and "staticflickr.com" not in source_url:
        reasons.append("flickr_source_mismatch")

    expected_queries = {canonical_query(variant) for variant in query_variants(spec)}
    expected_queries.discard("")
    actual_query = canonical_query(str(entry.get("query") or ""))
    actual_terms = set(query_tokens(f"{entry.get('query') or ''} {entry.get('title') or ''}"))
    expected_terms = set()
    for query in expected_queries:
        expected_terms.update(query.split(","))

    if not actual_query:
        reasons.append("missing_semantic_query")
    elif actual_query not in expected_queries and len(actual_terms & expected_terms) < min(2, len(expected_terms)):
        reasons.append("query_semantic_mismatch")

    if spec["slug"] in STRICT_REVIEW_SLUGS:
        if actual_query not in expected_queries:
            reasons.append("strict_query_not_curated")
        if not entry.get("foreign_landing_url"):
            reasons.append("missing_foreign_landing_url")
        if not entry.get("license"):
            reasons.append("missing_strict_license")
    return reasons


def row_for_spec(spec: dict, rows_by_key: dict[tuple[str, str], dict], rows_by_slug: dict[str, dict]) -> dict | None:
    return rows_by_key.get(spec_key(spec)) or rows_by_slug.get(spec["slug"])


def spec_by_slug() -> dict[str, dict]:
    return {spec["slug"]: spec for spec in PRODUCT_SPECS}


def validate_manifest_photo(spec: dict, entry: dict | None) -> tuple[str | None, list[str], dict]:
    reasons: list[str] = []
    detail = {
        "slug": spec["slug"],
        "name": spec["name"],
        "category": spec["category"],
        "provider": entry.get("provider") if entry else None,
        "local_path": entry.get("local_path") if entry else None,
        "source_url": entry.get("source_url") if entry else None,
        "license": entry.get("license") if entry else None,
        "query": entry.get("query") if entry else None,
        "review_status": entry.get("review_status") if entry else None,
        "strict_review": spec["slug"] in STRICT_REVIEW_SLUGS,
    }
    if not entry:
        return None, ["missing_manifest_entry"], detail

    provider = str(entry.get("provider") or "")
    source_url = str(entry.get("source_url") or "")
    local_path = str(entry.get("local_path") or "")
    license_value = str(entry.get("license") or "")
    if not provider:
        reasons.append("missing_provider")
    if not source_url:
        reasons.append("missing_source_url")
    if not license_value or license_value == "cached":
        reasons.append("missing_license")
    if provider in REJECTED_PROVIDERS:
        reasons.append("generated_provider")
    if provider == "local-cache" and not source_url:
        reasons.append("unverifiable_local_cache")
    if not local_path:
        reasons.append("missing_local_path")
        return None, reasons, detail
    if "-catalog." in local_path:
        reasons.append("programmatic_catalog_placeholder")
    if slug_from_image_path(local_path) != spec["slug"]:
        reasons.append("slug_path_mismatch")
    if Path(local_path).suffix.lower() not in ALLOWED_EXTENSIONS:
        reasons.append("unsupported_extension")
    expected_prefix = f"/uploads/products/{spec['category']}/2026/05/"
    if not local_path.startswith(expected_prefix):
        reasons.append("wrong_category_path")

    absolute_path = PROJECT_ROOT / local_path.lstrip("/")
    if not absolute_path.exists():
        reasons.append("missing_file")
        return local_path, reasons, detail
    if absolute_path.stat().st_size < MIN_BYTES:
        reasons.append("too_small_for_photo")
    dimensions = image_size(absolute_path.read_bytes())
    detail["dimensions"] = dimensions
    detail["size"] = absolute_path.stat().st_size
    if dimensions is None:
        reasons.append("unknown_dimensions")
    else:
        width, height = dimensions
        if width < MIN_WIDTH or height < MIN_HEIGHT:
            reasons.append("low_resolution")
    reasons.extend(semantic_reasons_for_manifest(spec, entry))
    return local_path, reasons, detail


def normalize_manifest() -> dict:
    manifest = load_manifest()
    manifest_products = manifest.setdefault("products", {})
    failures = []
    approved = 0
    reviewed_at = datetime.now().isoformat(timespec="seconds")

    for spec in PRODUCT_SPECS:
        entry = manifest_products.get(spec["slug"])
        expected_path, reasons, detail = validate_manifest_photo(spec, entry)
        if not entry:
            failures.append({"slug": spec["slug"], "reasons": reasons})
            continue

        entry["slug"] = spec["slug"]
        entry["name"] = spec["name"]
        entry["category"] = spec["category"]
        entry["asset_kind"] = "real-photo"
        entry["review_status"] = "failed-rule-audit" if reasons else "rule-approved-photo"
        entry["reviewed_at"] = reviewed_at
        if detail.get("dimensions") is not None:
            entry["dimensions"] = list(detail["dimensions"])
        if detail.get("size") is not None:
            entry["size"] = detail["size"]
        if reasons:
            entry["audit_reasons"] = reasons
            failures.append({"slug": spec["slug"], "local_path": expected_path, "reasons": reasons})
        else:
            entry.pop("audit_reasons", None)
            approved += 1

    write_manifest(manifest)
    return {
        "manifest": str(MANIFEST_PATH),
        "total_specs": len(PRODUCT_SPECS),
        "approved_photos": approved,
        "failures": failures,
        "ready": not failures,
    }


def backup_rows(mysql: str, args: argparse.Namespace) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = PROJECT_ROOT / "scratch" / f"product_photo_repair_{timestamp}.json"
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "products": read_product_rows(mysql, args),
        "categories": read_category_rows(mysql, args),
        "order_item_product_images": read_order_item_image_rows(mysql, args),
        "manifest": load_manifest(),
    }
    backup_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return backup_path


def build_audit(mysql: str, args: argparse.Namespace) -> dict:
    manifest_products = load_manifest().get("products") or {}
    product_rows = read_product_rows(mysql, args)
    rows_by_key = {(row["name"], row["category"]): row for row in product_rows}
    rows_by_slug = {}
    for row in product_rows:
        for image_path in (row["main_image"], row["images"]):
            slug = slug_from_image_path(image_path)
            if slug:
                rows_by_slug.setdefault(slug, row)
    specs_by_slug = spec_by_slug()
    photo_failures = []
    db_mismatches = []
    approved_entries = []
    seen_paths: dict[str, str] = {}
    duplicate_paths = []

    for spec in PRODUCT_SPECS:
        expected_path, reasons, detail = validate_manifest_photo(spec, manifest_products.get(spec["slug"]))
        if expected_path:
            previous_slug = seen_paths.get(expected_path)
            if previous_slug and previous_slug != spec["slug"]:
                duplicate_paths.append({"path": expected_path, "slugs": [previous_slug, spec["slug"]]})
            seen_paths[expected_path] = spec["slug"]
        if reasons:
            detail["reasons"] = reasons
            photo_failures.append(detail)
            continue
        approved_entries.append(detail)

        row = row_for_spec(spec, rows_by_key, rows_by_slug)
        images_json = json.dumps([expected_path], ensure_ascii=False, separators=(",", ":"))
        if row is None:
            db_mismatches.append({"slug": spec["slug"], "reason": "missing_db_row", "expected": expected_path})
            continue
        if (
            row["name"] != spec["name"]
            or row["category"] != spec["category"]
            or row["main_image"] != expected_path
            or row["images"].replace(" ", "") != images_json
        ):
            db_mismatches.append(
                {
                    "id": row["id"],
                    "slug": spec["slug"],
                    "actual_name": row["name"],
                    "expected_name": spec["name"],
                    "actual": row["main_image"],
                    "expected": expected_path,
                }
            )

    e2e_products = {}
    for label, slug in E2E_PRODUCT_SLUGS.items():
        spec = specs_by_slug[slug]
        row = row_for_spec(spec, rows_by_key, rows_by_slug)
        e2e_products[label] = {
            "slug": slug,
            "id": row["id"] if row else None,
            "name": spec["name"],
            "seller": spec["seller_name"],
            "ready": bool(row and row["status"] == 1 and row["audit_status"] == 1 and row["stock"] > 20 and row["price"] > 1),
        }

    return {
        "database": args.db_name,
        "total_specs": len(PRODUCT_SPECS),
        "approved_photos": len(approved_entries),
        "photo_failures": photo_failures,
        "duplicate_paths": duplicate_paths,
        "db_mismatches": db_mismatches,
        "e2e_products": e2e_products,
        "ready": not photo_failures and not duplicate_paths and not db_mismatches and all(item["ready"] for item in e2e_products.values()),
    }


def execute_repair(mysql: str, args: argparse.Namespace) -> dict:
    preflight = build_audit(mysql, args)
    if preflight["photo_failures"] or preflight["duplicate_paths"]:
        raise RuntimeError(
            "商品照片素材未通过审计，请先运行 scripts/fetch_young_catalog_assets.py 刷新真实照片。"
            f" failures={len(preflight['photo_failures'])}, duplicates={len(preflight['duplicate_paths'])}"
        )

    manifest_products = load_manifest().get("products") or {}
    ensure_categories(mysql, args)
    category_ids = read_id_map(mysql, args, "tb_category", "name")
    user_ids = read_id_map(mysql, args, "tb_user", "username")
    product_rows = read_product_rows(mysql, args)
    rows_by_key = {(row["name"], row["category"]): row for row in product_rows}
    rows_by_slug = {}
    for row in product_rows:
        for image_path in (row["main_image"], row["images"]):
            slug = slug_from_image_path(image_path)
            if slug:
                rows_by_slug.setdefault(slug, row)
    backup_path = backup_rows(mysql, args)

    statements = ["START TRANSACTION;"]
    updated = 0
    inserted = 0
    for index, spec in enumerate(PRODUCT_SPECS, start=1):
        image_url = manifest_products[spec["slug"]]["local_path"]
        images_json = json.dumps([image_url], ensure_ascii=False, separators=(",", ":"))
        category_id = category_ids.get(spec["category"])
        seller_id = user_ids.get(spec["seller_name"])
        if category_id is None:
            raise RuntimeError(f"缺少商品分类: {spec['category']}")
        if seller_id is None:
            raise RuntimeError(f"缺少卖家账号: {spec['seller_name']}")
        stock = 160 + (index % 20) * 7
        row = row_for_spec(spec, rows_by_key, rows_by_slug)
        if row:
            updated += 1
            statements.append(
                "UPDATE tb_product SET "
                f"name='{sql_escape(spec['name'])}', "
                f"description='{sql_escape(spec['description'])}', "
                f"category_id={category_id}, price={float(spec['price']):.2f}, original_price={float(spec['original_price']):.2f}, "
                f"stock=GREATEST(stock,{stock}), status=1, audit_status=1, "
                f"main_image='{sql_escape(image_url)}', images='{sql_escape(images_json)}', "
                f"seller_id={seller_id}, seller_name='{sql_escape(spec['seller_name'])}', updated_time=NOW() "
                f"WHERE id={row['id']};"
            )
        else:
            inserted += 1
            statements.append(
                "INSERT INTO tb_product "
                "(name, description, category_id, price, original_price, pending_price, pending_original_price, stock, version, sales, status, main_image, images, seller_id, seller_name, audit_status, audit_remark, audit_time, created_time, updated_time) "
                "VALUES "
                "("
                f"'{sql_escape(spec['name'])}', '{sql_escape(spec['description'])}', {category_id}, "
                f"{float(spec['price']):.2f}, {float(spec['original_price']):.2f}, NULL, NULL, {max(stock, 200)}, 0, 0, 1, "
                f"'{sql_escape(image_url)}', '{sql_escape(images_json)}', {seller_id}, '{sql_escape(spec['seller_name'])}', "
                "1, NULL, NOW(), NOW(), NOW()"
                ");"
            )

    for slug in E2E_PRODUCT_SLUGS.values():
        spec = spec_by_slug()[slug]
        statements.append(
            "UPDATE tb_product p "
            "JOIN tb_category c ON c.id=p.category_id "
            "SET p.stock=GREATEST(p.stock,300), p.status=1, p.audit_status=1, p.updated_time=NOW() "
            f"WHERE p.name='{sql_escape(spec['name'])}' AND c.name='{sql_escape(spec['category'])}';"
        )
    if not args.no_sync_order_items:
        statements.append(
            "UPDATE tb_order_item oi "
            "JOIN tb_product p ON p.id=oi.product_id "
            "SET oi.product_image=p.main_image, oi.updated_time=NOW();"
        )
    statements.append("COMMIT;")
    run_mysql_script(mysql, args, "\n".join(statements))

    result = build_audit(mysql, args)
    result["backup_path"] = str(backup_path)
    result["updated"] = updated
    result["inserted"] = inserted
    return result


def main() -> int:
    args = parse_args()
    mysql = resolve_mysql_command(args.mysql_exe)
    if args.mode != "manifest" and not mysql:
        print("mysql not found. Set MYSQL_EXE or install MySQL CLI.", file=os.sys.stderr)
        return 2
    try:
        if args.mode == "manifest":
            result = normalize_manifest()
        elif args.mode == "execute":
            result = execute_repair(mysql, args)
        else:
            result = build_audit(mysql, args)
    except Exception as error:
        print(str(error), file=os.sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ready") else 1


if __name__ == "__main__":
    raise SystemExit(main())
