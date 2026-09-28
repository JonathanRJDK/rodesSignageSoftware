# Rodes Signage – Project Handover for Codex

## 1. Project purpose

Build a lightweight, reusable digital signage application for Raspberry Pi 4 Model B.

The first use case is a contact lens display for Rodes, but the project must be designed as a generic product-presentation engine so the same application can later be reused for other product categories.

The display should:

- Show a configurable matrix/grid of products.
- Show product image and product title in the overview.
- Support a small price badge, ideally placed in the lower-right area of each product card.
- Highlight products one at a time automatically.
- Animate the selected product out of the grid and enlarge it.
- Dim/fade the non-selected products while a product is highlighted.
- Show the selected product title prominently.
- Optionally show the selected product price prominently.
- Animate the selected product back to its original grid position.
- Continue automatically to the next product.
- Loop forever.
- Run fullscreen on a Raspberry Pi 4.
- Work fully offline after deployment.
- Be configurable without changing application code.
- Be suitable for 1920×1080 output.

The user wants to develop and refine the project in VS Code with Codex.

---

# 2. Preferred implementation

Use a local web application:

- HTML
- CSS
- Vanilla JavaScript
- JSON configuration
- Chromium in kiosk mode on Raspberry Pi OS

Avoid React, Vue, Electron, or other large frameworks unless a concrete requirement appears later.

The application should be lightweight and simple enough to run reliably for long periods on a Raspberry Pi 4.

A small Python utility may later be added for:

- local development server
- configuration management
- media preparation
- optional MP4/video rendering
- deployment helpers

However, Python should not be required for the actual animation engine unless there is a strong technical reason.

---

# 3. Initial visual concept

The current contact lens mockup uses a teal background with white cards and white typography.

Approximate concept:

```text
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]       │
│    TITLE       TITLE       TITLE       TITLE       TITLE            │
│                                                                    │
│  [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]       │
│    TITLE       TITLE       TITLE       TITLE       TITLE            │
│                                                                    │
│  [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]        [ PRICE / CTA ]         │
│    TITLE       TITLE       TITLE                                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

The supplied mockups demonstrate these states:

1. Full overview.
2. A selected product begins moving/enlarging while the rest of the scene is dimmed.
3. The selected product is shown large and centered.
4. The product returns toward the grid.
5. The full overview is restored.
6. The next product begins.

The transition should visually feel as if the actual product card is moving from its grid position to the enlarged presentation position and then returning to exactly the same place.

Avoid a simple page-to-page fade if possible.

---

# 4. Example first product set

Initial contact lens names shown in the concept:

- Black Witch
- Angelic Yellow
- Black Cat
- White Zombie
- Spider
- Sharingu Cataclysm
- Red Devil
- Metatron
- Ice Blue
- Hellraiser
- Angel
- Blind White
- Bloodshot

Treat names, prices, ordering, and images as configuration data.

Do not hardcode these into the renderer.

---

# 5. Target animation sequence

Default loop:

```text
OVERVIEW
   ↓
highlight product 1
   ↓
product 1 fullscreen/detail state
   ↓
return product 1 to grid
   ↓
OVERVIEW
   ↓
highlight product 2
   ↓
product 2 fullscreen/detail state
   ↓
return product 2
   ↓
...
   ↓
last product
   ↓
OVERVIEW
   ↓
repeat forever
```

Recommended configurable timings:

- overview duration before first highlight: 1.5–3 seconds
- transition into detail: 500–900 ms
- detail hold time: 2–5 seconds
- transition back: 500–900 ms
- overview pause between products: 0.5–2 seconds

All timings must be configurable.

---

# 6. Animation requirements

The selected card should ideally use DOM geometry rather than a separate duplicate image.

Possible implementation strategies:

## Option A – FLIP animation

Recommended.

Use the FLIP technique:

1. Read original card rectangle with `getBoundingClientRect()`.
2. Move selected card into a fixed overlay/detail container.
3. Read final rectangle.
4. Calculate inverse translation/scale.
5. Animate to identity transform.
6. Reverse the process when returning.

Advantages:

- visually smooth
- preserves apparent physical continuity
- selected card appears to originate from its actual grid location
- works with responsive grid layouts

## Option B – CSS clone

Create a cloned product card positioned exactly over the selected grid card and animate the clone to the center.

The original remains hidden during the detail state.

This is also acceptable and may be simpler.

Important:

- keep animation GPU-friendly
- animate primarily `transform` and `opacity`
- avoid animating layout-heavy properties every frame
- target smooth playback at 1080p on Raspberry Pi 4

---

# 7. Product overview behavior

Each product card should contain:

- image
- title
- optional price badge

Example:

```text
┌────────────────────────┐
│                        │
│      PRODUCT IMAGE     │
│                        │
│                 99,-   │
└────────────────────────┘
        BLACK WITCH
```

Price badge behavior should be configurable.

Possible modes:

```json
"priceDisplay": "card"
```

or

```json
"priceDisplay": "global"
```

or

```json
"priceDisplay": "detailOnly"
```

or

```json
"priceDisplay": "hidden"
```

For the first version, supporting `card`, `detailOnly`, and `hidden` is enough.

---

# 8. Configuration-first architecture

The application must be data driven.

The renderer should not need code changes to:

- add products
- remove products
- reorder products
- change title
- change images
- change prices
- change timing
- change column count
- change background color
- change accent color
- change text colors
- change detail zoom size

Suggested file:

```text
config/config.json
```

Example:

```json
{
  "display": {
    "width": 1920,
    "height": 1080,
    "backgroundColor": "#4f8e91",
    "accentColor": "#ffffff",
    "textColor": "#ffffff"
  },

  "branding": {
    "logo": "assets/branding/rodes-logo.png",
    "showLogo": true,
    "logoPosition": "bottom-right"
  },

  "grid": {
    "columns": 5,
    "gapX": 48,
    "gapY": 26,
    "cardAspectRatio": 1.55,
    "autoFit": true
  },

  "animation": {
    "overviewInitialDurationMs": 2000,
    "betweenProductsDurationMs": 1000,
    "transitionInDurationMs": 700,
    "detailDurationMs": 3000,
    "transitionOutDurationMs": 700,
    "backgroundOpacityDuringDetail": 0.35,
    "detailWidthPercent": 62
  },

  "price": {
    "displayMode": "card",
    "defaultPrice": "99 kr.-"
  },

  "products": [
    {
      "id": "black-witch",
      "name": "Black Witch",
      "image": "assets/products/black-witch.webp",
      "price": "99 kr.-",
      "enabled": true
    },
    {
      "id": "angelic-yellow",
      "name": "Angelic Yellow",
      "image": "assets/products/angelic-yellow.webp",
      "price": "99 kr.-",
      "enabled": true
    }
  ]
}
```

The exact schema can evolve, but preserve the concept.

---

# 9. Suggested project structure

```text
rodes-signage/
│
├── README.md
├── HANDOVER.md
├── index.html
│
├── src/
│   ├── app.js
│   ├── config.js
│   ├── renderer.js
│   ├── animation.js
│   └── utils.js
│
├── styles/
│   ├── main.css
│   ├── grid.css
│   └── animation.css
│
├── config/
│   └── config.json
│
├── assets/
│   ├── products/
│   │   ├── black-witch.webp
│   │   ├── angelic-yellow.webp
│   │   └── ...
│   │
│   ├── branding/
│   │   └── rodes-logo.png
│   │
│   └── fonts/
│
├── scripts/
│   ├── start-dev.sh
│   ├── start-kiosk.sh
│   └── install-pi.sh
│
└── systemd/
    ├── rodes-signage-server.service
    └── rodes-signage-kiosk.service
```

Keep the first iteration smaller if useful, but do not mix all logic into a single huge JavaScript file.

---

# 10. Rendering model

Recommended DOM hierarchy:

```html
<body>
  <main id="signage">
    <section id="product-grid"></section>

    <section id="global-price-panel"></section>

    <div id="scene-dimmer"></div>

    <section id="detail-overlay">
      <div id="detail-product"></div>
      <div id="detail-title"></div>
      <div id="detail-price"></div>
    </section>

    <img id="brand-logo">
  </main>
</body>
```

This is only a suggestion.

The final architecture can differ if a cleaner approach is identified.

---

# 11. Responsive behavior

Primary target is:

```text
1920 × 1080
16:9
```

However, the layout should ideally scale proportionally to other 16:9 displays.

Use CSS units and/or a scale wrapper rather than fixed pixel positions everywhere.

Possible strategy:

```text
virtual design canvas = 1920×1080
actual screen scale = min(
    screenWidth / 1920,
    screenHeight / 1080
)
```

Alternatively, create a fully responsive CSS Grid.

Prefer a robust responsive grid where possible.

---

# 12. Grid requirements

Configuration should support:

```json
"columns": 5
```

Potential future support:

```json
"columns": "auto"
```

For first release, a configured number of columns is acceptable.

Products should automatically flow into new rows.

The system must not require manual `x/y` coordinates for every product.

Allow an optional special card / CTA card later, for example:

```text
KONTAKTLINSER
Frit valg kun
99 kr.-
```

This could be represented as:

```json
{
  "type": "promo",
  "title": "KONTAKTLINSER",
  "subtitle": "Frit valg kun",
  "price": "99 kr.-"
}
```

Do not make promo cards a blocker for the first prototype.

---

# 13. Visual states

Use explicit application states.

Suggested state machine:

```text
OVERVIEW
SELECTING
DETAIL
RETURNING
WAITING
```

Possible JavaScript representation:

```js
const SignageState = Object.freeze({
  OVERVIEW: "overview",
  SELECTING: "selecting",
  DETAIL: "detail",
  RETURNING: "returning",
  WAITING: "waiting"
});
```

Avoid uncontrolled overlapping timers.

Prefer `async/await` with promise-based delay utilities.

Example conceptual loop:

```js
async function runPresentation() {
    while (true) {
        for (const product of enabledProducts) {
            await wait(config.animation.betweenProductsDurationMs);
            await showProduct(product);
            await wait(config.animation.detailDurationMs);
            await hideProduct(product);
        }
    }
}
```

Animation completion should ideally listen for `transitionend` / `animationend`, with a timeout fallback.

---

# 14. Error handling

The application should continue running even if one product is misconfigured.

Examples:

- missing image → show placeholder and log warning
- missing price → use default price
- missing title → use ID
- invalid animation duration → use safe default
- empty product array → show clear status/debug screen

Browser console logs should be useful.

Example:

```text
[Signage] Loaded 13 products
[Signage] Product "black-witch" selected
[Signage] Missing image for "foo"
```

---

# 15. Image handling

Preferred format:

- WebP for product images
- PNG where transparency is required
- SVG for logos where possible

Avoid excessively large source images.

For a 1080p screen, product assets usually do not need to be many thousands of pixels wide.

Provide documentation for recommended source image size.

Potential recommendation:

```text
product image:
~1000–1600 px wide
WebP quality around 80–90
```

Preload all product images before starting the animation loop to avoid visible loading.

---

# 16. Fonts

Fonts must be locally hosted.

No Google Fonts or other internet dependency in production.

If the exact Rodes font is later supplied, support it via `@font-face`.

For the prototype, use a clean fallback stack.

Example:

```css
font-family:
  "Rodes Display",
  "Arial Narrow",
  Arial,
  sans-serif;
```

Do not include proprietary font files in the repository unless licensing permits it.

---

# 17. Raspberry Pi target

Hardware:

```text
Raspberry Pi 4 Model B
```

Recommended OS:

```text
Raspberry Pi OS Lite 64-bit
```

Target:

```text
1920×1080 HDMI display
fullscreen kiosk
automatic startup after boot
no keyboard or mouse required during normal use
```

The signage content should remain local.

No internet connection should be required after installation.

---

# 18. Local web server

The browser should load the site over localhost rather than opening `file://`.

For development a simple server is sufficient:

```bash
python3 -m http.server 8080
```

Then:

```text
http://localhost:8080
```

For production, it is acceptable to use the same approach behind systemd.

A tiny custom Python server may later be used if cache-control or API endpoints are required.

---

# 19. Chromium kiosk startup

Conceptual startup command:

```bash
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:8080
```

Exact Chromium binary / flags may differ depending on current Raspberry Pi OS.

Validate on the actual Pi instead of assuming the binary name.

---

# 20. systemd

Eventually provide:

```text
rodes-signage-server.service
rodes-signage-kiosk.service
```

Requirements:

- server starts on boot
- kiosk starts after graphical environment/server is ready
- restart automatically on failure
- logs available through journalctl

Possible commands:

```bash
sudo systemctl restart rodes-signage-server
sudo systemctl restart rodes-signage-kiosk
```

And:

```bash
journalctl -u rodes-signage-server
journalctl -u rodes-signage-kiosk
```

Do not finalize these service files until the actual Raspberry Pi OS environment is known.

---

# 21. Development mode

Provide a development mode usable from a normal PC.

Recommended command:

```bash
python -m http.server 8080
```

or:

```bash
./scripts/start-dev.sh
```

Then navigate to:

```text
http://localhost:8080
```

Useful dev-only features may include:

```text
?debug=true
```

Possible debug overlay:

- current state
- selected product index
- animation FPS
- config filename
- viewport resolution

Do not show debug elements in normal signage mode.

---

# 22. Keyboard shortcuts for development

Useful optional shortcuts:

```text
Space   = pause/resume
Right   = next product
Left    = previous product
R       = reload config
D       = toggle debug overlay
F       = fullscreen
```

These should not be required for normal playback.

---

# 23. Config reload

Long term, it would be useful to reload configuration without rebooting.

Possible implementation:

- press `R` during development
- automatic config poll every 30–60 seconds
- filesystem watcher in a Python helper
- simple local admin page

Do not implement remote admin functionality in the first prototype unless requested.

---

# 24. Optional video rendering feature

Potential future feature:

Use the same configuration file to render the presentation into an MP4.

Concept:

```text
config.json
    ↓
renderer
    ↓
frames
    ↓
FFmpeg
    ↓
contact-lenses.mp4
```

Potential Python stack:

- Pillow
- OpenCV if useful
- FFmpeg subprocess

Alternative:

Use headless Chromium / Playwright to record the browser animation.

This may produce output that matches the live renderer more accurately and avoids maintaining two independent layout engines.

This feature is optional and should not be part of the first MVP unless implementation is trivial.

---

# 25. Long-term architecture preference

Important principle:

**One visual engine, one configuration format.**

Avoid implementing a browser renderer and a completely different Python renderer with separate layout logic if possible.

If MP4 export is added later, strongly consider rendering/recording the existing web presentation.

---

# 26. Phase 1 – MVP

Codex should initially implement only enough to validate the concept.

MVP requirements:

1. Load products from `config/config.json`.
2. Render configurable product grid.
3. Show image and title.
4. Show optional price badge.
5. Automatically iterate through enabled products.
6. Dim all non-selected products.
7. Animate selected product from grid to centered detail view.
8. Display large title.
9. Animate selected product back to original position.
10. Move to next product.
11. Loop forever.
12. Work at 1920×1080.
13. Run from a basic localhost web server.
14. No internet dependencies.
15. Clean code structure.

Do not build an editor/admin UI yet.

---

# 27. Phase 2

After MVP has been visually approved:

- refine exact spacing
- reproduce Rodes visual identity
- add logo positioning
- improve price component
- add configurable promo card
- improve responsive scaling
- add development shortcuts
- add debug mode
- improve asset preload/error handling

---

# 28. Phase 3

Raspberry Pi deployment:

- install script
- kiosk mode
- systemd services
- automatic recovery
- disable screen blanking
- hide mouse pointer
- test HDMI reconnect behavior
- test 24–48 hour continuous runtime
- document SSH update workflow

---

# 29. Phase 4 / future ideas

Possible future additions:

- simple browser-based editor
- drag/drop product ordering
- upload images
- multiple scenes/playlists
- date/time scheduling
- automatic category switching
- transition presets
- individual per-product hold time
- individual per-product zoom
- sale prices
- QR code
- multiple screens
- central server synchronization
- offline cache
- MP4 export
- Anthias integration

Do not let these future ideas complicate MVP architecture unnecessarily.

---

# 30. Style requirements

The current concept is:

- simple
- clean
- high contrast
- large readable text
- product focused
- minimal clutter
- suitable for viewing from several meters away

Initial design colors should be configurable.

Current mockup roughly resembles:

```text
background teal:
#4f8e91
```

Do not assume this exact hex value is final.

Cards:

- white rounded borders
- image fills most of card
- rounded corners
- product title directly below
- thin/light overview typography
- bold condensed detail typography

---

# 31. Important implementation detail: dimming

When a product is selected, non-selected content should visually recede.

Do this with either:

```css
opacity
```

or a scene overlay.

The selected product must remain fully opaque.

Avoid applying opacity to a parent element that also contains the selected product.

Possible DOM model:

```text
grid
├── card A
├── card B
├── card C
└── ...

dimmer overlay

active card / clone
```

---

# 32. Important implementation detail: layering

Recommended conceptual z-index levels:

```text
background                 0
normal grid               10
branding                  20
dimmer                    30
active product            40
detail title / price      50
debug                     100
```

Avoid arbitrary z-index numbers spread throughout CSS.

Use CSS custom properties if useful.

---

# 33. CSS custom properties

Recommended:

```css
:root {
    --background-color: #4f8e91;
    --text-color: #ffffff;
    --card-radius: 24px;
    --transition-duration: 700ms;
}
```

Populate relevant variables from config in JavaScript.

---

# 34. Performance considerations

Target stable playback on Raspberry Pi 4.

Prefer:

```text
transform
opacity
```

Avoid excessive:

```text
filter: blur(...)
large box shadows
continuous JS position updates
canvas redraw of full 1080p screen
```

unless proven performant.

Use `requestAnimationFrame` only where needed.

CSS transitions/Web Animations API are preferred.

---

# 35. Browser behavior

Prevent:

- scrollbars
- text selection
- accidental drag
- image drag ghosting
- context menu if desired
- overscroll

Example:

```css
html,
body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
}
```

---

# 36. Accessibility / reduced motion

This is signage, so reduced-motion system preference is not a primary requirement.

However, animation logic should still avoid harsh flashing.

Do not use high-frequency blinking or strobing effects.

---

# 37. Test checklist

Desktop test:

- [ ] Loads without internet
- [ ] No console errors
- [ ] All images preload
- [ ] Correct number of products
- [ ] Grid fits at 1920×1080
- [ ] No scrollbars
- [ ] Product transitions originate from correct location
- [ ] Product returns to exact original location
- [ ] Text does not overflow
- [ ] Prices display correctly
- [ ] Loop continues indefinitely
- [ ] Resize does not break layout

Pi test:

- [ ] Launches automatically after boot
- [ ] 1920×1080 output
- [ ] Smooth animation
- [ ] No visible browser chrome
- [ ] No mouse pointer
- [ ] No screen blanking
- [ ] Recovers after browser crash
- [ ] Recovers after power cycle
- [ ] Works without internet
- [ ] Stable after several hours

---

# 38. Acceptance criteria for first prototype

The first version is successful when:

1. A JSON file defines at least 8–13 test products.
2. Opening the page shows a clean 5-column product matrix.
3. Each card has image, name, and optional price.
4. After a configurable delay, the first product is highlighted.
5. Other content dims.
6. The selected product smoothly enlarges and moves toward the center.
7. The selected title appears prominently.
8. It remains visible for a configurable duration.
9. It smoothly returns to its grid position.
10. The overview is restored.
11. The next product is highlighted.
12. The process loops indefinitely.
13. No page refresh is required.
14. It runs smoothly in Chromium at 1920×1080.

---

# 39. Development approach for Codex

Please work incrementally.

Recommended order:

### Step 1
Create initial project skeleton.

### Step 2
Create config loader and test configuration.

### Step 3
Create static product grid.

### Step 4
Make layout fit 1920×1080 cleanly.

### Step 5
Implement product selection state.

### Step 6
Implement dimming.

### Step 7
Implement animated detail view.

### Step 8
Implement return animation.

### Step 9
Implement automatic sequence loop.

### Step 10
Add configuration validation and error handling.

### Step 11
Refactor where necessary.

### Step 12
Only after desktop approval, add Raspberry Pi deployment files.

Do not attempt all deployment and editing features before the visual animation prototype is working.

---

# 40. Coding conventions

Prefer:

- clear naming
- small functions
- no unnecessary abstraction
- comments explaining non-obvious animation logic
- no large dependencies without justification
- configuration separated from implementation
- CSS split logically
- avoid magic numbers where configuration is more appropriate

Use modern JavaScript supported by current Chromium.

No transpiler/build step should be required for MVP.

The ideal development workflow is:

```text
edit files
↓
refresh browser
↓
see changes
```

---

# 41. First task for Codex

Start by creating an MVP implementation of the signage renderer.

Use placeholder images or temporary assets if the real product images have not yet been added to the repository.

The first implementation should include:

```text
index.html
styles/main.css
src/app.js
config/config.json
README.md
```

Create a 5-column product grid and implement one complete automated highlight/detail/return cycle.

After that, extend it to iterate over all configured products.

Focus on the visual engine first.

Do not implement Raspberry Pi installation scripts until the browser prototype is working.

---

# 42. Design discussion points to revisit after prototype

Once the first visual version exists, confirm:

- exact card dimensions
- exact spacing
- exact detail size
- whether the title is below or overlaid
- whether price is shown in each card
- whether price is global
- whether the large selected product includes price
- whether the product grid remains partially visible behind detail view
- amount of background dimming
- easing curve
- transition speed
- exact Rodes colors
- exact fonts
- logo size and position
- whether a promotional price card occupies one grid cell
- whether all products must have identical card aspect ratios

These details should remain adjustable without changing the overall architecture.

---

# 43. Summary

Build a lightweight offline product signage engine using:

```text
HTML
CSS
Vanilla JavaScript
JSON
Chromium kiosk
Raspberry Pi 4
```

Core principle:

> The product configuration defines the content; the signage engine defines the behavior.

Contact lenses are only the first content set.

The architecture must remain reusable for other Rodes product categories later.
