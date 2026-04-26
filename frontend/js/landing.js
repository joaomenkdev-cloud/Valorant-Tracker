/* ============================================================
   VCI ANALYTICS — LANDING.JS
   Landing page functionality
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearch();
  initLeaderboardPreview();
  initAgentsPreview();
  initExamples();
});

/* ============================================================
   MOBILE MENU
============================================================ */
function initMobileMenu() {
  const btn = document.getElementById('navMobileBtn');
  const menu = document.getElementById('mobileMenu');
  
  btn?.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}

/* ============================================================
   SEARCH FUNCTIONALITY
============================================================ */
function initSearch() {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('playerName');
  const regionSelect = document.getElementById('regionSelect');
  const statusMsg = document.getElementById('statusMsg');
  const btnSearch = document.getElementById('btnSearch');

  // Support pasting "Name#Tag" format
  input?.addEventListener('input', function() {
    if (this.value.includes('#')) {
      const [name, tag] = this.value.split('#');
      this.value = name;
      // We'll handle the tag in form submission
      this.dataset.tag = tag || '';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let name = (input?.value || '').trim();
    let tag = input?.dataset.tag || '';
    
    // Check if name contains # (user pasted full ID)
    if (name.includes('#')) {
      const parts = name.split('#');
      name = parts[0];
      tag = parts[1] || '';
    }
    
    // If no tag found, try to extract from input
    if (!tag && name) {
      // Check for common formats
      const match = name.match(/^(.+?)#(.+)$/);
      if (match) {
        name = match[1];
        tag = match[2];
      }
    }

    if (!name) {
      showStatus('Enter a player name', 'warn');
      return;
    }

    if (!tag) {
      showStatus('Enter the tag (e.g., TenZ#000)', 'warn');
      return;
    }

    const region = regionSelect?.value || 'br';

    setLoading(true);
    showStatus('Searching player...', 'info');

    try {
      const account = await fetchAccount(name, tag);
      
      // Save session
      setSession(account.name, account.tag, account.region || region);
      
      showStatus(`Found: ${account.name}#${account.tag}`, 'ok');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      if (
        err.message.includes('404') ||
        err.message.toLowerCase().includes('not found') ||
        err.message.toLowerCase().includes('não encontrado')
      ) {
        showStatus('Player not found. Check the name and tag.', 'err');
      } else {
        showStatus(`Error: ${err.message}`, 'err');
      }
      setLoading(false);
    }
  });

  function showStatus(msg, type = 'info') {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.className = `search-status show status-${type}`;
  }

  function setLoading(loading) {
    if (btnSearch) {
      btnSearch.disabled = loading;
    }
  }
}

/* ============================================================
   EXAMPLE BUTTONS
============================================================ */
function initExamples() {
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('playerName');
      const regionSelect = document.getElementById('regionSelect');
      
      if (input) {
        input.value = `${btn.dataset.name}#${btn.dataset.tag}`;
        input.dataset.tag = btn.dataset.tag;
      }
      if (regionSelect && btn.dataset.region) {
        regionSelect.value = btn.dataset.region;
      }
    });
  });
}

/* ============================================================
   LEADERBOARD PREVIEW
============================================================ */
const MOCK_LEADERBOARDS = {
  br: [
    { rank: 1, name: 'Aspas', tag: 'BR1', rr: 892, tier: 'Radiant' },
    { rank: 2, name: 'Less', tag: '7777', rr: 856, tier: 'Radiant' },
    { rank: 3, name: 'Saadhak', tag: 'loud', rr: 834, tier: 'Radiant' },
    { rank: 4, name: 'cauanzin', tag: 'BR1', rr: 812, tier: 'Radiant' },
    { rank: 5, name: 'Tuyz', tag: '1231', rr: 798, tier: 'Radiant' },
  ],
  na: [
    { rank: 1, name: 'TenZ', tag: '000', rr: 921, tier: 'Radiant' },
    { rank: 2, name: 'yay', tag: 'optic', rr: 889, tier: 'Radiant' },
    { rank: 3, name: 's0m', tag: 'NRG', rr: 867, tier: 'Radiant' },
    { rank: 4, name: 'Demon1', tag: '1', rr: 845, tier: 'Radiant' },
    { rank: 5, name: 'FNS', tag: 'NRG', rr: 823, tier: 'Radiant' },
  ],
  eu: [
    { rank: 1, name: 'cNed', tag: '7777', rr: 912, tier: 'Radiant' },
    { rank: 2, name: 'Derke', tag: 'FNC', rr: 878, tier: 'Radiant' },
    { rank: 3, name: 'Chronicle', tag: 'M3C', rr: 856, tier: 'Radiant' },
    { rank: 4, name: 'Alfajer', tag: '1', rr: 834, tier: 'Radiant' },
    { rank: 5, name: 'Leo', tag: 'VIT', rr: 812, tier: 'Radiant' },
  ],
  ap: [
    { rank: 1, name: 'f0rsakeN', tag: 'PRX', rr: 901, tier: 'Radiant' },
    { rank: 2, name: 'something', tag: 'PRX', rr: 879, tier: 'Radiant' },
    { rank: 3, name: 'Jinggg', tag: '1', rr: 856, tier: 'Radiant' },
    { rank: 4, name: 'mindfreak', tag: 'PRX', rr: 834, tier: 'Radiant' },
    { rank: 5, name: 'd4v41', tag: 'PRX', rr: 812, tier: 'Radiant' },
  ],
};

function initLeaderboardPreview() {
  const tabs = document.querySelectorAll('.lb-tab');
  const list = document.getElementById('lbPreviewList');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLeaderboard(tab.dataset.region);
    });
  });
  
  // Initial render
  renderLeaderboard('br');
  
  function renderLeaderboard(region) {
    const data = MOCK_LEADERBOARDS[region] || MOCK_LEADERBOARDS.br;
    
    list.innerHTML = data.map((player, i) => `
      <div class="lb-preview-row" onclick="searchPlayer('${player.name}', '${player.tag}', '${region}')">
        <div class="lb-preview-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">#${player.rank}</div>
        <div class="lb-preview-player">
          <div class="lb-preview-avatar" style="background: hsl(${(player.name.charCodeAt(0) * 47) % 360}, 55%, 45%)">${player.name[0]}</div>
          <div>
            <div class="lb-preview-name">${player.name}</div>
            <div class="lb-preview-tag">#${player.tag}</div>
          </div>
        </div>
        <div class="lb-preview-rr">${player.rr} RR</div>
        <div class="lb-preview-tier">
          <span class="tier-badge ${player.tier === 'Radiant' ? 'tier-radiant' : 'tier-immortal'}">${player.tier}</span>
        </div>
      </div>
    `).join('');
  }
}

// Global function to search player from leaderboard click
window.searchPlayer = function(name, tag, region) {
  const input = document.getElementById('playerName');
  const regionSelect = document.getElementById('regionSelect');
  
  if (input) {
    input.value = `${name}#${tag}`;
    input.dataset.tag = tag;
  }
  if (regionSelect) {
    regionSelect.value = region;
  }
  
  // Scroll to search
  document.querySelector('.search-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/* ============================================================
   AGENTS PREVIEW
============================================================ */
const POPULAR_AGENTS = [
  { name: 'Jett', role: 'Duelist', color: '#4a90d9', pickRate: 18.2 },
  { name: 'Reyna', role: 'Duelist', color: '#c062db', pickRate: 15.8 },
  { name: 'Omen', role: 'Controller', color: '#7b5ea7', pickRate: 12.4 },
  { name: 'Sage', role: 'Sentinel', color: '#0ca678', pickRate: 11.9 },
  { name: 'Sova', role: 'Initiator', color: '#1971c2', pickRate: 10.5 },
  { name: 'Chamber', role: 'Sentinel', color: '#c9a227', pickRate: 9.8 },
];

function initAgentsPreview() {
  const grid = document.getElementById('agentsGrid');
  if (!grid) return;
  
  grid.innerHTML = POPULAR_AGENTS.map(agent => `
    <a href="agents.html" class="agent-card">
      <div class="agent-icon" style="background: ${agent.color}">${agent.name[0]}</div>
      <div class="agent-name">${agent.name}</div>
      <span class="agent-role ${agent.role.toLowerCase()}">${agent.role}</span>
      <div class="agent-pickrate">Pick Rate: <strong>${agent.pickRate}%</strong></div>
    </a>
  `).join('');
}
