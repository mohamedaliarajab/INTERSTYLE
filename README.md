> **Start with [`INTERSTYLE.md`](INTERSTYLE.md)** — the current, complete project handoff.
> This README is older and partly out of date.

# Interstyle — split entry landing page

Static site. No build step, no dependencies. Deploy the folder as-is.

## Structure

```
.
├── index.html              Split entry screen (the landing page)
├── interstyle/index.html   Interstyle — full page
├── home/index.html         Interstyle Home — placeholder, next to build
├── assets/
│   ├── css/
│   │   ├── tokens.css      Brand colours, type, motion — single source of truth
│   │   ├── base.css        Reset, type primitives, ENTER button, reveal
│   │   ├── landing.css     Split screen
│   │   ├── site.css        Nav, section headers, buttons, footer
│   │   ├── brand-page.css  Hero, about, products, brands, locations,
│   │   │                   contact, product modal
│   │   └── inner.css       Old placeholder shell (Home page, until rebuilt)
│   ├── js/
│   │   ├── landing.js      Panel choice + exit transition
│   │   ├── products.js     ← PRODUCT GALLERY CONTENT. Edit this one file.
│   │   ├── site.js         Nav, carousel, product modal, form
│   │   └── parallax.js     Used by the Home placeholder
│   └── img/
│       ├── brands/         17 partner logos
│       ├── ambiance/       Project photography (swap freely)
│       └── *.png           Interstyle + Interstyle Home logos, favicon
├── netlify.toml
└── robots.txt
```

## Swapping product photos and copy

Everything the product pop-ups show lives in `assets/js/products.js`. Each entry:

```js
'floor-wall-tiles': {
  title:    'Floor & Wall Tiles',
  enquiry:  'Floor & Wall Tiles',      // preselects the contact dropdown
  desc:     'Paragraph beside the gallery.',
  features: ['Bullet one', 'Bullet two'],
  images:   ['/assets/img/ambiance/your-photo.jpg']
}
```

Drop files into `assets/img/ambiance/` and list them in `images`. The carousel,
thumbnails, dots and counter all size themselves — no other file to touch. Leave
`images: []` and that product shows a tidy "photography coming soon" placeholder
instead, so the page never looks broken while you gather shots.

## Brand values

Taken from *Interstyle Brandstyle Guideline 21*:

| Role   | Hex       | Guideline reference        |
| ------ | --------- | -------------------------- |
| Black  | `#101820` | 07 Colour — R16 G24 B32    |
| Grey   | `#898A8D` | 07 Colour — R137 G138 B141 |
| Orange | `#FF5F00` | 07 Colour — R255 G95 B0    |
| White  | `#FFFFFF` | 07 Colour                  |

Typeface: **Montserrat** — the guideline's *06 Typography for Digital Media*
face. (Metropolis is specified for print only, so it is not used here.)

All of these live in `assets/css/tokens.css`. Change them there and both the
landing page and the destination pages follow.

## Logos

Your original files, copied in unmodified:

| File                        | Source                                              |
| --------------------------- | --------------------------------------------------- |
| `interstyle-logo.png`       | `Website/Interstyle Logo PNG.png`                   |
| `interstyle-logo-ondark.png` | `October 2025/WHITE LOGO ORANGE SQUARE.png`        |
| `interstyle-home-logo.png`  | `Design Acc/Interstyle Home Logo (Black).png`       |

To swap in an SVG later, drop it in `assets/img/` and change the `src` — the
`width`/`height` attributes on the `<img>` reserve the aspect ratio, so update
those to match the new file.

## Swapping the two sides

The reference screenshot has Interstyle on the left and Interstyle Home on the
right, and that is how it is built. To flip them, add to `landing.css`:

```css
.panel--home { order: -1; }
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A server is required — the pages use
root-relative paths (`/assets/...`), which do not resolve over `file://`.

## Deploy to Netlify

**Drag and drop:** open <https://app.netlify.com/drop> and drop this folder.

**Git:** push the folder to a repo and connect it in Netlify. Build command
empty, publish directory `.` — `netlify.toml` already sets this.

## Notes

- The Interstyle page is built. Interstyle Home is still the placeholder.
- Two decisions worth confirming, both one-line changes:
  1. **Display serif.** Headlines use Cormorant Garamond, matching the reference
     site you supplied. The guideline names Montserrat for digital media and no
     serif at all. To go all-Montserrat, set `--font-display: var(--font-brand)`
     in `tokens.css`.
  2. **No gold.** The reference used `#B8935A` for labels and accents. That
     colour is not in the guideline, so every instance is now brand orange
     `#FF5F00`.
- Motion is fully gated behind `prefers-reduced-motion`.
- Without JavaScript the landing page still works — the ENTER buttons are real
  links; only the exit transition and whole-panel click are enhancements.


## Contact form — where enquiries go

The form is wired to **Netlify Forms** (`name="interstyle-enquiry"`,
`data-netlify="true"`, with a honeypot field for spam). Netlify picks it up
automatically on deploy — there is no backend to run.

**To have enquiries emailed to info@isc-ng.com, one dashboard step is needed:**

1. Deploy the site.
2. Netlify dashboard → your site → **Forms** → `interstyle-enquiry`
3. **Settings and usage** → **Form notifications** → **Add notification** →
   **Email notification**
4. Enter `info@isc-ng.com` and save.

Every submission is then emailed there and also stored in the dashboard.
Without step 4, submissions are captured but no email is sent.

All fields are required. On submit the button reads "Enquiry Sent", a
confirmation reads "Message received, we will get back to you shortly", and
the form clears itself after 5 seconds. On `localhost` there is no form
backend, so the flow is simulated rather than reporting a false failure.

## Preloader

`assets/js/preloader.js` holds the landing page while it warms the logos,
hero, About carousel and brand marks — so entering either brand page is
instant. Progress is real, counting assets as they arrive.

Gallery photography (the product pop-ups, ~7MB) is deliberately **not**
preloaded; it sits behind a click and holding the entry screen for it would
punish anyone on a mobile connection.

Without JavaScript the preloader never appears and the site works normally.

## Tools

```bash
# Fix image names/formats and compress a gallery folder
python3 tools/optimise-images.py assets/img/products/<folder>

# Re-stamp cache-busting hashes after editing any CSS or JS
python3 tools/version-assets.py
```
