# ImmoHitz Website-Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static replacement website for immohitz.ch (Startseite, Über uns, Team, Angebote, Kontakt, Impressum, Datenschutz), ready for SFTP upload to Hostpoint, replacing the current Hostpoint homepage-builder site.

**Architecture:** Plain static HTML/CSS with client-side JavaScript ES modules. No build step, no server-side code. Shared header/footer are HTML partials injected at runtime via `fetch()`. The Angebote page reads a JSON data file and renders a filterable grid purely in the browser. The Kontakt page is a real HTML form that posts to Formspree.

**Tech Stack:** HTML5, CSS3 (custom properties, no framework), vanilla JavaScript (ES modules), Node.js built-in test runner (`node --test`) for the pure-logic modules, `sips` (built into macOS) for image resizing. No npm dependencies.

**Spec:** `docs/superpowers/specs/2026-09-25-immohitz-website-relaunch-design.md`

## Global Constraints

- No build tooling, no bundler, no server-side rendering — every file that ships is exactly what gets uploaded via SFTP.
- No CMS, no admin backend for non-technical editing (spec's "Out of Scope").
- German only, no multi-language support.
- Contact form has no own server backend — submission is handled by Formspree.
- Colors: primary `#203a6b`, primary-dark `#17284d`, accent `#c08a2e`, background `#f7f8fa`, background-alt `#eef1f6`, text `#1f2430`, text-light `#5b6472`, border `#dfe3ea`, status-aktiv `#2f7d4f`, status-vermietet `#a5690f`, status-verkauft `#6b7280`.
- Fonts: headings `Libre Franklin` (weights 600–800), body `Inter` (weights 400–700), both self-hosted (no Google Fonts CDN calls — same privacy reasoning as the sibling anttenitz.ch project).
- Mobile-first responsive layout; current Chrome/Safari/Firefox/Edge only, no IE11 support.
- `data/listings.json` field names are exactly: `titel`, `ort`, `preis`, `zimmer`, `flaeche`, `bild`, `typ` (`Kauf`/`Miete`), `status` (`aktiv`/`verkauft`/`vermietet`), `beschreibung`. Only `titel` is required — every other field must degrade gracefully when missing.
- `data/listings.json` ships as an empty array (`[]`) in production — there are currently zero real listings, and no fake/placeholder listings are shipped as content.

## Review Focus

- Formspree form without a real form ID (`REPLACE-WITH-YOUR-FORM-ID`) shipped by default — client-side validation must still work correctly and never crash, so the form is testable before Jeremias provides the real ID (owned by Task 8's tests).
- Empty `data/listings.json` — the Angebote page must show a friendly empty-state message instead of a blank grid or a JS error (owned by Task 6's tests).
- Invalid/incomplete contact-form input (empty email, `"abc"` as email, missing required fields) must be caught client-side before the form would submit (owned by Task 7's tests).
- Mobile viewport (< 720px) across all 7 pages, including the new Angebote grid and the Kontakt form — hamburger menu and layout must keep working (owned by Task 11's manual QA pass, building on each page task's own mobile check).
- A listing with no `bild` field must render a placeholder image, not a broken `<img>` tag (owned by Task 6's tests).

---

## File Structure

```
/index.html                Startseite
/ueber-uns.html
/team.html
/angebote.html
/kontakt.html
/impressum.html
/datenschutz.html
/partials/header.html      Nav bar (logo + 5 links), injected at runtime
/partials/footer.html      Footer + legal links
/css/style.css             Design tokens, nav, hero, buttons, service/listing grids
/js/include.js             Fetches & injects partials, highlights active nav link
/js/nav.js                 Mobile hamburger toggle
/js/listings-data.js       Pure: type list + filtering + status label (tested)
/js/listings.js            DOM glue: renders the Angebote grid using the above
/js/contact-form.js        Pure: field validation (tested)
/js/contact-form-ui.js     DOM glue: wires contact-form.js into kontakt.html
/data/listings.json        Angebote entries (ships empty: `[]`)
/img/site/                 Logo, portrait placeholder, listing placeholder
/scripts/process-images.sh Resize source photos into web-friendly JPEGs + thumbs
/fonts/                    Self-hosted Inter + Libre Franklin woff2 + OFL licenses
/tests/listings-data.test.js
/tests/contact-form.test.js
/tests/process-images.test.sh
/tests/fixtures/sample-source.jpg  Synthetic fixture for the image-pipeline test
/package.json               `{"type":"module"}` so Node resolves the JS as ES modules (dev-only, not uploaded)
/DEPLOY.md                  Upload checklist
```

---

### Task 1: Design tokens, assets, partials, include mechanism, Startseite

**Files:**
- Create: `package.json`
- Create: `fonts/inter-latin.woff2`, `fonts/inter-latin-ext.woff2`, `fonts/libre-franklin-latin.woff2`, `fonts/libre-franklin-latin-ext.woff2`, `fonts/OFL-inter.txt`, `fonts/OFL-libre-franklin.txt`
- Create: `img/site/logo.png`
- Create: `css/style.css`
- Create: `partials/header.html`
- Create: `partials/footer.html`
- Create: `js/include.js`
- Create: `index.html`

**Interfaces:**
- Produces: CSS custom properties (`--color-primary`, `--color-primary-dark`, `--color-accent`, `--color-bg`, `--color-bg-alt`, `--color-text`, `--color-text-light`, `--color-border`, `--color-status-aktiv`, `--color-status-vermietet`, `--color-status-verkauft`, `--font-heading`, `--font-body`, `--radius`, `--max-width`) used by every later page/component task.
- Produces: `<div data-include="/partials/header.html"></div>` / `<div data-include="/partials/footer.html"></div>` pattern, and `<body data-page="...">` convention for active-nav highlighting, used by every page task.
- Produces: `document.dispatchEvent(new Event('partials:loaded'))` — later tasks (nav.js, listings.js, contact-form-ui.js) must wait for this event before touching injected DOM.
- Produces: `.service-grid` / `.service-card` CSS classes used by `index.html`.

- [ ] **Step 1: Add a minimal package.json for ES module resolution**

`package.json`:

```json
{
  "name": "immohitz-website",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Download and self-host the webfonts**

Inter and Libre Franklin are both SIL Open Font License. Fetch the current variable-weight woff2 files and their license texts directly from Google's font-serving CDN and the Google Fonts GitHub repo:

```bash
mkdir -p fonts
curl -sL "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2" -o fonts/inter-latin-ext.woff2
curl -sL "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2" -o fonts/inter-latin.woff2
curl -sL "https://fonts.gstatic.com/s/librefranklin/v20/jizDREVItHgc8qDIbSTKq4XkRiUR2zcLig.woff2" -o fonts/libre-franklin-latin-ext.woff2
curl -sL "https://fonts.gstatic.com/s/librefranklin/v20/jizDREVItHgc8qDIbSTKq4XkRiUf2zc.woff2" -o fonts/libre-franklin-latin.woff2
curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt" -o fonts/OFL-inter.txt
curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/librefranklin/OFL.txt" -o fonts/OFL-libre-franklin.txt
ls -la fonts/
```

Expected: `fonts/inter-latin.woff2` (~48KB), `fonts/inter-latin-ext.woff2` (~85KB), `fonts/libre-franklin-latin.woff2` (~29KB), `fonts/libre-franklin-latin-ext.woff2` (~26KB), and both `OFL-*.txt` files starting with `Copyright 2020 The <Font> Project Authors` (verify with `head -3 fonts/OFL-inter.txt`).

If these URLs 404 (Google reshuffles font file hashes periodically), regenerate them:

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Libre+Franklin:wght@600..800&display=swap" \
  -o /tmp/fonts.css
grep -A4 "/\* latin" /tmp/fonts.css
```

Then use the fresh `url(...)` values from the `/* latin */` and `/* latin-ext */` blocks (the Chrome user-agent is required — without it Google serves old TTF/WOFF1 instead of WOFF2).

- [ ] **Step 3: Download and resize the current logo**

The current immohitz.ch site serves its logo through Hostpoint's image proxy. Download it and shrink it to a web-appropriate size:

```bash
mkdir -p img/site
curl -sL "https://immohitz.ch/.cm4all/uproc.php/0/.Logo%20ImmoHitz%20halbtrans.png/picture-1200" -o img/site/logo.png
sips -Z 600 img/site/logo.png
sips -g pixelWidth -g pixelHeight img/site/logo.png
```

Expected: `img/site/logo.png` exists, ~600×124px, well under 30KB (`du -h img/site/logo.png`). If the download fails (the proxy URL includes a cache-busting token that may have changed), open https://immohitz.ch in a browser, save the logo image manually, and place it at `img/site/logo.png` before continuing.

- [ ] **Step 4: Create the base stylesheet**

`css/style.css`:

```css
/* Self-hosted webfonts (SIL Open Font License).
   Deliberately NOT loaded from fonts.googleapis.com / fonts.gstatic.com: that
   would send every visitor's IP address to Google and contradict the privacy
   statement on datenschutz.html. Files live in /fonts/ and ship with the site. */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/inter-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/inter-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: 'Libre Franklin';
  font-style: normal;
  font-weight: 600 800;
  font-display: swap;
  src: url('/fonts/libre-franklin-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Libre Franklin';
  font-style: normal;
  font-weight: 600 800;
  font-display: swap;
  src: url('/fonts/libre-franklin-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

:root {
  --color-primary: #203a6b;
  --color-primary-dark: #17284d;
  --color-accent: #c08a2e;
  --color-bg: #f7f8fa;
  --color-bg-alt: #eef1f6;
  --color-text: #1f2430;
  --color-text-light: #5b6472;
  --color-border: #dfe3ea;
  --color-status-aktiv: #2f7d4f;
  --color-status-vermietet: #a5690f;
  --color-status-verkauft: #6b7280;
  --font-heading: 'Libre Franklin', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --radius: 12px;
  --max-width: 1100px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

h1, h2, h3 { font-family: var(--font-heading); font-weight: 700; margin: 0 0 0.5em; }

.container { max-width: var(--max-width); margin: 0 auto; padding: 0 20px; }

header.site-header { background: #fff; border-bottom: 1px solid var(--color-border); position: relative; }

.nav-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  max-width: var(--max-width);
  margin: 0 auto;
}

.nav-logo { display: flex; align-items: center; margin-right: auto; }
.nav-logo-img { height: 40px; width: auto; display: block; }

.nav-links { display: flex; gap: 20px; list-style: none; margin: 0; padding: 0; }
.nav-links a { color: var(--color-text); text-decoration: none; font-weight: 700; font-size: 15px; }
.nav-links a:hover, .nav-links a.active { color: var(--color-primary); }

.nav-toggle { display: none; background: none; border: none; font-size: 26px; cursor: pointer; color: var(--color-primary); }

.btn {
  display: inline-block;
  padding: 10px 22px;
  border-radius: 24px;
  background: var(--color-primary);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 15px;
}
.btn:hover { background: var(--color-primary-dark); }

footer.site-footer { text-align: center; padding: 24px 20px; font-size: 13px; color: var(--color-text-light); }
footer.site-footer a { color: var(--color-text-light); margin: 0 8px; }

.hero {
  background: var(--color-bg-alt);
  padding: 48px 20px;
  text-align: center;
}
.hero h1 { font-size: 32px; color: var(--color-primary); }
.hero p { font-size: 16px; color: var(--color-text-light); margin: 0 0 20px; max-width: 640px; margin-left: auto; margin-right: auto; }

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  max-width: var(--max-width);
  margin: 32px auto;
  padding: 0 20px;
}
.service-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 24px;
}
.service-card h2 { color: var(--color-primary); font-size: 19px; }
.service-card p { color: var(--color-text-light); margin: 0; }

@media (max-width: 720px) {
  .nav-toggle { display: block; }
  .nav-links {
    position: absolute;
    top: 64px; left: 0; right: 0;
    background: #fff;
    flex-direction: column;
    padding: 12px 20px;
    display: none;
    border-bottom: 1px solid var(--color-border);
  }
  .nav-links.open { display: flex; }
}
```

- [ ] **Step 5: Create the header partial**

`partials/header.html`:

```html
<header class="site-header">
  <nav class="nav-bar">
    <a href="/index.html" class="nav-logo"><img src="/img/site/logo.png" alt="ImmoHitz GmbH" class="nav-logo-img"></a>
    <button class="nav-toggle" id="navToggle" aria-label="Menü öffnen" aria-expanded="false">☰</button>
    <ul class="nav-links" id="navLinks">
      <li><a href="/index.html" data-nav="home">Startseite</a></li>
      <li><a href="/ueber-uns.html" data-nav="ueber-uns">Über uns</a></li>
      <li><a href="/team.html" data-nav="team">Team</a></li>
      <li><a href="/angebote.html" data-nav="angebote">Angebote</a></li>
      <li><a href="/kontakt.html" data-nav="kontakt">Kontakt</a></li>
    </ul>
  </nav>
</header>
```

- [ ] **Step 6: Create the footer partial**

`partials/footer.html`:

```html
<footer class="site-footer">
  <p>&copy; 2026 ImmoHitz GmbH</p>
  <p><a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a></p>
</footer>
```

- [ ] **Step 7: Create the include mechanism**

`js/include.js` (rehydrates `<script>` tags in injected partials so inline/module scripts actually execute, and always fires `partials:loaded` even if a fetch fails so dependent scripts don't hang forever):

```js
function rehydrateScripts(fragment) {
  fragment.querySelectorAll('script').forEach((oldScript) => {
    const newScript = document.createElement('script');
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

async function loadPartial(el) {
  const url = el.getAttribute('data-include');
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    rehydrateScripts(tpl.content);
    el.replaceWith(tpl.content);
  } catch (err) {
    console.error(`[include] Partial "${url}" konnte nicht geladen werden:`, err);
  }
}

function highlightActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-nav]').forEach((a) => {
    if (a.dataset.nav === current) a.classList.add('active');
  });
}

async function loadAllPartials() {
  const els = Array.from(document.querySelectorAll('[data-include]'));
  try {
    await Promise.all(els.map(loadPartial));
    highlightActiveNav();
  } catch (err) {
    console.error('[include] Fehler beim Laden der Partials:', err);
  } finally {
    document.dispatchEvent(new Event('partials:loaded'));
  }
}

document.addEventListener('DOMContentLoaded', loadAllPartials);
```

- [ ] **Step 8: Create the Startseite**

`index.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ImmoHitz GmbH – Ihr Immobiliendienstleister in Urtenen-Schönbühl</title>
<meta name="description" content="ImmoHitz GmbH: Immobilienbewirtschaftung, -bewertung und -vermarktung in Urtenen-Schönbühl.">
<link rel="stylesheet" href="/css/style.css">
</head>
<body data-page="home">
<div data-include="/partials/header.html"></div>

<main>
  <section class="hero">
    <h1>Willkommen bei ImmoHitz</h1>
    <p>Bei der ImmoHitz GmbH dreht sich alles um Immobilien – und um Sie! Mit Leidenschaft, Erfahrung und einem familiären Ansatz sorgen wir dafür, dass Ihre Immobilie in besten Händen ist.</p>
    <a class="btn" href="/angebote.html">Zu unseren Angeboten</a>
  </section>

  <div class="service-grid">
    <div class="service-card">
      <h2>Immobilienbewirtschaftung</h2>
      <p>Mietliegenschaften / STOWE</p>
    </div>
    <div class="service-card">
      <h2>Immobilienbewertung</h2>
      <p>Professionelle Bewertung Ihrer Liegenschaft.</p>
    </div>
    <div class="service-card">
      <h2>Immobilienvermarktung</h2>
      <p>Reibungsloser Verkauf mit persönlicher Betreuung.</p>
    </div>
  </div>

  <section class="hero" style="background: none;">
    <p>Ihre persönlichen Ansprechpartner: <strong>Tamara &amp; Jeremias Hitz</strong></p>
    <a class="btn" href="/team.html">Team kennenlernen</a>
  </section>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
</body>
</html>
```

- [ ] **Step 9: Manual verification**

Run: `python3 -m http.server 8000` from the project root, then open `http://localhost:8000/index.html`.

Expected: header nav (Startseite/Über uns/Team/Angebote/Kontakt) with the ImmoHitz logo and footer (Impressum/Datenschutz) appear (injected via `include.js`), "Startseite" is highlighted in the nav, hero text and the 3 service cards render, no errors in the browser console.

- [ ] **Step 10: Commit**

```bash
git add package.json fonts/ img/site/logo.png css/style.css partials/ js/include.js index.html
git commit -m "feat: add design tokens, self-hosted fonts, header/footer partials, and Startseite"
```

---

### Task 2: Mobile navigation

**Files:**
- Create: `js/nav.js`
- Modify: `index.html` (add script tag)

**Interfaces:**
- Consumes: `partials:loaded` event from `js/include.js` (Task 1), `#navToggle`/`#navLinks` IDs from `partials/header.html` (Task 1).

- [ ] **Step 1: Create the hamburger toggle script**

`js/nav.js`:

```js
document.addEventListener('partials:loaded', () => {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});
```

- [ ] **Step 2: Wire it into the Startseite**

In `index.html`, change:

```html
<script type="module" src="/js/include.js"></script>
```

to:

```html
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
```

- [ ] **Step 3: Manual verification**

Run: with the local server still running, open `http://localhost:8000/index.html`, open browser devtools, switch to a mobile viewport (< 720px wide, e.g. iPhone SE).

Expected: the nav links collapse behind a "☰" button; clicking it shows the links in a dropdown; clicking it again hides them; `aria-expanded` toggles between `"true"`/`"false"` in the elements panel.

- [ ] **Step 4: Commit**

```bash
git add js/nav.js index.html
git commit -m "feat: add mobile hamburger navigation"
```

---

### Task 3: Über uns page

**Files:**
- Create: `ueber-uns.html`

**Interfaces:**
- Consumes: same `<div data-include>` / `<body data-page>` / script-tag pattern as `index.html` (Task 1, Task 2).

- [ ] **Step 1: Create the page**

`ueber-uns.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Über uns – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
<style>
  .about { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
  .about p { margin: 0 0 1em; }
</style>
</head>
<body data-page="ueber-uns">
<div data-include="/partials/header.html"></div>

<main class="about">
  <h1>Über uns</h1>
  <p>Willkommen bei der ImmoHitz GmbH, Ihrem zuverlässigen Partner für alle Belange rund um Immobilienbewirtschaftung, -bewertung und -vermarktung. Als familiengeführtes Unternehmen legen wir besonderen Wert auf persönliche Betreuung, massgeschneiderte Lösungen und höchste Professionalität.</p>
  <p>Egal, ob Sie Unterstützung bei der Bewirtschaftung Ihrer Liegenschaft benötigen, eine Bewertung Ihrer Immobilie wünschen oder Ihre Immobilie erfolgreich vermarkten und verkaufen möchten – wir stehen Ihnen mit unserem Fachwissen und unserem Engagement zur Seite.</p>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 2: Manual verification**

Run: open `http://localhost:8000/ueber-uns.html` (local server from Task 1 must still be running).

Expected: "Über uns" is highlighted in the nav, both paragraphs render, hamburger menu works at narrow widths.

- [ ] **Step 3: Commit**

```bash
git add ueber-uns.html
git commit -m "feat: add Über uns page"
```

---

### Task 4: Team page

**Files:**
- Create: `team.html`
- Create: `img/site/portrait-placeholder.svg`

**Interfaces:**
- Consumes: same partial/include pattern as Task 1/2.

- [ ] **Step 1: Create a placeholder portrait**

Real photos of Tamara and Jeremias haven't been supplied yet (see spec's "Offene Punkte"). Ship a placeholder SVG reused for both, so the layout is correct now; swapping in real photos later is a one-line `src` change per person.

`img/site/portrait-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#eef1f6"/>
  <circle cx="200" cy="160" r="70" fill="#203a6b"/>
  <path d="M80 380c0-80 54-140 120-140s120 60 120 140z" fill="#203a6b"/>
  <text x="200" y="370" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#5b6472">Foto folgt</text>
</svg>
```

- [ ] **Step 2: Create the page**

`team.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Team – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
<style>
  .team-intro { text-align: center; padding: 40px 20px 0; }
  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
    max-width: var(--max-width);
    margin: 32px auto 48px;
    padding: 0 20px;
  }
  .team-card { text-align: center; }
  .team-card img { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
  .team-card h2 { font-size: 19px; margin-bottom: 2px; }
  .team-card .role { color: var(--color-text-light); margin: 0 0 10px; }
  .team-card a { color: var(--color-primary); text-decoration: none; display: block; }
</style>
</head>
<body data-page="team">
<div data-include="/partials/header.html"></div>

<main>
  <h1 class="team-intro">Team ImmoHitz</h1>
  <div class="team-grid">
    <article class="team-card">
      <img src="/img/site/portrait-placeholder.svg" alt="Portrait von Tamara Hitz">
      <h2>Tamara Hitz</h2>
      <p class="role">Inhaberin / Administration</p>
      <a href="tel:+41313043834">Telefon: +41 31 304 38 34</a>
      <a href="mailto:info@immohitz.ch">info@immohitz.ch</a>
    </article>
    <article class="team-card">
      <img src="/img/site/portrait-placeholder.svg" alt="Portrait von Jeremias Hitz">
      <h2>Jeremias Hitz</h2>
      <p class="role">Inhaber / eidg. dipl. Immobilientreuhänder</p>
      <a href="tel:+41796061480">Telefon: +41 79 606 14 80</a>
      <a href="mailto:jeremias.hitz@immohitz.ch">jeremias.hitz@immohitz.ch</a>
    </article>
  </div>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manual verification**

Run: open `http://localhost:8000/team.html`.

Expected: "Team" highlighted in nav, both team cards render with placeholder portraits, name, role, phone and email links, cards stack to one column below 720px.

- [ ] **Step 4: Commit**

```bash
git add team.html img/site/portrait-placeholder.svg
git commit -m "feat: add Team page"
```

---

### Task 5: Listings data logic (pure functions)

**Files:**
- Create: `js/listings-data.js`
- Test: `tests/listings-data.test.js`

**Interfaces:**
- Produces: `getTypes(listings: {typ?: string}[]): string[]` — returns `['Alle', ...sorted unique types]`.
- Produces: `filterByType(listings: {typ?: string}[], type: string): array` — returns all listings when `type` is falsy or `'Alle'`, otherwise only listings whose `typ` matches exactly.
- Produces: `statusLabel(status: string): string` — maps `'aktiv'|'verkauft'|'vermietet'` to their German display label (`'Aktiv'`/`'Verkauft'`/`'Vermietet'`); returns the input unchanged for any other value.

- [ ] **Step 1: Write the failing test**

`tests/listings-data.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getTypes, filterByType, statusLabel } from '../js/listings-data.js';

test('getTypes returns "Alle" plus sorted unique types', () => {
  const listings = [{ typ: 'Miete' }, { typ: 'Kauf' }, { typ: 'Miete' }, {}];
  assert.deepEqual(getTypes(listings), ['Alle', 'Kauf', 'Miete']);
});

test('getTypes returns just "Alle" for an empty list', () => {
  assert.deepEqual(getTypes([]), ['Alle']);
});

test('filterByType returns everything for "Alle"', () => {
  const listings = [{ typ: 'Kauf' }, { typ: 'Miete' }];
  assert.deepEqual(filterByType(listings, 'Alle'), listings);
});

test('filterByType returns everything when type is falsy', () => {
  const listings = [{ typ: 'Kauf' }, { typ: 'Miete' }];
  assert.deepEqual(filterByType(listings, undefined), listings);
});

test('filterByType filters to exact matches', () => {
  const listings = [{ typ: 'Kauf', id: 1 }, { typ: 'Miete', id: 2 }, { typ: 'Kauf', id: 3 }];
  assert.deepEqual(filterByType(listings, 'Kauf'), [{ typ: 'Kauf', id: 1 }, { typ: 'Kauf', id: 3 }]);
});

test('statusLabel maps known statuses to German labels', () => {
  assert.equal(statusLabel('aktiv'), 'Aktiv');
  assert.equal(statusLabel('verkauft'), 'Verkauft');
  assert.equal(statusLabel('vermietet'), 'Vermietet');
});

test('statusLabel returns unknown values unchanged', () => {
  assert.equal(statusLabel('reserviert'), 'reserviert');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/listings-data.test.js`
Expected: FAIL — `Cannot find module '../js/listings-data.js'`

- [ ] **Step 3: Write the implementation**

`js/listings-data.js`:

```js
const STATUS_LABELS = { aktiv: 'Aktiv', verkauft: 'Verkauft', vermietet: 'Vermietet' };

export function getTypes(listings) {
  const set = new Set(listings.map((l) => l.typ).filter(Boolean));
  return ['Alle', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))];
}

export function filterByType(listings, type) {
  if (!type || type === 'Alle') return listings;
  return listings.filter((l) => l.typ === type);
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/listings-data.test.js`
Expected: PASS — 7 tests passing, 0 failing

- [ ] **Step 5: Commit**

```bash
git add js/listings-data.js tests/listings-data.test.js
git commit -m "feat: add listings type filtering and status label logic with tests"
```

---

### Task 6: Angebote page (grid, filter tabs, empty state)

**Files:**
- Create: `angebote.html`
- Create: `js/listings.js`
- Create: `data/listings.json`
- Create: `img/site/listing-placeholder.svg`
- Modify: `css/style.css` (append listings grid + status badge + empty-state styles)

**Interfaces:**
- Consumes: `getTypes`, `filterByType`, `statusLabel` from `js/listings-data.js` (Task 5); `data/listings.json`; `partials:loaded` event (Task 1).

- [ ] **Step 1: Create a placeholder listing image**

`img/site/listing-placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#eef1f6"/>
  <path d="M60 180 L200 70 L340 180 V240 H60 Z" fill="#203a6b"/>
  <rect x="180" y="160" width="40" height="80" fill="#eef1f6"/>
  <text x="200" y="270" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#5b6472">Bild folgt</text>
</svg>
```

- [ ] **Step 2: Ship the empty listings data file**

`data/listings.json`:

```json
[]
```

- [ ] **Step 3: Append listings grid, status badge, and empty-state styles**

Append to `css/style.css`:

```css
.listing-tabs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; padding: 24px 20px 0; max-width: var(--max-width); margin: 0 auto; }
.listing-tabs .tab {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  padding: 6px 16px; border-radius: 20px; border: none; cursor: pointer;
  background: #f3f3f3; color: var(--color-text-light);
}
.listing-tabs .tab.active { background: var(--color-primary); color: #fff; }

.listing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  max-width: var(--max-width);
  margin: 24px auto 48px;
  padding: 0 20px;
}
.listing-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.listing-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.listing-body { padding: 16px; }
.listing-body h2 { font-size: 18px; margin: 6px 0 4px; }
.listing-ort { color: var(--color-text-light); margin: 0 0 4px; }
.listing-meta { color: var(--color-text-light); font-size: 14px; margin: 0 0 8px; }
.listing-preis { font-weight: 700; color: var(--color-accent); margin: 0 0 8px; }
.listing-desc { color: var(--color-text); font-size: 14px; margin: 0; }

.status-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  color: #fff;
}
.status-badge.status-aktiv { background: var(--color-status-aktiv); }
.status-badge.status-vermietet { background: var(--color-status-vermietet); }
.status-badge.status-verkauft { background: var(--color-status-verkauft); }

.listing-message { grid-column: 1 / -1; text-align: center; color: var(--color-text-light); padding: 20px; }
```

- [ ] **Step 4: Create the listings DOM glue script**

`js/listings.js`:

```js
import { getTypes, filterByType, statusLabel } from './listings-data.js';

let allListings = [];
let currentListings = [];

async function init() {
  try {
    const res = await fetch('/data/listings.json');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    allListings = await res.json();
  } catch (err) {
    console.error('[listings] data/listings.json konnte nicht geladen werden:', err);
    showMessage('Angebote konnten nicht geladen werden.');
    return;
  }
  renderTabs();
  applyFilter('Alle');
}

function showMessage(text) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'listing-message';
  p.textContent = text;
  grid.appendChild(p);
}

function renderTabs() {
  const tabsEl = document.getElementById('listingsTabs');
  const types = getTypes(allListings);
  if (types.length <= 1) {
    tabsEl.hidden = true;
    return;
  }
  tabsEl.hidden = false;
  tabsEl.innerHTML = '';
  types.forEach((type) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.textContent = type;
    btn.dataset.type = type;
    btn.addEventListener('click', () => applyFilter(type));
    tabsEl.appendChild(btn);
  });
}

function applyFilter(type) {
  currentListings = filterByType(allListings, type);
  document.querySelectorAll('#listingsTabs .tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('listingsGrid');
  grid.innerHTML = '';
  if (currentListings.length === 0) {
    showMessage('Aktuell sind keine Angebote verfügbar. Kontaktieren Sie uns gerne direkt.');
    return;
  }
  currentListings.forEach((listing) => grid.appendChild(renderCard(listing)));
}

function renderCard(listing) {
  const card = document.createElement('article');
  card.className = 'listing-card';

  const img = document.createElement('img');
  img.src = listing.bild || '/img/site/listing-placeholder.svg';
  img.alt = listing.titel || 'Immobilienangebot';
  img.loading = 'lazy';
  card.appendChild(img);

  const body = document.createElement('div');
  body.className = 'listing-body';

  const status = listing.status || 'aktiv';
  const badge = document.createElement('span');
  badge.className = `status-badge status-${status}`;
  badge.textContent = statusLabel(status);
  body.appendChild(badge);

  const h2 = document.createElement('h2');
  h2.textContent = listing.titel || 'Immobilienangebot';
  body.appendChild(h2);

  if (listing.ort) {
    const ort = document.createElement('p');
    ort.className = 'listing-ort';
    ort.textContent = listing.ort;
    body.appendChild(ort);
  }

  const metaParts = [];
  if (listing.zimmer) metaParts.push(`${listing.zimmer} Zimmer`);
  if (listing.flaeche) metaParts.push(`${listing.flaeche} m²`);
  if (metaParts.length > 0) {
    const meta = document.createElement('p');
    meta.className = 'listing-meta';
    meta.textContent = metaParts.join(' · ');
    body.appendChild(meta);
  }

  if (listing.preis) {
    const preis = document.createElement('p');
    preis.className = 'listing-preis';
    preis.textContent = listing.preis;
    body.appendChild(preis);
  }

  if (listing.beschreibung) {
    const desc = document.createElement('p');
    desc.className = 'listing-desc';
    desc.textContent = listing.beschreibung;
    body.appendChild(desc);
  }

  return card;
}

document.addEventListener('partials:loaded', init);
```

- [ ] **Step 5: Create the Angebote page**

`angebote.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Angebote – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body data-page="angebote">
<div data-include="/partials/header.html"></div>

<main>
  <h1 style="text-align:center; padding-top: 32px;">Aktuelle Angebote</h1>
  <div class="listing-tabs" id="listingsTabs"></div>
  <div class="listing-grid" id="listingsGrid"></div>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
<script type="module" src="/js/listings.js"></script>
</body>
</html>
```

- [ ] **Step 6: Manual verification with the empty production data**

Run: open `http://localhost:8000/angebote.html`.

Expected: "Angebote" highlighted in nav, no filter tabs shown (only one implicit type when the list is empty), and the message "Aktuell sind keine Angebote verfügbar. Kontaktieren Sie uns gerne direkt." appears instead of an empty grid or a console error.

- [ ] **Step 7: Manual verification with sample data (temporary, not committed)**

Temporarily replace the contents of `data/listings.json` with:

```json
[
  { "titel": "3.5-Zimmer-Wohnung", "ort": "Urtenen-Schönbühl", "preis": "590'000 CHF", "zimmer": 3.5, "flaeche": 92, "typ": "Kauf", "status": "aktiv", "beschreibung": "Helle Wohnung mit Balkon." },
  { "titel": "2-Zimmer-Attikawohnung", "ort": "Schönbühl", "typ": "Miete", "status": "vermietet" }
]
```

Reload `http://localhost:8000/angebote.html`.

Expected: filter tabs "Alle / Kauf / Miete" appear, 2 cards render, the first shows all fields plus a green "Aktiv" badge, the second (missing `preis`/`flaeche`/`zimmer`/`bild`/`beschreibung`) still renders cleanly with the placeholder image, no room/area line, and an amber "Vermietet" badge — confirming the card degrades gracefully when optional fields are missing.

Afterwards, restore `data/listings.json` to `[]` (do not commit sample data — see Global Constraints).

- [ ] **Step 8: Commit**

```bash
git add css/style.css js/listings.js angebote.html data/listings.json img/site/listing-placeholder.svg
git commit -m "feat: add Angebote page with filterable listing grid and empty state"
```

---

### Task 7: Contact form validation logic (pure functions)

**Files:**
- Create: `js/contact-form.js`
- Test: `tests/contact-form.test.js`

**Interfaces:**
- Produces: `isValidEmail(value: string): boolean`.
- Produces: `validateContactForm({vorname, nachname, email, telefon}): string[]` — returns an array of invalid field names (subset of `['vorname', 'nachname', 'email', 'telefon']`), empty when all required fields are valid. `nachricht` is optional and not validated.

- [ ] **Step 1: Write the failing test**

`tests/contact-form.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, validateContactForm } from '../js/contact-form.js';

test('isValidEmail accepts a plausible address', () => {
  assert.equal(isValidEmail('jeremias.hitz@immohitz.ch'), true);
});

test('isValidEmail rejects missing @ or domain dot', () => {
  assert.equal(isValidEmail('abc'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail(''), false);
});

test('validateContactForm returns no errors for a complete, valid submission', () => {
  const errors = validateContactForm({
    vorname: 'Max',
    nachname: 'Muster',
    email: 'max@example.com',
    telefon: '079 123 45 67',
  });
  assert.deepEqual(errors, []);
});

test('validateContactForm flags missing required fields', () => {
  const errors = validateContactForm({ vorname: '', nachname: '', email: '', telefon: '' });
  assert.deepEqual(errors, ['vorname', 'nachname', 'email', 'telefon']);
});

test('validateContactForm flags an invalid email but leaves valid fields out', () => {
  const errors = validateContactForm({
    vorname: 'Max',
    nachname: 'Muster',
    email: 'not-an-email',
    telefon: '079 123 45 67',
  });
  assert.deepEqual(errors, ['email']);
});

test('validateContactForm treats whitespace-only fields as missing', () => {
  const errors = validateContactForm({ vorname: '   ', nachname: 'Muster', email: 'max@example.com', telefon: '079' });
  assert.deepEqual(errors, ['vorname']);
});

test('validateContactForm ignores nachricht entirely', () => {
  const errors = validateContactForm({
    vorname: 'Max', nachname: 'Muster', email: 'max@example.com', telefon: '079', nachricht: '',
  });
  assert.deepEqual(errors, []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/contact-form.test.js`
Expected: FAIL — `Cannot find module '../js/contact-form.js'`

- [ ] **Step 3: Write the implementation**

`js/contact-form.js`:

```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

export function validateContactForm({ vorname, nachname, email, telefon } = {}) {
  const errors = [];
  if (!vorname || !vorname.trim()) errors.push('vorname');
  if (!nachname || !nachname.trim()) errors.push('nachname');
  if (!isValidEmail(email)) errors.push('email');
  if (!telefon || !telefon.trim()) errors.push('telefon');
  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/contact-form.test.js`
Expected: PASS — 7 tests passing, 0 failing

- [ ] **Step 5: Commit**

```bash
git add js/contact-form.js tests/contact-form.test.js
git commit -m "feat: add contact form validation logic with tests"
```

---

### Task 8: Kontakt page (Formspree form)

**Files:**
- Create: `kontakt.html`
- Create: `js/contact-form-ui.js`

**Interfaces:**
- Consumes: `validateContactForm` from `js/contact-form.js` (Task 7); same partial/include pattern as Task 1/2.

- [ ] **Step 1: Create the DOM glue script**

`js/contact-form-ui.js`:

```js
import { validateContactForm } from './contact-form.js';

document.addEventListener('partials:loaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const errorBanner = document.getElementById('formError');

  form.addEventListener('submit', (event) => {
    const errors = validateContactForm({
      vorname: form.vorname.value,
      nachname: form.nachname.value,
      email: form.email.value,
      telefon: form.telefon.value,
    });

    ['vorname', 'nachname', 'email', 'telefon'].forEach((field) => {
      form.elements[field].removeAttribute('aria-invalid');
    });

    if (errors.length > 0) {
      event.preventDefault();
      errorBanner.hidden = false;
      errors.forEach((field) => {
        form.elements[field].setAttribute('aria-invalid', 'true');
      });
    } else {
      errorBanner.hidden = true;
    }
  });
});
```

- [ ] **Step 2: Create the page**

`kontakt.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kontakt – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
<style>
  .contact { max-width: 640px; margin: 0 auto; padding: 48px 20px; }
  .contact h1 { text-align: center; }
  .contact-intro { text-align: center; color: var(--color-text-light); margin-bottom: 24px; }
  .contact-details { text-align: center; margin-bottom: 32px; line-height: 1.8; }
  .contact-details a { color: var(--color-primary); }
  .form-error { background: #fdecea; color: #7a1f1f; border: 1px solid #f2b8b5; border-radius: var(--radius); padding: 12px 16px; margin-bottom: 20px; }
  .form-field { margin-bottom: 16px; }
  .form-field label { display: block; font-weight: 700; margin-bottom: 4px; }
  .form-field input, .form-field textarea {
    width: 100%; padding: 10px 12px; border: 1px solid var(--color-border);
    border-radius: 8px; font-family: var(--font-body); font-size: 15px;
  }
  .form-field input[aria-invalid="true"], .form-field textarea[aria-invalid="true"] { border-color: #c0392b; }
  .honeypot { position: absolute; left: -9999px; }
</style>
</head>
<body data-page="kontakt">
<div data-include="/partials/header.html"></div>

<main class="contact">
  <h1>Kontaktieren Sie uns!</h1>
  <p class="contact-intro">Der einfachste Weg, mit uns in Kontakt zu treten. Wir bemühen uns um schnellstmögliche Bearbeitung Ihrer Anfrage!</p>

  <p class="contact-details">
    ImmoHitz GmbH<br>
    Unterdorfstrasse 8, 3322 Urtenen-Schönbühl<br>
    Telefon: <a href="tel:+41313043834">+41 31 304 38 34</a><br>
    E-Mail: <a href="mailto:info@immohitz.ch">info@immohitz.ch</a>
  </p>

  <p class="form-error" id="formError" role="alert" hidden>Sie haben nicht alle Pflichtfelder ausgefüllt. Bitte überprüfen Sie Ihre Eingaben.</p>

  <form id="contactForm" action="https://formspree.io/f/REPLACE-WITH-YOUR-FORM-ID" method="POST">
    <input type="text" name="_gotcha" class="honeypot" tabindex="-1" autocomplete="off">
    <input type="hidden" name="_subject" value="Neue Anfrage von der ImmoHitz Website">

    <div class="form-field">
      <label for="vorname">Vorname *</label>
      <input type="text" id="vorname" name="vorname" required>
    </div>
    <div class="form-field">
      <label for="nachname">Nachname *</label>
      <input type="text" id="nachname" name="nachname" required>
    </div>
    <div class="form-field">
      <label for="email">E-Mail *</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-field">
      <label for="telefon">Telefon *</label>
      <input type="tel" id="telefon" name="telefon" required>
    </div>
    <div class="form-field">
      <label for="nachricht">Nachricht</label>
      <textarea id="nachricht" name="nachricht" rows="5"></textarea>
    </div>

    <p><em>* Pflichtfelder</em></p>
    <button type="submit" class="btn">Nachricht senden</button>
  </form>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
<script type="module" src="/js/contact-form-ui.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manual verification**

Run: open `http://localhost:8000/kontakt.html`.

Expected: "Kontakt" highlighted in nav, address/phone/email block renders, clicking "Nachricht senden" with empty fields shows the red error banner and highlights the 4 required fields in red without submitting (the form's `action` points at a placeholder Formspree ID, so a real submission would fail anyway — that's expected until Task 11's DEPLOY.md step is completed). Filling in valid values for Vorname/Nachname/E-Mail/Telefon and submitting again clears the error banner (submission itself will 404 against the placeholder ID until the real Formspree form is created — that's expected at this stage).

- [ ] **Step 4: Commit**

```bash
git add js/contact-form-ui.js kontakt.html
git commit -m "feat: add Kontakt page with Formspree contact form"
```

---

### Task 9: Impressum & Datenschutz pages

**Files:**
- Create: `impressum.html`
- Create: `datenschutz.html`

**Interfaces:**
- Consumes: same partial/include pattern as Task 1/2.

- [ ] **Step 1: Create the Impressum page**

The UID/Handelsregisternummer isn't known yet (open item, see `DEPLOY.md` in Task 11) — the page ships with an explicit bracketed placeholder that Task 11's deploy checklist calls out, so it can't accidentally go live unfilled.

`impressum.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Impressum – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
<style>
  .legal { max-width: 640px; margin: 0 auto; padding: 48px 20px; line-height: 1.8; }
</style>
</head>
<body data-page="">
<div data-include="/partials/header.html"></div>

<main class="legal">
  <h1>Impressum</h1>
  <p>Verantwortlich für den Inhalt dieser Website:</p>
  <p>
    ImmoHitz GmbH<br>
    Unterdorfstrasse 8<br>
    3322 Urtenen-Schönbühl
  </p>
  <p>
    Telefon: <a href="tel:+41313043834">+41 31 304 38 34</a><br>
    E-Mail: <a href="mailto:info@immohitz.ch">info@immohitz.ch</a>
  </p>
  <p>Geschäftsführung: Tamara Hitz, Jeremias Hitz</p>
  <p>UID/Handelsregisternummer: [vor Live-Schaltung ergänzen]</p>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create the Datenschutz page**

`datenschutz.html`:

```html
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Datenschutz – ImmoHitz GmbH</title>
<link rel="stylesheet" href="/css/style.css">
<style>
  .legal { max-width: 640px; margin: 0 auto; padding: 48px 20px; line-height: 1.8; }
</style>
</head>
<body data-page="">
<div data-include="/partials/header.html"></div>

<main class="legal">
  <h1>Datenschutz</h1>
  <p>Diese Website erhebt personenbezogene Daten nur, wenn Sie uns über das Kontaktformular freiwillig Angaben machen (Vorname, Nachname, E-Mail-Adresse, Telefonnummer, Nachricht). Diese Daten werden ausschliesslich zur Bearbeitung Ihrer Anfrage verwendet.</p>
  <p>Das Kontaktformular wird über den Dienst <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener">Formspree</a> (Formspree, Inc., USA) technisch abgewickelt, der die eingegebenen Daten per E-Mail an die ImmoHitz GmbH weiterleitet. Formspree verarbeitet die Daten dabei als Auftragsverarbeiter.</p>
  <p>Diese Website setzt keine Cookies und keine Analyse- oder Tracking-Dienste ein.</p>
  <p>Verantwortlich im Sinne der Datenschutzgesetzgebung ist die im <a href="/impressum.html">Impressum</a> genannte Firma. Fragen zum Datenschutz können jederzeit per E-Mail an <a href="mailto:info@immohitz.ch">info@immohitz.ch</a> gestellt werden.</p>
</main>

<div data-include="/partials/footer.html"></div>
<script type="module" src="/js/include.js"></script>
<script type="module" src="/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manual verification**

Run: open `http://localhost:8000/impressum.html` and `http://localhost:8000/datenschutz.html`.

Expected: both pages render with header/footer, correct content, and the Datenschutz page's links to "/impressum.html" and the Formspree privacy policy work.

- [ ] **Step 4: Commit**

```bash
git add impressum.html datenschutz.html
git commit -m "feat: add Impressum and Datenschutz pages"
```

---

### Task 10: Image processing pipeline

**Files:**
- Create: `scripts/process-images.sh`
- Create: `tests/fixtures/sample-source.jpg`
- Test: `tests/process-images.test.sh`

**Interfaces:**
- Produces: `scripts/process-images.sh <source-dir> <dest-dir> <file1> [file2 ...]` — for each source file, writes `<dest-dir>/<lowercased-basename>.jpg` (max width 1400px, quality ~70) and `<dest-dir>/thumbs/<lowercased-basename>.jpg` (max width 500px, quality ~60). This is the tool Stefan will run whenever Jeremias supplies real team or listing photos.

- [ ] **Step 1: Generate a synthetic source-image fixture**

The project has no real, already-cleared source photos yet (team photos and listing photos are still outstanding, per the spec's "Offene Punkte"). Generate a synthetic fixture so the pipeline test is self-contained and doesn't depend on private/unsupplied images:

```bash
mkdir -p tests/fixtures
python3 -c "
from PIL import Image
Image.new('RGB', (2000, 1500), (32, 58, 107)).save('tests/fixtures/sample-source.jpg', quality=90)
"
ls -la tests/fixtures/sample-source.jpg
```

Expected: `tests/fixtures/sample-source.jpg` exists, 2000×1500px, roughly 45-50KB.

- [ ] **Step 2: Write the test for the (not yet existing) script**

`tests/process-images.test.sh`:

```bash
#!/usr/bin/env bash
# Verifies scripts/process-images.sh produces correctly-sized, small output files.
set -euo pipefail

TMP_SRC="$(mktemp -d)"
TMP_DEST="$(mktemp -d)"
trap 'rm -rf "$TMP_SRC" "$TMP_DEST"' EXIT

cp tests/fixtures/sample-source.jpg "$TMP_SRC/sample-source.jpg"

./scripts/process-images.sh "$TMP_SRC" "$TMP_DEST" "sample-source.jpg"

full="$TMP_DEST/sample-source.jpg"
thumb="$TMP_DEST/thumbs/sample-source.jpg"

[ -f "$full" ] || { echo "FAIL: missing $full"; exit 1; }
[ -f "$thumb" ] || { echo "FAIL: missing $thumb"; exit 1; }

full_width="$(sips -g pixelWidth "$full" | awk '/pixelWidth/{print $2}')"
[ "$full_width" -le 1400 ] || { echo "FAIL: $full is wider than 1400px ($full_width)"; exit 1; }

full_size_kb="$(du -k "$full" | cut -f1)"
[ "$full_size_kb" -le 500 ] || { echo "FAIL: $full is larger than 500KB (${full_size_kb}KB)"; exit 1; }

thumb_width="$(sips -g pixelWidth "$thumb" | awk '/pixelWidth/{print $2}')"
[ "$thumb_width" -le 500 ] || { echo "FAIL: $thumb is wider than 500px ($thumb_width)"; exit 1; }

echo "PASS: process-images.sh produces correctly sized output"
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `chmod +x tests/process-images.test.sh && bash tests/process-images.test.sh`
Expected: FAIL — `./scripts/process-images.sh: No such file or directory` (the script doesn't exist yet) — confirms the test actually exercises the script rather than trivially passing.

- [ ] **Step 4: Write the processing script**

`scripts/process-images.sh`:

```bash
#!/usr/bin/env bash
# Resize source photos into web-friendly listing/team images + thumbnails using sips.
# Usage: scripts/process-images.sh <source-dir> <dest-dir> <file1> [file2 ...]
set -euo pipefail

SRC_DIR="$1"
DEST_DIR="$2"
shift 2

mkdir -p "$DEST_DIR" "$DEST_DIR/thumbs"

for name in "$@"; do
  src="$SRC_DIR/$name"
  base="$(basename "$name" | tr '[:upper:]' '[:lower:]' | sed 's/\.[^.]*$//')"
  out="$DEST_DIR/${base}.jpg"
  thumb="$DEST_DIR/thumbs/${base}.jpg"

  cp "$src" "$out"
  sips -Z 1400 -s format jpeg -s formatOptions 70 "$out" >/dev/null

  cp "$src" "$thumb"
  sips -Z 500 -s format jpeg -s formatOptions 60 "$thumb" >/dev/null

  echo "Processed $name -> $out ($(du -h "$out" | cut -f1)), $thumb ($(du -h "$thumb" | cut -f1))"
done
```

- [ ] **Step 5: Make it executable**

Run: `chmod +x scripts/process-images.sh`

- [ ] **Step 6: Run the test again to verify it passes**

Run: `bash tests/process-images.test.sh`
Expected: `PASS: process-images.sh produces correctly sized output` (the fixture produces a ~24KB/1400px full image and a ~4KB/500px thumbnail).

- [ ] **Step 7: Commit**

```bash
git add scripts/process-images.sh tests/fixtures/sample-source.jpg tests/process-images.test.sh
git commit -m "feat: add image processing pipeline with a self-contained test fixture"
```

---

### Task 11: Final QA and deploy preparation

**Files:**
- Create: `DEPLOY.md`

**Interfaces:**
- None — this is the final integration/documentation task.

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test tests/*.test.js && bash tests/process-images.test.sh`
Expected: all Node tests pass (14 total across Tasks 5 and 7), and the shell test prints `PASS: process-images.sh produces correctly sized output`.

- [ ] **Step 2: Manual full-site pass**

Run: `python3 -m http.server 8000`, then open each page in turn: `index.html`, `ueber-uns.html`, `team.html`, `angebote.html`, `kontakt.html`, `impressum.html`, `datenschutz.html`.

Expected, on every page: header nav renders with the correct link highlighted, footer renders with working Impressum/Datenschutz links, no console errors, and at a viewport under 720px the hamburger menu opens/closes correctly. Confirm again that `angebote.html` shows the empty-state message (production `data/listings.json` is `[]`) and that `kontakt.html`'s client-side validation still blocks empty submissions.

- [ ] **Step 3: Write the deploy checklist**

`DEPLOY.md`:

```markdown
# Deployment-Checkliste

## Vor dem Upload

- [ ] `node --test tests/*.test.js && bash tests/process-images.test.sh` läuft fehlerfrei durch
- [ ] Lokaler Test (`python3 -m http.server 8000`) zeigt alle 7 Seiten korrekt
- [ ] Mobile-Ansicht (< 720px) geprüft: Hamburger-Menü funktioniert auf jeder Seite
- [ ] Echte Formspree-Formular-ID erstellt (auf formspree.io) und in `kontakt.html` eingetragen (nicht mehr `REPLACE-WITH-YOUR-FORM-ID`), danach eine echte Testanfrage über das Live-Formular verschickt und die Zustellung per E-Mail geprüft
- [ ] UID/Handelsregisternummer in `impressum.html` ergänzt (nicht mehr `[vor Live-Schaltung ergänzen]`)
- [ ] Echte Team-Fotos eingefügt (ersetzen `img/site/portrait-placeholder.svg` in `team.html`; `scripts/process-images.sh` dafür verwenden)
- [ ] Aktuelle Immobilienangebote in `data/listings.json` eingetragen, sobald welche vorliegen (siehe Feldschema in der Spec); bis dahin bleibt die Datei bewusst `[]`

## Upload per SFTP

1. Hostpoint Control Panel → SFTP-Zugangsdaten notieren (Host, Benutzername, Passwort/Key, Port meist 22)
2. Mit einem SFTP-Client (z. B. Cyberduck, FileZilla, oder `sftp` im Terminal) verbinden
3. Diese Dateien/Ordner ins Webroot-Verzeichnis hochladen (meist `htdocs` oder `www`):
   `*.html`, `css/`, `js/`, `data/`, `img/`, `fonts/`, `partials/`
4. **Nicht** hochladen: `.git/`, `.superpowers/`, `tests/`, `scripts/`, `docs/`, `package.json`, `DEPLOY.md`, `.gitignore` — das sind reine Entwicklungs-/Quelldateien
5. Im Hostpoint Control Panel die Domain vom Homepage-Baukasten auf das klassische Hosting-Paket mit Dateisystem umstellen (die Baukasten-Instanz muss deaktiviert bzw. die Domain neu zugeordnet werden)

## Nach dem Upload

- [ ] Website live unter immohitz.ch aufrufen, obige Checkliste auf dem echten Server wiederholen
- [ ] Auf einem echten Mobilgerät prüfen (Ladezeit, Darstellung, Menü)
- [ ] Testanfrage über das Kontaktformular auf der Live-Seite verschicken und die E-Mail-Zustellung bestätigen
```

- [ ] **Step 4: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: add deployment checklist"
```
