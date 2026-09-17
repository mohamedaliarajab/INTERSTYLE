# INTERSTYLE — Project Handoff

Source of truth for the Interstyle website. Read this first when resuming work
in a new chat. Last updated **17 September 2026**.

---

## 1. What this is

A static marketing site for **Interstyle** (tiles, stone, sanitary ware,
installation products) and its furniture division **Interstyle Home**, with a
split landing page that lets the visitor choose between the two.

- **No build step, no framework, no dependencies.** Plain HTML / CSS / JS.
- **Deploys to Netlify as-is** — drag the folder onto app.netlify.com/drop, or
  connect a repo. `netlify.toml` sets publish dir `.` and no build command.
- **Location:** `~/Desktop/interstyle-web/`
- **Run locally:**
  ```bash
  cd ~/Desktop/interstyle-web && python3 -m http.server 8420
  ```
  then open http://localhost:8420. Stop with `kill $(lsof -ti:8420)`.
  A server is required — pages use root-relative paths (`/assets/...`).

---

## 2. Pages

| URL | File | What it is |
|---|---|---|
| `/` | `index.html` | Split landing: Interstyle (left) / Interstyle Home (right), with preloader |
| `/interstyle/` | `interstyle/index.html` | Interstyle brand page |
| `/home/` | `home/index.html` | Interstyle Home brand page |

Both brand pages share the same structure and components:
**Nav → Hero → About (text + carousel) → Products/Collections (cards open a
gallery pop-up) → Brands → Showrooms → Contact form → Footer.**

---

## 3. File map

```
index.html                     Landing (split screen + preloader)
interstyle/index.html          Interstyle page
home/index.html                Interstyle Home page

assets/css/
  tokens.css        Brand colours, fonts, motion, spacing — edit here first
  base.css          Reset, type primitives, ENTER button, reveal animation
  landing.css       Split landing screen
  preloader.css     Orange pixel-square loader
  site.css          Nav, sections, buttons, footer, Home theme overrides
  brand-page.css    Hero, about, carousel, products, brands, locations,
                    contact form, gallery pop-up, readability pass

assets/js/
  preloader.js      Loader: builds pixel grid, real % progress, ?holdloader
  landing.js        Panel choice, exit transition, pointer parallax
  site.js           Nav, scroll parallax, reveals, carousel, pop-up, form
  products.js       ← INTERSTYLE gallery data (titles, copy, bullets, images)
  products-home.js  ← INTERSTYLE HOME gallery data

assets/img/
  interstyle-logo.png, interstyle-logo-ondark.png, interstyle-home-logo.png
  favicon.svg
  ambiance/         Interstyle hero + About carousel
  home/             Interstyle Home hero + About carousel
  range/<key>/      Interstyle product gallery photos
  products-home/<key>/  Interstyle Home collection photos
  brands/           Partner logos

tools/
  add-image.py         Append a photo to a gallery (see §8)
  optimise-images.py   Batch-convert a folder to web JPEGs
  version-assets.py    Cache-bust CSS/JS links — run after editing CSS/JS

netlify.toml, robots.txt, .gitignore, README.md (older notes)
```

---

## 4. Brand system

From *Interstyle Brandstyle Guideline 21* (`~/Desktop/Milan Interstyle/Branding/`).

| Token | Value | Use |
|---|---|---|
| Black | `#101820` | Ink, Interstyle dark surfaces |
| Grey | `#898A8D` | Neutral |
| Orange | `#FF5F00` | **Interstyle** accent / CTAs |
| White | `#FFFFFF` | |

**Typography**
- **Montserrat** — all UI and body text (guideline: "digital media" face).
- **Cormorant Garamond** — display headlines. *Not in the guideline*; kept from
  the reference site the client supplied. To go all-Montserrat, set
  `--font-display: var(--font-brand)` in `tokens.css`.

**Deliberate departures, made on the client's instruction**
- **Interstyle Home uses gold `#B8935A`** as its accent, not orange.
- **Interstyle Home dark surfaces are `#0A0A0A`** (black), not `#101820`.
- Both are scoped to `body.theme-home-page` in `site.css`.

Supporting text is **solid black on light / solid white on dark**, Regular
weight in pop-ups (Light weight read as grey on screen).

---

## 5. Current content

### Interstyle (`/interstyle/`)

**Hero:** `ambiance/hero-bathroom.jpg` (3204px, with 2000/1200 `srcset`
renditions, focal point `center 68%`). Headline "Premium Surfaces for
*Exceptional* Spaces".

**About carousel:** 5 slides — `ambiance/carousel-1..5.jpg`.

**Product range — in this order:**

| # | Key | Title | Photos |
|---|---|---|---|
| 1 | `floor-wall-tiles` | Floor & Wall Tiles | 8 |
| 2 | `outdoor-tiles` | Outdoor Tiles & Pool Mosaics | 9 |
| 3 | `stone` | Stones | 7 |
| 4 | `sanitary-ware` | Sanitary Ware | 13 |
| 5 | `adhesives-grouts` | Tile Adhesives & Grouts | 5 |
| 6 | `tools-accessories` | Tools & Accessories | 10 |

Tools & Accessories order: RUBI cutting/handling tools → levelling wedges &
spacers → profiles → switches.
Sanitary Ware order: basins, toilets, furniture and showers first, with the
dark rain-shower panel (`01.jpg`) in the middle (slide 7 of 13); bathtubs
(`04`, `11`) and the glass shower enclosure (`03`) come last.
Stones copy was written from stonewrap.com **without naming that brand** — keep
it unbranded. No technical specs are claimed (the source gives none).

**Brands (20):** Porcelanosa, RAK Ceramics, Ecoceramic, Epsilon Tile,
Portobello, Kohler, Hansgrohe, Kludi, Geberit, Noken, Laticrete, Legrand, Rubi,
Sonia, ITT Ceramic, Ariston, AstralPool, Gala, Alumácer, Living Ceramics.

**Showrooms (6):**

| City | Address | Contact |
|---|---|---|
| Lagos | 22A Ligali Ayorinde Street, Victoria Island | 0706 667 7555 |
| Abuja | 1145 Aminu Kano Crescent, Wuse 2 | 0813 030 2020 |
| Ibadan | 2nd Floor, Tafotech Building, MKO Abiola Way, Ring Road | 0803 324 1833 |
| Port Harcourt | Woji Road, GRA Phase II | 0809 293 4544 |
| Accra | Spintex Road | +233 23 404 4444 · karam@isc-ng.com |
| Dakar | • 15 Rue Carnot, Dakar 10200 • Ngaparou, Senegal | +221 78 172 63 90 · ibrahim.yazbeck@isc-ng.com |

Dakar's two addresses are marked with small accent dots (`.location__list`).
General email: **info@isc-ng.com**.

### Interstyle Home (`/home/`)

**Hero:** `home/hero.jpg` (Febal Casa showroom). "Living Spaces *Designed* to Inspire".
**About carousel:** 6 slides — `home/about-1..6.jpg`. Stats: 3 Countries · 4+ Brands · 100% Curated.

**Collections:**

| Key | Title | Photos |
|---|---|---|
| `outdoor-furniture` | Outdoor Furniture | 7 (Vondom catalogue) |
| `indoor-furniture` | Indoor Furniture | 7 |
| `doors` | Doors | 7 (Porte Imic) |
| `soft-furnishings` | Soft Furnishings | **0 — shows placeholder** |
| `kitchen-furniture` | Kitchen Furniture | 7 |
| `garden-accessories` | Garden Accessories | 6 |

**Brands (4):** Chakra, Febal Casa, Ezpeleta, Porte Imic.
**Showrooms (4):** Lagos (No. 18 Babatunde Jose Street, V.I.), Abuja, Accra, Dakar (both Dakar addresses).

---

## 6. Behaviour worth knowing

- **Preloader** (landing only): orange outlined square filling with random
  pixels left→right, % beside it. Warms key images so pages open instantly.
  Hidden without JS. Append `?holdloader=1` to keep it on screen for design work.
- **Parallax:** scroll parallax on ~53 layers per brand page (auto-assigned by
  selector in `site.js`); pointer parallax on the landing. Off under
  `prefers-reduced-motion`.
- **Gallery pop-up:** 92vw × 88vh. Missing image files show an
  "Image awaiting upload" placeholder, and `.jpg` paths auto-retry
  `.jpeg/.png/.webp` — nothing ever renders as a broken image.
- **Contact form:** all fields required. On submit → "Enquiry Sent" +
  "Message received, we will get back to you shortly." → resets after 5s.
  Wired to **Netlify Forms** (`interstyle-enquiry`, `interstyle-home-enquiry`).
  On localhost it simulates success.
- **Menu links** smooth-scroll and stop clear of the fixed nav.
- **Back to top** (both brand pages): square button bottom-right, appears
  after scrolling about one screen, smooth-scrolls to the top. It rides up
  above the footer bar so it never covers "Back to Home", stays inside the
  iPhone safe area (home indicator, landscape notch), and hides while the
  mobile menu or a gallery is open. 44px on phones, 48px from 768px up,
  tighter to the corner on landscape phones. Styles in `site.css` §6,
  behaviour in `site.js` §1b.
- **Mobile:** tested 320–1440px — no horizontal overflow, 44px tap targets,
  hamburger under 940px, hero fits one screen from 375×667 up.

---

## 7. Deploy checklist (Netlify)

1. Deploy the folder.
2. **Forms → enable form detection**, then **Forms → Notifications → Email
   notification → `info@isc-ng.com`** for both forms. *Without this, enquiries
   are stored in Netlify but not emailed.*
3. Test a real submission on the live URL.

Caching (`netlify.toml`): CSS/JS revalidate every load (links are
content-hashed); images cache for 1 day.

---

## 8. How to change things

| Task | How |
|---|---|
| Add a photo to a gallery | Save it anywhere, then `python3 tools/add-image.py <key> "/path/to/file"` — appends as the last slide |
| Remove a gallery photo | Delete its path from `products.js` / `products-home.js` and delete the file |
| Reorder a gallery | Reorder the `images` array in the data file |
| Change gallery copy/bullets | Edit `title`, `desc`, `features` in the data file |
| Rename a product | Update **4 places**: card `.product__nm`, data-file `title` + `enquiry`, form `<option>`, footer link |
| Edit any CSS or JS | Then run `python3 tools/version-assets.py` so browsers load the new file |
| Change brand colours | `assets/css/tokens.css` (Home overrides in `site.css` → `.theme-home-page`) |

**Rules learned the hard way**
- **Never reuse an image filename for a different picture.** Browsers serve the
  cached old image. `add-image.py` now names files `NN-hash.jpg` to prevent it.
- **Always run `version-assets.py` after CSS/JS edits**, or changes won't show.
- **Images pasted into chat can't be saved to disk by the assistant.** Save the
  file to a folder (e.g. `~/Desktop/NEW IMAGES/`) and say where it is.
- Source photos from the client live in `~/Desktop/NEW IMAGES/`.
- Previous gallery sets are archived in `~/Desktop/interstyle-web-archive/`
  (outside the deploy folder).

---

## 9. Open items

- [ ] **Soft Furnishings** (Home) has no photos — shows placeholder.
- [ ] **Low-resolution images** (under 1000px) that look soft when enlarged —
      only 3 of 101 photos: Tools & Accessories LED staircase
      (`tools-accessories/11-46d99e.jpg`, 562px); Home carousel `about-4`
      kitchen and `about-6` planters (678px).
- [ ] **Ariston logo** is the Wikimedia "Thermo Group" lockup, not the red-box
      mark the client showed.
- [ ] **Hansgrohe logo** has a green block baked in; reads differently from the
      other 19 marks.
- [ ] **"6 branches in Nigeria"** appears in the hero, About text and stats, but
      only 4 Nigerian showrooms are listed. Confirm the figure.
- [ ] **Netlify form email notifications** must be configured after deploy (§7).
- [ ] **Unused files, safe to delete** (not referenced anywhere):
      `assets/css/inner.css`, `assets/js/parallax.js`,
      `assets/img/ambiance/ambiance-1.webp … ambiance-5.jpg`,
      `assets/img/ambiance/interstyle-ceramics-ambiance.jpg` (~1.6MB total).
- [ ] **Not verified on real devices:** touch scrolling feel, iOS Safari address
      bar, loader animation, smooth scroll and pointer parallax (the dev preview
      used here doesn't run animation frames). Test in a real browser and phone.
- [ ] `README.md` predates most of this work; this file supersedes it.

---

## 10. Starting a new chat

Paste something like this:

> I'm continuing work on the Interstyle website at `~/Desktop/interstyle-web/`.
> Read `INTERSTYLE.md` in that folder first — it describes the structure,
> brand rules, current content, tools and open items. Then start the local
> server on port 8420. My next change is: …

Checkpoint: the project is a git repository — `git log` shows the history,
and `git diff` shows anything changed since the last commit.
