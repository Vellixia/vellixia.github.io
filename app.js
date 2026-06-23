// Vellixia landing page — fetches live repo data from GitHub public API
// Updates avatar cache-bust timestamp every render to pick up GitHub avatar changes

const AVATAR_VERSION = Date.now();
const ORG = "Vellixia";
const API = "https://api.github.com";

// 1. Update avatar timestamps so any new upload on GitHub is reflected immediately
document.querySelectorAll('img[src*="Vellixia.png"]').forEach((img) => {
  img.src = `https://github.com/${ORG}.png?v=${AVATAR_VERSION}`;
});

// 2. Fetch live repos + stats
async function loadRepos() {
  const grid = document.getElementById("projectsGrid");
  try {
    const res = await fetch(`${API}/orgs/${ORG}/repos?per_page=100&sort=updated&type=public`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const repos = await res.json();

    // Stats
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    document.getElementById("statRepos").textContent = repos.length;
    document.getElementById("statStars").textContent = totalStars;

    // Members (public /orgs endpoint returns 0 for unauthenticated members_count;
    // we keep it as a soft target rather than risk rate-limiting on extra requests)
    document.getElementById("statMembers").textContent = "2+";

    if (!repos.length) {
      grid.innerHTML = `<div class="project-loading">No public repositories yet.</div>`;
      return;
    }

    // Render cards
    grid.innerHTML = "";
    repos.forEach((r) => grid.appendChild(renderRepo(r)));
  } catch (err) {
    grid.innerHTML = `<div class="project-loading">Could not load repos: ${err.message}.<br><a href="https://github.com/${ORG}" target="_blank" rel="noopener" style="color: var(--accent-2)">View on GitHub →</a></div>`;
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loadRepos();