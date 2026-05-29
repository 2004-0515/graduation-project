from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "ecommerce-database-relation.json"
PNG_PATH = BASE_DIR / "ecommerce-database-relation.png"
SCALE = 3


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_dir = Path("C:/Windows/Fonts")
    candidates = [
        font_dir / ("msyhbd.ttc" if bold else "msyh.ttc"),
        font_dir / ("simhei.ttf" if bold else "simsun.ttc"),
        font_dir / ("arialbd.ttf" if bold else "arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size * SCALE)
    return ImageFont.load_default()


FONT_HEADER = load_font(16, bold=True)
FONT_FIELD = load_font(15)
FONT_CARDINALITY = load_font(12, bold=True)


def s(value: float | int) -> int:
    return round(float(value) * SCALE)


def draw_text(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    value: str,
    font: ImageFont.ImageFont,
    *,
    anchor: str = "start",
) -> None:
    x_scaled = s(x)
    y_scaled = s(y)
    bbox = draw.textbbox((0, 0), value, font=font)
    width = bbox[2] - bbox[0]
    if anchor == "middle":
        x_scaled -= width // 2
    elif anchor == "end":
        x_scaled -= width
    draw.text((x_scaled, y_scaled), value, font=font, fill="black")


def draw_label(draw: ImageDraw.ImageDraw, x: float, y: float, value: str) -> None:
    draw.text((s(x), s(y)), value, font=FONT_CARDINALITY, fill="black")


def unit_vector(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    length = math.hypot(dx, dy) or 1.0
    return dx / length, dy / length


def draw_one_marker(draw: ImageDraw.ImageDraw, p0: tuple[float, float], p1: tuple[float, float]) -> None:
    ux, uy = unit_vector(p0, p1)
    nx, ny = -uy, ux
    for distance in (4, 10):
      cx = p0[0] + ux * distance
      cy = p0[1] + uy * distance
      half = 8
      draw.line(
          [s(cx - nx * half), s(cy - ny * half), s(cx + nx * half), s(cy + ny * half)],
          fill="black",
          width=max(1, s(1)),
      )


def draw_many_marker(draw: ImageDraw.ImageDraw, previous: tuple[float, float], endpoint: tuple[float, float]) -> None:
    ux, uy = unit_vector(endpoint, previous)
    nx, ny = -uy, ux
    stem = 13
    half = 7
    base = (endpoint[0] + ux * stem, endpoint[1] + uy * stem)
    draw.line([s(endpoint[0]), s(endpoint[1]), s(base[0]), s(base[1])], fill="black", width=max(1, s(1)))
    draw.line(
        [s(endpoint[0]), s(endpoint[1]), s(base[0] + nx * half), s(base[1] + ny * half)],
        fill="black",
        width=max(1, s(1)),
    )
    draw.line(
        [s(endpoint[0]), s(endpoint[1]), s(base[0] - nx * half), s(base[1] - ny * half)],
        fill="black",
        width=max(1, s(1)),
    )
    circle = (endpoint[0] + ux * 24, endpoint[1] + uy * 24)
    radius = 5
    draw.ellipse(
        [s(circle[0] - radius), s(circle[1] - radius), s(circle[0] + radius), s(circle[1] + radius)],
        fill="white",
        outline="black",
        width=max(1, s(1)),
    )


def draw_relationship_line(draw: ImageDraw.ImageDraw, points: list[list[float]]) -> None:
    scaled_points = [(s(x), s(y)) for x, y in points]
    draw.line(scaled_points, fill="black", width=max(1, s(1)))


def draw_relationship_markers(draw: ImageDraw.ImageDraw, points: list[list[float]]) -> None:
    start = tuple(points[0])
    second = tuple(points[1])
    previous = tuple(points[-2])
    end = tuple(points[-1])
    draw_one_marker(draw, start, second)
    draw_many_marker(draw, previous, end)

    sux, suy = unit_vector(start, second)
    tux, tuy = unit_vector(previous, end)
    if abs(sux) >= abs(suy):
        sx = start[0] + sux * 10
        sy = start[1] - 20
    else:
        sx = start[0] + 8
        sy = start[1] + (12 if suy > 0 else -30)
    if abs(tux) >= abs(tuy):
        tx = end[0] - tux * 34
        ty = end[1] - 20
    else:
        tx = end[0] + 8
        ty = end[1] - tuy * 34
    draw_label(draw, sx, sy, "1")
    draw_label(draw, tx, ty, "N")


def draw_table(draw: ImageDraw.ImageDraw, table: dict, header_height: int, row_height: int) -> None:
    x = table["x"]
    y = table["y"]
    w = table["w"]
    h = table["h"]
    draw.rectangle([s(x), s(y), s(x + w), s(y + h)], fill="white", outline="black", width=max(1, s(1)))
    draw.line([s(x), s(y + header_height), s(x + w), s(y + header_height)], fill="black", width=max(1, s(1)))
    draw_text(draw, x + w / 2, y + 8, table.get("label", table["id"]), FONT_HEADER, anchor="middle")
    for index, field in enumerate(table.get("displayFields", table["fields"])):
        draw_text(draw, x + 10, y + header_height + 6 + index * row_height, field.replace(":", ": "), FONT_FIELD)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    image = Image.new("RGB", (s(data["width"]), s(data["height"])), "white")
    draw = ImageDraw.Draw(image)

    for rel in data["relationships"]:
        draw_relationship_line(draw, rel["points"])
    for table in data["tables"]:
        draw_table(draw, table, data["headerHeight"], data["rowHeight"])
    for rel in data["relationships"]:
        draw_relationship_markers(draw, rel["points"])

    image.save(PNG_PATH)
    print(PNG_PATH)


if __name__ == "__main__":
    main()
