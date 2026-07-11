"""Create web-ready image assets without overwriting source images."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]

WEBP_TARGETS = [
    ("dream.png", "dream.webp", 1600),
    ("home_pic/direction1.png", "home_pic/direction1.webp", 960),
    ("home_pic/direction2.png", "home_pic/direction2.webp", 960),
    ("home_pic/direction3.png", "home_pic/direction3.webp", 960),
    ("home_pic/xt.png", "home_pic/xt.webp", 640),
    ("home_pic/byr.png", "home_pic/byr.webp", 640),
    ("home_pic/chenjiahe.png", "home_pic/chenjiahe.webp", 640),
    ("home_pic/zhangtiantong.png", "home_pic/zhangtiantong.webp", 640),
    ("home_pic/linxiaoai.png", "home_pic/linxiaoai.webp", 640),
    ("home_pic/lipeirong.png", "home_pic/lipeirong.webp", 640),
    ("home_pic/hanxue.png", "home_pic/hanxue.webp", 640),
    (
        "news_pic/plos-computational-biology.png",
        "news_pic/plos-computational-biology.webp",
        1400,
    ),
    (
        "news_pic/trends-in-cognitive-sciences.png",
        "news_pic/trends-in-cognitive-sciences.webp",
        1400,
    ),
    ("news_pic/pnas.png", "news_pic/pnas.webp", 1400),
    ("news_pic/current-biology.png", "news_pic/current-biology.webp", 1400),
]


def create_favicon() -> Path:
    """Create a compact square favicon from the existing PI portrait."""
    source = ROOT / "home_pic" / "xt.png"
    destination = ROOT / "favicon.png"

    with Image.open(source) as image:
        rgba = image.convert("RGBA")
        favicon = ImageOps.fit(
            rgba,
            (64, 64),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.35),
        )
        favicon.save(destination, format="PNG", optimize=True)

    return destination


def create_webp(source_name: str, destination_name: str, max_width: int) -> Path:
    """Resize an active image to its display budget and encode it as WebP."""
    source = ROOT / source_name
    destination = ROOT / destination_name

    with Image.open(source) as image:
        image.load()
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)

        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")

        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, format="WEBP", quality=82, method=6)

    return destination


def create_optimized_images() -> list[Path]:
    """Create every WebP asset referenced by the site."""
    return [create_webp(*target) for target in WEBP_TARGETS]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--favicon-only", action="store_true")
    args = parser.parse_args()
    create_favicon()
    if not args.favicon_only:
        create_optimized_images()


if __name__ == "__main__":
    main()
