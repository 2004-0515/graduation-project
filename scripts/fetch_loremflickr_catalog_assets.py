#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen

from fetch_young_catalog_assets import image_size
from young_catalog_data import PRODUCT_SPECS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "scripts" / "young-catalog-assets.json"
UPLOADS_ROOT = PROJECT_ROOT / "uploads" / "products"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
MIN_BYTES = 30_000
MIN_WIDTH = 700
MIN_HEIGHT = 700
GENERIC_TERMS = {
    "aesthetic",
    "ambient",
    "bag",
    "clear",
    "cream",
    "cute",
    "desk",
    "display",
    "fashion",
    "flatlay",
    "gift",
    "minimal",
    "product",
    "set",
}

TAG_OVERRIDES = {
    "anime-acrylic-stand": ["acrylic,stand", "display,stand", "collectible,stand"],
    "anime-badge-book": ["button,badges", "pin,badge", "badge,collection"],
    "anime-keychain-gift": ["keychain,charm", "bag,charm", "keyring"],
    "anime-sticker-pack": ["sticker,pack", "planner,stickers", "stickers"],
    "anime-plush-keyring": ["plush,toy", "plush,keychain", "stuffed,toy"],
    "anime-desk-figure": ["anime,figurine", "toy,figurine", "collectible,figure"],
    "anime-ita-pouch": ["ita,bag", "clear,pouch", "display,pouch"],
    "anime-postcard-set": ["postcard,set", "illustration,postcards", "art,cards"],
    "anime-mousepad": ["mouse,pad", "desk,mat", "gaming,mousepad"],
    "anime-lanyard-card": ["lanyard,badge", "card,holder", "id,holder"],
    "anime-display-rack": ["display,shelf", "figurine,shelf", "collectible,display"],
    "anime-towel": ["printed,towel", "towel", "hand,towel"],
    "anime-card-sleeves": ["trading,cards", "card,sleeves", "photocard"],
    "anime-desk-calendar": ["desk,calendar", "table,calendar", "calendar"],
    "desk-keyboard-75": ["mechanical,keyboard", "keyboard,product", "keyboard,desk"],
    "desk-keycaps-soda": ["desktop,workstation", "computer,desk", "keyboard,desk"],
    "desk-headphones-sony-wh1000xm5": ["sony,headphones", "noise,cancelling,headphones", "headphones"],
    "desk-camera-canon-eos": ["canon,eos,camera", "canon,mirrorless,camera", "canon,camera"],
    "desk-speaker-mini": ["portable,speaker", "bluetooth,speaker", "speaker,desk"],
    "desk-watch-softlight": ["snow,landscape", "winter,landscape", "landscape,print"],
    "desk-tablet-sleeve": ["tablet,case", "ipad,case", "tablet,sleeve"],
    "desk-camera-pouch": ["camera,bag", "camera,pouch", "camera,case"],
    "desk-cable-dock": ["cable,organizer", "cable,holder", "desk,cable"],
    "desk-light-strip": ["desk,light", "monitor,light", "led,strip"],
    "desk-phone-stand": ["phone,stand", "aluminum,stand", "mobile,stand"],
    "desk-monitor-riser": ["monitor,stand", "monitor,riser", "desk,stand"],
    "desk-earbud-case": ["earbuds,case", "airpods,case", "earphone,case"],
    "desk-laptop-stand": ["laptop,stand", "notebook,stand", "desk,stand"],
    "desk-usb-hub": ["usb,hub", "computer,hub", "usb,adapter"],
    "desk-webcam-light": ["webcam,light", "ring,light", "camera,light"],
    "desk-wireless-charger": ["wireless,charger", "charging,pad", "phone,charger"],
    "desk-wireless-mic": ["wireless,microphone", "lapel,microphone", "microphone"],
    "wear-denim-soft": ["blue,jeans", "denim,pants", "straight,jeans"],
    "wear-canvas-crossbody": ["canvas,bag", "crossbody,bag", "shoulder,bag"],
    "wear-sneaker-retro": ["sneakers", "retro,sneakers", "white,sneakers"],
    "wear-baseball-cap": ["baseball,cap", "blue,cap", "cap"],
    "wear-phone-strap": ["phone,charm", "phone,lanyard", "phone,strap"],
    "wear-hairclip-gift": ["hair,clip", "hair,accessories", "hairpin"],
    "wear-tshirt-graphic": ["graphic,tshirt", "tshirt", "t-shirt"],
    "wear-tote-soft": ["canvas,tote", "tote,bag", "shopping,bag"],
    "wear-socks-pop": ["colorful,socks", "socks", "casual,socks"],
    "wear-hoodie-soft": ["hoodie", "casual,hoodie", "sweatshirt"],
    "wear-mini-backpack": ["mini,backpack", "backpack", "small,backpack"],
    "wear-shoulder-bag-soft": ["shoulder,bag", "handbag", "bag,fashion"],
    "wear-slip-ons": ["canvas,shoes", "slip,on", "sneakers"],
    "wear-cardigan-knit": ["knit,cardigan", "cardigan", "knitwear"],
    "wear-pleated-skirt": ["pleated,skirt", "skirt", "fashion,skirt"],
    "wear-layer-necklace": ["layered,necklace", "necklace", "jewelry"],
    "wear-sunglasses-clear": ["sunglasses", "clear,sunglasses", "glasses"],
    "home-throw-pillows": ["throw,pillows", "sofa,cushion", "cushion"],
    "home-floor-lamp": ["livingroom,lamp", "floor,lamp", "livingroom,decor"],
    "home-side-table": ["side,table", "bedside,table", "small,table"],
    "home-glass-vase": ["glass,vase", "vase", "flower,vase"],
    "home-curtain-soft": ["curtain", "sheer,curtain", "window,curtain"],
    "home-lounge-corner": ["area,rug", "bedroom,rug", "small,rug"],
    "home-candle-amber": ["scented,candle", "candle,jar", "candle"],
    "home-diffuser-clear": ["reed,diffuser", "fragrance,diffuser", "aroma,diffuser"],
    "home-mug-ceramic": ["ceramic,mug", "coffee,mug", "mug"],
    "home-tray-softlight": ["decor,tray", "vanity,tray", "small,tray"],
    "home-room-spray": ["room,spray", "fragrance,spray", "spray,bottle"],
    "home-storage-crate": ["storage,box", "storage,crate", "folding,crate"],
    "home-bedding-check": ["bedding,set", "bed,sheets", "duvet,cover"],
    "home-table-mirror": ["table,mirror", "makeup,mirror", "desk,mirror"],
    "home-incense-holder": ["incense,holder", "incense,burner", "incense"],
    "home-book-stand": ["book,stand", "book,holder", "reading,stand"],
    "home-linen-basket": ["storage,basket", "linen,basket", "woven,basket"],
    "home-bedside-tray": ["bedside,tray", "small,tray", "serving,tray"],
    "beauty-essence-classic": ["serum,bottle", "skincare,serum", "cosmetic,bottle"],
    "beauty-lotion-soft": ["makeup,flatlay", "eyeshadow,brushes", "makeup,palette"],
    "beauty-cleanser": ["face,cleanser", "face,wash", "cleanser"],
    "beauty-foundation": ["foundation,bottle", "liquid,foundation", "foundation,makeup"],
    "beauty-sunscreen": ["sunscreen", "sunscreen,bottle", "sun,cream"],
    "beauty-lipstick": ["lipstick", "cosmetic,lipstick", "makeup,lipstick"],
    "beauty-hand-cream": ["hand,cream", "cream,tube", "cosmetic,tube"],
    "beauty-body-mist": ["body,mist", "perfume,spray", "fragrance,bottle"],
    "beauty-blush-cloud": ["blush,compact", "makeup,blush", "cosmetic,compact"],
    "beauty-lip-gloss": ["lip,gloss", "makeup,gloss", "cosmetic,gloss"],
    "beauty-hair-oil": ["hair,oil", "oil,bottle", "cosmetic,oil"],
    "beauty-face-mask": ["face,mask", "sheet,mask", "skincare,mask"],
    "beauty-makeup-brush": ["makeup,brushes", "makeup,brush", "cosmetic,brush"],
    "beauty-perfume-mini": ["mini,perfume", "perfume,bottle", "fragrance,bottle"],
    "snack-nut-gift": ["mixed,nuts", "nuts,box", "nuts"],
    "snack-sparkling": ["amber,sparkling,drink", "sparkling,drink,glass", "soda,drink"],
    "snack-drip-coffee": ["drip,coffee", "coffee,bag", "coffee,sachet"],
    "snack-cookies": ["butter,cookies", "cookie,tin", "cookies"],
    "snack-tea-pack": ["tea,bag", "tea,box", "tea,sachet"],
    "snack-oat-bites": ["lemon,soda", "soft,drink", "soda,bottle"],
    "snack-candy-box": ["fruit,snack", "dried,fruit", "snack,box"],
    "snack-yogurt-cup": ["yogurt,cup", "strawberry,yogurt", "yogurt"],
    "snack-matcha-latte": ["matcha,latte", "matcha,drink", "matcha"],
    "snack-fruit-tea-jar": ["tea,jar", "fruit,tea", "tea,tin"],
    "snack-popcorn-tin": ["popcorn,tin", "caramel,popcorn", "popcorn"],
    "snack-choco-wafer": ["chocolate,wafer", "wafer,snack", "chocolate,snack"],
    "snack-jelly-pack": ["jelly,cup", "fruit,jelly", "jelly"],
    "snack-party-pack": ["snack,box", "assorted,snacks", "snacks"],
    "culture-stationery-red": ["stationery,set", "journal,stationery", "notebook,pen"],
    "culture-notebook-grid": ["notebook", "grid,notebook", "journal"],
    "culture-pen-case": ["pen,case", "pencil,case", "stationery,pouch"],
    "culture-reading-kit": ["bookmark", "bookmark,set", "reading,bookmark"],
    "culture-print-poster": ["poster,print", "art,poster", "poster"],
    "culture-illustration-book": ["illustration,book", "art,book", "notebook"],
    "culture-poster-set": ["art,print", "poster,set", "art,poster"],
    "culture-photo-frame": ["photo,frame", "picture,frame", "frame"],
    "culture-washi-tape": ["washi,tape", "decorative,tape", "paper,tape"],
    "culture-sticker-sheet": ["sticker,sheet", "stickers", "planner,stickers"],
    "culture-vinyl-decor": ["vinyl,record,sleeve", "record,cover", "vinyl,record"],
    "culture-desk-easel": ["desk,easel", "wooden,easel", "easel"],
    "culture-cd-wallet": ["cd,case", "cd,wallet", "disc,case"],
    "culture-pen-set": ["pen,set", "gel,pen", "stationery,pen"],
    "culture-reading-lamp": ["book,light", "reading,light", "clip,light"],
    "travel-fragrance": ["car,airfreshener", "air,freshener", "car,fragrance"],
    "travel-jump-starter": ["stainless,tumbler", "travel,tumbler", "thermos"],
    "travel-phone-mount": ["folding,umbrella", "travel,umbrella", "umbrella"],
    "travel-inflator": ["phone,mount", "car,phoneholder", "magnetic,mount"],
    "travel-organizer": ["laptop,sleeve", "laptop,bag", "computer,sleeve"],
    "travel-packing-cubes": ["packing,cubes", "travel,organizer", "packing,bags"],
    "travel-passport-wallet": ["passport,wallet", "passport,holder", "travel,wallet"],
    "travel-neck-pillow": ["neck,pillow", "travel,pillow", "pillow"],
    "travel-cable-pouch": ["cable,pouch", "travel,organizer", "cable,bag"],
    "travel-luggage-tag": ["luggage,tag", "baggage,tag", "travel,tag"],
    "travel-vacuum": ["white,headphones", "folding,headphones", "travel,headphones"],
    "travel-mini-bottle": ["travel,bottle", "toiletry,bottle", "small,bottle"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch real Flickr-backed product photos through LoremFlickr.")
    parser.add_argument("--only-slugs", nargs="*", default=[])
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--attempts", type=int, default=4)
    return parser.parse_args()


def fetch_json(url: str) -> dict:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=35) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch json: {url}") from last_error


def fetch_bytes(url: str) -> tuple[bytes, str | None]:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=50) as response:
                return response.read(), response.headers.get_content_type()
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch image: {url}") from last_error


def sha256_hex(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def image_extension(url: str, content_type: str | None) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    if content_type:
        guessed = mimetypes.guess_extension(content_type)
        if guessed in {".jpe", ".jpeg"}:
            return ".jpg"
        if guessed in {".jpg", ".png", ".webp"}:
            return guessed
    return ".jpg"


def query_variants(spec: dict) -> list[str]:
    variants = list(TAG_OVERRIDES.get(spec["slug"], []))
    for query in spec.get("download_queries") or []:
        terms = [
            term
            for term in re.split(r"[^a-z0-9]+", query.lower())
            if len(term) > 1 and term not in GENERIC_TERMS
        ]
        for width in (3, 2, 1):
            if len(terms) >= width:
                variants.append(",".join(terms[:width]))
    deduped = []
    seen = set()
    for variant in variants:
        normalized = variant.strip().strip(",")
        if normalized and normalized not in seen:
            deduped.append(normalized)
            seen.add(normalized)
    return deduped


def flickr_photo_id(url: str) -> str:
    match = re.search(r"/(\d+)_", urlparse(url).path)
    return match.group(1) if match else ""


def good_payload(payload: bytes) -> tuple[bool, tuple[int, int] | None]:
    if len(payload) < MIN_BYTES:
        return False, image_size(payload)
    dimensions = image_size(payload)
    if not dimensions:
        return False, None
    width, height = dimensions
    return width >= MIN_WIDTH and height >= MIN_HEIGHT, dimensions


def fetch_one(spec: dict, attempts: int) -> tuple[str, dict | None, str | None]:
    for variant in query_variants(spec):
        for attempt in range(attempts):
            url = "https://loremflickr.com/json/900/900/" + quote(variant, safe=",") + "?" + urlencode(
                {"random": f"{spec['slug']}-{attempt}-{int(time.time() * 1000)}"}
            )
            try:
                meta = fetch_json(url)
            except Exception:
                continue
            file_url = meta.get("file") or ""
            raw_url = meta.get("rawFileUrl") or file_url
            if "defaultImage" in file_url or not file_url:
                continue
            try:
                payload, content_type = fetch_bytes(file_url)
            except Exception:
                continue
            accepted, dimensions = good_payload(payload)
            if not accepted:
                continue
            extension = image_extension(file_url, content_type)
            target_dir = UPLOADS_ROOT / spec["category"] / "2026" / "05"
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / f"{spec['slug']}{extension}"
            target_path.write_bytes(payload)
            photo_id = flickr_photo_id(raw_url)
            return spec["slug"], {
                "slug": spec["slug"],
                "name": spec["name"],
                "category": spec["category"],
                "provider": "loremflickr-flickr",
                "query": variant,
                "title": meta.get("tags") or variant,
                "creator": meta.get("owner") or "",
                "license": meta.get("license") or "unknown",
                "license_version": None,
                "source_url": raw_url,
                "foreign_landing_url": f"https://www.flickr.com/photo.gne?id={photo_id}" if photo_id else "",
                "local_path": "/" + target_path.relative_to(PROJECT_ROOT).as_posix(),
                "content_hash": sha256_hex(payload),
                "dimensions": list(dimensions) if dimensions else None,
                "size": len(payload),
                "asset_kind": "real-photo",
                "review_status": "rule-approved-photo",
                "reviewed_at": datetime.now().isoformat(timespec="seconds"),
            }, None
    return spec["slug"], None, "no_acceptable_flickr_photo"


def main() -> int:
    args = parse_args()
    only_slugs = {slug.strip() for slug in args.only_slugs if slug.strip()}
    manifest = {"generated_at": datetime.now().isoformat(timespec="seconds"), "products": {}}
    if MANIFEST_PATH.exists():
        backup_path = PROJECT_ROOT / "scratch" / f"young-catalog-assets-before-loremflickr-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(MANIFEST_PATH.read_text(encoding="utf-8"), encoding="utf-8")

    specs = [spec for spec in PRODUCT_SPECS if not only_slugs or spec["slug"] in only_slugs]
    failures = {}
    used_hashes = set()
    used_urls = set()
    fetched = 0

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(fetch_one, spec, args.attempts): spec for spec in specs}
        for future in as_completed(futures):
            spec = futures[future]
            try:
                slug, entry, error = future.result()
            except Exception as exc:
                failures[spec["slug"]] = str(exc)
                continue
            if not entry:
                failures[slug] = error or "unknown_failure"
                continue
            if entry["content_hash"] in used_hashes or entry["source_url"] in used_urls:
                failures[slug] = "duplicate_photo"
                continue
            used_hashes.add(entry["content_hash"])
            used_urls.add(entry["source_url"])
            manifest["products"][slug] = entry
            fetched += 1

    if only_slugs and MANIFEST_PATH.exists():
        current = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        current_products = current.setdefault("products", {})
        current_products.update(manifest["products"])
        current["generated_at"] = manifest["generated_at"]
        manifest = current

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    result = {"fetched": fetched, "failures": failures, "ready": not failures}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
