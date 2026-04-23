/* ============================================================
   VCI ANALYTICS — MAPS.JS (dados reais)
============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initShared('maps');
  if (!hasSession()) { window.location.href = 'index.html'; return; }

  const { name, tag, region } = getSession();
  const grid = document.getElementById('mapsGrid');

  // Loading skeleton
  if (grid) grid.innerHTML = [...Array(6)].map(() => `<div class="mpc" style="opacity:0.3;height:200px;background:var(--bg3)"></div>`).join('');

  try {
    const [matchRes, assetRes] = await Promise.allSettled([
      fetchMatches(region, name, tag, 'competitive', 10),
      getMapAssets(),
    ]);

    const matches   = matchRes.status === 'fulfilled' ? matchRes.value.matches : [];
    const mapAssets = assetRes.status  === 'fulfilled' ? assetRes.value         : {};

    let mapStats = calcMapStats(matches);
    window._mapStats   = mapStats;
    window._mapAssets2 = mapAssets;

    document.getElementById('mapSort')?.addEventListener('change', () => {
      renderMapsGrid(window._mapStats, window._mapAssets2);
    });

    renderMapsGrid(mapStats, mapAssets);
  } catch (err) {
    if (grid) grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><p>Erro: ${err.message}</p></div>`;
  }
});

function renderMapsGrid(mapStats, mapAssets) {
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
      <p>Sem dados de mapas disponíveis.</p>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(m => {
    const asset   = mapAssets[m.name.toLowerCase()];
    const bgImg   = asset?.listViewIcon || asset?.splash || null;
    const bgColor = `hsl(${(m.name.charCodeAt(0) * 37) % 360},40%,20%)`;

    return `
      <div class="mpc">
        <div class="map-banner" style="${bgImg ? `background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.7)),url('${bgImg}') center/cover` : `background:${bgColor}`}">
          ${!bgImg ? `<div class="map-banner-bg">${m.name[0]}</div>` : ''}
          <div class="map-banner-name">${m.name}</div>
        </div>
        <div class="mpc-body">
          <div class="mpc-grid">
            <div class="mms"><div class="mms-val raj">${m.matches}</div><div class="mms-lbl">Games</div></div>
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
