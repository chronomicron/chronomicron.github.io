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
let currentLang = "en";
let currentMode = "profile";
let currentPage = null;

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
    jaComingSoon: "Japanese version coming soon."
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
    jaComingSoon: "La version japonaise sera disponible bientôt."
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
    jaComingSoon: "日本語版は近日公開予定です。"
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
    });
  });

  // Brand link also goes to Profile
  document.querySelector(".nav-brand a").addEventListener("click", (e) => {
    e.preventDefault();
    switchMode("profile");
    closeMobileMenu();
  });

  // Hamburger toggle (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const topNav = document.getElementById("top-nav");
      const open = topNav.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? t().menuClose : t().menuOpen);
    });
  }

  // Language switcher (EN, FR, JA – JA UI ready; content can follow)
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (!UI[lang]) return;

      currentLang = lang;
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

  const mdPath = `${currentLang}/${item.file}`;
  loadMarkdown(mdPath);
}

async function loadMarkdown(path) {
  const contentBody = document.getElementById("content-body");
  contentBody.innerHTML = "<p>Loading…</p>";

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Could not load ${path} (${response.status})`);
    }
    const markdownText = await response.text();
    const html = marked.parse(markdownText);
    contentBody.innerHTML = html;
  } catch (err) {
    contentBody.innerHTML = `
      <h1>Content not found</h1>
      <p>Sorry, the requested page could not be loaded.</p>
      <pre>${err.message}</pre>
    `;
    console.error(err);
  }
}
