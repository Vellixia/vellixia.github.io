// Vellixia landing page — fetches live repo data, theme toggle, Cmd-K search
const AVATAR_VERSION = Date.now();
const ORG = "Vellixia";
const API = "https://api.github.com";

// 1. Cache-bust avatar so any GitHub avatar update reflects immediately
document.querySelectorAll('img[src*="Vellixia.png"]').forEach((img) => {
  img.src = `https://github.com/${ORG}.png?v=${AVATAR_VERSION}`;
});

// ============================================================
// THEME TOGGLE
// ============================================================
const themeToggle = document.getElementById("themeToggle");
const themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("vx-theme", theme); } catch (_) {}
}
themeToggle?.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

// React to system theme changes if user hasn't explicitly set one
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
  if (!localStorage.getItem("vx-theme")) {
    setTheme(e.matches ? "dark" : "light");
  }
});

// ============================================================
// LIVE REPOS
// ============================================================
async function loadRepos() {
  const grid = document.getElementById("projectsGrid");
  try {
    const res = await fetch(`${API}/orgs/${ORG}/repos?per_page=100&sort=updated&type=public`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const repos = await res.json();

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    document.getElementById("statRepos").textContent = repos.length;
    document.getElementById("statStars").textContent = totalStars;
    document.getElementById("statMembers").textContent = "2+";

    if (!repos.length) {
      grid.innerHTML = `<div class="project-loading">No public repositories yet.</div>`;
      return;
    }

    grid.innerHTML = "";
    repos.forEach((r) => grid.appendChild(renderRepo(r)));
    // Expose to search
    window.__repos = repos;
  } catch (err) {
    grid.innerHTML = `<div class="project-loading">Could not load repos: ${escapeHtml(err.message)}.<br><a href="https://github.com/${ORG}" target="_blank" rel="noopener" style="color: var(--accent-2)">View on GitHub →</a></div>`;
  }
}

function renderRepo(r) {
  const a = document.createElement("a");
  a.href = r.html_url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "project";

  const topics = (r.topics || []).slice(0, 4).map(t => `<span class="topic">${escapeHtml(t)}</span>`).join("");
  const desc = r.description
    ? `<p class="project-desc">${escapeHtml(r.description)}</p>`
    : `<p class="project-desc empty">No description yet.</p>`;

  const initial = r.name.charAt(0).toUpperCase();

  a.innerHTML = `
    <div class="project-head">
      <div class="project-icon">${initial}</div>
      <div class="project-name">${escapeHtml(r.name)}</div>
    </div>
    ${desc}
    <div class="project-meta">
      ${r.language ? `<span class="meta-pill">● ${escapeHtml(r.language)}</span>` : ""}
      ${r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? `<span class="meta-pill">${escapeHtml(r.license.spdx_id)}</span>` : ""}
      <span class="meta-pill">★ ${r.stargazers_count}</span>
      ${topics}
    </div>
  `;
  return a;
}

// ============================================================
// CMD-K SEARCH
// ============================================================
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchTrigger = document.getElementById("searchTrigger");

const STATIC_RESULTS = [
  { type: "section", title: "Mission", subtitle: "Where velocity meets clarity", href: "#mission" },
  { type: "section", title: "Projects", subtitle: "Live repository showcase", href: "#projects" },
  { type: "section", title: "Etymology", subtitle: "The meaning of Vellixia", href: "#etymology" },
  { type: "page", title: "Glia", subtitle: "AI agent skill synthesizer", href: "./glia/" },
  { type: "page", title: "Cairn", subtitle: "Context & reliability layer", href: "./cairn/" },
  { type: "page", title: "404", subtitle: "Page not found", href: "./404.html" },
  { type: "external", title: "GitHub organization", subtitle: "github.com/Vellixia", href: "https://github.com/Vellixia" },
  { type: "external", title: "RSS feed", subtitle: "feed.xml", href: "./feed.xml" },
  { type: "external", title: "Contact", subtitle: "andresholivin01@gmail.com", href: "mailto:andresholivin01@gmail.com" },
];

let focusedIdx = -1;

function openSearch() {
  searchOverlay.classList.add("open");
  searchInput.focus();
  searchInput.value = "";
  focusedIdx = -1;
  renderSearch("");
}
function closeSearch() {
  searchOverlay.classList.remove("open");
}

searchTrigger?.addEventListener("click", openSearch);
searchOverlay?.addEventListener("click", (e) => {
  if (e.target === searchOverlay) closeSearch();
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSearch();
    return;
  }
  if (e.key === "Escape" && searchOverlay.classList.contains("open")) {
    closeSearch();
    return;
  }
  if (!searchOverlay.classList.contains("open")) return;
  const items = searchResults.querySelectorAll(".search-item");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    focusedIdx = Math.min(focusedIdx + 1, items.length - 1);
    updateFocus(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusedIdx = Math.max(focusedIdx - 1, 0);
    updateFocus(items);
  } else if (e.key === "Enter" && focusedIdx >= 0) {
    e.preventDefault();
    items[focusedIdx]?.click();
  }
});

function updateFocus(items) {
  items.forEach((it, i) => it.classList.toggle("focused", i === focusedIdx));
  items[focusedIdx]?.scrollIntoView({ block: "nearest" });
}

function renderSearch(q) {
  q = q.toLowerCase().trim();
  // Combine static + live repos
  const live = (window.__repos || []).map(r => ({
    type: "repo",
    title: r.name,
    subtitle: r.description || "Repository",
    href: r.html_url,
    topics: r.topics || [],
    external: true,
  }));
  const all = [...STATIC_RESULTS, ...live];

  const filtered = q
    ? all.filter(r => (r.title + " " + r.subtitle + " " + (r.topics || []).join(" ")).toLowerCase().includes(q))
    : all.slice(0, 8);

  if (!filtered.length) {
    searchResults.innerHTML = `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`;
    focusedIdx = -1;
    return;
  }

  searchResults.innerHTML = "";
  let lastType = null;
  filtered.forEach((r, i) => {
    if (r.type !== lastType) {
      const label = document.createElement("div");
      label.className = "search-section-label";
      label.textContent = r.type === "repo" ? "Repositories" : r.type === "section" ? "Sections" : r.type === "page" ? "Pages" : "External";
      searchResults.appendChild(label);
      lastType = r.type;
    }
    const item = document.createElement("a");
    item.className = "search-item";
    item.href = r.href;
    if (r.external || (r.href && (r.href.startsWith("http") || r.href.startsWith("mailto")))) {
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    } else {
      item.addEventListener("click", () => closeSearch());
    }
    item.innerHTML = `
      <div class="search-item-icon">${escapeHtml(r.title.charAt(0).toUpperCase())}</div>
      <div class="search-item-text">
        <div class="search-item-title">${escapeHtml(r.title)}</div>
        <div class="search-item-sub">${escapeHtml(r.subtitle)}</div>
      </div>
      <div class="search-item-arrow">→</div>
    `;
    searchResults.appendChild(item);
  });
  focusedIdx = filtered.length > 0 ? 0 : -1;
  const items = searchResults.querySelectorAll(".search-item");
  if (focusedIdx >= 0) items[focusedIdx]?.classList.add("focused");
}

searchInput?.addEventListener("input", (e) => renderSearch(e.target.value));

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loadRepos();