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
  const stored = localStorage.getItem(LANG_KEY);
  if (stored && UI[stored]) {
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
  return v === "light" || v === "dark" || v === "system" ? v : "system";
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
  // Show the action: click to switch toward the other mode
  btn.textContent = effective === "dark" ? "☀" : "◐";
  btn.title =
    theme === "system"
      ? `Theme: system (${effective}) — click for light/dark`
      : `Theme: ${theme} — click to cycle`;
  btn.setAttribute("aria-label", `Color theme: ${theme}`);
}

function cycleTheme() {
  const order = ["system", "light", "dark"];
  const current = getStoredTheme();
  const next = order[(order.indexOf(current) + 1) % order.length];
  applyTheme(next);
}

// ---------- INITIALISATION ----------
document.addEventListener("DOMContentLoaded", () => {
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

  // Custom cursor: switch image while mouse button is held down
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

  const leftColumn = document.createElement("div");
  const rightColumn = document.createElement("div");
  leftColumn.className = "experience-column experience-column-left";
  rightColumn.className = "experience-column experience-column-right";

  [...timeline.querySelectorAll(".experience-entry")].forEach((card, index) => {
    const isLeftCard = index % 2 === 0;
    card.classList.add(isLeftCard ? "experience-entry-left" : "experience-entry-right");
    card.style.order = String(index);
    (isLeftCard ? leftColumn : rightColumn).appendChild(card);
  });

  timeline.append(leftColumn, rightColumn);

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
      image.alt = `First page of ${entry.title}`;
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
  closeExperienceCard(activeExperienceCard);
  activateAcademicCard(null);
  const contentBody = document.getElementById("content-body");
  contentBody.dataset.page = pageId;

  // Fade out current content
  contentBody.classList.add("is-fading");
  await new Promise(r => setTimeout(r, 160));

  try {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not load ${path} (${response.status})`);
    }
    const markdownText = await response.text();
    const html = marked.parse(markdownText);
    contentBody.innerHTML = html;

    if (pageId === "experience") {
      buildExperienceTimeline(contentBody);
    } else if (pageId === "academic") {
      buildAcademicLayout(contentBody);
    } else if (pageId === "publications") {
      buildPublicationGallery(contentBody, markdownText);
    }

    // Contact page: fill email slots without storing a plain address in Markdown
    injectEmailLinks(contentBody);
  } catch (err) {
    contentBody.innerHTML = `
      <h1>Content not found</h1>
      <p>Sorry, the requested page could not be loaded.</p>
      <pre>${err.message}</pre>
    `;
    console.error(err);
  }

  // Fade in new content
  requestAnimationFrame(() => {
    contentBody.classList.remove("is-fading");
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
