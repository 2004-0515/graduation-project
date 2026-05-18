#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import struct
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from young_catalog_data import PRODUCT_SPECS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "scripts" / "young-catalog-assets.json"
UPLOADS_ROOT = PROJECT_ROOT / "uploads" / "products"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
OPENVERSE_BASE = "https://api.openverse.org/v1/images/"
COMMONS_BASE = "https://commons.wikimedia.org/w/api.php"
ALLOWED_LICENSES = {"by", "by-sa", "cc0", "pdm"}
MIN_WIDTH = 500
MIN_HEIGHT = 500
MIN_BYTES = 20_000
SKIP_TITLE_TERMS = {"icon", "logo", "svg", "diagram", "historic", "pdf", "coat of arms"}
# Prefer the normalized display asset when multiple cached variants exist.
EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
FETCH_DATE = datetime(2026, 5, 15)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch curated product assets for the localized catalog.")
    parser.add_argument(
        "--only-slugs",
        nargs="*",
        default=[],
        help="Refresh only the listed product slugs. Matching slugs bypass the existing manifest entry and local cache.",
    )
    parser.add_argument(
        "--refresh-provider",
        action="append",
        default=[],
        help="Refresh manifest entries whose current provider matches this value. Can be passed multiple times.",
    )
    return parser.parse_args()


def fetch_json(url: str) -> dict:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=30) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"failed to fetch json: {url}") from last_error


def fetch_bytes(url: str) -> tuple[bytes, str | None]:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=45) as response:
                return response.read(), response.headers.get_content_type()
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"failed to fetch bytes: {url}") from last_error


def sha256_hex(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def file_extension(url: str, content_type: str | None) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in EXTENSIONS:
        return ".jpg" if suffix == ".jpeg" else suffix
    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guessed in {".jpe", ".jpeg"}:
            return ".jpg"
        if guessed in EXTENSIONS:
            return guessed
    return ".jpg"


def image_size(payload: bytes) -> tuple[int, int] | None:
    if payload.startswith(b"\x89PNG\r\n\x1a\n") and len(payload) >= 24:
        return struct.unpack(">II", payload[16:24])
    if payload[:3] == b"\xff\xd8\xff":
        index = 2
        length = len(payload)
        while index < length:
            if payload[index] != 0xFF:
                index += 1
                continue
            marker = payload[index + 1]
            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                height, width = struct.unpack(">HH", payload[index + 5:index + 9])
                return width, height
            segment_length = struct.unpack(">H", payload[index + 2:index + 4])[0]
            index += 2 + segment_length
        return None
    if payload.startswith(b"RIFF") and payload[8:12] == b"WEBP":
        chunk = payload[12:16]
        if chunk == b"VP8X" and len(payload) >= 30:
            width = 1 + int.from_bytes(payload[24:27], "little")
            height = 1 + int.from_bytes(payload[27:30], "little")
            return width, height
        if chunk == b"VP8 " and len(payload) >= 30:
            width, height = struct.unpack("<HH", payload[26:30])
            return width & 0x3FFF, height & 0x3FFF
        if chunk == b"VP8L" and len(payload) >= 25:
            bits = int.from_bytes(payload[21:25], "little")
            width = (bits & 0x3FFF) + 1
            height = ((bits >> 14) & 0x3FFF) + 1
            return width, height
    return None


def is_good_candidate(title: str, payload: bytes) -> bool:
    lowered = title.lower()
    if any(term in lowered for term in SKIP_TITLE_TERMS):
        return False
    if len(payload) < MIN_BYTES:
        return False
    size = image_size(payload)
    if size is None:
        return False
    width, height = size
    return width >= MIN_WIDTH and height >= MIN_HEIGHT


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {"generated_at": None, "products": {}}


def write_manifest(manifest: dict) -> None:
    manifest["generated_at"] = datetime.now().isoformat(timespec="seconds")
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def openverse_candidates(query: str) -> list[dict]:
    payload = fetch_json(f"{OPENVERSE_BASE}?{urlencode({'q': query, 'page_size': 10, 'license_type': 'commercial'})}")
    candidates = []
    for item in payload.get("results", []):
        source_url = item.get("url")
        license_code = (item.get("license") or "").lower()
        if not source_url or license_code not in ALLOWED_LICENSES:
            continue
        if Path(urlparse(source_url).path).suffix.lower() not in EXTENSIONS:
            continue
        title = (item.get("title") or query).strip()
        candidates.append(
            {
                "provider": "openverse",
                "query": query,
                "title": title,
                "creator": (item.get("creator") or "").strip(),
                "license": license_code,
                "license_version": item.get("license_version"),
                "source_url": source_url,
                "foreign_landing_url": item.get("foreign_landing_url"),
            }
        )
    return candidates


def commons_candidates(query: str) -> list[dict]:
    payload = fetch_json(
        COMMONS_BASE + "?" + urlencode(
            {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": query,
                "gsrnamespace": "6",
                "gsrlimit": "8",
                "prop": "imageinfo",
                "iiprop": "url|size|mime",
            }
        )
    )
    candidates = []
    for page in (payload.get("query") or {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        source_url = info.get("url")
        mime = (info.get("mime") or "").lower()
        if not source_url or not mime.startswith("image/"):
            continue
        if Path(urlparse(source_url).path).suffix.lower() not in EXTENSIONS:
            continue
        candidates.append(
            {
                "provider": "wikimedia-commons",
                "query": query,
                "title": page.get("title", query).replace("File:", "").strip(),
                "creator": "Wikimedia Commons",
                "license": "commons",
                "license_version": None,
                "source_url": source_url,
                "foreign_landing_url": "https://commons.wikimedia.org/wiki/" + page.get("title", ""),
            }
        )
    return candidates


def target_folder(category_name: str) -> Path:
    return UPLOADS_ROOT / category_name / str(FETCH_DATE.year) / f"{FETCH_DATE.month:02d}"


def save_asset(category_name: str, slug: str, payload: bytes, extension: str) -> str:
    folder = target_folder(category_name)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f"{slug}{extension}"
    target.write_bytes(payload)
    return "/" + target.relative_to(PROJECT_ROOT).as_posix()


def cached_asset_path(category_name: str, slug: str) -> Path | None:
    folder = target_folder(category_name)
    for extension in EXTENSIONS:
        candidate = folder / f"{slug}{extension}"
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    args = parse_args()
    manifest = load_manifest()
    only_slugs = {slug.strip() for slug in args.only_slugs if slug.strip()}
    refresh_providers = {provider.strip() for provider in args.refresh_provider if provider and provider.strip()}
    used_hashes = {
        entry.get("content_hash")
        for entry in manifest.get("products", {}).values()
        if entry.get("content_hash")
    }
    used_urls = {
        entry.get("source_url")
        for entry in manifest.get("products", {}).values()
        if entry.get("source_url")
    }

    failures: list[str] = []
    fetched = 0

    for spec in PRODUCT_SPECS:
        if only_slugs and spec["slug"] not in only_slugs:
            continue

        queries = spec.get("download_queries") or []
        if not queries:
            continue

        existing = manifest.get("products", {}).get(spec["slug"])
        force_refresh = spec["slug"] in only_slugs or (existing and existing.get("provider") in refresh_providers)
        if existing:
            local_path = existing.get("local_path")
            if (
                not force_refresh
                and
                existing.get("provider") != "generated-local"
                and local_path
                and (PROJECT_ROOT / local_path.lstrip("/")).exists()
            ):
                continue

        cached_path = None if force_refresh else cached_asset_path(spec["category"], spec["slug"])
        if cached_path:
            payload = cached_path.read_bytes()
            content_hash = sha256_hex(payload)
            manifest.setdefault("products", {})[spec["slug"]] = {
                "slug": spec["slug"],
                "name": spec["name"],
                "category": spec["category"],
                "provider": "local-cache",
                "query": (queries[0] if queries else ""),
                "title": spec["name"],
                "creator": "",
                "license": "cached",
                "license_version": None,
                "source_url": "",
                "foreign_landing_url": "",
                "local_path": "/" + cached_path.relative_to(PROJECT_ROOT).as_posix(),
                "content_hash": content_hash,
                "size": len(payload),
            }
            used_hashes.add(content_hash)
            write_manifest(manifest)
            continue

        chosen_meta = None
        chosen_payload = None
        chosen_ext = None

        candidate_groups = []
        for query in queries:
            for provider in (openverse_candidates, commons_candidates):
                try:
                    candidate_groups.append(provider(query))
                except Exception:
                    continue

        for group in candidate_groups:
            for candidate in group:
                if candidate["source_url"] in used_urls:
                    continue
                try:
                    payload, content_type = fetch_bytes(candidate["source_url"])
                except Exception:
                    continue
                if not is_good_candidate(candidate["title"], payload):
                    continue
                content_hash = sha256_hex(payload)
                if content_hash in used_hashes:
                    continue
                chosen_meta = candidate
                chosen_payload = payload
                chosen_ext = file_extension(candidate["source_url"], content_type)
                candidate["content_hash"] = content_hash
                candidate["size"] = len(payload)
                break
            if chosen_meta is not None:
                break

        if chosen_meta is None or chosen_payload is None or chosen_ext is None:
            failures.append(spec["slug"])
            continue

        local_path = save_asset(spec["category"], spec["slug"], chosen_payload, chosen_ext)
        manifest.setdefault("products", {})[spec["slug"]] = {
            "slug": spec["slug"],
            "name": spec["name"],
            "category": spec["category"],
            "provider": chosen_meta["provider"],
            "query": chosen_meta["query"],
            "title": chosen_meta["title"],
            "creator": chosen_meta["creator"],
            "license": chosen_meta["license"],
            "license_version": chosen_meta["license_version"],
            "source_url": chosen_meta["source_url"],
            "foreign_landing_url": chosen_meta["foreign_landing_url"],
            "local_path": local_path,
            "content_hash": chosen_meta["content_hash"],
            "size": chosen_meta["size"],
        }
        used_hashes.add(chosen_meta["content_hash"])
        used_urls.add(chosen_meta["source_url"])
        fetched += 1
        write_manifest(manifest)

    write_manifest(manifest)
    print(json.dumps({"fetched": fetched, "failures": failures}, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
