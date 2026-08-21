/*
  ============================================================
  FILE: js/main.js
  PURPOSE: Core application logic for the personal profile site.
  ROLE IN PROJECT:
    - Handles top navigation (high-level modes)
    - Builds the left sidebar menu according to the selected mode
    - Loads the correct Markdown file from /en/ (later /fr/, /ja/)
    - Converts Markdown to HTML using the Marked library
    - Updates the main content area

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
  Navigation structure – grouped by high-level mode.
  Each mode contains the pages that appear in the left sidebar.
*/
const navigation = {
  profile: {
    title: "Profile / Resume",
    items: [
      { id: "about",        label: "About",        file: "about/index.md" },
      { id: "experience",   label: "Experience",   file: "experience/index.md" },
      { id: "academic",     label: "Academic",     file: "academic/index.md" },
      { id: "publications", label: "Publications", file: "publications/index.md" },
      {
        id: "skills",
        label: "Skills",
        file: "skills/index.md",
        children: [
          { id: "technical", label: "Technical", file: "skills/technical.md" },
          { id: "other",     label: "Other",     file: "skills/other.md" }
        ]
      }
    ]
  },
  projects: {
    title: "Projects",
    items: [
      { id: "software", label: "Software Applications", file: "projects/software.md" },
      { id: "hardware", label: "Hardware Applications", file: "projects/hardware.md" }
    ]
  },
  personal: {
    title: "Personal",
    items: [
      { id: "interests", label: "Personal Interests", file: "personal_interests/index.md" }
    ]
  },
  contact: {
    title: "Contact",
    items: [
      { id: "contact", label: "Get in Touch", file: "contact/index.md" }
    ]
  }
};

// ---------- INITIALISATION ----------
document.addEventListener("DOMContentLoaded", () => {
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
  // Safety: if drag ends outside the window
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
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  // Language switcher (only EN fully supported for now)
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang !== "en") {
        alert("French and Japanese translations will be available soon.");
        return;
      }
      currentLang = lang;
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // Reload current page in the selected language
      if (currentPage) loadPage(currentPage);
    });
  });

  // Start on Profile / Resume → About
  switchMode("profile");
});

/** Close the mobile hamburger menu */
function closeMobileMenu() {
  const topNav = document.getElementById("top-nav");
  const menuToggle = document.getElementById("menu-toggle");
  if (topNav) topNav.classList.remove("menu-open");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }
}

// ---------- MODE SWITCHING ----------
/**
 * Called when a top-level mode button is clicked.
 * Updates the active state, rebuilds the left sidebar, and loads the first page.
 */
function switchMode(modeId) {
  currentMode = modeId;
  currentPage = null;

  // Highlight the active top button
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === modeId);
  });

  // Set semi-transparent background image for this mode
  setBackgroundForMode(modeId);

  // Rebuild left sidebar
  buildSidebar(modeId);

  // Load the first item of this mode
  const mode = navigation[modeId];
  if (mode && mode.items.length > 0) {
    loadPage(mode.items[0].id);
  }
}

/**
 * Sets a random semi-transparent background image and optionally the graph paper.
 * Images live in /assets/background/
 */
function setBackgroundForMode(modeId) {
  const content = document.getElementById("content");
  if (!content) return;

  // Random background each time the top-level mode changes
  const bg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  content.setAttribute("data-bg", bg);

  // Toggle graph paper on/off via the boolean at the top of this file
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

  titleEl.textContent = mode.title;
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

/**
 * Creates a single sidebar <li><button> entry.
 * @param {object} item - navigation item with id, label, file
 * @param {boolean} isChild - if true, styled as a sub-item
 */
function createSidebarItem(item, isChild) {
  const li = document.createElement("li");
  if (isChild) li.className = "sidebar-child";

  const btn = document.createElement("button");
  btn.className = "sidebar-btn" + (isChild ? " sidebar-btn-child" : "");
  btn.textContent = item.label;
  btn.dataset.page = item.id;

  btn.addEventListener("click", () => {
    loadPage(item.id);
  });

  li.appendChild(btn);
  return li;
}

/**
 * Finds a navigation item by id, including nested children.
 */
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

/**
 * Loads a specific page (Markdown file) into the main content area.
 */
function loadPage(pageId) {
  currentPage = pageId;

  // Highlight the active sidebar item
  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  const item = findNavItem(pageId);
  if (!item) return;

  const mdPath = `${currentLang}/${item.file}`;
  loadMarkdown(mdPath);
}

/**
 * Fetches a Markdown file and renders it as HTML.
 */
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
