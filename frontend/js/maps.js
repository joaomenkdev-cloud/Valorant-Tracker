/* ============================================================
   VCI ANALYTICS — MAPS.JS
   Shows global map stats OR player-specific if logged in
============================================================ */

const GLOBAL_MAPS = [
  { name: 'Ascent', matches: 4521, wins: 2283, kills: 38765, deaths: 35234, acs: 189 },
  { name: 'Haven', matches: 4234, wins: 2117, kills: 36543, deaths: 33456, acs: 185 },
  { name: 'Split', matches: 3987, wins: 1914, kills: 34567, deaths: 32123, acs: 182 },
  { name: 'Bind', matches: 3876, wins: 1976, kills: 33456, deaths: 30234, acs: 187 },
  { name: 'Icebox', matches: 3654, wins: 1754, kills: 31234, deaths: 29876, acs: 178 },
  { name: 'Breeze', matches: 3432, wins: 1682, kills: 29876, deaths: 28234, acs: 175 },
  { name: 'Fracture', matches: 3210, wins: 1541, kills: 27654, deaths: 26543, acs: 173 },
  { name: 'Pearl', matches: 2987, wins: 1464, kills: 25432, deaths: 24321, acs: 176 },
  { name: 'Lotus', matches: 2765, wins: 1383, kills: 23456, deaths: 22345, acs: 179 },
  { name: 'Sunset', matches: 2543, wins: 1297, kills: 21234, deaths: 20123, acs: 181 },
  { name: 'Abyss', matches: 1987, wins: 994, kills: 16789, deaths: 15678, acs: 174 },
];

const MAP_COLORS = {
  ascent: '#4a6fa5',
  haven: '#8b4513',
  split: '#2f4f4f',
  bind: '#daa520',
  icebox: '#4682b4',
  breeze: '#20b2aa',
  fracture: '#cd853f',
  pearl: '#9370db',
  lotus: '#2e8b57',
  sunset: '#ff6347',
  abyss: '#483d8b',
};

document.addEventListener('DOMContentLoaded', async () => {
  initShared('maps');

  const grid = document.getElementById('mapsGrid');

  // Loading skeleton
  if (grid) grid.innerHTML = [...Array(6)].map(() => `<div class="mpc" style="opacity:0.3;height:200px;background:var(--bg3)"></div>`).join('');

  // Check if we have a session for player-specific data
  if (hasSession()) {
    const { name, tag, region } = getSession();

    try {
      const [matchRes, assetRes] = await Promise.allSettled([
        fetchMatches(region, name, tag, 'competitive', 10),
        getMapAssets(),
      ]);

      const matches   = matchRes.status === 'fulfilled' ? matchRes.value.matches : [];
      const mapAssets = assetRes.status  === 'fulfilled' ? assetRes.value         : {};

      if (matches.length > 0) {
        let mapStats = calcMapStats(matches);
        window._mapStats   = mapStats;
        window._mapAssets2 = mapAssets;

        setupMapFilters(true);
        renderMapsGrid(mapStats, mapAssets, true);
        return;
      }
    } catch (err) {
      // Fall through to global data
    }
  }

  // Show global map data
  const globalStats = GLOBAL_MAPS.map(m => ({
    ...m,
    wr: m.matches > 0 ? Math.round((m.wins / m.matches) * 100) : 0,
    kd: m.deaths > 0 ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2),
    acs: Math.round(m.acs),
  }));

  window._mapStats = globalStats;
  window._mapAssets2 = {};
  
  setupMapFilters(false);
  renderMapsGrid(globalStats, {}, false);
});

function setupMapFilters(isPlayerData) {
  document.getElementById('mapSort')?.addEventListener('change', () => {
    renderMapsGrid(window._mapStats, window._mapAssets2, isPlayerData);
  });
}

function renderMapsGrid(mapStats, mapAssets, isPlayerData) {
  const sortF = document.getElementById('mapSort')?.value || 'matches';

  const data = [...mapStats].sort((a, b) => {
    if (sortF === 'wr')  return b.wr  - a.wr;
    if (sortF === 'kd')  return parseFloat(b.kd) - parseFloat(a.kd);
    if (sortF === 'acs') return b.acs - a.acs;
    return b.matches - a.matches;
  });

  const grid = document.getElementById('mapsGrid');
  if (!grid) return;

  if (!data.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
      <p>No map data available.</p>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(m => {
    const asset   = mapAssets[m.name.toLowerCase()];
    const bgImg   = asset?.listViewIcon || asset?.splash || null;
    const bgColor = MAP_COLORS[m.name.toLowerCase()] || `hsl(${(m.name.charCodeAt(0) * 37) % 360},40%,25%)`;
    const matchLabel = isPlayerData ? 'Games' : 'Popularity';
    const matchValue = isPlayerData ? m.matches : `${((m.matches / 50000) * 100).toFixed(1)}%`;

    return `
      <div class="mpc">
        <div class="map-banner" style="${bgImg ? `background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.7)),url('${bgImg}') center/cover` : `background:linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`}">
          ${!bgImg ? `<div class="map-banner-bg">${m.name[0]}</div>` : ''}
          <div class="map-banner-name">${m.name}</div>
        </div>
        <div class="mpc-body">
          <div class="mpc-grid">
            <div class="mms"><div class="mms-val raj">${matchValue}</div><div class="mms-lbl">${matchLabel}</div></div>
            <div class="mms"><div class="mms-val raj" style="color:${kdColor(m.kd)}">${m.kd}</div><div class="mms-lbl">K/D</div></div>
            <div class="mms"><div class="mms-val raj">${m.acs}</div><div class="mms-lbl">ACS</div></div>
            <div class="mms"><div class="mms-val raj" style="color:${m.wr >= 50 ? 'var(--green)' : 'var(--red)'}">${m.wr}%</div><div class="mms-lbl">Win%</div></div>
          </div>
          <div class="mpc-wr">
            <span class="mpc-wr-lbl">Win Rate</span>
            <div class="mpc-wr-bar">
              <div class="mpc-wr-fill" style="width:${m.wr}%;background:${m.wr >= 50 ? 'var(--green)' : 'var(--red)'}"></div>
            </div>
            <span class="mpc-wr-pct raj" style="color:${m.wr >= 50 ? 'var(--green)' : 'var(--red)'}">${m.wr}%</span>
          </div>
        </div>
      </div>`;
  }).join('');
}
