#!/usr/bin/env python3
"""
Cache-bust the CSS and JS references in every page.

    python3 tools/version-assets.py

There is no build step, so asset filenames never change and browsers happily
serve a stale copy of site.css / site.js after an edit. This appends a short
content hash to each reference:

    /assets/css/site.css  ->  /assets/css/site.css?v=9f3a1c

Re-run it after editing any CSS or JS. Only the query string changes, so
nothing else in the page is touched. Unchanged files keep their hash.

It also stamps VERSION in sw.js with a hash of all the CSS and JS, so
returning visitors' offline copy is refreshed whenever those files change.
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = list(ROOT.glob("*.html")) + list(ROOT.glob("*/index.html"))
PATTERN = re.compile(r'(/assets/(?:css|js)/[A-Za-z0-9._-]+\.(?:css|js))(\?v=[0-9a-f]+)?')


def short_hash(rel_path):
    f = ROOT / rel_path.lstrip("/")
    if not f.exists():
        return None
    return hashlib.sha256(f.read_bytes()).hexdigest()[:8]


def main():
    changed = 0
    for page in sorted(PAGES):
        text = page.read_text()

        def sub(m):
            h = short_hash(m.group(1))
            return m.group(1) if h is None else f"{m.group(1)}?v={h}"

        new = PATTERN.sub(sub, text)
        if new != text:
            page.write_text(new)
            changed += 1
            print(f"  updated {page.relative_to(ROOT)}")
        else:
            print(f"  unchanged {page.relative_to(ROOT)}")
    print(f"\n{changed} page(s) rewritten")
    stamp_service_worker()


def stamp_service_worker():
    sw = ROOT / "sw.js"
    if not sw.exists():
        return
    h = hashlib.sha256()
    for f in sorted((ROOT / "assets/css").glob("*.css")) + sorted((ROOT / "assets/js").glob("*.js")):
        h.update(f.name.encode() + f.read_bytes())
    version = h.hexdigest()[:8]
    text = sw.read_text()
    new = re.sub(r"var VERSION = '[^']*';", f"var VERSION = '{version}';", text, count=1)
    if new != text:
        sw.write_text(new)
        print(f"  sw.js VERSION -> {version}")
    else:
        print("  sw.js unchanged")


if __name__ == "__main__":
    main()
