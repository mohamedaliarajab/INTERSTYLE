#!/usr/bin/env python3
"""
Install a hero photograph for a brand page, in every width the site needs.

    python3 tools/hero-image.py interstyle "/path/to/master.png"
    python3 tools/hero-image.py home       "/path/to/master.png"

Use the largest master you have — ideally an AI upscale (Photoshop
"Preserve Details 2.0" or Topaz Gigapixel) around 6000-7200px wide, because
a full-width hero on a 5K/6K display needs about 7000 real pixels.

It will:
  * write renditions 1280 / 1920 / 2560 / 3480 / 4800 px and the master
    width (capped at 7200) as progressive JPEGs, named
    hero-<name>-<hash>-<width>.jpg so a new master never reuses a filename
  * rewrite the hero <img> srcset / sizes / width / height on the page
  * rewrite the matching srcset line in assets/js/preloader.js
  * move the previous renditions to archive/ inside the project

Then run  python3 tools/version-assets.py
"""
import hashlib
import pathlib
import re
import shutil
import sys
from datetime import date

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install --user pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "archive" / f"heroes-{date.today()}"

HEROES = {
    "interstyle": {"page": "interstyle/index.html", "dir": "assets/img/ambiance", "name": "bathroom"},
    "home":       {"page": "home/index.html",       "dir": "assets/img/home",     "name": "showroom"},
}
LADDER = [1280, 1920, 2560, 3480, 4800]
TOP = 7200
QUALITY = 85

# The parallax scales the hero to 112%, and on portrait screens object-fit:
# cover crops the sides, so the photo renders up to ~1.6x the viewport width.
SIZES = "(orientation: portrait) 160vw, 112vw"
FALLBACK_WIDTH = 1920


def main(key, master_path):
    if key not in HEROES:
        sys.exit(f"unknown page '{key}' — use one of: {', '.join(HEROES)}")
    cfg = HEROES[key]
    master = pathlib.Path(master_path).expanduser()
    if not master.is_file():
        sys.exit(f"not a file: {master}")

    im = Image.open(master)
    im.load()
    if im.mode != "RGB":
        im = im.convert("RGB")
    digest = hashlib.sha256(master.read_bytes()).hexdigest()[:6]
    stem = f"hero-{cfg['name']}-{digest}"
    folder = ROOT / cfg["dir"]

    top = min(im.width, TOP)
    widths = [w for w in LADDER if w < top * 0.92] + [top]

    written = []
    for w in widths:
        h = round(im.height * w / im.width)
        out = folder / f"{stem}-{w}.jpg"
        frame = im if w == im.width else im.resize((w, h), Image.LANCZOS, reducing_gap=3.0)
        frame.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True, subsampling=0)
        written.append((w, h, out))
        print(f"  {out.relative_to(ROOT)}  {w}x{h}  {out.stat().st_size / 1e6:.2f} MB")

    url = lambda p: "/" + str(p.relative_to(ROOT))
    srcset = ", ".join(f"{url(p)} {w}w" for w, _, p in written)
    fallback = next((p for w, _, p in written if w >= FALLBACK_WIDTH), written[-1][2])
    top_w, top_h, _ = written[-1]

    # --- Page: rebuild the hero <img>, keeping alt / style / parallax ------
    page = ROOT / cfg["page"]
    html = page.read_text()
    m = re.search(r'(<figure class="hero__media">\s*)<img\b([^>]*)>', html)
    if not m:
        sys.exit(f"no hero image found in {cfg['page']}")
    attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(2)))
    previous = re.findall(r"/assets/img/[^\s\",]+", m.group(2))

    keep = {k: attrs[k] for k in ("data-parallax", "style", "alt", "fetchpriority") if k in attrs}
    indent = " " * 9
    srcset_lines = (",\n" + indent + " " * 8).join(f"{url(p)} {w}w" for w, _, p in written)
    img = (
        "<img" + (f' data-parallax="{keep["data-parallax"]}"' if "data-parallax" in keep else "") +
        f'\n{indent}src="{url(fallback)}"'
        f'\n{indent}srcset="{srcset_lines}"'
        f'\n{indent}sizes="{SIZES}"'
        f'\n{indent}width="{top_w}" height="{top_h}"' +
        (f'\n{indent}style="{keep["style"]}"' if "style" in keep else "") +
        f'\n{indent}alt="{keep.get("alt", "")}"' +
        f'\n{indent}fetchpriority="{keep.get("fetchpriority", "high")}">'
    )
    html = html[:m.start()] + m.group(1) + img + html[m.end():]
    page.write_text(html)
    print(f"  updated {cfg['page']}")

    # --- Preloader: the landing page warms this exact srcset ---------------
    pre = ROOT / "assets/js/preloader.js"
    js = pre.read_text()
    line = re.compile(r"(\{ page: '" + key + r"', srcset: ')[^']*(' \})")
    if not line.search(js):
        sys.exit("preloader.js has no hero entry for this page — add it to HEROES there first")
    pre.write_text(line.sub(lambda mm: mm.group(1) + srcset + mm.group(2), js))
    print("  updated assets/js/preloader.js")

    # --- Archive whatever the page used before -----------------------------
    new_files = {p.resolve() for _, _, p in written}
    for ref in dict.fromkeys(previous):
        old = (ROOT / ref.lstrip("/")).resolve()
        if old.is_file() and old not in new_files and not still_referenced(ref):
            ARCHIVE.mkdir(parents=True, exist_ok=True)
            shutil.move(str(old), ARCHIVE / old.name)
            print(f"  archived {ref}")

    print("\nNow run:  python3 tools/version-assets.py")


def still_referenced(ref):
    for f in list(ROOT.glob("*.html")) + list(ROOT.glob("*/index.html")) + list((ROOT / "assets/js").glob("*.js")):
        if ref in f.read_text():
            return True
    return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
