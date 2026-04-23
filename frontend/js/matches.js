/* ============================================================
   VCI ANALYTICS — MATCHES.JS (dados reais)
============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initShared('matches');
  if (!hasSession()) { window.location.href = 'index.html'; return; }

  const { name, tag, region } = getSession();

  // Carrega partidas
  setLoading(true);
  try {
    const { matches } = await fetchMatches(region, name, tag, 'competitive', 10);
    window._matches = matches; // cache local para filtros

    populateFilters(matches);
    renderMatches(matches);
  } catch (err) {
    document.getElementById('matchList').innerHTML = errorState(err.message);
  }
  setLoading(false);

  // Filtro event listeners
  ['mfAgent', 'mfMap', 'mfResult'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      renderMatches(applyFilters(window._matches || []));
    });
  });
  document.getElementById('clearMf')?.addEventListener('click', () => {
    ['mfAgent', 'mfMap', 'mfResult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderMatches(window._matches || []);
  });

  // Botão "Carregar mais" — busca próxima página
  document.getElementById('loadMoreBtn')?.addEventListener('click', async () => {
    document.getElementById('loadMoreBtn').textContent = 'Carregando...';
    // HenrikDev API limita a 10 por chamada.
    // Para mais, precisaria de paginação via PUUID — aqui exibimos aviso.
    showToast('A API retorna no máximo 10 partidas por chamada com plano Basic.', 'warn');
    document.getElementById('loadMoreBtn').textContent = 'Carregar mais';
  });
});

function setLoading(on) {
  const container = document.getElementById('matchList');
  if (on && container) {
    container.innerHTML = `
      ${[...Array(5)].map(() => `
        <div class="mr" style="opacity:0.4">
          <div style="height:40px;background:var(--bg4);border-radius:4px"></div>
          <div style="height:40px;background:var(--bg4);border-radius:4px"></div>
          <div style="height:40px;background:var(--bg4);border-radius:4px"></div>
        </div>`).join('')}`;
  }
}

function populateFilters(matches) {
  const agents = [...new Set(matches.map(m => m.agent))].sort();
  const maps   = [...new Set(matches.map(m => m.map))].sort();

  const af = document.getElementById('mfAgent');
  const mf = document.getElementById('mfMap');

  if (af && af.options.length <= 1) agents.forEach(a => { const o = document.createElement('option'); o.value = a; o.textContent = a; af.appendChild(o); });
  if (mf && mf.options.length <= 1) maps.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; mf.appendChild(o); });
}

function applyFilters(matches) {
  const af = document.getElementById('mfAgent')?.value  || '';
  const mf = document.getElementById('mfMap')?.value    || '';
  const rf = document.getElementById('mfResult')?.value || '';
  return matches.filter(m =>
    (!af || m.agent === af) && (!mf || m.map === mf) && (!rf || m.res === rf)
  );
}

function renderMatches(matches) {
  const container = document.getElementById('matchList');
  if (!container) return;

  if (!matches.length) {
    container.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <p>Nenhuma partida encontrada.</p>
    </div>`;
    return;
  }

  const clr = agentColor;

  container.innerHTML = matches.map(m => `
    <div class="mr ${m.result}">
      <div class="mr-res">
        <div class="res">${m.result === 'win' ? 'V' : 'D'}</div>
        <div class="sc">${m.score}</div>
      </div>
      <div class="mr-agent">
        <div class="mr-icon" style="background:${clr(m.agent)}22;color:${clr(m.agent)}">
          ${m.agentId
            ? `<img src="${m.agentId}" width="38" height="38" style="border-radius:7px;object-fit:cover">`
            : m.agent[0]}
        </div>
        <div>
          <div class="mr-aname">${m.agent}</div>
          <div class="mr-map">${m.map}</div>
        </div>
      </div>
      <div class="mr-time">
        <span>${timeAgo(m.startedAt)}</span>
        <span style="color:var(--txt3);margin-top:2px">${m.mode || 'Competitive'}</span>
      </div>
      <div class="mr-stat">
        <div class="mr-stat-val">${m.kills}/${m.deaths}/${m.assists}</div>
        <div class="mr-stat-lbl">KDA</div>
      </div>
      <div class="mr-stat">
        <div class="mr-stat-val ${parseFloat(m.kd) >= 1.4 ? 'kd-g' : parseFloat(m.kd) >= 1 ? 'kd-y' : 'kd-r'}">${m.kd}</div>
        <div class="mr-stat-lbl">K/D</div>
      </div>
      <div class="mr-stat">
        <div class="mr-stat-val">${m.acs}</div>
        <div class="mr-stat-lbl">ACS</div>
      </div>
      <div class="mr-stat">
        <div class="mr-stat-val">${m.hs}%</div>
        <div class="mr-stat-lbl">HS%</div>
      </div>
    </div>
  `).join('');
}

function errorState(msg) {
  return `<div class="empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <p>Erro ao carregar partidas: ${msg}</p>
  </div>`;
}
