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

/*
  Navigation structure – grouped by high-level mode.
  Each mode contains the pages that appear in the left sidebar.
*/
const navigation = {
  profile: {
    title: "Profile / Resume",
    items: [
      { id: "about",       label: "About",               file: "about/index.md" },
      { id: "experience",  label: "Experience",          file: "experience/index.md" },
      { id: "academic",    label: "Academic",            file: "academic/index.md" },
      { id: "publications",label: "Publications",        file: "publications/index.md" },
      { id: "skills",      label: "Skills – Overview",   file: "skills/index.md" },
      { id: "technical",   label: "Skills – Technical",  file: "skills/technical.md" },
      { id: "other",       label: "Skills – Other",      file: "skills/other.md" }
    ]
  },
  projects: {
    title: "Projects",
    items: [
      { id: "projects", label: "All Projects", file: "projects/index.md" }
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
  // Top navigation (modes)
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
    });
  });

  // Brand link also goes to Profile
  document.querySelector(".nav-brand a").addEventListener("click", (e) => {
    e.preventDefault();
    switchMode("profile");
  });

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

  // Rebuild left sidebar
  buildSidebar(modeId);

  // Load the first item of this mode
  const mode = navigation[modeId];
  if (mode && mode.items.length > 0) {
    loadPage(mode.items[0].id);
  }
}

/**
 * Builds the left sidebar menu for the given mode.
 */
function buildSidebar(modeId) {
  const mode = navigation[modeId];
  const menuEl = document.getElementById("sidebar-menu");
  const titleEl = document.getElementById("sidebar-title");

  titleEl.textContent = mode.title;
  menuEl.innerHTML = "";

  mode.items.forEach(item => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "sidebar-btn";
    btn.textContent = item.label;
    btn.dataset.page = item.id;

    btn.addEventListener("click", () => {
      loadPage(item.id);
    });

    li.appendChild(btn);
    menuEl.appendChild(li);
  });
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

  // Find the file path
  const mode = navigation[currentMode];
  const item = mode.items.find(i => i.id === pageId);
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
