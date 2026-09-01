# chronomicron.github.io

**Live site:** [https://chronomicron.github.io](https://chronomicron.github.io)  
**Domain:** [https://chronomicron.com](https://chronomicron.com) *(when DNS is pointed at GitHub Pages)*

Personal digital profile and résumé site for **Robert Grou-Szabo** — electrical engineer focused on hardware, firmware, ASIC/FPGA, and VLSI for computer vision and video processing.

This repository is the source for a static site hosted with **GitHub Pages**. Content is kept separate from presentation so pages can be updated without redesigning the whole site.

---

## What this site is

A multi-section profile aimed at:

- Recruiters and hiring managers (experience, education, publications, skills)
- Technical collaborators (projects, tools, GitHub)
- Anyone curious about background and interests

Visitors can switch **language** (English, French, Japanese), **theme** (light / dark / system), and browse by top-level mode with a contextual left menu.

---

## Features

| Feature | Description |
|--------|-------------|
| **Top navigation modes** | Profile / Resume, Projects, Personal, Contact |
| **Left sidebar** | Section list for the active mode (with nested Skills items) |
| **Markdown content** | Page text lives in `.md` files under `en/`, `fr/`, `ja/` |
| **Three languages** | Full UI + content in English, French, and Japanese |
| **Auto language** | First visit follows the browser language; manual choice is remembered |
| **Light / dark theme** | Follows system preference or manual toggle; preference saved |
| **Responsive layout** | Hamburger menu and horizontal section chips on small screens |
| **Collapsible experience** | “Read more” blocks for longer job descriptions |
| **Organization logos** | Small icons next to schools, employers, and verification links |
| **Background images** | Optional semi-transparent technical/photo backgrounds per visit |
| **Custom cursor** | Optional rocket pointer (with press state) |
| **Downloadable résumés** | PDF résumés under `assets/resume/` (EN / FR / JA) |
| **Email without plain-text harvesting** | Contact address assembled in JavaScript |
| **Analytics** | Statcounter (invisible) on the main page |

---

## Repository layout

```text
chronomicron.github.io/
├── index.html              # Shell: top bar, sidebar, content pane
├── css/style.css           # Layout, themes, responsive rules
├── js/main.js              # Navigation, Markdown loading, i18n, theme
├── en/  fr/  ja/           # Content by language (same folder structure)
│   ├── about/
│   ├── academic/
│   ├── contact/
│   ├── experience/
│   ├── personal_interests/
│   ├── projects/
│   ├── publications/
│   └── skills/
├── assets/
│   ├── background/         # Optional page backgrounds
│   ├── icons/              # Organization logos (e.g. alpha/)
│   ├── publications/       # Paper PDFs
│   └── resume/             # Downloadable résumé PDFs
├── favicon*.png / .ico
└── README.md
```

Content is edited as Markdown; the site loads and renders it in the browser (Marked.js). Shared media stays under `assets/`.

---

## Local preview

From the repository root:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

Use a hard refresh or a private window if CSS/JS changes do not appear (caching).

---

## GitHub Pages

- Repo name: `chronomicron.github.io` (user site)
- Branch: `main`, site root published as Pages
- Custom domain optional via repository **Settings → Pages** and DNS at the domain registrar

---

## Résumé PDFs

Visual and text résumés are maintained separately (often as LaTeX sources outside the public phone-number workflow). Published PDFs for the website are stored in:

```text
assets/resume/
```

Examples: `Robert_Grou_Resume_en.pdf`, `_fr.pdf`, `_ja.pdf` — linked from About / Contact in each language.

---

## Privacy notes

- The public site does **not** include a phone number.
- Email on the Contact page is injected by script so it does not appear as a single plain string in the Markdown sources.
- Statcounter is used for basic traffic awareness; see their policies for data handling.

---

## License / use

Personal portfolio site. Content and branding are owned by the author unless otherwise noted. Third-party logos remain trademarks of their respective owners and are used here for identification only.
