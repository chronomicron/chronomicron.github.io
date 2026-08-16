/*
  ============================================================
  FILE: js/main.js
  PURPOSE: Core application logic for the personal profile site.
  ROLE IN PROJECT:
    - Handles top navigation clicks
    - Builds the left sidebar menu according to the selected section
    - Loads the correct Markdown file from /en/ (later /fr/, /ja/)
    - Converts Markdown to HTML using the Marked library
    - Updates the main content area
  ============================================================
*/

// ---------- CONFIGURATION ----------
// Current language (will be expandable later)
let currentLang = "en";

// Current section and sub-page
let currentSection = "about";
let currentSub = null;

/*
  Navigation structure.
  For most sections there is only one page (index.md).
  For "skills" we have multiple files, so we define sub-items.
  This can later be moved into a navigation.json file.
*/
const navigation = {
  about: {
    title: "About",
    items: [
      { id: "index", label: "Overview", file: "about/index.md" }
    ]
  },
  experience: {
    title: "Experience",
    items: [
      { id: "index", label: "Work History", file: "experience/index.md" }
    ]
  },
  academic: {
    title: "Academic",
    items: [
      { id: "index", label: "Education & Awards", file: "academic/index.md" }
    ]
  },
  publications: {
    title: "Publications",
    items: [
      { id: "index", label: "Papers", file: "publications/index.md" }
    ]
  },
  projects: {
    title: "Projects",
    items: [
      { id: "index", label: "All Projects", file: "projects/index.md" }
    ]
  },
  personal_interests: {
    title: "Personal Interests",
    items: [
      { id: "index", label: "Interests", file: "personal_interests/index.md" }
    ]
  },
  skills: {
    title: "Skills",
    items: [
      { id: "index", label: "Overview", file: "skills/index.md" },
      { id: "technical", label: "Technical Skills", file: "skills/technical.md" },
      { id: "other", label: "Other Skills & Interests", file: "skills/other.md" }
    ]
  },
  contact: {
    title: "Contact",
    items: [
      { id: "index", label: "Get in Touch", file: "contact/index.md" }
    ]
  }
};

// ---------- INITIALISATION ----------
document.addEventListener("DOMContentLoaded", () => {
  // Attach click handlers to top navigation buttons
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      switchSection(section);
    });
  });

  // Language switcher (placeholder – only EN works for now)
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      // For now we only support English fully
      if (lang !== "en") {
        alert("French and Japanese translations will be available soon.");
        return;
      }
      currentLang = lang;
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadContent(); // reload current page in new language
    });
  });

  // Load the default section (About)
  switchSection("about");
});

// ---------- SECTION SWITCHING ----------
/**
 * Called when a top-level navigation button is clicked.
 * Updates the active state, rebuilds the left sidebar, and loads content.
 */
function switchSection(sectionId) {
  currentSection = sectionId;
  currentSub = null;

  // Update active state on top nav buttons
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });

  // Rebuild left sidebar for this section
  buildSidebar(sectionId);

  // Load the first (or only) item of this section
  const section = navigation[sectionId];
  if (section && section.items.length > 0) {
    loadSubPage(section.items[0].id);
  }
}

/**
 * Builds the left sidebar menu based on the current section.
 */
function buildSidebar(sectionId) {
  const section = navigation[sectionId];
  const menuEl = document.getElementById("sidebar-menu");
  const titleEl = document.getElementById("sidebar-title");

  titleEl.textContent = section.title;
  menuEl.innerHTML = "";

  section.items.forEach(item => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "sidebar-btn";
    btn.textContent = item.label;
    btn.dataset.sub = item.id;

    btn.addEventListener("click", () => {
      loadSubPage(item.id);
    });

    li.appendChild(btn);
    menuEl.appendChild(li);
  });
}

/**
 * Loads a specific sub-page (Markdown file) into the main content area.
 */
function loadSubPage(subId) {
  currentSub = subId;

  // Update active state in sidebar
  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sub === subId);
  });

  // Find the file path
  const section = navigation[currentSection];
  const item = section.items.find(i => i.id === subId);
  if (!item) return;

  const mdPath = `${currentLang}/${item.file}`;

  // Fetch and render the Markdown file
  loadMarkdown(mdPath);
}

/**
 * Fetches a Markdown file and renders it as HTML in #content-body.
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

    // Convert Markdown → HTML using the Marked library
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
