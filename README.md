# Portfolio — "IDE" design (P1)

A personal portfolio that looks and works like a code editor: an explorer, tabs, files you open, a working terminal and a status bar.
Plain HTML, CSS and JavaScript. No framework, no build step, no `npm install`.

**All your content lives in one file: `data/portfolio.json`.** It uses the same format as the App Showcase design (P2), so you can move your JSON between the two designs without changing anything.

---

## 1. Folder structure

```
portfolio-ide/
├── index.html                 ← page structure (title, meta tags, the empty "slots")
├── 404.html                   ← "file not found" page
│
├── data/
│   ├── portfolio.json         ← ★ ALL your content
│   └── portfolio.schema.json  ← rules for the JSON (VS Code autocompletes + flags mistakes)
│
├── assets/
│   ├── css/
│   │   ├── fonts.css          ← self-hosted Space Grotesk + Space Mono
│   │   ├── tokens.css         ← ★ colours for dark + light theme, fonts, radii
│   │   ├── base.css           ← reset, buttons, syntax colours
│   │   ├── ide.css            ← the editor shell: window, explorer, tabs, terminal, status bar
│   │   ├── panels.css         ← what's inside each file (README, projects.kt, …)
│   │   └── animations.css     ← all motion (+ "reduce motion" support)
│   ├── js/
│   │   ├── main.js            ← entry point: loads the JSON, renders, starts everything
│   │   ├── render.js          ← JSON → HTML for every file panel (safely escaped)
│   │   ├── router.js          ← which file is open = the URL hash (#projects, #contact…)
│   │   ├── terminal.js        ← the interactive terminal (help, ls, open, contact…)
│   │   ├── theme.js           ← light/dark switch, remembers the visitor's choice
│   │   └── utils.js           ← helpers: escaping, safe links, accent colour, icons
│   ├── fonts/                 ← .woff2 files + their licences (OFL)
│   ├── favicon/               ← browser + home-screen icons
│   ├── img/
│   │   ├── projects/          ← ★ your app screenshots / icons (see README.txt inside)
│   │   └── og-image-1200x630.png ← preview image when your link is shared
│   └── cv/                    ← ★ your resume.pdf (see README.txt inside)
│
├── site.webmanifest           ← name + icons for "add to home screen"
├── robots.txt / sitemap.xml   ← for search engines (replace yourdomain.com)
├── .nojekyll                  ← tells GitHub Pages to serve files as-is (keep it)
├── _headers                   ← security + cache headers (Netlify, Cloudflare Pages)
└── vercel.json                ← the same headers for Vercel
```

★ = the files you'll actually touch.

---

## 2. Run it locally

The page loads `portfolio.json` with `fetch()` and uses JavaScript modules. **Browsers block both on `file://`**, so double-clicking `index.html` shows an error message instead of your content. Serve the folder instead:

```bash
npx serve .                      # Node, nothing to install
python3 -m http.server 8080      # Python → open http://localhost:8080
```
Or use VS Code's **Live Server** extension: right-click `index.html` → *Open with Live Server*.

---

## 3. Updating your content

1. Open `data/portfolio.json` in VS Code. The `$schema` line at the top gives you autocomplete and red squiggles on mistakes.
2. Edit, save, refresh. Once it's deployed, `git push` and the host redeploys automatically.

Replace every `[bracket]` and every `[X]` with real values. **Don't publish made-up numbers.** If you don't have a number yet, delete that stat.

### `person`
```json
"person": {
  "name": "Your Name",
  "role": "Android & Kotlin Multiplatform Developer",
  "headline": "I build Android apps *people keep.*",
  "location": "Lahore, Pakistan",
  "utcOffset": 5,
  "avatar": "assets/img/me.jpg",
  "resume": "assets/cv/resume.pdf",
  "email": "you@yourdomain.com",
  "available": true,
  "availableNote": "Open to freelance work",
  "company": { "name": "Agile Interface", "role": "Co-founder", "url": "https://yourcompany.com" }
}
```
| Field | Where it shows |
|---|---|
| `name` | README heading, explorer profile card, status bar, terminal `whoami`, the window title (as `your-name`) |
| `headline` | Under your name. Words between `*stars*` get the accent colour |
| `utcOffset` | The live clock in the status bar and the terminal `time` command (Pakistan = `5`) |
| `avatar` | Photo on the README and in the explorer. Square, at least 600×600. Leave `""` to show your initials |
| `resume` | Shows a "Résumé.pdf" button. Leave `""` to hide it |
| `available` | Green "available" or yellow "busy" in the README badge, status bar and contact.sh |

### `about`, `stats`, `skills`
- `about`: one string per paragraph (README).
- `stats`: `{ "label", "value" }` pairs, shown as shield badges on the README. `value` is a string, so `"10k+"` works.
- `skills`: groups of items. They render as a `dependencies { … }` block **and** as chips in `skills.gradle.kts`.

### `projects`
```json
{
  "name": "Qibla Finder",
  "kind": "app",
  "summary": "One or two sentences.",
  "platforms": ["android", "ios"],
  "metrics": [{ "label": "Installs", "value": "50k+" }],
  "image": "assets/img/projects/qibla-finder.png",
  "icon": "assets/img/projects/qibla-finder-icon.png",
  "color": "#1E3A8A",
  "install": "",
  "links": [{ "label": "Google Play", "url": "https://play.google.com/store/apps/details?id=…" }]
}
```
- `kind`: `"app"`, `"library"` or `"case-study"`.
- `platforms`: any of `"android"`, `"ios"`, `"desktop"`, `"web"`.
- `icon` / `color`: the IDE card shows the icon, or a letter tile in `color` if there's no icon. (`image` is used by the App Showcase design.)
- `install`: for libraries, e.g. `implementation("io.github.you:lib:1.0.0")`. Shown as a code snippet.
- `links`: any number. The first link's label also appears top-right on the card. Links that aren't `https://` or `mailto:` are dropped automatically.

### `experience`
Newest first. If `"to"` is `"now"` (or `"present"`), that role gets the **HEAD → now** tag in `experience.log`. The 7-character "commit hashes" are generated from the role name. They're decoration.

### `services`
Optional. If the list has items, a `services.md` file appears in the explorer. Delete everything inside `[ ]` and the file disappears.

### `socials`
`{ "label", "url" }`. They appear in `contact.sh` and the terminal `contact` command. The README's GitHub button uses the first link that contains "github".

### `theme`
```json
"theme": { "design": "ide", "accent": "#2F5BEA", "mode": "dark" }
```
- `accent`: your colour for buttons, the active tab and the status bar. The site works out whether white or navy text is readable on top of it (WCAG contrast). Pick something mid-dark, like `#2F5BEA`, `#7C3AED`, `#0B7A55` or `#C2410C`.
- `mode`: what first-time visitors see: `"dark"`, `"light"` or `"auto"` (follow their system). After that, the theme button decides and the choice is remembered. If you change this to `"light"`, also change `data-theme="dark"` on the `<html>` tag in `index.html` to avoid a one-frame flash.
- `design`: informational only. This folder *is* the IDE design.

---

## 4. Things that live in the HTML, not the JSON

- `<title>`, `description`, the `og:` tags and the canonical URL in the `<head>` of `index.html`. Link previews (WhatsApp, LinkedIn, Slack) **don't run JavaScript**, so these must be written into the HTML by hand.
- `assets/img/og-image-1200x630.png`: the preview image. Replace it with your own (1200×630). A screenshot of your finished site works well.
- `site.webmanifest`: replace `[Full Name]`.

---

## 5. Customising (good practice for learning)

**Change colours:** edit `assets/css/tokens.css`. Every colour is a variable, defined once for dark and once for light.

**Add a terminal command:** in `assets/js/terminal.js`, add a key to `COMMANDS`:
```js
coffee: () => ['☕ brewing… ready in 3 minutes'],
```
Each command returns an array of HTML lines. Use `esc()` on anything that came from the visitor or the JSON.

**Add a new file to the explorer** (e.g. `blog.md`):
1. `render.js` → add `{ id: 'blog', name: 'blog.md', icon: 'B', color: '#F472B6' }` to `FILE_DEFS`.
2. `render.js` → write `function blog(d) { return '…html…'; }` and add it to `PANELS`.
3. `index.html` → add `<section class="panel" id="panel-blog" data-panel="blog" aria-label="blog.md" tabindex="-1" data-slot="panel-blog" hidden></section>`.

The router, tabs and terminal `open blog` pick it up automatically.

---

## 6. Deploy (free): GitHub Pages, Netlify, Vercel, Cloudflare

There is **no build command**. Every host just serves the folder.

### GitHub Pages (step by step)

GitHub Pages works with this site as-is: plain files, relative paths and no build step. Two ways to host it:

| | Repo name | Your URL |
|---|---|---|
| **User site** (recommended, one per GitHub account) | `yourusername.github.io` | `https://yourusername.github.io/` |
| **Project site** (any other repo name) | e.g. `portfolio` | `https://yourusername.github.io/portfolio/` |

Each founder has their own GitHub account, so each of you can use your own **user site**.

1. **Create the repo** on github.com → **New repository** → name it as in the table → **Public** (Pages on private repos needs a paid plan) → Create.
2. **Upload the files.** Put the *contents* of this folder at the top of the repo, so `index.html` sits next to `README.md`, **not** inside a `portfolio-…/` sub-folder. (This is the #1 mistake. If it happens, your site is at `…/portfolio-ide/` instead.)
   - Web upload: **Add file → Upload files** → drag in everything *inside* the folder → **Commit changes**.
   - Or with git:
     ```bash
     cd portfolio-…               # the unzipped folder
     git init && git add . && git commit -m "Portfolio"
     git branch -M main
     git remote add origin https://github.com/yourusername/yourusername.github.io.git
     git push -u origin main
     ```
3. **Turn on Pages:** repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
4. Wait about a minute, then open the URL shown at the top of that page. The **Actions** tab shows the deploy progress.
5. **Update the URLs** in `index.html` (`canonical`, `og:url`, `og:image`), `robots.txt` and `sitemap.xml` to your real address, e.g. `https://yourusername.github.io/`. For a project site, include the folder: `https://yourusername.github.io/portfolio/`.

**Good to know on GitHub Pages**
- **`.nojekyll`**: an empty file that tells GitHub "don't run Jekyll, just serve the files". It's included. On a Mac, files starting with a dot are hidden in Finder (press <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd> to show them) and drag-and-drop can skip them. If it's missing in your repo, use **Add file → Create new file**, name it `.nojekyll`, and commit it empty.
- **`_headers` and `vercel.json` are ignored** (they're for Netlify, Cloudflare and Vercel). They're harmless, so you can leave them in. GitHub Pages doesn't support custom security headers.
- **Updates:** edit `data/portfolio.json` on GitHub (pencil icon) or push. The site rebuilds in about a minute. GitHub caches files for up to 10 minutes, so hard-refresh (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>) if you don't see a change.
- **Custom domain** (e.g. `yourname.dev`): **Settings → Pages → Custom domain**, then add the DNS records GitHub shows you and tick **Enforce HTTPS**. GitHub adds a `CNAME` file to the repo. Keep it.
- **404 page** works on both user and project sites. It finds the home folder by itself.
- **File names are case-sensitive** on GitHub Pages: `Me.JPG` and `me.jpg` are different files. Keep everything lowercase.

### Other hosts


- **Netlify:** drag the folder onto app.netlify.com/drop. Or connect a GitHub repo: empty build command, publish directory `.`.
- **Vercel:** Add New → Project → import the repo → Framework preset **Other** → empty build command → Deploy.
- **Cloudflare Pages:** Workers & Pages → Create → Pages → upload the folder or connect Git (preset **None**, output directory `/`).
- **Custom domain:** in the host's dashboard, open Domains → add your domain → follow the DNS steps. HTTPS is automatic.

Each founder gets their own repo and site, e.g. `yourname.agileinterface.com` or `yourname.dev`.

---

## 7. Before you launch

- [ ] Every `[bracket]` and `[X]` in `portfolio.json` replaced, or the line removed.
- [ ] Photo in `assets/img/`, CV in `assets/cv/` (or both set to `""`).
- [ ] `index.html`: title, description, `og:` tags and `yourdomain.com` updated. Same for `robots.txt`, `sitemap.xml` and `site.webmanifest`.
- [ ] Your own `og-image-1200x630.png`.
- [ ] Tried on a real phone in both themes. Typed `help` in the terminal and clicked every link.
- [ ] Chrome DevTools → Lighthouse: aim for green.

---

## 8. How it works (2-minute version)

- **Data → UI:** `main.js` fetches the JSON and passes it to `render.js`. Each panel is a function that takes the data and returns HTML, the same idea as a `@Composable`. Every value goes through `esc()` and every link through `safeUrl()`, so a stray `<` or a `javascript:` link in the JSON can't break the page or inject code.
- **Routing:** the open file lives in the URL hash (`#projects`). Clicking a file only changes the hash, and `router.js` listens for `hashchange`. That means the back button works, and you can share `yourdomain.com/#contact` directly. It's the same idea as a NavHost route.
- **Theme:** colours are CSS variables (`var(--fg)`) defined per theme in `tokens.css`, like `MaterialTheme.colorScheme`. A tiny script in `<head>` applies the saved choice before the first paint, so there's no flash.
- **Accent:** `utils.js → applyAccent()` turns your hex into CSS variables. It also computes a readable text colour on top of it and a lighter version for dark backgrounds.
- **Motion:** pure CSS. It all switches off for visitors who turn on "reduce motion" in their OS.

---

Fonts: Space Grotesk and Space Mono, © their authors, SIL Open Font License 1.1 (licences in `assets/fonts/`).
