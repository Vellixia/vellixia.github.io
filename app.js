// Vellixia landing page — particle network + custom cursor + 3D tilt + magnetic buttons + counters + scroll reveals
(function () {
  "use strict";

  const AVATAR_VERSION = Date.now();
  const ORG = "Vellixia";
  const API = "https://api.github.com";
  const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IS_TOUCH = !matchMedia("(hover: hover) and (pointer: fine)").matches;

  // 1. Cache-bust avatar
  document.querySelectorAll('img[src*="Vellixia.png"]').forEach((img) => {
    img.src = `https://github.com/${ORG}.png?v=${AVATAR_VERSION}`;
  });

  // ============================================================
  // 2. THEME
  // ============================================================
  const themeToggle = document.getElementById("themeToggle");
  function getTheme() { return document.documentElement.getAttribute("data-theme") || "dark"; }
  function setTheme(t) { document.documentElement.setAttribute("data-theme", t); try { localStorage.setItem("vx-theme", t); } catch (_) {} }
  themeToggle?.addEventListener("click", () => setTheme(getTheme() === "dark" ? "light" : "dark"));
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    if (!localStorage.getItem("vx-theme")) setTheme(e.matches ? "dark" : "light");
  });

  // ============================================================
  // 3. SPOTLIGHT (mouse-following ambient light)
  // ============================================================
  if (!REDUCED_MOTION && !IS_TOUCH) {
    let raf = null, mx = 0, my = 0;
    document.addEventListener("mousemove", (e) => {
      mx = (e.clientX / innerWidth) * 100;
      my = (e.clientY / innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mouse-x", mx + "%");
        document.documentElement.style.setProperty("--mouse-y", my + "%");
        raf = null;
      });
    }, { passive: true });
  }

  // ============================================================
  // 4. CUSTOM CURSOR
  // ============================================================
  if (!REDUCED_MOTION && !IS_TOUCH) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(dot);
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(ring);

    let rx = 0, ry = 0, dx = 0, dy = 0;
    document.addEventListener("mousemove", (e) => {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    });
    function animateRing() {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const hoverables = "a, button, [role='button'], .project, .pillar, .feature, .topic, .mottos li, .search-trigger, .theme-toggle, .search-item";
    document.addEventListener("mouseover", (e) => { if (e.target.closest(hoverables)) { ring.classList.add("hover"); dot.classList.add("hover"); } });
    document.addEventListener("mouseout", (e) => { if (e.target.closest(hoverables)) { ring.classList.remove("hover"); dot.classList.remove("hover"); } });

    // Hide cursor when leaving window
    document.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { dot.style.opacity = "1"; ring.style.opacity = "1"; });
  }

  // ============================================================
  // 5. MAGNETIC BUTTONS
  // ============================================================
  if (!REDUCED_MOTION && !IS_TOUCH) {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.setProperty("--tx", x * 0.25 + "px");
        btn.style.setProperty("--ty", y * 0.35 + "px");
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  // ============================================================
  // 6. 3D TILT (project cards + pillars)
  // ============================================================
  if (!REDUCED_MOTION && !IS_TOUCH) {
    document.querySelectorAll(".project, .pillar").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const ry = (px - 0.5) * 8; // -4..4 deg
        const rx = (0.5 - py) * 6;
        el.style.setProperty("--ry", ry + "deg");
        el.style.setProperty("--rx", rx + "deg");
        if (el.classList.contains("project")) {
          el.style.setProperty("--glow-x", (px * 100) + "%");
          el.style.setProperty("--glow-y", (py * 100) + "%");
        }
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      });
    });
  }

  // ============================================================
  // 7. SCROLL REVEAL
  // ============================================================
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  // ============================================================
  // 8. ANIMATED STAT COUNTERS
  // ============================================================
  function animateCount(el, target, duration = 1400, suffix = "") {
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const v = Math.round(target * easeOut(t));
      el.textContent = v + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function observeCounters() {
    const stats = document.querySelectorAll(".stat dt[data-count]");
    if (!stats.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || "";
            animateCount(el, target, 1400, suffix);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    stats.forEach((el) => io.observe(el));
  }

  // ============================================================
  // 9. PARTICLE NETWORK BACKGROUND
  // ============================================================
  function initParticles() {
    if (REDUCED_MOTION) return;
    const canvas = document.createElement("canvas");
    canvas.id = "particles-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      ctx.scale(dpr, dpr);
      const count = Math.min(80, Math.floor((innerWidth * innerHeight) / 22000));
      particles = Array.from({ length: count }, () => makeParticle());
    }
    function makeParticle() {
      return {
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      };
    }
    function isDark() {
      return document.documentElement.getAttribute("data-theme") !== "light";
    }

    let raf = null;
    function tick() {
      const CW = innerWidth, CH = innerHeight;
      ctx.clearRect(0, 0, CW, CH);
      const dark = isDark();
      const dotColor = dark ? "rgba(167, 139, 255, 0.6)" : "rgba(109, 62, 255, 0.55)";
      const lineColor = dark ? [167, 139, 255] : [109, 62, 255];

      particles.forEach((p) => {
        // Mouse interaction: repel if close, attract if far
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            const force = (1 - dist / 180) * 0.6;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 0.5;
            p.vy += Math.sin(angle) * force * 0.5;
          }
        }
        // Friction
        p.vx *= 0.985;
        p.vy *= 0.985;
        // Drift (gentle continuous motion)
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;
        // Cap velocity
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 1.2) { p.vx *= 1.2 / sp; p.vy *= 1.2 / sp; }

        p.x += p.vx;
        p.y += p.vy;
        // Wrap
        if (p.x < 0) p.x += CW; else if (p.x > CW) p.x -= CW;
        if (p.y < 0) p.y += CH; else if (p.y > CH) p.y -= CH;

        // Dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.25;
            ctx.strokeStyle = `rgba(${lineColor[0]}, ${lineColor[1]}, ${lineColor[2]}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        // Mouse line
        if (mouse.active) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.45;
            ctx.strokeStyle = `rgba(${lineColor[0]}, ${lineColor[1]}, ${lineColor[2]}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    function onMove(e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }
    function onLeave() { mouse.active = false; }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    tick();
  }

  // ============================================================
  // 10. LIVE REPOS + counters init
  // ============================================================
  async function loadRepos() {
    const grid = document.getElementById("projectsGrid");
    try {
      const res = await fetch(`${API}/orgs/${ORG}/repos?per_page=100&sort=updated&type=public`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const repos = await res.json();

      const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
      // Set targets for animated counters
      const repoEl = document.getElementById("statRepos");
      const starEl = document.getElementById("statStars");
      const memberEl = document.getElementById("statMembers");
      if (repoEl) { repoEl.dataset.count = repos.length; repoEl.textContent = "0"; }
      if (starEl) { starEl.dataset.count = totalStars; starEl.textContent = "0"; }
      if (memberEl) { memberEl.dataset.count = 2; memberEl.dataset.suffix = "+"; memberEl.textContent = "0+"; }
      observeCounters();

      if (!repos.length) {
        grid.innerHTML = `<div class="project-loading">No public repositories yet.</div>`;
        return;
      }
      grid.innerHTML = "";
      repos.forEach((r) => grid.appendChild(renderRepo(r)));
      window.__repos = repos;
      // Re-bind 3D tilt to new cards
      if (!REDUCED_MOTION && !IS_TOUCH) {
        document.querySelectorAll(".project").forEach((el) => {
          el.addEventListener("mousemove", (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            el.style.setProperty("--ry", (px - 0.5) * 8 + "deg");
            el.style.setProperty("--rx", (0.5 - py) * 6 + "deg");
            el.style.setProperty("--glow-x", (px * 100) + "%");
            el.style.setProperty("--glow-y", (py * 100) + "%");
          });
          el.addEventListener("mouseleave", () => {
            el.style.setProperty("--ry", "0deg");
            el.style.setProperty("--rx", "0deg");
          });
        });
      }
    } catch (err) {
      grid.innerHTML = `<div class="project-loading">Could not load repos: ${escapeHtml(err.message)}.<br><a href="https://github.com/${ORG}" target="_blank" rel="noopener" style="color: var(--accent-2)">View on GitHub →</a></div>`;
    }
  }

  function renderRepo(r) {
    const a = document.createElement("a");
    a.href = r.html_url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.className = "project";
    const topics = (r.topics || []).slice(0, 4).map(t => `<span class="topic">${escapeHtml(t)}</span>`).join("");
    const desc = r.description ? `<p class="project-desc">${escapeHtml(r.description)}</p>` : `<p class="project-desc empty">No description yet.</p>`;
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
  // 11. CMD-K SEARCH (unchanged from previous build)
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
  function openSearch() { searchOverlay.classList.add("open"); searchInput.focus(); searchInput.value = ""; focusedIdx = -1; renderSearch(""); }
  function closeSearch() { searchOverlay.classList.remove("open"); }
  searchTrigger?.addEventListener("click", openSearch);
  searchOverlay?.addEventListener("click", (e) => { if (e.target === searchOverlay) closeSearch(); });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); return; }
    if (e.key === "Escape" && searchOverlay.classList.contains("open")) { closeSearch(); return; }
    if (!searchOverlay.classList.contains("open")) return;
    const items = searchResults.querySelectorAll(".search-item");
    if (e.key === "ArrowDown") { e.preventDefault(); focusedIdx = Math.min(focusedIdx + 1, items.length - 1); updateFocus(items); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusedIdx = Math.max(focusedIdx - 1, 0); updateFocus(items); }
    else if (e.key === "Enter" && focusedIdx >= 0) { e.preventDefault(); items[focusedIdx]?.click(); }
  });
  function updateFocus(items) { items.forEach((it, i) => it.classList.toggle("focused", i === focusedIdx)); items[focusedIdx]?.scrollIntoView({ block: "nearest" }); }
  function renderSearch(q) {
    q = q.toLowerCase().trim();
    const live = (window.__repos || []).map(r => ({ type: "repo", title: r.name, subtitle: r.description || "Repository", href: r.html_url, topics: r.topics || [], external: true }));
    const all = [...STATIC_RESULTS, ...live];
    const filtered = q ? all.filter(r => (r.title + " " + r.subtitle + " " + (r.topics || []).join(" ")).toLowerCase().includes(q)) : all.slice(0, 8);
    if (!filtered.length) { searchResults.innerHTML = `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`; focusedIdx = -1; return; }
    searchResults.innerHTML = "";
    let lastType = null;
    filtered.forEach((r) => {
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
      if (r.external || (r.href && (r.href.startsWith("http") || r.href.startsWith("mailto")))) { item.target = "_blank"; item.rel = "noopener noreferrer"; } else { item.addEventListener("click", () => closeSearch()); }
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

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ============================================================
  // INIT
  // ============================================================
  // Particle network (after DOM ready)
  initParticles();
  // Repos
  loadRepos();
})();