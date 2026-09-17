#!/usr/bin/env python3
"""
Prepare product-gallery images for the web.

    python3 tools/optimise-images.py assets/img/products/bathroom-fixtures

For every image in the folder it will:
  * rename loose numbering to the zero-padded names the gallery expects
    (1.png -> 01.jpg, 2.jpeg -> 02.jpg, ...)
  * convert to a real progressive JPEG, whatever the file said it was
  * flatten any transparency onto white
  * resize so the long edge is at most MAX px

Safe to re-run: files already correct are left alone.
"""
import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install --user pillow")

MAX = 1800
QUALITY = 82
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff")


def main(folder):
    if not os.path.isdir(folder):
        sys.exit(f"not a folder: {folder}")

    files = [f for f in sorted(os.listdir(folder)) if f.lower().endswith(EXTS)]
    if not files:
        sys.exit(f"no images found in {folder}")

    # Order by any number in the filename so 1,2,10 sort correctly.
    def key(f):
        m = re.search(r"\d+", f)
        return (int(m.group()) if m else 9999, f)

    before = after = 0
    for src in sorted(files, key=key):
        path = os.path.join(folder, src)
        m = re.search(r"\d+", src)
        if m:
            dst_name = f"{int(m.group()):02d}.jpg"
        else:
            # No number to pad (e.g. hero.jpg) — keep the name, just optimise.
            dst_name = os.path.splitext(src)[0] + ".jpg"
        dst = os.path.join(folder, dst_name)

        size_in = os.path.getsize(path)
        before += size_in

        im = Image.open(path)
        fmt, dims = im.format, im.size

        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.getchannel("A"))
            im = bg
        else:
            im = im.convert("RGB")

        if max(im.size) > MAX:
            r = MAX / max(im.size)
            im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)

        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        if os.path.abspath(path) != os.path.abspath(dst):
            os.remove(path)

        size_out = os.path.getsize(dst)
        after += size_out
        print(f"  {src:14s} {fmt:5s} {str(dims):13s} {size_in//1024:6d}KB"
              f"  ->  {dst_name}  {str(im.size):13s} {size_out//1024:5d}KB")

    if before:
        print(f"\ntotal {before//1024}KB -> {after//1024}KB "
              f"({100 - after * 100 // before}% smaller)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(f"usage: python3 {sys.argv[0]} <folder>")
    main(sys.argv[1])
