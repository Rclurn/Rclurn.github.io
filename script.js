const USERNAME = 'Rclurn';

// ── Theme ──────────────────────────────────────────────
// Day: 06:00–18:00  |  Night: 18:00–06:00
function applyTheme() {
  const hour = new Date().getHours();
  const dark = hour < 6 || hour >= 18;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// ── Language colors ────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883', Go: '#00ADD8',
  Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d', C: '#555555',
  Ruby: '#701516', Swift: '#fa7343', Kotlin: '#A97BFF', Shell: '#89e051',
  Dart: '#00B4AB', 'C#': '#178600', PHP: '#4F5D95', Scala: '#c22d40',
};

function langColor(name) {
  if (LANG_COLORS[name]) return LANG_COLORS[name];
  // Deterministic fallback color from name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 55%, 50%)`;
}

// ── Placeholder gradient (used when no README image) ──
function placeholderGradient(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const h1 = Math.abs(h) % 360;
  const h2 = (h1 + 50) % 360;
  return `linear-gradient(135deg, hsl(${h1},55%,42%), hsl(${h2},55%,32%))`;
}

// ── README image extraction ────────────────────────────
// Looks for the first PNG in a README (markdown or HTML img syntax)
function extractFirstPng(content, repo, branch) {
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)\s]*\.png(?:\?[^)]*)?)\)/i);
  if (mdMatch) return resolveUrl(mdMatch[1], repo, branch);

  const htmlMatch = content.match(/<img[^>]+src=["']([^"']*\.png(?:\?[^"']*)?)['"]/i);
  if (htmlMatch) return resolveUrl(htmlMatch[1], repo, branch);

  return null;
}

function resolveUrl(url, repo, branch) {
  url = url.trim();
  if (url.startsWith('http')) return url;
  const path = url.replace(/^\.\//, '');
  return `https://raw.githubusercontent.com/${USERNAME}/${repo}/${branch}/${path}`;
}

async function getReadmeImage(repo) {
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${USERNAME}/${repo}/${branch}/README.md`
      );
      if (!res.ok) continue;
      const text = await res.text();
      return extractFirstPng(text, repo, branch); // null if no PNG found
    } catch { /* try next branch */ }
  }
  return null;
}

// ── Stars formatter ────────────────────────────────────
function fmtStars(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

// ── Skeleton card ──────────────────────────────────────
function makeSkeleton() {
  const el = document.createElement('div');
  el.className = 'card skeleton';
  el.innerHTML = `
    <div class="card-image"></div>
    <div class="card-info">
      <div class="skeleton-line" style="width:65%"></div>
      <div class="skeleton-line" style="width:90%"></div>
      <div class="skeleton-line short"></div>
    </div>`;
  return el;
}

// ── Real card ──────────────────────────────────────────
function makeCard(repo, imageUrl, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${index * 0.06}s`;

  // Clickable image area
  const img = document.createElement('a');
  img.href = repo.html_url;
  img.target = '_blank';
  img.rel = 'noopener noreferrer';
  img.className = 'card-image';
  img.setAttribute('aria-label', repo.name);

  if (imageUrl) {
    img.style.backgroundImage = `url(${imageUrl})`;
  } else {
    img.style.background = placeholderGradient(repo.name);
  }

  // Info section
  const info = document.createElement('div');
  info.className = 'card-info';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = repo.name;
  info.appendChild(title);

  if (repo.description) {
    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.textContent = repo.description;
    info.appendChild(desc);
  }

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'card-meta';

  if (repo.stargazers_count > 0) {
    const stars = document.createElement('span');
    stars.className = 'meta-item';
    stars.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416
          1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75
          0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75
          0 0 1 8 .25Z"/>
      </svg>${fmtStars(repo.stargazers_count)}`;
    meta.appendChild(stars);
  }

  if (repo.language) {
    const lang = document.createElement('span');
    lang.className = 'meta-item';
    lang.innerHTML = `<span class="lang-dot" style="background:${langColor(repo.language)}"></span>${repo.language}`;
    meta.appendChild(lang);
  }

  if (meta.children.length > 0) info.appendChild(meta);

  card.appendChild(img);
  card.appendChild(info);
  return card;
}

// ── Load profile ───────────────────────────────────────
async function loadProfile() {
  try {
    const res = await fetch(`https://api.github.com/users/${USERNAME}`);
    if (!res.ok) return;
    const u = await res.json();
    const avatar = document.getElementById('avatar');
    const name   = document.getElementById('profile-name');
    const bio    = document.getElementById('profile-bio');
    if (avatar) avatar.src = u.avatar_url;
    if (name)   name.textContent = u.name || u.login;
    if (bio)    bio.textContent  = u.bio  || '';
  } catch { /* ignore */ }
}

// ── Load repos + render ────────────────────────────────
async function loadRepos() {
  const grid = document.getElementById('grid');

  let repos;
  try {
    const res = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?type=public&sort=updated&per_page=100`
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    repos = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="error">无法加载仓库：${err.message}</p>`;
    return;
  }

  // Exclude forks and the GitHub Pages repo itself
  const list = repos.filter(r => !r.fork && r.name !== `${USERNAME}.github.io`);

  if (list.length === 0) {
    grid.innerHTML = `<p class="error">没有找到公开仓库</p>`;
    return;
  }

  // Show skeletons while loading
  list.forEach(() => grid.appendChild(makeSkeleton()));

  // Fetch all README images concurrently
  const images = await Promise.all(list.map(r => getReadmeImage(r.name)));

  // Replace skeletons with real cards
  grid.innerHTML = '';
  list.forEach((repo, i) => grid.appendChild(makeCard(repo, images[i], i)));
}

// ── Init ───────────────────────────────────────────────
applyTheme();
loadProfile();
loadRepos();
