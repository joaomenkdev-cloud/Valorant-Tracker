/* ============================================================
   VCI ANALYTICS — AGENTS.JS (dados reais)
============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initShared('agents');
  if (!hasSession()) { window.location.href = 'index.html'; return; }

  const { name, tag, region } = getSession();

  setGridLoading('agentsGrid');

  try {
    const [matchRes, assetRes] = await Promise.allSettled([
      fetchMatches(region, name, tag, 'competitive', 10),
      getAgentAssets(),
    ]);

    const matches = matchRes.status === 'fulfilled' ? matchRes.value.matches : [];
    const assets  = assetRes.status  === 'fulfilled' ? assetRes.value         : {};

    let agentStats = calcAgentStats(matches);

    document.getElementById('roleFilter')?.addEventListener('change', () => {
      renderAgentsGrid(agentStats, assets);
    });
    document.getElementById('agentSort')?.addEventListener('change', () => {
      renderAgentsGrid(agentStats, assets);
    });

    renderAgentsGrid(agentStats, assets);

  } catch (err) {
    document.getElementById('agentsGrid').innerHTML = `<div class="empty" style="grid-column:1/-1"><p>Erro: ${err.message}</p></div>`;
  }
});

function renderAgentsGrid(agentStats, assets) {
  const roleF = document.getElementById('roleFilter')?.value || '';
  const sortF = document.getElementById('agentSort')?.value  || 'matches';

  let data = agentStats.filter(a => {
    if (!roleF) return true;
    const asset = assets[a.name.toLowerCase()];
    return asset?.role === roleF;
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
      <p>Sem dados de agentes disponíveis.</p>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(a => {
    const asset = assets[a.name.toLowerCase()];
    const clr   = agentColor(a.name);
    const role  = asset?.role || '—';

    return `
      <div class="apc">
        <div class="apc-top">
          <div class="apc-icon" style="background:${clr}22;color:${clr}">
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
          <div class="ams"><div class="ams-val raj">${a.matches}</div><div class="ams-lbl">Partidas</div></div>
          <div class="ams"><div class="ams-val raj" style="color:${kdColor(a.kd)}">${a.kd}</div><div class="ams-lbl">K/D</div></div>
          <div class="ams"><div class="ams-val raj">${a.acs}</div><div class="ams-lbl">ACS</div></div>
          <div class="ams"><div class="ams-val raj">${a.hs}%</div><div class="ams-lbl">HS%</div></div>
        </div>
        <div class="apc-wr">
          <span class="apc-wr-lbl">Win Rate</span>
          <div class="apc-wr-bar">
            <div class="apc-wr-fill" style="width:${a.wr}%;background:${a.wr >= 55 ? 'var(--green)' : 'var(--red)'}"></div>
          </div>
          <span class="apc-wr-pct raj" style="color:${a.wr >= 55 ? 'var(--green)' : 'var(--red)'}">${a.wr}%</span>
        </div>
      </div>`;
  }).join('');
}

function setGridLoading(id) {
  const g = document.getElementById(id);
  if (g) g.innerHTML = [...Array(6)].map(() => `<div class="apc" style="opacity:0.3;height:220px;background:var(--bg3)"></div>`).join('');
}
