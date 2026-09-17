#!/usr/bin/env python3
"""
Build the link-preview images and tags for WhatsApp, LinkedIn, Facebook, X.

    python3 tools/share-preview.py

Makes a 1200x630 preview for each page from its current hero photograph
(the landing page gets both, side by side) and writes the Open Graph /
Twitter tags between the "Link previews" markers in each page's <head>.

Those platforms only accept a full web address for the image, so SITE_URL
below must be the address the site is published on. If that changes (for
example to www.interstyleceramics.com), edit SITE_URL and re-run.

Re-run it after replacing a hero with tools/hero-image.py. Platforms cache
previews for days, so each image is named with a content hash; a new photo
gets a new URL and is picked up on the next share.
"""
import hashlib
import io
import pathlib
import re

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError:
    raise SystemExit("Pillow is required:  python3 -m pip install --user pillow")

SITE_URL = "https://interstyleceramics.com"

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/img/share"
W, H = 1200, 630

PAGES = {
    "landing": {
        "file": "index.html", "path": "/",
        "alt": "Interstyle and Interstyle Home: a stone-floored bathroom beside a furniture showroom",
    },
    "interstyle": {
        "file": "interstyle/index.html", "path": "/interstyle/",
        "alt": "Light-filled bathroom with stone floor tiles and a freestanding black bath, with the Interstyle logo",
        "logo": "interstyle-logo-ondark.png", "invert": False, "focus": 0.68,
    },
    "home": {
        "file": "home/index.html", "path": "/home/",
        "alt": "Furniture showroom living room with a curved sofa and arc lamps, with the Interstyle Home logo",
        "logo": "interstyle-home-logo.png", "invert": True, "focus": 0.5,
    },
}


def hero_path(page_file):
    """The widest hero rendition no bigger than 3480px — plenty for 1200px."""
    html = (ROOT / page_file).read_text()
    m = re.search(r'<figure class="hero__media">\s*<img\b[^>]*srcset="([^"]+)"', html)
    if not m:
        raise SystemExit(f"no hero srcset in {page_file}")
    cands = [(int(w), u) for u, w in re.findall(r"(/assets/img/\S+)\s+(\d+)w", m.group(1))]
    w, url = max((c for c in cands if c[0] <= 3480), default=max(cands))
    return ROOT / url.lstrip("/")


def cover(im, w, h, focus_y=0.5):
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left = (im.width - w) // 2
    top = round((im.height - h) * focus_y)
    return im.crop((left, top, left + w, top + h))


def logo(name, invert, height):
    im = Image.open(ROOT / "assets/img" / name).convert("RGBA")
    alpha = im.getchannel("A")
    im = im.crop(alpha.point(lambda a: 255 if a > 12 else 0).getbbox())
    if invert:                                   # black artwork -> white
        white = Image.new("RGBA", im.size, (255, 255, 255, 255))
        white.putalpha(im.getchannel("A"))
        im = white
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def shade(size, strength=0.78):
    """A scrim along the bottom, heaviest at the left where the logo sits, so a
    white logo reads on any photo."""
    w, h = size
    down = Image.new("L", (1, h))
    for y in range(h):
        down.putpixel((0, y), int(255 * max(0.0, (y / h - 0.38) / 0.62) ** 1.5))
    across = Image.new("L", (w, 1))
    for x in range(w):
        across.putpixel((x, 0), int(255 * (1 - 0.6 * x / w)))
    mask = ImageChops.multiply(down.resize((w, h)), across.resize((w, h)))
    black = Image.new("RGBA", size, (10, 10, 10, 255))
    black.putalpha(mask.point(lambda a: int(a * strength)))
    return black


def card(photo, focus, logo_name, invert, w, h, logo_h):
    base = cover(Image.open(photo).convert("RGB"), w, h, focus).convert("RGBA")
    base.alpha_composite(shade((w, h)))
    mark = logo(logo_name, invert, logo_h)
    pad = round(h * 0.085)
    base.alpha_composite(mark, (pad, h - pad - mark.height))
    return base


def build(key):
    cfg = PAGES[key]
    if key == "landing":
        left = card(hero_path(PAGES["interstyle"]["file"]), 0.68, "interstyle-logo-ondark.png", False, W // 2, H, 44)
        right = card(hero_path(PAGES["home"]["file"]), 0.5, "interstyle-home-logo.png", True, W // 2, H, 84)
        img = Image.new("RGBA", (W, H))
        img.paste(left, (0, 0))
        img.paste(right, (W // 2, 0))
        ImageDraw.Draw(img).line([(W // 2, 0), (W // 2, H)], fill=(255, 255, 255, 90), width=2)
    else:
        img = card(hero_path(cfg["file"]), cfg["focus"], cfg["logo"], cfg["invert"], W, H,
                   52 if key == "interstyle" else 104)

    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=84, optimize=True, progressive=True)
    data = buf.getvalue()
    name = f"{key}-{hashlib.sha256(data).hexdigest()[:6]}.jpg"

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob(f"{key}-*.jpg"):
        if old.name != name:
            old.unlink()                             # generated here; rebuilt on demand
    (OUT / name).write_bytes(data)
    print(f"  assets/img/share/{name}  {len(data) / 1000:.0f} KB")
    return f"/assets/img/share/{name}"


def write_tags(key, image_url):
    cfg = PAGES[key]
    page = ROOT / cfg["file"]
    html = page.read_text()
    url = SITE_URL.rstrip("/") + cfg["path"]
    block = (
        "  <!-- Link previews: written by tools/share-preview.py -->\n"
        f'  <link rel="canonical" href="{url}">\n'
        f'  <meta property="og:url" content="{url}">\n'
        '  <meta property="og:site_name" content="Interstyle">\n'
        f'  <meta property="og:image" content="{SITE_URL.rstrip("/")}{image_url}">\n'
        '  <meta property="og:image:type" content="image/jpeg">\n'
        f'  <meta property="og:image:width" content="{W}">\n'
        f'  <meta property="og:image:height" content="{H}">\n'
        f'  <meta property="og:image:alt" content="{cfg["alt"]}">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        "  <!-- /Link previews -->\n"
    )
    marked = re.compile(r"  <!-- Link previews: .*?<!-- /Link previews -->\n", re.S)
    if marked.search(html):
        html = marked.sub(lambda _: block, html)
    else:
        anchor = re.search(r'  <meta property="og:description"[^>]*>\n', html)
        if not anchor:
            raise SystemExit(f"no og:description in {cfg['file']} to anchor the tags to")
        html = html[:anchor.end()] + block + html[anchor.end():]
    page.write_text(html)
    print(f"  updated {cfg['file']}")


if __name__ == "__main__":
    for key in PAGES:
        write_tags(key, build(key))
