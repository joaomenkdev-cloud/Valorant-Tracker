/* ============================================================
   VCI ANALYTICS — AGENTS.JS
   Shows global agent stats OR player-specific if logged in
============================================================ */

const GLOBAL_AGENTS = [
  { name: 'Jett', role: 'Duelist', matches: 2847, wins: 1452, kills: 23456, deaths: 18234, assists: 5678, acs: 245, hs: 27 },
  { name: 'Reyna', role: 'Duelist', matches: 2654, wins: 1327, kills: 21234, deaths: 17456, assists: 4234, acs: 238, hs: 25 },
  { name: 'Omen', role: 'Controller', matches: 2156, wins: 1134, kills: 16789, deaths: 14567, assists: 7890, acs: 198, hs: 22 },
  { name: 'Sage', role: 'Sentinel', matches: 1987, wins: 1089, kills: 12345, deaths: 11234, assists: 9876, acs: 176, hs: 20 },
  { name: 'Sova', role: 'Initiator', matches: 1876, wins: 994, kills: 14567, deaths: 12345, assists: 8765, acs: 189, hs: 23 },
  { name: 'Chamber', role: 'Sentinel', matches: 1765, wins: 918, kills: 15678, deaths: 13456, assists: 4567, acs: 215, hs: 28 },
  { name: 'Raze', role: 'Duelist', matches: 1654, wins: 843, kills: 14234, deaths: 12567, assists: 5432, acs: 228, hs: 21 },
  { name: 'Phoenix', role: 'Duelist', matches: 1543, wins: 772, kills: 13456, deaths: 12345, assists: 4876, acs: 219, hs: 24 },
  { name: 'Brimstone', role: 'Controller', matches: 1432, wins: 744, kills: 11234, deaths: 10567, assists: 6789, acs: 185, hs: 19 },
  { name: 'Killjoy', role: 'Sentinel', matches: 1321, wins: 701, kills: 10876, deaths: 9876, assists: 5678, acs: 178, hs: 21 },
  { name: 'Cypher', role: 'Sentinel', matches: 1210, wins: 629, kills: 9876, deaths: 9234, assists: 6234, acs: 172, hs: 20 },
  { name: 'Viper', role: 'Controller', matches: 1198, wins: 623, kills: 9234, deaths: 8765, assists: 5876, acs: 169, hs: 18 },
  { name: 'Skye', role: 'Initiator', matches: 1087, wins: 565, kills: 8765, deaths: 8234, assists: 7654, acs: 174, hs: 19 },
  { name: 'Breach', role: 'Initiator', matches: 976, wins: 498, kills: 7890, deaths: 7567, assists: 6543, acs: 168, hs: 17 },
  { name: 'Yoru', role: 'Duelist', matches: 865, wins: 424, kills: 7234, deaths: 6987, assists: 3456, acs: 205, hs: 26 },
  { name: 'Astra', role: 'Controller', matches: 754, wins: 392, kills: 5876, deaths: 5678, assists: 5432, acs: 162, hs: 16 },
  { name: 'KAY/O', role: 'Initiator', matches: 643, wins: 334, kills: 5234, deaths: 4987, assists: 4876, acs: 171, hs: 18 },
  { name: 'Fade', role: 'Initiator', matches: 532, wins: 282, kills: 4567, deaths: 4234, assists: 4321, acs: 177, hs: 20 },
  { name: 'Harbor', role: 'Controller', matches: 421, wins: 210, kills: 3456, deaths: 3234, assists: 3876, acs: 158, hs: 17 },
  { name: 'Gekko', role: 'Initiator', matches: 310, wins: 165, kills: 2678, deaths: 2456, assists: 3234, acs: 173, hs: 19 },
  { name: 'Deadlock', role: 'Sentinel', matches: 199, wins: 99, kills: 1678, deaths: 1567, assists: 1876, acs: 165, hs: 18 },
  { name: 'Iso', role: 'Duelist', matches: 88, wins: 44, kills: 789, deaths: 723, assists: 345, acs: 212, hs: 25 },
  { name: 'Clove', role: 'Controller', matches: 66, wins: 34, kills: 567, deaths: 534, assists: 456, acs: 175, hs: 21 },
  { name: 'Neon', role: 'Duelist', matches: 1098, wins: 549, kills: 9234, deaths: 8765, assists: 3456, acs: 221, hs: 22 },
];

document.addEventListener('DOMContentLoaded', async () => {
  initShared('agents');

  const grid = document.getElementById('agentsGrid');
  
  // Show loading
  if (grid) grid.innerHTML = [...Array(6)].map(() => `<div class="apc" style="opacity:0.3;height:220px;background:var(--bg3)"></div>`).join('');

  // Check if we have a session for player-specific data
  if (hasSession()) {
    const { name, tag, region } = getSession();
    
    try {
      const [matchRes, assetRes] = await Promise.allSettled([
        fetchMatches(region, name, tag, 'competitive', 10),
        getAgentAssets(),
      ]);

      const matches = matchRes.status === 'fulfilled' ? matchRes.value.matches : [];
      const assets  = assetRes.status  === 'fulfilled' ? assetRes.value         : {};

      if (matches.length > 0) {
        let agentStats = calcAgentStats(matches);
        setupFilters(agentStats, assets);
        renderAgentsGrid(agentStats, assets, true);
        return;
      }
    } catch (err) {
      // Fall through to global data
    }
  }

  // Show global agent data
  const globalStats = GLOBAL_AGENTS.map(a => ({
    ...a,
    wr: a.matches > 0 ? Math.round((a.wins / a.matches) * 100) : 0,
    kd: a.deaths > 0 ? (a.kills / a.deaths).toFixed(2) : a.kills.toFixed(2),
    acs: Math.round(a.acs),
    hs: Math.round(a.hs),
  }));

  setupFilters(globalStats, {});
  renderAgentsGrid(globalStats, {}, false);
});

function setupFilters(agentStats, assets) {
  document.getElementById('roleFilter')?.addEventListener('change', () => {
    renderAgentsGrid(agentStats, assets, hasSession());
  });
  document.getElementById('agentSort')?.addEventListener('change', () => {
    renderAgentsGrid(agentStats, assets, hasSession());
  });
}

function renderAgentsGrid(agentStats, assets, isPlayerData) {
  const roleF = document.getElementById('roleFilter')?.value || '';
  const sortF = document.getElementById('agentSort')?.value  || 'matches';

  // Get role from our data or assets
  let data = agentStats.filter(a => {
    if (!roleF) return true;
    const role = a.role || assets[a.name.toLowerCase()]?.role;
    return role === roleF;
  });

  data = [...data].sort((a, b) => {
    if (sortF === 'wr')  return b.wr  - a.wr;
    if (sortF === 'kd')  return parseFloat(b.kd) - parseFloat(a.kd);
    if (sortF === 'acs') return b.acs - a.acs;
    return b.matches - a.matches;
  });

  const grid = document.getElementById('agentsGrid');
  if (!grid) return;

  if (!data.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
      <p>No agent data available.</p>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(a => {
    const asset = assets[a.name.toLowerCase()];
    const clr   = agentColor(a.name);
    const role  = a.role || asset?.role || '—';
    const matchLabel = isPlayerData ? 'Games' : 'Popularity';
    const matchValue = isPlayerData ? a.matches : `${((a.matches / 30000) * 100).toFixed(1)}%`;

    return `
      <div class="apc">
        <div class="apc-top">
          <div class="apc-icon" style="background:${clr}">
            ${asset?.displayIcon
              ? `<img src="${asset.displayIcon}" width="50" height="50" style="border-radius:9px;object-fit:cover">`
              : a.name[0]}
          </div>
          <div class="apc-info">
            <h3>${a.name}</h3>
            <span class="rb ${roleClass(role)}">${role}</span>
          </div>
        </div>
        <div class="apc-stats">
          <div class="ams"><div class="ams-val raj">${matchValue}</div><div class="ams-lbl">${matchLabel}</div></div>
          <div class="ams"><div class="ams-val raj" style="color:${kdColor(a.kd)}">${a.kd}</div><div class="ams-lbl">K/D</div></div>
          <div class="ams"><div class="ams-val raj">${a.acs}</div><div class="ams-lbl">ACS</div></div>
          <div class="ams"><div class="ams-val raj">${a.hs}%</div><div class="ams-lbl">HS%</div></div>
        </div>
        <div class="apc-wr">
          <span class="apc-wr-lbl">Win Rate</span>
          <div class="apc-wr-bar">
            <div class="apc-wr-fill" style="width:${a.wr}%;background:${a.wr >= 50 ? 'var(--green)' : 'var(--red)'}"></div>
          </div>
          <span class="apc-wr-pct raj" style="color:${a.wr >= 50 ? 'var(--green)' : 'var(--red)'}">${a.wr}%</span>
        </div>
      </div>`;
  }).join('');
}
