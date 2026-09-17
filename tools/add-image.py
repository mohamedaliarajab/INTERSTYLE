#!/usr/bin/env python3
"""
Append an image to the END of a product gallery on the Interstyle page.

    python3 tools/add-image.py floor-wall-tiles "~/Desktop/mosaic.png"
    python3 tools/add-image.py stone "/path/photo.webp" --max 2000   (keep more pixels)

Gallery keys: floor-wall-tiles, outdoor-tiles, stone, sanitary-ware,
              adhesives-grouts, tools-accessories

Converts any format to an optimised JPEG (long edge max 1800px, or --max N),
gives it the next free
number in assets/img/range/<key>/, adds it as the last slide in
assets/js/products.js, and re-stamps the cache-busting hashes.
"""
import os, re, sys, subprocess, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent

def main(key, src, max_px=1800):
    src = os.path.expanduser(src)
    if not os.path.exists(src): sys.exit(f"not found: {src}")
    folder = ROOT / "assets/img/range" / key
    if not folder.is_dir(): sys.exit(f"unknown gallery: {key}")

    used = [int(m.group(1)) for f in os.listdir(folder) if (m := re.match(r"(\d+)(?:-[0-9a-f]+)?\.jpg$", f))]
    n = max(used, default=0) + 1
    tmp = folder / f".{n:02d}.tmp.jpg"

    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.getchannel("A")); im = bg
    else:
        im = im.convert("RGB")
    if max(im.size) > max_px:
        r = max_px / max(im.size); im = im.resize((round(im.width*r), round(im.height*r)), Image.LANCZOS)
    im.save(tmp, "JPEG", quality=84, optimize=True, progressive=True)
    # A content hash in the name means a reused number can never be served
    # from a browser's cache of an image that was deleted earlier.
    import hashlib
    out = folder / f"{n:02d}-{hashlib.sha256(tmp.read_bytes()).hexdigest()[:6]}.jpg"
    tmp.rename(out)

    js = ROOT / "assets/js/products.js"; s = js.read_text()
    block = re.search(rf"('{re.escape(key)}': \{{.*?images: \[)(.*?)(\n    \])", s, flags=re.S)
    if not block: sys.exit(f"gallery {key} not found in products.js")
    body = block.group(2).rstrip()
    entry = f"'/assets/img/range/{key}/{out.name}'"
    body = (body + ",\n      " + entry) if body.strip() else ("\n      " + entry)
    s = s[:block.start(2)] + body + s[block.end(2):]
    js.write_text(s)

    subprocess.run([sys.executable, str(ROOT / "tools/version-assets.py")], stdout=subprocess.DEVNULL)
    print(f"added {out.relative_to(ROOT)} ({im.width}x{im.height}, {out.stat().st_size//1024}KB) as the last slide of {key}")

if __name__ == "__main__":
    args = sys.argv[1:]
    max_px = 1800
    if "--max" in args:
        i = args.index("--max"); max_px = int(args[i + 1]); del args[i:i + 2]
    if len(args) != 2: sys.exit(__doc__)
    main(args[0], args[1], max_px)
