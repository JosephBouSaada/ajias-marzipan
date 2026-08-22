#!/usr/bin/env python3
"""Create restrained, web-ready photo corrections from preserved *_old assets."""

from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent.parent
FULL = ROOT / "img" / "full"
OUTPUTS = (
    ("full", 1800, 88),
    ("card", 900, 84),
    ("thumb", 420, 80),
)


def enhance(source: Path) -> Image.Image:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")

    # Recover a little range from mixed phone/camera captures, then blend the
    # correction back so black backdrops and pale almond tones remain natural.
    ranged = ImageOps.autocontrast(image, cutoff=0.35, preserve_tone=True)
    image = Image.blend(image, ranged, 0.58)
    image = ImageEnhance.Brightness(image).enhance(1.012)
    image = ImageEnhance.Contrast(image).enhance(1.045)
    image = ImageEnhance.Color(image).enhance(1.045)
    image = image.filter(ImageFilter.UnsharpMask(radius=1.25, percent=48, threshold=3))
    return image


sources = sorted(FULL.glob("*_old.jpg"))
if not sources:
    raise SystemExit("No preserved img/full/*_old.jpg sources found")

for source in sources:
    slug = source.name.removesuffix("_old.jpg")
    corrected = enhance(source)
    for directory, longest_edge, quality in OUTPUTS:
        output = corrected.copy()
        output.thumbnail((longest_edge, longest_edge), Image.Resampling.LANCZOS)
        output.save(
            ROOT / "img" / directory / f"{slug}.jpg",
            "JPEG",
            quality=quality,
            optimize=True,
            progressive=True,
            subsampling="4:2:0",
        )

print(f"enhanced {len(sources)} photographs at {len(OUTPUTS)} web sizes")
