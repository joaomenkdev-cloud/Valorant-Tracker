/* ============================================================
   VCI ANALYTICS — SHARED.JS
   Sidebar rendering, topbar, toast, and shared utilities
============================================================ */

/* ---- SIDEBAR HTML (injected into every page) ---- */
const SIDEBAR_HTML = `
  <div class="sb-logo">
    <a href="index.html" class="sb-logo-link">
      <div class="sb-logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div class="sb-logo-txt"><h1>VCI</h1><span>Analytics</span></div>
    </a>
  </div>

  <div class="sb-search">
    <div class="sb-search-box">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" id="sbSearch" placeholder="Search players...">
    </div>
  </div>

  <div class="sb-section">Navigation</div>
  <nav class="sb-nav">
    <a class="nav-item" href="index.html" data-page="home">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      Home
    </a>
    <a class="nav-item" href="dashboard.html" data-page="dashboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      Dashboard
    </a>
    <a class="nav-item" href="matches.html" data-page="matches">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      Match History
    </a>
    <a class="nav-item" href="agents.html" data-page="agents">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      Agents
    </a>
    <a class="nav-item" href="maps.html" data-page="maps">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
      </svg>
      Maps
    </a>
    <a class="nav-item" href="leaderboards.html" data-page="leaderboards">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M4 22h16"></path>
      </svg>
      Leaderboards
    </a>

    <div class="sb-section mt8">Account</div>

    <a class="nav-item" href="settings.html" data-page="settings">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M1 12h6m6 0h6M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24"></path>
      </svg>
      Settings
    </a>
  </nav>

  <div class="sb-footer">
    <div class="sb-user-wrapper" id="sbUserWrapper">
      <!-- Rendered by JS based on session -->
    </div>
  </div>
`;

/* ---- TOPBAR HTML ---- */
const TOPBAR_HTML = `
  <button class="mobile-menu-btn" id="mobileBtn">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </button>
  <div class="tb-breadcrumb">
    <a href="index.html" style="color:var(--txt3);text-decoration:none">VCI</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
    <span class="cur" id="tbTitle"></span>
  </div>
  <div class="tb-right">
    <div class="tb-region">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z"></path>
      </svg>
      <span id="regionLbl">Brazil</span>
      <select id="regionSel">
        <option value="br" selected>Brazil</option>
        <option value="na">North America</option>
        <option value="eu">Europe</option>
        <option value="ap">Asia Pacific</option>
        <option value="kr">Korea</option>
        <option value="latam">LATAM</option>
      </select>
    </div>
    <button class="tb-btn" id="notifBtn" title="Notifications">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="dot"></span>
    </button>
  </div>
`;

/* ---- PAGE TITLES ---- */
const PAGE_TITLES = {
  home:         'Home',
  dashboard:    'Dashboard',
  matches:      'Match History',
  agents:       'Agents',
  maps:         'Maps',
  leaderboards: 'Leaderboards',
  settings:     'Settings',
};

/* ---- INIT SHARED UI ---- */
function initShared(currentPage) {
  // Inject sidebar + overlay
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.innerHTML = SIDEBAR_HTML;

  // Inject topbar
  const topbar = document.getElementById('topbar');
  if (topbar) topbar.innerHTML = TOPBAR_HTML;

  // Mark active nav item
  const activeLink = document.querySelector(`.nav-item[data-page="${currentPage}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Set topbar title
  const tbTitle = document.getElementById('tbTitle');
  if (tbTitle) tbTitle.textContent = PAGE_TITLES[currentPage] || currentPage;

  // Mobile toggle
  document.getElementById('mobileBtn')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });

  // Region select
  const regionSel = document.getElementById('regionSel');
  const session = getSession();
  if (regionSel && session.region) {
    regionSel.value = session.region;
    document.getElementById('regionLbl').textContent = regionSel.options[regionSel.selectedIndex].text;
  }
  
  regionSel?.addEventListener('change', function () {
    document.getElementById('regionLbl').textContent = this.options[this.selectedIndex].text;
    showToast('Region changed to ' + this.options[this.selectedIndex].text);
  });

  // Notification button
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('No new notifications');
    document.querySelector('#notifBtn .dot')?.remove();
  });

  // Sidebar search
  document.getElementById('sbSearch')?.addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const val = e.target.value.trim();
      // If contains #, search player, else go to leaderboards
      if (val.includes('#')) {
        const [name, tag] = val.split('#');
        if (name && tag) {
          setSession(name, tag, session.region || 'br');
          window.location.href = 'dashboard.html';
          return;
        }
      }
      window.location.href = `leaderboards.html?q=${encodeURIComponent(val)}`;
    }
  });

  // Render user info in sidebar
  renderSidebarUser();
}

/* ---- RENDER SIDEBAR USER ---- */
function renderSidebarUser() {
  const wrapper = document.getElementById('sbUserWrapper');
  if (!wrapper) return;

  const session = getSession();
  
  if (session.name && session.tag) {
    wrapper.innerHTML = `
      <a class="sb-user" href="settings.html">
        <div class="sb-avatar" style="background:linear-gradient(135deg, #ff4655, #f5c518)">${session.name[0].toUpperCase()}</div>
        <div class="sb-uinfo">
          <div class="sb-uname">${session.name}#${session.tag}</div>
          <div class="sb-urank">Tracking active</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--txt3);flex-shrink:0">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </a>
    `;
  } else {
    wrapper.innerHTML = `
      <a class="sb-user" href="index.html" style="background:var(--bg3);border-radius:var(--r)">
        <div class="sb-avatar" style="background:var(--bg4)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <div class="sb-uinfo">
          <div class="sb-uname" style="color:var(--txt2)">Search Player</div>
          <div class="sb-urank">Track any Riot ID</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--txt3);flex-shrink:0">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </a>
    `;
  }
}

/* ---- TOAST ---- */
let _toastTimer;
function showToast(msg, type = 'ok') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.borderLeftColor = type === 'err' ? 'var(--red)' : 'var(--green)';
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ---- SHARED HELPERS ---- */
function roleClass(role) {
  return { Duelist: 'rb-d', Controller: 'rb-c', Sentinel: 'rb-s', Initiator: 'rb-i' }[role] || 'rb-d';
}

function kdColor(v) {
  return parseFloat(v) >= 1.4 ? 'var(--green)' : parseFloat(v) >= 1 ? 'var(--yellow)' : 'var(--red)';
}

function rkBadgeClass(r) {
  if (r === 'Radiant')    return 'rk-rad';
  if (r === 'Immortal 3') return 'rk-i3';
  if (r === 'Immortal 2') return 'rk-i2';
  return 'rk-i1';
}

function rkNumClass(i) {
  if (i === 1) return 'g';
  if (i === 2) return 's';
  if (i === 3) return 'b';
  return '';
}

/* ---- CHECK SESSION FOR PLAYER-SPECIFIC PAGES ---- */
function requireSession(redirectUrl = 'index.html') {
  if (!hasSession()) {
    showToast('Search for a player first', 'err');
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
    return false;
  }
  return true;
}
