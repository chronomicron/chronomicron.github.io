/*
  ============================================================
  FILE: js/main.js
  PURPOSE: Core application logic for the personal profile site.
  ROLE IN PROJECT:
    - Handles top navigation (high-level modes)
    - Builds the left sidebar menu according to the selected mode
    - Loads the correct Markdown file from /en/, /fr/, or /ja/
    - Converts Markdown to HTML using the Marked library
    - Updates the main content area
    - UI labels (top bar + sidebar) are translated via UI object

  NAVIGATION MODEL:
    Top bar buttons = modes (Profile/Resume, Projects, Personal, Contact)
    Left sidebar    = the actual pages that belong to that mode
  ============================================================
*/

// ---------- CONFIGURATION ----------
const LANG_KEY = "chronomicron-lang"; // "en" | "fr" | "ja"
let currentLang = "en";
let currentMode = "profile";
let currentPage = null;
let markdownLoadSequence = 0;
let activeExperienceCard = null;
let experiencePointerTrackingInstalled = false;
let activeAcademicCard = null;
let academicPointerTrackingInstalled = false;

/** Browser preference → en / fr / ja (first visit only if nothing stored) */
function detectBrowserLang() {
  const list = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || "en"];
  for (const raw of list) {
    const code = (raw || "").toLowerCase();
    if (code.startsWith("fr")) return "fr";
    if (code.startsWith("ja")) return "ja";
    if (code.startsWith("en")) return "en";
  }
  return "en";
}

function initLanguage() {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get("lang") || "").trim().toLowerCase().split(/[-_]/)[0];
  const stored = localStorage.getItem(LANG_KEY);
  if (requested && UI[requested]) {
    currentLang = requested;
    localStorage.setItem(LANG_KEY, currentLang);
  } else if (stored && UI[stored]) {
    currentLang = stored;
  } else {
    currentLang = detectBrowserLang();
    localStorage.setItem(LANG_KEY, currentLang);
  }
  document.documentElement.lang = currentLang === "ja" ? "ja" : currentLang;
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
}

// Set to true to show the millimeter graph-paper overlay
const SHOW_GRAPH_PAPER = false;

// Available background images (in /assets/background/)
const BACKGROUND_IMAGES = [
  "transceiver",
  "neural-network",
  "himeji-jo",
  "lagrange-point",
  "energy-levels"
];

/*
  UI strings shared by all languages (top bar, sidebar titles, item labels).
  When you translate Japanese content later, these labels are already ready.
*/
const UI = {
  en: {
    modes: {
      profile: "Profile / Resume",
      projects: "Projects",
      personal: "Personal",
      contact: "Contact"
    },
    pages: {
      about: "About",
      experience: "Experience",
      academic: "Academic",
      publications: "Publications",
      skills: "Skills",
      technical: "Technical",
      other: "Other",
      software: "Software Applications",
      hardware: "Hardware Applications",
      interests: "Personal Interests",
      contact: "Get in Touch"
    },
    menuOpen: "Open menu",
    menuClose: "Close menu",
    themeControl: {
      ariaLabel: "Change color theme",
      names: { system: "system", light: "light", dark: "dark" },
      systemTooltip: "Theme: system ({effective}) — click for light/dark",
      modeTooltip: "Theme: {theme} — click to cycle"
    },
    jaComingSoon: "Japanese version coming soon.",
    resumeLink: "↓ Resume PDF",
    resumeFile: "Robert_Grou_Resume_en.pdf",
    hero: {
      eyebrow: "Electrical Engineer · Builder · Curious about what’s next",
      titleMain: "Firmware / Hardware",
      titleAccent: "+ AI",
      lede: "I design systems from firmware and circuit boards down to ASICs—and I’m exploring how AI and agentic tools can help us build what comes next.",
      tagsLabel: "Areas of experience and interest",
      tagFirmware: "Firmware",
      tagHardware: "Hardware design",
      tagVision: "Computer Vision & Algorithms",
      tagAI: "AI & agents",
      explore: "Explore my background",
      resume: "View résumé",
      hardwareLabel: "HARDWARE",
      intelligenceLabel: "INTELLIGENCE",
      caption: "From silicon to intelligent systems"
    },
    profileVisual: {
      kicker: "ENGINEERING LAYERS",
      title: "From code to silicon",
      firmware: "Firmware",
      firmwareNote: "code meets the device",
      silicon: "ASIC / FPGA",
      siliconNote: "logic in silicon",
      intelligence: "Vision + AI",
      intelligenceNote: "systems that interpret",
      summary: "Ideas move through firmware, hardware, and intelligent systems.",
      signal: "Signal path active"
    },
    publication: {
      previewAlt: "Cropped preview of the first page of the paper: {title}"
    }
  },
  fr: {
    modes: {
      profile: "Profil / CV",
      projects: "Projets",
      personal: "Personnel",
      contact: "Contact"
    },
    pages: {
      about: "À propos",
      experience: "Expérience",
      academic: "Formation",
      publications: "Publications",
      skills: "Compétences",
      technical: "Techniques",
      other: "Autres",
      software: "Applications logicielles",
      hardware: "Applications matérielles",
      interests: "Intérêts personnels",
      contact: "Me joindre"
    },
    menuOpen: "Ouvrir le menu",
    menuClose: "Fermer le menu",
    themeControl: {
      ariaLabel: "Changer le thème de couleur",
      names: { system: "automatique", light: "clair", dark: "sombre" },
      systemTooltip: "Thème : automatique ({effective}) — cliquer pour alterner entre le clair et le sombre",
      modeTooltip: "Thème : {theme} — cliquer pour changer"
    },
    jaComingSoon: "La version japonaise sera disponible bientôt.",
    resumeLink: "↓ CV PDF",
    resumeFile: "Robert_Grou_Resume_fr.pdf",
    hero: {
      eyebrow: "Ingénieur électrique · Créateur · Curieux de la suite",
      titleMain: "Firmware / Matériel",
      titleAccent: "+ IA",
      lede: "Je conçois des systèmes, du firmware et des circuits imprimés jusqu’aux ASIC, et j’explore comment l’IA et les outils agentiques peuvent nous aider à construire la suite.",
      tagsLabel: "Domaines d’expérience et d’intérêt",
      tagFirmware: "Firmware",
      tagHardware: "Conception matérielle",
      tagVision: "Vision par ordinateur · algorithmes",
      tagAI: "IA et agents",
      explore: "Découvrir mon parcours",
      resume: "Voir mon CV",
      hardwareLabel: "MATÉRIEL",
      intelligenceLabel: "INTELLIGENCE",
      caption: "Du silicium aux systèmes intelligents"
    },
    profileVisual: {
      kicker: "COUCHES D’INGÉNIERIE",
      title: "Du code au silicium",
      firmware: "Firmware",
      firmwareNote: "le code rejoint l’appareil",
      silicon: "ASIC / FPGA",
      siliconNote: "logique dans le silicium",
      intelligence: "Vision + IA",
      intelligenceNote: "des systèmes qui interprètent",
      summary: "Les idées traversent le firmware, le matériel et les systèmes intelligents.",
      signal: "Trajet du signal actif"
    },
    publication: {
      previewAlt: "Aperçu recadré de la première page de l’article : {title}"
    }
  },
  ja: {
    modes: {
      profile: "プロフィール / 履歴書",
      projects: "プロジェクト",
      personal: "個人",
      contact: "連絡先"
    },
    pages: {
      about: "自己紹介",
      experience: "職歴",
      academic: "学歴",
      publications: "論文・発表",
      skills: "スキル",
      technical: "技術",
      other: "その他",
      software: "ソフトウェア",
      hardware: "ハードウェア",
      interests: "個人的な関心",
      contact: "お問い合わせ"
    },
    menuOpen: "メニューを開く",
    menuClose: "メニューを閉じる",
    themeControl: {
      ariaLabel: "配色テーマを変更",
      names: { system: "自動", light: "ライト", dark: "ダーク" },
      systemTooltip: "テーマ：自動（{effective}）—クリックしてライト／ダークを切り替え",
      modeTooltip: "テーマ：{theme} — クリックして切り替え"
    },
    jaComingSoon: "日本語版は近日公開予定です。",
    resumeLink: "↓ 履歴書 PDF",
    resumeFile: "Robert_Grou_Resume_jp.pdf",
    hero: {
      eyebrow: "電気エンジニア · ものづくり · 次の可能性に関心",
      titleMain: "ファームウェア / ハードウェア",
      titleAccent: "+ AI",
      lede: "ファームウェアや回路基板からASICまで、幅広いシステムを設計しています。AIやエージェント型ツールが、これからのものづくりにどう役立つかも探っています。",
      tagsLabel: "経験分野と関心分野",
      tagFirmware: "ファームウェア",
      tagHardware: "ハードウェア設計",
      tagVision: "コンピュータビジョン・アルゴリズム",
      tagAI: "AI・エージェント",
      explore: "経歴を見る",
      resume: "履歴書を見る",
      hardwareLabel: "ハードウェア",
      intelligenceLabel: "インテリジェンス",
      caption: "シリコンから知能システムへ"
    },
    profileVisual: {
      kicker: "エンジニアリングの層",
      title: "コードからシリコンへ",
      firmware: "ファームウェア",
      firmwareNote: "機器を動かすコード",
      silicon: "ASIC / FPGA",
      siliconNote: "シリコン上の論理回路",
      intelligence: "Vision + AI",
      intelligenceNote: "理解するシステム",
      summary: "ファームウェア、ハードウェア、知能システムへとアイデアを形にします。",
      signal: "信号経路が動作中"
    },
    publication: {
      previewAlt: "論文「{title}」の1ページ目を切り取ったプレビュー"
    }
  }
};

/*
  Navigation structure – ids and file paths only.
  Display labels come from UI[currentLang].
*/
const navigation = {
  profile: {
    modeKey: "profile",
    items: [
      { id: "about",        file: "about/index.md" },
      { id: "experience",   file: "experience/index.md" },
      { id: "academic",     file: "academic/index.md" },
      { id: "publications", file: "publications/index.md" },
      {
        id: "skills",
        file: "skills/index.md",
        children: [
          { id: "technical", file: "skills/technical.md" },
          { id: "other",     file: "skills/other.md" }
        ]
      }
    ]
  },
  projects: {
    modeKey: "projects",
    items: [
      { id: "software", file: "projects/software.md" },
      { id: "hardware", file: "projects/hardware.md" }
    ]
  },
  personal: {
    modeKey: "personal",
    items: [
      { id: "interests", file: "personal_interests/index.md" }
    ]
  },
  contact: {
    modeKey: "contact",
    items: [
      { id: "contact", file: "contact/index.md" }
    ]
  }
};

function t() {
  return UI[currentLang] || UI.en;
}

function pageLabel(id) {
  return t().pages[id] || id;
}

function modeLabel(modeId) {
  return t().modes[modeId] || modeId;
}

// ---------- THEME (light / dark / system) ----------
const THEME_KEY = "chronomicron-theme"; // "light" | "dark" | "system"

function getStoredTheme() {
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "dark";
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply theme: system follows OS; light/dark force a mode */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggleLabel(theme);
}

function updateThemeToggleLabel(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const effective = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
  const copy = t().themeControl;
  // Show the action: click to switch toward the other mode
  btn.textContent = effective === "dark" ? "☀" : "◐";
  btn.title = theme === "system"
    ? copy.systemTooltip.replace("{effective}", copy.names[effective])
    : copy.modeTooltip.replace("{theme}", copy.names[theme]);
  btn.setAttribute("aria-label", copy.ariaLabel);
}

function cycleTheme() {
  const order = ["system", "light", "dark"];
  const current = getStoredTheme();
  const next = order[(order.indexOf(current) + 1) % order.length];
  applyTheme(next);
}

function initSciFiCursor() {
  if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;

  const cursor = document.createElement("div");
  cursor.className = "scifi-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = `
    <span class="scifi-orbit-speck"></span>
    <img class="scifi-cursor-pointer scifi-cursor-pointer--idle" src="/assets/pointer/scifi-pointer.svg" alt="">
    <img class="scifi-cursor-pointer scifi-cursor-pointer--click" src="/assets/pointer/scifi-pointer-click.svg" alt="">
  `;
  document.body.append(cursor);

  let framePending = false;
  let pointerX = 0;
  let pointerY = 0;
  const moveCursor = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    pointerX = event.clientX - 2;
    pointerY = event.clientY - 1;
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
      cursor.classList.add("is-visible");
      framePending = false;
    });
  };

  document.addEventListener("pointermove", moveCursor, { passive: true });
  document.addEventListener("pointerover", (event) => {
    cursor.classList.toggle("is-over-text", Boolean(event.target.closest?.("input, textarea, [contenteditable='true']")));
  });
  document.addEventListener("pointerout", (event) => {
    if (event.relatedTarget == null) cursor.classList.remove("is-visible");
  });
  document.documentElement.classList.add("has-sci-fi-cursor");
}

// ---------- INITIALISATION ----------
document.addEventListener("DOMContentLoaded", () => {
  initSciFiCursor();
  // Restore theme before paint-heavy UI work
  applyTheme(getStoredTheme());
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", cycleTheme);
  }
  // If user chose "system", update icon when OS theme changes
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getStoredTheme() === "system") updateThemeToggleLabel("system");
    });
  }

  // Language: saved choice, or browser preference on first visit
  initLanguage();
  updateTopNavOffset();
  window.addEventListener("resize", updateTopNavOffset);

  // Sci-fi cursor: switch to its bright pulse state while the mouse is pressed.
  document.addEventListener("mousedown", () => {
    document.documentElement.classList.add("cursor-pressed");
  });
  document.addEventListener("mouseup", () => {
    document.documentElement.classList.remove("cursor-pressed");
  });
  document.addEventListener("mouseleave", () => {
    document.documentElement.classList.remove("cursor-pressed");
  });
  window.addEventListener("blur", () => {
    document.documentElement.classList.remove("cursor-pressed");
  });

  // Top navigation (modes)
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
      closeMobileMenu();
      enterSite();
    });
  });

  // Clicking the name returns to the opening hero.
  document.querySelector(".nav-brand a").addEventListener("click", (e) => {
    e.preventDefault();
    switchMode("profile");
    closeMobileMenu();
    returnToHero();
  });

  // Both hero navigation cues enter the Profile / About view.
  document.querySelectorAll('a[href="#main-layout"]').forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      switchMode("profile");
      enterSite();
    });
  });

  // Hamburger toggle (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const topNav = document.getElementById("top-nav");
      const open = topNav.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? t().menuClose : t().menuOpen);
      requestAnimationFrame(updateTopNavOffset);
    });
  }

  // Language switcher (manual choice is remembered)
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (!UI[lang]) return;

      currentLang = lang;
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.lang = lang === "ja" ? "ja" : lang;
      const url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

      document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Update all chrome labels, then reload content
      updateChromeLabels();
      buildSidebar(currentMode);
      if (currentPage) loadPage(currentPage);
    });
  });

  // Start on Profile / Resume → About
  updateChromeLabels();
  switchMode("profile");
});

/** Keep the hero and profile content below the fixed header, including on mobile. */
function updateTopNavOffset() {
  const topNav = document.getElementById("top-nav");
  if (!topNav) return;
  document.documentElement.style.setProperty("--topnav-offset", `${topNav.getBoundingClientRect().height}px`);
}

/** Reveal the selected site section by sliding the opening hero away. */
function enterSite() {
  const hero = document.querySelector(".hero");
  const mainLayout = document.getElementById("main-layout");
  updateTopNavOffset();
  document.body.classList.add("site-entered");
  hero.inert = true;
  hero.setAttribute("aria-hidden", "true");
  mainLayout.inert = false;
  mainLayout.removeAttribute("aria-hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
  document.getElementById("sidebar-title").focus({ preventScroll: true });
}

/** Return to the hero and reset the profile view for the next entry. */
function returnToHero() {
  const hero = document.querySelector(".hero");
  const mainLayout = document.getElementById("main-layout");
  updateTopNavOffset();
  hero.inert = false;
  hero.removeAttribute("aria-hidden");
  mainLayout.inert = true;
  mainLayout.setAttribute("aria-hidden", "true");
  document.body.classList.remove("site-entered");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Update top-bar mode button labels for the current language */
function updateChromeLabels() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    const mode = btn.dataset.mode;
    btn.textContent = modeLabel(mode);
  });

  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle && !document.getElementById("top-nav").classList.contains("menu-open")) {
    menuToggle.setAttribute("aria-label", t().menuOpen);
  }

  updateThemeToggleLabel(getStoredTheme());
  updateHeroTranslations();
}

/** Update static hero and profile-visual labels for the selected language. */
function updateHeroTranslations() {
  const strings = t();
  const getString = key => key.split(".").reduce((value, part) => value && value[part], strings);

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = getString(element.dataset.i18n);
    if (typeof value === "string") element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
    const value = getString(element.dataset.i18nAriaLabel);
    if (typeof value === "string") element.setAttribute("aria-label", value);
  });

  const resumePath = `/assets/resume/${strings.resumeFile}`;
  [document.getElementById("nav-resume"), document.getElementById("hero-resume")]
    .filter(Boolean)
    .forEach(link => { link.href = resumePath; });
}

/** Close the mobile hamburger menu */
function closeMobileMenu() {
  const topNav = document.getElementById("top-nav");
  const menuToggle = document.getElementById("menu-toggle");
  if (topNav) topNav.classList.remove("menu-open");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", t().menuOpen);
  }
}

// ---------- MODE SWITCHING ----------
function switchMode(modeId) {
  currentMode = modeId;
  currentPage = null;
  document.getElementById("main-layout").dataset.mode = modeId;

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === modeId);
  });

  setBackgroundForMode(modeId);
  buildSidebar(modeId);

  const mode = navigation[modeId];
  if (mode && mode.items.length > 0) {
    loadPage(mode.items[0].id);
  }
}

function setBackgroundForMode(modeId) {
  const content = document.getElementById("content");
  if (!content) return;

  const bg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  content.setAttribute("data-bg", bg);
  content.classList.toggle("show-graph-paper", SHOW_GRAPH_PAPER);
}

/**
 * Builds the left sidebar menu for the given mode.
 * Supports one level of children (e.g. Skills → Technical / Other).
 */
function buildSidebar(modeId) {
  const mode = navigation[modeId];
  const menuEl = document.getElementById("sidebar-menu");
  const titleEl = document.getElementById("sidebar-title");

  titleEl.textContent = modeLabel(modeId);
  menuEl.innerHTML = "";

  mode.items.forEach(item => {
    menuEl.appendChild(createSidebarItem(item, false));

    if (item.children && item.children.length) {
      item.children.forEach(child => {
        menuEl.appendChild(createSidebarItem(child, true));
      });
    }
  });
}

function createSidebarItem(item, isChild) {
  const li = document.createElement("li");
  if (isChild) li.className = "sidebar-child";

  const btn = document.createElement("button");
  btn.className = "sidebar-btn" + (isChild ? " sidebar-btn-child" : "");
  btn.textContent = pageLabel(item.id);
  btn.dataset.page = item.id;

  btn.addEventListener("click", () => {
    loadPage(item.id);
  });

  li.appendChild(btn);
  return li;
}

function findNavItem(pageId) {
  const mode = navigation[currentMode];
  if (!mode) return null;

  for (const item of mode.items) {
    if (item.id === pageId) return item;
    if (item.children) {
      const child = item.children.find(c => c.id === pageId);
      if (child) return child;
    }
  }
  return null;
}

function loadPage(pageId) {
  currentPage = pageId;

  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  const item = findNavItem(pageId);
  if (!item) return;

  // Dynamic browser tab title, e.g. "About — Robert Grou-Szabo"
  document.title = pageLabel(pageId) + " — Robert Grou-Szabo";

  const mdPath = `${currentLang}/${item.file}`;
  loadMarkdown(mdPath, pageId);
}

/** Group each work-history entry so CSS can present it as an animated timeline. */
function buildExperienceTimeline(contentBody) {
  const firstHeading = contentBody.querySelector("h2");
  if (!firstHeading) return;

  const timeline = document.createElement("div");
  timeline.className = "experience-timeline";
  firstHeading.before(timeline);

  let node = firstHeading;
  let entry = null;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") {
      entry = document.createElement("article");
      entry.className = "experience-entry";
      timeline.appendChild(entry);
    }
    (entry || timeline).appendChild(node);
    node = next;
  }

  [...timeline.querySelectorAll(".experience-entry")].forEach((card, index) => {
    const isLeftCard = index % 2 === 0;
    card.classList.add(isLeftCard ? "experience-entry-left" : "experience-entry-right");
  });

  installExperiencePointerTracking();
}

/** Present education as credential cards and a separate awards panel. */
function buildAcademicLayout(contentBody) {
  const firstHeading = contentBody.querySelector("h2");
  if (!firstHeading) return;

  const layout = document.createElement("div");
  layout.className = "academic-layout";
  const degrees = document.createElement("div");
  degrees.className = "academic-degrees";
  const awards = document.createElement("section");
  awards.className = "academic-awards";
  firstHeading.before(layout);

  let node = firstHeading;
  let section = null;
  let degreeCount = 0;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") {
      const isAwardsSection = node.nextElementSibling?.tagName === "UL";
      if (isAwardsSection) {
        section = awards;
      } else {
        section = document.createElement("article");
        section.className = "academic-degree";
        section.classList.add(degreeCount < 2 ? "academic-degree-advanced" : "academic-degree-compact");
        section.style.setProperty("--academic-delay", `${Math.min(degreeCount * 90, 360)}ms`);
        degreeCount += 1;
        degrees.appendChild(section);
      }
      section.appendChild(node);
    } else if (section) {
      section.appendChild(node);
    }
    node = next;
  }

  degrees.querySelectorAll(":scope > .academic-degree").forEach(degree => {
    const institution = degree.querySelector(":scope > p");
    institution?.classList.add("academic-institution");

    degree.querySelectorAll(":scope > p").forEach(paragraph => {
      const label = paragraph.querySelector("strong")?.textContent?.trim() || "";
      if (/^(thesis|thèse|論文題目)/i.test(label)) {
        paragraph.classList.add("academic-thesis");
      }
    });
  });

  layout.append(degrees);
  if (awards.childElementCount) layout.append(awards);
  installAcademicPointerTracking();
}

/** Make the Skills landing page category cards navigable and add an animated circuit map. */
function buildSkillsLandingVisual(contentBody) {
  const heading = contentBody.querySelector("h1");
  if (!heading) return;

  const overview = document.createElement("section");
  overview.className = "skills-overview";
  overview.setAttribute("aria-label", ({
    en: "Skills overview",
    fr: "Aperçu des compétences",
    ja: "スキルの概要"
  })[currentLang] || "Skills overview");
  heading.after(overview);
  while (overview.nextSibling) overview.appendChild(overview.nextSibling);

  const categories = overview.querySelector("ul");
  if (categories) {
    categories.classList.add("skills-category-grid");
    [...categories.children].filter(category => category.tagName === "LI").forEach((category, index) => {
      const card = document.createElement("button");
      const pageId = index === 0 ? "technical" : "other";
      card.type = "button";
      card.className = "skills-category-card";
      card.dataset.page = pageId;
      card.append(...category.childNodes);
      card.addEventListener("click", () => loadPage(pageId));
      category.replaceChildren(card);
    });
  }

  const visual = document.createElement("div");
  visual.className = "skills-signal-art";
  visual.setAttribute("aria-hidden", "true");
  visual.innerHTML = `
    <svg viewBox="0 0 820 250" role="presentation" focusable="false">
      <defs>
        <linearGradient id="skills-signal-gradient" x1="0" x2="1">
          <stop offset="0" stop-color="var(--color-primary)" stop-opacity=".18" />
          <stop offset=".5" stop-color="var(--color-primary)" />
          <stop offset="1" stop-color="#a78bfa" />
        </linearGradient>
        <radialGradient id="skills-chip-glow">
          <stop offset="0" stop-color="var(--color-primary)" stop-opacity=".22" />
          <stop offset="1" stop-color="var(--color-primary)" stop-opacity="0" />
        </radialGradient>
        <symbol id="skills-microchip" viewBox="-32 -31 64 62">
          <path d="M-12-28v9m12-9v9m12-9v9m-12 38v9m12-9v9m12-9v9m-42-39h9m-9 12h9m-9 12h9m33-24h9m-9 12h9m-9 12h9" fill="none" stroke="var(--color-primary)" stroke-width="1.8" stroke-linecap="round" />
          <rect x="-19" y="-19" width="38" height="38" rx="5" fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="1.5" />
          <rect x="-12" y="-12" width="24" height="24" rx="3" fill="var(--color-bg)" stroke="var(--color-primary)" stroke-opacity=".7" />
          <path d="M-7-5h5v-3h7v7H0v6h7" fill="none" stroke="var(--color-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="-5" cy="5" r="1.7" fill="var(--color-primary)" />
        </symbol>
      </defs>
      <g class="skills-io-input">
        <rect class="skills-io-box" x="12" y="78" width="112" height="60" rx="8" />
        <text class="skills-io-label" x="68" y="103" text-anchor="middle"><tspan></tspan><tspan x="68" dy="15"></tspan></text>
      </g>
      <g class="skills-io-output">
        <rect class="skills-io-box" x="696" y="78" width="112" height="60" rx="8" />
        <text class="skills-io-label" x="752" y="103" text-anchor="middle"><tspan></tspan><tspan x="752" dy="15"></tspan></text>
      </g>
      <path id="skills-wire-input-a" class="skills-wire-base" d="M124 96h15" />
      <path id="skills-wire-input-b" class="skills-wire-base" d="M124 108h15" />
      <path id="skills-wire-input-c" class="skills-wire-base" d="M124 120h15" />
      <path id="skills-wire-ab" class="skills-wire-base" d="M193 108h25V69h30" />
      <path id="skills-wire-ac" class="skills-wire-base" d="M193 108h25v50h30" />
      <path id="skills-wire-bd" class="skills-wire-base" d="M302 69h55" />
      <path id="skills-wire-cd" class="skills-wire-base" d="M302 158h25V81h30" />
      <path id="skills-wire-ce" class="skills-wire-base" d="M302 158h55" />
      <path id="skills-wire-df" class="skills-wire-base" d="M411 69h24v27h31" />
      <path id="skills-wire-ef" class="skills-wire-base" d="M411 158h24v-38h31" />
      <path id="skills-wire-fg" class="skills-wire-base" d="M520 108h55" />
      <path id="skills-wire-dg" class="skills-wire-base" d="M411 69h130v27h34" />
      <path id="skills-wire-output" class="skills-wire-base" d="M629 108h50v-20h17m-17 20h17m-17 0v20h17" />
      <path class="skills-wire-flow" d="M124 96h15M124 108h15M124 120h15M193 108h25V69h30M193 108h25v50h30M302 69h55M302 158h25V81h30M302 158h55M411 69h24v27h31M411 158h24v-38h31M520 108h55M411 69h130v27h34M629 108h50v-20h17m-17 20h17m-17 0v20h17" />
      <g class="skills-circuit-junctions">
        <circle cx="98" cy="78" r="3" /><circle cx="98" cy="138" r="3" /><circle cx="218" cy="108" r="3" />
        <circle cx="327" cy="158" r="3" /><circle cx="435" cy="69" r="3" /><circle cx="435" cy="158" r="3" />
        <circle cx="541" cy="69" r="3" /><circle cx="679" cy="88" r="3" /><circle cx="679" cy="128" r="3" />
      </g>
      <g class="skills-signal-travel" aria-hidden="true">
        <circle r="3"><animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#skills-wire-input-a" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.7s" begin="-.8s" repeatCount="indefinite"><mpath href="#skills-wire-ab" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.9s" begin="-.4s" repeatCount="indefinite"><mpath href="#skills-wire-ac" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.6s" begin="-1.1s" repeatCount="indefinite"><mpath href="#skills-wire-bd" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="3s" begin="-.7s" repeatCount="indefinite"><mpath href="#skills-wire-cd" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.8s" begin="-1.3s" repeatCount="indefinite"><mpath href="#skills-wire-ef" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.5s" begin="-.5s" repeatCount="indefinite"><mpath href="#skills-wire-fg" /></animateMotion></circle>
        <circle r="3"><animateMotion dur="2.7s" begin="-1.5s" repeatCount="indefinite"><mpath href="#skills-wire-output" /></animateMotion></circle>
      </g>
      <circle class="skills-chip-aura" cx="384" cy="113" r="128" />
      <g class="skills-chip-network">
        <use href="#skills-microchip" x="134" y="77" width="64" height="62" />
        <use href="#skills-microchip" x="243" y="38" width="64" height="62" />
        <use href="#skills-microchip" x="243" y="127" width="64" height="62" />
        <use href="#skills-microchip" x="352" y="38" width="64" height="62" />
        <use href="#skills-microchip" x="352" y="127" width="64" height="62" />
        <use href="#skills-microchip" x="461" y="77" width="64" height="62" />
        <use href="#skills-microchip" x="570" y="77" width="64" height="62" />
      </g>
    </svg>`;

  const flowLabels = ({
    en: [["YOUR", "SPECIFICATIONS"], ["YOUR", "APPLICATION"]],
    fr: [["VOS", "SPÉCIFICATIONS"], ["VOTRE", "APPLICATION"]],
    ja: [["仕様", "入力"], ["アプリケーション", "出力"]]
  })[currentLang] || [["YOUR", "SPECIFICATIONS"], ["YOUR", "APPLICATION"]];
  visual.querySelectorAll(".skills-io-input tspan").forEach((line, index) => {
    line.textContent = flowLabels[0][index];
  });
  visual.querySelectorAll(".skills-io-output tspan").forEach((line, index) => {
    line.textContent = flowLabels[1][index];
  });
  overview.appendChild(visual);
}

/** Reframe technical skill lists as a layered engineering stack. */
function buildTechnicalSkillsMap(contentBody) {
  const heading = contentBody.querySelector("h1");
  if (!heading) return;

  const map = document.createElement("div");
  map.className = "technical-stack-map";
  const kicker = document.createElement("p");
  kicker.className = "technical-stack-kicker";
  kicker.textContent = ({
    en: "ENGINEERING SYSTEM STACK",
    fr: "COUCHES DE L’INGÉNIERIE",
    ja: "エンジニアリング・スタック"
  })[currentLang] || "ENGINEERING SYSTEM STACK";
  const core = document.createElement("div");
  core.className = "technical-stack-core";
  const support = document.createElement("div");
  support.className = "technical-stack-support";
  const layers = [];
  let currentLayer = null;
  let node = heading.nextSibling;

  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") {
      currentLayer = document.createElement("section");
      currentLayer.className = "technical-stack-layer";
      currentLayer.appendChild(node);
      layers.push(currentLayer);
    } else if (currentLayer) {
      currentLayer.appendChild(node);
    }
    node = next;
  }

  layers.forEach((layer, index) => {
    const layerHeading = layer.querySelector("h2");
    const list = layer.querySelector("ul");
    if (list) {
      list.classList.add("technical-skill-chips");
      list.querySelectorAll(":scope > li").forEach(item => {
        const text = item.textContent.trim();
        const prefix = emphasizedSkillPrefix(text);
        if (!prefix) return;

        const emphasis = document.createElement("strong");
        emphasis.className = "technical-skill-emphasis";
        emphasis.textContent = prefix;
        item.replaceChildren(emphasis, document.createTextNode(text.slice(prefix.length)));
      });
    }

    if (index < 3) {
      layer.classList.add("technical-stack-layer-core");
      layer.dataset.layer = String(index + 1).padStart(2, "0");
      if (layerHeading) {
        const indexLabel = document.createElement("span");
        indexLabel.className = "technical-layer-index";
        indexLabel.setAttribute("aria-hidden", "true");
        indexLabel.textContent = layer.dataset.layer;
        layerHeading.prepend(indexLabel);
      }
      core.appendChild(layer);
    } else if (index < 5) {
      layer.classList.add("technical-stack-layer-support");
      support.appendChild(layer);
    } else {
      layer.classList.add("technical-stack-layer-learning");
      support.appendChild(layer);
    }
  });

  map.append(kicker, core, support);
  heading.after(map);
}

function emphasizedSkillPrefix(text) {
  if (/^C\s*\/\s*C\+\+/i.test(text)) return text.match(/^C\s*\/\s*C\+\+/i)[0];

  const label = text.match(/^(.{1,36}?[:：])/u);
  if (label) return label[1];

  const parenthetical = text.search(/[（(]/u);
  if (parenthetical > 0 && parenthetical <= 42) return text.slice(0, parenthetical).trim();

  const separator = text.search(/[,，/／]/u);
  if (separator >= 3 && separator <= 42) return text.slice(0, separator).trim();

  const words = text.match(/^\S+(?:\s+\S+)?/u);
  if (words) return words[0];

  return Array.from(text).slice(0, Math.min(7, Array.from(text).length)).join("");
}

/** Present non-technical skills and interests as independent personal profile cards. */
function buildOtherSkillsMosaic(contentBody) {
  const heading = contentBody.querySelector("h1");
  if (!heading) return;

  const mosaic = document.createElement("section");
  mosaic.className = "other-interests-mosaic";
  mosaic.setAttribute("aria-label", ({
    en: "Other skills and interests",
    fr: "Autres compétences et intérêts",
    ja: "その他のスキルと関心"
  })[currentLang] || "Other skills and interests");

  const kicker = document.createElement("p");
  kicker.className = "other-interests-kicker";
  kicker.textContent = ({
    en: "PERSONAL INTERESTS · PRACTICAL SKILLS · CURIOSITY",
    fr: "INTÉRÊTS PERSONNELS · SAVOIR-FAIRE · CURIOSITÉ",
    ja: "個人的な関心 · 実践的な技能 · 好奇心"
  })[currentLang] || "PERSONAL INTERESTS · PRACTICAL SKILLS · CURIOSITY";
  mosaic.appendChild(kicker);

  const markers = ["A/あ", "ID", "FERM", "FIX", "OUT", "ART", "READ", "HOME", "C64", "20+", "AI"];
  const categories = ["languages", "mobility", "food", "hands-on", "outdoors", "creative", "reading", "lifestyle", "gaming", "travel", "ai"];
  const pictograms = {
    languages: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.2 5.3 3.2 8.5s-.9 6.1-3.2 8.5m0-17c-2.3 2.4-3.2 5.3-3.2 8.5s.9 6.1 3.2 8.5M5.3 7.5h13.4m-13.4 9h13.4"/>',
    mobility: '<path d="M4 14l1.5-5h13L20 14v5h-2v-2H6v2H4zM7 9l1.5-3h7L17 9"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/>',
    food: '<path d="M4 11h16l-1.7 7H5.7L4 11zM3 20h18M8 8c-1.2-1.3 1.2-2 0-3m4 3c-1.2-1.3 1.2-2 0-3m4 3c-1.2-1.3 1.2-2 0-3"/>',
    "hands-on": '<path d="M14.5 6.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8L6.7 4.1a4 4 0 0 0 5 5l7.5 7.5a2 2 0 0 1-2.8 2.8l-7.5-7.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8"/>',
    outdoors: '<path d="M3 19l6-10 4 6 3-4 5 8H3zM9 9l2-3 2 3m4-1V4m-2 2h4"/>',
    creative: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/><path d="M6.5 10h.1"/>',
    reading: '<path d="M12 7c-2.2-2-5-2.5-8-1.5v13c3-.9 5.8-.4 8 1.5 2.2-1.9 5-2.4 8-1.5v-13c-3-1-5.8-.5-8 1.5zM12 7v13"/>',
    lifestyle: '<path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5M9 20v-6h6v6"/>',
    gaming: '<path d="M7 8h10a4 4 0 0 1 3.8 5l-1 3a2 2 0 0 1-3.2 1l-2.2-1.7h-4.8L7.4 17a2 2 0 0 1-3.2-1l-1-3A4 4 0 0 1 7 8zM7 11v4m-2-2h4m7-1h.1m2 2h.1"/>',
    travel: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.2"/><path d="M3 20h4m10 0h4"/>',
    ai: '<circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="6" r="1.6"/><circle cx="5" cy="18" r="1.6"/><circle cx="19" cy="18" r="1.6"/><path d="M7 7l3.2 3.3m6.8-3.3l-3.2 3.3M7 17l3.2-3.3m6.8 3.3l-3.2-3.3"/>'
  };
  let currentCard = null;
  let node = heading.nextSibling;
  let index = -1;

  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") {
      index += 1;
      currentCard = document.createElement("article");
      currentCard.className = `other-interest-card other-interest-${categories[index] || "extra"}`;
      currentCard.dataset.category = categories[index] || "extra";

      const marker = document.createElement("span");
      marker.className = "other-interest-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = markers[index] || "•";
      const title = document.createElement("span");
      title.className = "other-interest-title";
      title.textContent = node.textContent.trim();
      const pictogram = document.createElement("span");
      pictogram.className = "other-interest-pictogram";
      pictogram.setAttribute("aria-hidden", "true");
      pictogram.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${pictograms[categories[index]] || ""}</svg>`;
      node.replaceChildren(marker, title, pictogram);

      currentCard.appendChild(node);
      mosaic.appendChild(currentCard);
    } else if (currentCard) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "UL") {
        node.classList.add("other-interest-items");
      }
      currentCard.appendChild(node);
    }
    node = next;
  }

  heading.after(mosaic);
}

/** Turn the Personal Interests page into an interactive connected bubble tree. */
function buildPersonalInterestTree(contentBody) {
  const heading = contentBody.querySelector("h1");
  if (!heading) return;

  const tree = document.createElement("section");
  tree.className = "personal-interest-tree";
  tree.setAttribute("aria-label", ({
    en: "Explore personal interests by category",
    fr: "Découvrir les intérêts personnels par catégorie",
    ja: "カテゴリ別に個人的な関心を紹介"
  })[currentLang] || "Explore personal interests by category");

  const kicker = document.createElement("p");
  kicker.className = "interest-tree-kicker";
  kicker.textContent = ({
    en: "A FEW THINGS I LIKE TO LEARN, MAKE, AND EXPLORE",
    fr: "QUELQUES SUJETS QUE J’AIME APPRENDRE, CRÉER ET EXPLORER",
    ja: "学び、つくり、探求すること"
  })[currentLang] || "A FEW THINGS I LIKE TO LEARN, MAKE, AND EXPLORE";

  const canvas = document.createElement("div");
  canvas.className = "interest-tree-canvas";
  canvas.innerHTML = `
    <svg class="interest-tree-wires" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M500 350 C500 270 500 185 500 96" />
      <path d="M500 350 C590 280 690 220 780 175" />
      <path d="M500 350 C610 390 700 470 800 505" />
      <path d="M500 350 C540 450 560 540 580 615" />
      <path d="M500 350 C420 450 355 540 320 615" />
      <path d="M500 350 C390 355 280 390 200 425" />
      <path d="M500 350 C410 285 315 220 235 175" />
    </svg>
    <div class="interest-tree-root">
      <span class="interest-root-orbit" aria-hidden="true"></span>
      <span class="interest-root-label">${({ en: "CURIOSITY", fr: "CURIOSITÉ", ja: "好奇心" })[currentLang] || "CURIOSITY"}</span>
      <strong>${({ en: "Always learning", fr: "Toujours apprendre", ja: "学び続ける" })[currentLang] || "Always learning"}</strong>
    </div>
  `;

  const interestIcons = [
    '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22zM4 5.5v13A3.5 3.5 0 0 1 7.5 15H20M9 6h7m-7 4h5"/>',
    '<path d="M4 11h16l-1.7 7H5.7L4 11zM3 20h18M8 8c-1.2-1.3 1.2-2 0-3m4 3c-1.2-1.3 1.2-2 0-3m4 3c-1.2-1.3 1.2-2 0-3"/>',
    '<path d="M3 19l6-10 4 6 3-4 5 8H3zM9 9l2-3 2 3m4-1V4m-2 2h4"/>',
    '<path d="M7 8h10a4 4 0 0 1 3.8 5l-1 3a2 2 0 0 1-3.2 1l-2.2-1.7h-4.8L7.4 17a2 2 0 0 1-3.2-1l-1-3A4 4 0 0 1 7 8zM7 11v4m-2-2h4m7-1h.1m2 2h.1"/>',
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/><path d="M6.5 10h.1"/>',
    '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.2"/><path d="M3 20h4m10 0h4"/>',
    '<path d="M14.5 6.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8L6.7 4.1a4 4 0 0 0 5 5l7.5 7.5a2 2 0 0 1-2.8 2.8l-7.5-7.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8"/>'
  ];

  const nodes = [];
  let nodeIndex = -1;
  let sourceNode = heading.nextSibling;
  while (sourceNode) {
    const next = sourceNode.nextSibling;
    if (sourceNode.nodeType === Node.ELEMENT_NODE && sourceNode.tagName === "H2") {
      nodeIndex += 1;
      const node = document.createElement("article");
      node.className = `interest-tree-node interest-tree-node-${nodeIndex + 1}`;
      node.dataset.nodeIndex = String(nodeIndex);
      node.setAttribute("style", `--node-x:${[50, 78, 80, 58, 32, 20, 24][nodeIndex] || 50}%;--node-y:${[14, 25, 70, 88, 88, 61, 25][nodeIndex] || 50}%`);

      const toggle = document.createElement("button");
      toggle.className = "interest-node-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", `interest-details-${nodeIndex}`);

      const title = document.createElement("span");
      title.className = "interest-node-title";
      title.textContent = sourceNode.textContent.trim();
      const pictogram = document.createElement("span");
      pictogram.className = "interest-node-icon";
      pictogram.setAttribute("aria-hidden", "true");
      pictogram.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${interestIcons[nodeIndex] || ""}</svg>`;
      const titleRow = document.createElement("span");
      titleRow.className = "interest-node-heading";
      titleRow.append(title, pictogram);
      toggle.appendChild(titleRow);

      const details = document.createElement("div");
      details.className = "interest-node-details";
      details.id = `interest-details-${nodeIndex}`;
      details.hidden = true;

      const sourceContent = [];
      let contentNode = sourceNode.nextSibling;
      while (contentNode && !(contentNode.nodeType === Node.ELEMENT_NODE && contentNode.tagName === "H2")) {
        const following = contentNode.nextSibling;
        if (contentNode.nodeType === Node.ELEMENT_NODE) {
          sourceContent.push(contentNode);
        }
        contentNode = following;
      }

      const firstListItem = sourceContent.find(element => element.tagName === "UL")?.querySelector("li");
      const previewText = sourceContent.find(element => element.tagName === "P")?.textContent.trim()
        || firstListItem?.textContent.trim()
        || "";
      const preview = document.createElement("span");
      preview.className = "interest-node-preview";
      preview.textContent = previewText;
      toggle.appendChild(preview);

      sourceContent.forEach(element => details.appendChild(element));
      node.append(toggle, details);
      nodes.push(node);
      sourceNode.remove();
      canvas.appendChild(node);
      sourceNode = contentNode;
      continue;
    }
    sourceNode = next;
  }

  if (!nodes.length) return;
  tree.append(kicker, canvas);
  heading.after(tree);

  let activeNode = null;
  let lastPointerType = null;
  const setActiveNode = node => {
    if (activeNode === node) return;
    activeNode?.classList.remove("is-active");
    const previousToggle = activeNode?.querySelector(".interest-node-toggle");
    const previousDetails = activeNode?.querySelector(".interest-node-details");
    previousToggle?.setAttribute("aria-expanded", "false");
    if (previousDetails) previousDetails.hidden = true;
    activeNode = node;
    activeNode?.classList.add("is-active");
    const toggle = activeNode?.querySelector(".interest-node-toggle");
    const details = activeNode?.querySelector(".interest-node-details");
    toggle?.setAttribute("aria-expanded", "true");
    if (details) details.hidden = false;
  };

  canvas.addEventListener("pointerover", event => {
    if (event.pointerType !== "mouse") return;
    const node = event.target.closest(".interest-tree-node");
    if (node) setActiveNode(node);
  });
  canvas.addEventListener("pointerout", event => {
    if (event.pointerType !== "mouse") return;
    const leaving = event.target.closest(".interest-tree-node");
    if (!leaving || !leaving.contains(event.relatedTarget)) setActiveNode(null);
  });
  canvas.addEventListener("pointerdown", event => {
    lastPointerType = event.pointerType;
  });
  canvas.addEventListener("focusin", event => {
    if (lastPointerType === "touch") return;
    const node = event.target.closest(".interest-tree-node");
    if (node) setActiveNode(node);
  });
  canvas.addEventListener("focusout", event => {
    const leaving = event.target.closest(".interest-tree-node");
    if (leaving && !leaving.contains(event.relatedTarget)) setActiveNode(null);
  });
  canvas.addEventListener("click", event => {
    const toggle = event.target.closest(".interest-node-toggle");
    if (!toggle) return;
    const node = toggle.closest(".interest-tree-node");
    if (event.detail === 0) {
      setActiveNode(node);
      return;
    }
    if (window.matchMedia("(hover: hover)").matches) return;
    setActiveNode(activeNode === node ? null : node);
  });
}

/** Turn software project markdown into a featured portfolio board. */
function buildSoftwareProjectBoard(contentBody) {
  const heading = contentBody.querySelector("h1");
  const projectHeadings = [...contentBody.querySelectorAll("h2")];
  if (!heading || !projectHeadings.length) return;

  const copy = ({
    en: {
      kicker: "SOFTWARE · LOCAL AI · PERSONAL ARCHIVING",
      lede: "A few projects I’m building to solve useful problems at home and beyond.",
      featured: "FEATURED BUILD", aiLab: "LOCAL AI LAB", completed: "COMPLETED PROJECT",
      details: "Project details", toolchain: "Tools in the workshop",
      chronoFlow: ["Scattered media", "Review dates", "Chronological archive"],
      aiFlow: ["Home GPU server", "Local models", "Tools & agents"]
    },
    fr: {
      kicker: "LOGICIEL · IA LOCALE · ARCHIVAGE PERSONNEL",
      lede: "Quelques projets que je développe pour résoudre des problèmes concrets, à la maison et ailleurs.",
      featured: "PROJET À LA UNE", aiLab: "LABORATOIRE IA LOCALE", completed: "PROJET TERMINÉ",
      details: "Détails du projet", toolchain: "Outils à l’essai",
      chronoFlow: ["Médias dispersés", "Vérifier les dates", "Archive chronologique"],
      aiFlow: ["Serveur GPU maison", "Modèles locaux", "Outils et agents"]
    },
    ja: {
      kicker: "ソフトウェア · ローカルAI · 個人メディア整理",
      lede: "身近な課題を解決するために開発しているプロジェクトを紹介します。",
      featured: "注目プロジェクト", aiLab: "ローカルAI環境", completed: "完成したプロジェクト",
      details: "プロジェクトの詳細", toolchain: "試しているツール",
      chronoFlow: ["各所に散在するメディア", "日付を確認", "時系列アーカイブ"],
      aiFlow: ["自宅のGPUサーバ", "ローカルモデル", "ツールとエージェント"]
    }
  })[currentLang];
  if (!copy) return;

  const board = document.createElement("section");
  board.className = "software-project-board";
  const kicker = document.createElement("p");
  kicker.className = "software-project-kicker";
  kicker.textContent = copy.kicker;
  const lede = document.createElement("p");
  lede.className = "software-project-lede";
  lede.textContent = copy.lede;
  const grid = document.createElement("div");
  grid.className = "software-project-grid";

  const projects = projectHeadings.map(projectHeading => {
    const sourceNodes = [];
    let node = projectHeading.nextElementSibling;
    while (node && node.tagName !== "H2" && node.tagName !== "H1") {
      sourceNodes.push(node.cloneNode(true));
      node = node.nextElementSibling;
    }
    const title = projectHeading.textContent.trim();
    const normalizedTitle = title.toLocaleLowerCase();
    const type = /chronovault/.test(normalizedTitle)
      ? "chronovault"
      : /vlc/.test(normalizedTitle)
        ? "vlc"
        : /game|mod|ゲーム/i.test(title)
          ? "mods"
          : "ai-server";
    const statusNode = sourceNodes.find(element => element.matches("p") && element.querySelector("strong"));
    const status = statusNode ? statusNode.textContent.replace(/^[^:：]*[:：]\s*/, "").trim() : "";
    const bodyNodes = sourceNodes.filter(element => element !== statusNode);
    const repoLinks = bodyNodes.flatMap(element => [...element.querySelectorAll("a[href*='github.com']")]);
    const leadNode = bodyNodes.find(element => element.matches("p") && !element.querySelector("a[href*='github.com']"));
    const toolList = bodyNodes.find(element => element.tagName === "UL");

    const article = document.createElement("article");
    article.className = `software-project-card software-project-${type}`;
    const header = document.createElement("div");
    header.className = "software-project-card-header";
    const eyebrow = document.createElement("span");
    eyebrow.className = "software-project-eyebrow";
    eyebrow.textContent = type === "chronovault" ? copy.featured : type === "ai-server" ? copy.aiLab : copy.completed;
    const statusBadge = document.createElement("span");
    statusBadge.className = `software-project-status${type === "vlc" || type === "mods" ? " is-complete" : ""}`;
    statusBadge.textContent = status;
    header.append(eyebrow, statusBadge);

    const titleElement = document.createElement("h2");
    titleElement.textContent = title;
    const content = document.createElement("div");
    content.className = "software-project-copy";
    if (leadNode) content.appendChild(leadNode.cloneNode(true));

    if ((type === "chronovault" || type === "vlc") && bodyNodes.some(element => element !== leadNode)) {
      const details = document.createElement("details");
      details.className = "software-project-details";
      const summary = document.createElement("summary");
      summary.textContent = copy.details;
      details.appendChild(summary);
      bodyNodes.filter(element => element !== leadNode && !element.querySelector("a[href*='github.com']"))
        .forEach(element => details.appendChild(element.cloneNode(true)));
      if (details.childElementCount > 1) content.appendChild(details);
    }

    if ((type === "ai-server" || type === "mods") && toolList) {
      if (type === "ai-server") {
        const toolsBlock = document.createElement("div");
        toolsBlock.className = "software-project-tools";
        const toolsTitle = document.createElement("span");
        toolsTitle.className = "software-project-tools-title";
        toolsTitle.textContent = copy.toolchain;
        toolsBlock.appendChild(toolsTitle);
        const chips = document.createElement("div");
        chips.className = "software-tool-chips";
        [...toolList.querySelectorAll(":scope > li")].forEach(item => {
          const chip = document.createElement("span");
          chip.textContent = item.textContent.trim();
          chips.appendChild(chip);
        });
        toolsBlock.appendChild(chips);
        content.appendChild(toolsBlock);
      } else {
        const chips = document.createElement("div");
        chips.className = "software-tool-chips software-mod-chips";
        [...toolList.querySelectorAll(":scope > li")].forEach(item => {
          const chip = document.createElement("span");
          chip.textContent = item.textContent.trim();
          chips.appendChild(chip);
        });
        content.appendChild(chips);
      }
    }

    repoLinks.forEach(link => {
      const action = document.createElement("a");
      action.className = "software-project-repo";
      action.href = link.href;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = `${link.textContent.trim()} ↗`;
      content.appendChild(action);
    });

    article.append(header, titleElement, content);
    if (type === "chronovault" || type === "ai-server") {
      const visual = document.createElement("div");
      visual.className = `software-project-visual software-project-visual-${type}`;
      visual.setAttribute("aria-hidden", "true");
      const labels = type === "chronovault" ? copy.chronoFlow : copy.aiFlow;
      visual.innerHTML = `<div class="software-flow-track"><span class="software-flow-pulse"></span><span class="software-flow-pulse"></span></div>${labels.map((label, index) => `<div class="software-flow-step"><span class="software-flow-index">0${index + 1}</span><strong>${label}</strong></div>`).join("")}`;
      article.appendChild(visual);
    }
    return { type, article };
  });

  const order = ["chronovault", "ai-server", "vlc", "mods"];
  projects.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  projects.forEach(project => grid.appendChild(project.article));
  board.append(kicker, lede, grid);
  contentBody.replaceChildren(heading, board);
}

/** Turn the hardware experience into a visual engineering workbench. */
function buildHardwareProjectBoard(contentBody) {
  const heading = contentBody.querySelector("h1");
  const projectHeadings = [...contentBody.querySelectorAll("h2")];
  if (!heading || !projectHeadings.length) return;

  const copy = ({
    en: {
      kicker: "CAMERA IMU · ASIC · EMBEDDED · SBC · RF · PROTOTYPING",
      lede: "From camera-orientation metadata and silicon verification to embedded control, radio systems, and hands-on builds.",
      labels: {
        imu: "TAMAGGO · CAMERA SYSTEMS", transceiver: "RF SYSTEM",
        mcu: "EMBEDDED SYSTEMS",
        asic: "SILICON · COLLABORATIVE WORK", sbc: "SINGLE-BOARD COMPUTERS",
        bench: "PROTOTYPING · BENCH WORK"
      },
      flows: {
        imu: ["Gravity-down sensor", "Accelerometer", "Vector fusion", "Quaternion at capture"],
        transceiver: ["Audio input", "AM / FM signal", "4 W RF stage", "Antenna"],
        mcu: ["68332 controller", "Digital-to-analog", "Signal analysis"],
        asic: ["Collaborative design", "Chip testing", "Verification"],
        sbc: ["Compute", "Interfaces", "Prototype"]
      }
    },
    fr: {
      kicker: "IMU CAMÉRA · ASIC · EMBARQUÉ · MONOCARTES · RF · PROTOTYPAGE",
      lede: "Des métadonnées d’orientation d’une caméra à la vérification silicium, au contrôle embarqué et aux montages pratiques.",
      labels: {
        imu: "TAMAGGO · SYSTÈME CAMÉRA", transceiver: "SYSTÈME RF",
        mcu: "SYSTÈMES EMBARQUÉS",
        asic: "SILICIUM · COLLABORATION", sbc: "ORDINATEURS MONOCARTES",
        bench: "PROTOTYPAGE · ATELIER"
      },
      flows: {
        imu: ["Capteur gravité-bas", "Accéléromètre", "Fusion de vecteurs", "Quaternion à la capture"],
        transceiver: ["Entrée audio", "Signal AM / FM", "Étage RF 4 W", "Antenne"],
        mcu: ["Contrôleur 68332", "Conversion numérique-analogique", "Analyse de signaux"],
        asic: ["Conception en équipe", "Essais de puces", "Vérification"],
        sbc: ["Calcul", "Interfaces", "Prototype"]
      }
    },
    ja: {
      kicker: "カメラIMU · ASIC · 組み込み · SBC · RF · 試作",
      lede: "カメラの向きの記録やシリコン検証から、組み込み制御、無線回路、実機での試作まで。",
      labels: {
        imu: "TAMAGGO · カメラシステム", transceiver: "RFシステム",
        mcu: "組み込みシステム",
        asic: "シリコン · 共同作業", sbc: "シングルボードコンピュータ",
        bench: "試作 · ベンチ作業"
      },
      flows: {
        imu: ["重力下向きセンサー", "加速度センサー", "ベクトル融合", "撮影時のクォータニオン"],
        transceiver: ["音声入力", "AM / FM 信号", "4 W RF 段", "アンテナ"],
        mcu: ["68332 コントローラ", "D/A 変換", "信号解析"],
        asic: ["共同設計", "チップテスト", "検証"],
        sbc: ["処理", "インターフェース", "試作"]
      }
    }
  })[currentLang];
  if (!copy) return;

  const board = document.createElement("section");
  board.className = "hardware-project-board";
  const kicker = document.createElement("p");
  kicker.className = "hardware-project-kicker";
  kicker.textContent = copy.kicker;
  const lede = document.createElement("p");
  lede.className = "hardware-project-lede";
  lede.textContent = copy.lede;
  const grid = document.createElement("div");
  grid.className = "hardware-project-grid";

  const cards = projectHeadings.map(projectHeading => {
    const sourceNodes = [];
    let node = projectHeading.nextElementSibling;
    while (node && node.tagName !== "H2" && node.tagName !== "H1") {
      sourceNodes.push(node.cloneNode(true));
      node = node.nextElementSibling;
    }
    const title = projectHeading.textContent.trim();
    const lowered = title.toLocaleLowerCase();
    const kind = /imu|姿勢/.test(lowered)
      ? "imu"
      : /transceiver|émetteur-récepteur|トランシーバ/.test(lowered)
        ? "transceiver"
      : /68332/.test(lowered)
        ? "mcu"
        : /asic/.test(lowered)
          ? "asic"
          : /single-board|monocartes|シングルボード/.test(lowered)
            ? "sbc"
            : "bench";
    const leadNode = sourceNodes.find(element => element.matches("p"));
    const listNode = sourceNodes.find(element => element.tagName === "UL");

    const card = document.createElement("article");
    card.className = `hardware-project-card hardware-project-${kind}`;
    card.appendChild(makeHardwareCardIcon(kind));
    const label = document.createElement("p");
    label.className = "hardware-project-label";
    label.textContent = copy.labels[kind];
    const titleElement = document.createElement("h2");
    titleElement.textContent = title;
    const description = document.createElement("p");
    description.className = "hardware-project-description";
    description.textContent = leadNode?.textContent.trim() || "";
    card.append(label, titleElement, description);

    if (listNode) {
      const items = [...listNode.querySelectorAll(":scope > li")].map(item => item.textContent.trim());
      const tags = document.createElement("div");
      tags.className = `hardware-project-tags${kind === "sbc" ? " hardware-board-tags" : ""}`;
      items.forEach(item => {
        const tag = document.createElement("span");
        tag.textContent = item;
        tags.appendChild(tag);
      });
      card.appendChild(tags);
    }

    if (kind !== "bench") {
      const visual = document.createElement("div");
      visual.className = `hardware-project-visual hardware-visual-${kind}`;
      visual.setAttribute("aria-hidden", "true");
      const steps = copy.flows[kind];
      steps.forEach((step, index) => {
        const item = document.createElement("span");
        item.className = "hardware-flow-node";
        const number = document.createElement("small");
        number.textContent = `0${index + 1}`;
        const text = document.createElement("strong");
        text.textContent = step;
        item.append(number, text);
        visual.appendChild(item);
      });
      card.appendChild(visual);
    }
    return { kind, card };
  });

  const order = ["imu", "asic", "mcu", "sbc", "transceiver", "bench"];
  cards.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  cards.forEach(({ card }) => grid.appendChild(card));
  board.append(kicker, lede, grid);
  contentBody.replaceChildren(heading, board);
}

/** Draw a small category pictograph for each hardware card. */
function makeHardwareCardIcon(kind) {
  const ns = "http://www.w3.org/2000/svg";
  const wrapper = document.createElement("span");
  wrapper.className = `hardware-card-icon hardware-icon-${kind}`;
  wrapper.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("fill", "none");
  svg.setAttribute("focusable", "false");
  const add = (name, attrs) => {
    const shape = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));
    svg.appendChild(shape);
  };
  const stroke = { stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" };
  if (kind === "imu") {
    add("circle", { ...stroke, cx: "24", cy: "24", r: "15" });
    add("path", { ...stroke, d: "M24 35V13m0 0-5 5m5-5 5 5M13 25h21m0 0-5-5m5 5-5 5" });
    add("circle", { cx: "24", cy: "24", r: "3", fill: "currentColor" });
  } else if (kind === "transceiver") {
    add("path", { ...stroke, d: "M24 22v17m-8 0h16M20 30l4-8 4 8m-4-17v1" });
    add("path", { ...stroke, d: "M16 17a11 11 0 0 1 0 10m16-10a11 11 0 0 0 0 10M11 12a18 18 0 0 1 0 20m26-20a18 18 0 0 0 0 20" });
  } else if (kind === "asic" || kind === "mcu") {
    add("rect", { ...stroke, x: "14", y: "14", width: "20", height: "20", rx: "3" });
    [18, 24, 30].forEach(point => {
      add("path", { ...stroke, d: `M${point} 8v6m0 20v6M8 ${point}h6m20 0h6` });
    });
    if (kind === "mcu") add("path", { ...stroke, d: "M18 25h4l3-6 4 10 2-4h3" });
    else add("path", { ...stroke, d: "M19 19h10v10H19zM21 24h6" });
  } else if (kind === "sbc") {
    add("rect", { ...stroke, x: "9", y: "10", width: "30", height: "28", rx: "4" });
    add("rect", { ...stroke, x: "18", y: "17", width: "12", height: "12", rx: "2" });
    add("path", { ...stroke, d: "M12 15h3m-3 6h3m-3 6h3m18-12h3m-3 6h3m-3 6h3M18 33h12" });
  } else {
    add("rect", { ...stroke, x: "9", y: "10", width: "30", height: "28", rx: "4" });
    [16, 24, 32].forEach(x => [17, 25, 33].forEach(y => add("circle", { ...stroke, cx: String(x), cy: String(y), r: "1.5" })));
  }
  wrapper.appendChild(svg);
  return wrapper;
}

/** Present contact channels and profile links as a logo-led contact directory. */
function buildContactDirectory(contentBody) {
  const heading = contentBody.querySelector("h1");
  if (!heading) return;

  const paragraphs = [...contentBody.querySelectorAll("p")];
  const intro = paragraphs.find(paragraph => paragraph.previousElementSibling === heading);
  const directParagraph = paragraphs.find(paragraph => paragraph.querySelector("[data-email]"));
  const sectionHeadings = [...contentBody.querySelectorAll("h2")];
  const contactPage = document.createElement("div");
  contactPage.className = "contact-directory";

  const kicker = document.createElement("p");
  kicker.className = "contact-kicker";
  kicker.textContent = ({
    en: "DIRECT CONTACT · PROFESSIONAL PROFILES · ONLINE PRESENCE",
    fr: "CONTACT DIRECT · PROFILS PROFESSIONNELS · PRÉSENCE EN LIGNE",
    ja: "直接連絡 · プロフィール · オンライン上の活動"
  })[currentLang] || "DIRECT CONTACT · PROFESSIONAL PROFILES · ONLINE PRESENCE";
  contactPage.appendChild(kicker);

  if (intro) {
    const lede = document.createElement("p");
    lede.className = "contact-directory-lede";
    lede.textContent = intro.textContent.trim();
    contactPage.appendChild(lede);
  }

  const directSection = document.createElement("section");
  directSection.className = "contact-direct-section";
  const directHeading = document.createElement("h2");
  directHeading.textContent = ({ en: "Direct contact", fr: "Me joindre directement", ja: "直接連絡" })[currentLang] || "Direct contact";
  const directGrid = document.createElement("div");
  directGrid.className = "contact-direct-grid";
  const directIcons = [
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/>',
    '<path d="M6 3h8l5 5v13H6zM14 3v6h5M9 13h7m-7 4h7"/>'
  ];

  if (directParagraph) {
    const groups = [[]];
    [...directParagraph.childNodes].forEach(child => {
      if (child.nodeName === "BR" || child.nodeName === "STRONG") {
        if (groups[groups.length - 1].length) groups.push([]);
      }
      groups[groups.length - 1].push(child.cloneNode(true));
    });

    groups.filter(group => group.some(node => node.textContent.trim())).forEach((group, index) => {
      const item = document.createElement("article");
      item.className = `contact-direct-card contact-direct-card-${index + 1}`;
      const icon = document.createElement("span");
      icon.className = "contact-direct-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${directIcons[index] || directIcons[0]}</svg>`;
      const text = document.createElement("span");
      text.className = "contact-direct-text";
      const label = group.find(node => node.nodeName === "STRONG");
      if (label) {
        const labelText = document.createElement("span");
        labelText.className = "contact-direct-label";
        labelText.appendChild(label);
        text.appendChild(labelText);
      }
      const value = document.createElement("span");
      value.className = "contact-direct-value";
      group.filter(node => node !== label).forEach(node => value.appendChild(node));
      text.appendChild(value);
      item.append(icon, text);
      directGrid.appendChild(item);
    });
  }

  if (directGrid.childElementCount) {
    directSection.append(directHeading, directGrid);
    contactPage.appendChild(directSection);
  }

  sectionHeadings.forEach((sectionHeading, sectionIndex) => {
    const list = sectionHeading.nextElementSibling;
    if (!list || list.tagName !== "UL") return;
    const section = document.createElement("section");
    section.className = `contact-profile-section contact-profile-section-${sectionIndex + 1}`;
    const title = document.createElement("h2");
    title.className = "contact-section-title";
    title.textContent = sectionHeading.textContent.trim();
    const grid = document.createElement("div");
    grid.className = "contact-profile-grid";

    [...list.querySelectorAll(":scope > li")].forEach(listItem => {
      const logo = listItem.querySelector("img");
      const name = listItem.querySelector("strong")?.textContent.trim() || "Profile";
      const sourceLink = listItem.querySelector("a");
      if (!sourceLink) return;

      const profile = document.createElement("a");
      profile.className = "contact-profile-card";
      profile.href = sourceLink.href;
      profile.target = "_blank";
      profile.rel = "noopener noreferrer";

      const topLine = document.createElement("span");
      topLine.className = "contact-profile-topline";
      const logoPlate = document.createElement("span");
      logoPlate.className = "contact-profile-logo";
      if (logo) {
        const image = logo.cloneNode(true);
        image.loading = "lazy";
        logoPlate.appendChild(image);
      }
      const nameBlock = document.createElement("span");
      nameBlock.className = "contact-profile-name-block";
      const label = document.createElement("strong");
      label.textContent = name;
      const urlText = document.createElement("span");
      urlText.className = "contact-profile-url";
      urlText.textContent = sourceLink.textContent.trim();
      nameBlock.append(label, urlText);
      const arrow = document.createElement("span");
      arrow.className = "contact-profile-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      topLine.append(logoPlate, nameBlock, arrow);

      const description = document.createElement("span");
      description.className = "contact-profile-description";
      const descriptionSource = listItem.cloneNode(true);
      descriptionSource.querySelectorAll("img, strong, a").forEach(element => element.remove());
      description.textContent = descriptionSource.textContent.replace(/[\s—–-]+/gu, " ").trim();
      profile.appendChild(topLine);
      if (description.textContent) profile.appendChild(description);
      grid.appendChild(profile);
    });

    if (grid.childElementCount) {
      section.append(title, grid);
      contactPage.appendChild(section);
    }
  });

  contentBody.replaceChildren(heading, contactPage);
}

/** Turn the publication list into a cover gallery with a year ribbon. */
function buildPublicationGallery(contentBody, markdownText) {
  const firstYearHeading = [...contentBody.querySelectorAll("h2")].find(heading => /^\d{4}$/.test(heading.textContent.trim()));
  if (!firstYearHeading) return;

  const entries = [];
  let year = "";
  let currentEntry = null;
  const finishEntry = () => {
    if (!currentEntry) return;
    const links = [];
    const bodyLines = [];
    currentEntry.lines.forEach(line => {
      const lineWithoutImages = line.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
      for (const match of lineWithoutImages.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
        links.push({ label: match[1].trim(), href: match[2].trim() });
      }
      const plainLine = line
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\[[^\]]+\]\([^)]+\)/g, "")
        .replace(/[·•|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (plainLine) bodyLines.push(plainLine);
    });
    const pdfLink = links.find(link => /\.pdf(?:$|[?#])/i.test(link.href) || /\bpdf\b/i.test(link.label));
    let preview = "";
    if (pdfLink?.href) {
      try {
        const fileName = decodeURIComponent(new URL(pdfLink.href, window.location.href).pathname.split("/").pop());
        preview = `/assets/publications/previews/${fileName.replace(/\.pdf$/i, "").replace(/ /g, "-")}.png`;
      } catch (error) {
        preview = "";
      }
    }
    entries.push({
      year: currentEntry.year,
      title: currentEntry.title,
      authors: bodyLines[0] || "",
      venue: bodyLines.slice(1).join(" · "),
      links,
      preview
    });
    currentEntry = null;
  };

  (markdownText || "").split(/\r?\n/).forEach(line => {
    const yearHeading = line.match(/^##\s+(\d{4})\s*$/);
    if (yearHeading) {
      finishEntry();
      year = yearHeading[1];
      return;
    }
    const publication = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*$/);
    if (publication) {
      finishEntry();
      currentEntry = { year, title: publication[1].trim(), lines: [] };
    } else if (currentEntry) {
      currentEntry.lines.push(line.trim());
    }
  });
  finishEntry();
  if (!entries.length) return;

  const title = contentBody.querySelector("h1");
  const intro = document.createElement("div");
  intro.className = "publication-intro";
  if (title) {
    title.after(intro);
    let introNode = intro.nextSibling;
    while (introNode && introNode !== firstYearHeading) {
      const nextIntroNode = introNode.nextSibling;
      intro.appendChild(introNode);
      introNode = nextIntroNode;
    }
  }
  let contentNode = firstYearHeading;
  while (contentNode) {
    const nextContentNode = contentNode.nextSibling;
    contentNode.remove();
    contentNode = nextContentNode;
  }

  const gallery = document.createElement("section");
  gallery.className = "publication-gallery";
  gallery.setAttribute("aria-label", ({ en: "Publication collection", fr: "Collection de publications", ja: "論文コレクション" })[currentLang] || "Publication collection");
  const stage = document.createElement("div");
  stage.className = "publication-stage";
  const ribbon = document.createElement("div");
  ribbon.className = "publication-ribbon";
  ribbon.setAttribute("role", "group");
  ribbon.setAttribute("aria-label", ({ en: "Choose a publication", fr: "Choisir une publication", ja: "論文を選択" })[currentLang] || "Choose a publication");
  const timeline = document.createElement("div");
  timeline.className = "publication-timeline";
  ribbon.appendChild(timeline);

  const selectors = entries.map((entry, index) => {
    const button = document.createElement("button");
    button.className = "publication-selector";
    button.type = "button";
    button.setAttribute("aria-label", `${entry.year}: ${entry.title}`);
    button.setAttribute("aria-pressed", "false");
    const cover = document.createElement("span");
    cover.className = "publication-mini-cover";
    if (entry.preview) {
      const image = document.createElement("img");
      image.src = entry.preview;
      image.alt = "";
      image.loading = "lazy";
      cover.appendChild(image);
    } else {
      cover.classList.add("publication-mini-placeholder");
      cover.textContent = entry.year;
    }
    const yearLabel = document.createElement("span");
    yearLabel.className = "publication-selector-year";
    yearLabel.textContent = entry.year;
    const titleLabel = document.createElement("span");
    titleLabel.className = "publication-selector-title";
    titleLabel.textContent = entry.title;
    button.append(cover, yearLabel, titleLabel);
    button.addEventListener("click", () => selectPublication(index));
    timeline.appendChild(button);
    return button;
  });
  const publicationLabel = ({ en: "PAPER", fr: "ARTICLE", ja: "論文" })[currentLang] || "PAPER";
  const coverLabel = ({ en: "PUBLICATION", fr: "PUBLICATION", ja: "論文" })[currentLang] || "PUBLICATION";

  function selectPublication(index) {
    const entry = entries[index];
    selectors.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    gallery.classList.add("is-changing");
    const visual = document.createElement("figure");
    visual.className = "publication-cover";
    if (entry.preview) {
      const image = document.createElement("img");
      image.src = entry.preview;
      image.alt = t().publication.previewAlt.replace("{title}", entry.title);
      image.loading = "eager";
      visual.appendChild(image);
    } else {
      visual.classList.add("publication-cover-placeholder");
      const mark = document.createElement("span");
      mark.className = "publication-cover-kicker";
      mark.textContent = `${coverLabel} / ${entry.year}`;
      const titleMark = document.createElement("strong");
      titleMark.textContent = "IP Based Design";
      const locationMark = document.createElement("span");
      locationMark.textContent = "Grenoble · France";
      visual.append(mark, titleMark, locationMark);
    }

    const details = document.createElement("article");
    details.className = "publication-details";
    const yearLabel = document.createElement("p");
    yearLabel.className = "publication-year-label";
    yearLabel.textContent = `${publicationLabel} / ${entry.year}`;
    const heading = document.createElement("h2");
    heading.textContent = entry.title;
    details.append(yearLabel, heading);
    if (entry.authors) {
      const authors = document.createElement("p");
      authors.className = "publication-authors";
      authors.textContent = entry.authors;
      details.appendChild(authors);
    }
    if (entry.venue) {
      const venue = document.createElement("p");
      venue.className = "publication-venue";
      venue.textContent = entry.venue;
      details.appendChild(venue);
    }
    const links = document.createElement("div");
    links.className = "publication-links";
    entry.links.forEach(link => {
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (/^https?:/i.test(link.href || "")) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      links.appendChild(anchor);
    });
    if (links.childElementCount) details.appendChild(links);
    stage.replaceChildren(visual, details);
    requestAnimationFrame(() => gallery.classList.remove("is-changing"));
  }

  const onTimelineKeydown = event => {
    const current = selectors.indexOf(document.activeElement);
    if (current < 0) return;
    const next = event.key === "ArrowRight" ? Math.min(current + 1, selectors.length - 1)
      : event.key === "ArrowLeft" ? Math.max(current - 1, 0)
        : event.key === "Home" ? 0
          : event.key === "End" ? selectors.length - 1
            : current;
    if (next === current) return;
    event.preventDefault();
    selectors[next].focus();
    selectPublication(next);
  };
  timeline.addEventListener("keydown", onTimelineKeydown);

  if (intro.isConnected) {
    intro.after(gallery);
  } else if (title) {
    title.after(gallery);
  } else {
    contentBody.append(gallery);
  }
  gallery.append(stage, ribbon);
  selectPublication(0);
}

function academicCardFromTarget(target) {
  return target instanceof Element
    ? target.closest('#content-body[data-page="academic"] .academic-degree, #content-body[data-page="academic"] .academic-awards')
    : null;
}

function activateAcademicCard(card) {
  if (card === activeAcademicCard) return;
  activeAcademicCard?.classList.remove("is-pointer-active");
  activeAcademicCard = card;
  activeAcademicCard?.classList.add("is-pointer-active");
}

function installAcademicPointerTracking() {
  if (academicPointerTrackingInstalled) return;
  academicPointerTrackingInstalled = true;

  document.addEventListener("pointerover", event => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1200px)").matches) return;
    const card = academicCardFromTarget(event.target);
    if (card) activateAcademicCard(card);
  });

  document.addEventListener("pointerout", event => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1200px)").matches) return;
    const leavingCard = academicCardFromTarget(event.target);
    if (!leavingCard || leavingCard !== activeAcademicCard) return;

    const nextCard = academicCardFromTarget(event.relatedTarget);
    if (nextCard === leavingCard) return;
    activateAcademicCard(nextCard);
  });

  window.addEventListener("blur", () => activateAcademicCard(null));
}

function closeExperienceCard(card) {
  if (!card) return;
  card.classList.remove("is-pointer-active");
  card.querySelectorAll("details[open]").forEach(details => {
    details.open = false;
  });
  if (activeExperienceCard === card) {
    activeExperienceCard = null;
  }
}

function experienceCardFromTarget(target) {
  return target instanceof Element
    ? target.closest('#content-body[data-page="experience"] .experience-entry')
    : null;
}

function activateExperienceCard(card) {
  if (card === activeExperienceCard) return;
  closeExperienceCard(activeExperienceCard);
  activeExperienceCard = card;
  if (activeExperienceCard) activeExperienceCard.classList.add("is-pointer-active");
}

function installExperiencePointerTracking() {
  if (experiencePointerTrackingInstalled) return;
  experiencePointerTrackingInstalled = true;

  document.addEventListener("pointerover", event => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1200px)").matches) return;
    const card = experienceCardFromTarget(event.target);
    if (card) activateExperienceCard(card);
  });

  document.addEventListener("pointerout", event => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1200px)").matches) return;
    const leavingCard = experienceCardFromTarget(event.target);
    if (!leavingCard || leavingCard !== activeExperienceCard) return;

    const nextCard = experienceCardFromTarget(event.relatedTarget);
    if (nextCard === leavingCard) return;
    activateExperienceCard(nextCard);
  });

  window.addEventListener("blur", () => closeExperienceCard(activeExperienceCard));
}

async function loadMarkdown(path, pageId) {
  const loadSequence = ++markdownLoadSequence;
  closeExperienceCard(activeExperienceCard);
  activateAcademicCard(null);
  const contentBody = document.getElementById("content-body");
  contentBody.classList.remove("is-wiping-in", "is-wiping-out");
  contentBody.dataset.page = pageId;

  // Wipe the current page away from right to left before replacing it.
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) contentBody.classList.add("is-wiping-out");
  await new Promise(r => setTimeout(r, reducedMotion ? 0 : 650));
  if (loadSequence !== markdownLoadSequence) return;

  try {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not load ${path} (${response.status})`);
    }
    const markdownText = await response.text();
    if (loadSequence !== markdownLoadSequence) return;
    const html = marked.parse(markdownText);
    contentBody.innerHTML = html;

    if (pageId === "experience") {
      buildExperienceTimeline(contentBody);
    } else if (pageId === "academic") {
      buildAcademicLayout(contentBody);
    } else if (pageId === "skills") {
      buildSkillsLandingVisual(contentBody);
    } else if (pageId === "technical") {
      buildTechnicalSkillsMap(contentBody);
    } else if (pageId === "other") {
      buildOtherSkillsMosaic(contentBody);
    } else if (pageId === "interests") {
      buildPersonalInterestTree(contentBody);
    } else if (pageId === "software") {
      buildSoftwareProjectBoard(contentBody);
    } else if (pageId === "hardware") {
      buildHardwareProjectBoard(contentBody);
    } else if (pageId === "contact") {
      buildContactDirectory(contentBody);
    } else if (pageId === "publications") {
      buildPublicationGallery(contentBody, markdownText);
    }

    // Contact page: fill email slots without storing a plain address in Markdown
    injectEmailLinks(contentBody);
  } catch (err) {
    if (loadSequence !== markdownLoadSequence) return;
    contentBody.innerHTML = `
      <h1>Content not found</h1>
      <p>Sorry, the requested page could not be loaded.</p>
      <pre>${err.message}</pre>
    `;
    console.error(err);
  }

  // Reveal the new page from left to right.
  requestAnimationFrame(() => {
    if (loadSequence !== markdownLoadSequence) return;
    contentBody.classList.remove("is-wiping-out");
    if (reducedMotion) return;

    contentBody.classList.add("is-wiping-in");
    window.setTimeout(() => {
      if (loadSequence === markdownLoadSequence) {
        contentBody.classList.remove("is-wiping-in");
      }
    }, 720);
  });
}

/**
 * Build the contact email in JS so crawlers that only read static HTML/Markdown
 * do not see a complete address. Human visitors still get a normal mailto link.
 *
 * In Markdown use:  <span data-email></span>
 */
function injectEmailLinks(root) {
  const slots = root.querySelectorAll("[data-email]");
  if (!slots.length) return;

  // Split so the full address is never one contiguous string in the source
  const user = ["c", "h", "r", "o", "n", "o", "m", "i", "c", "r", "o", "n"].join("");
  const domain = ["g", "m", "a", "i", "l", ".", "c", "o", "m"].join("");
  const addr = user + String.fromCharCode(64) + domain; // 64 = '@'

  slots.forEach(el => {
    const a = document.createElement("a");
    a.href = "mailto:" + addr;
    a.textContent = addr;
    el.replaceWith(a);
  });
}
