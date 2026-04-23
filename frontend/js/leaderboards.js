/* ============================================================
   VCI ANALYTICS — LEADERBOARDS.JS (dados reais)
============================================================ */

let lbData  = [];
let lbSort  = 'rank';
let lbDir   = 1;
let lbPage  = 1;

document.addEventListener('DOMContentLoaded', async () => {
  initShared('leaderboards');

  // Pré-preenche busca da URL
  const urlQ = new URLSearchParams(window.location.search).get('q');
  if (urlQ) {
    const el = document.getElementById('lbQ');
    if (el) el.value = urlQ;
  }

  const region = getSession().region || 'br';
  document.getElementById('lbReg').value = region;

  await loadLeaderboard(region, 1);

  // Filtros
  document.getElementById('lbReg')?.addEventListener('change', async function () {
    lbPage = 1;
    await loadLeaderboard(this.value, 1);
  });
  document.getElementById('lbQ')?.addEventListener('input', renderLb);
  document.getElementById('lbRnk')?.addEventListener('change', renderLb);
});

async function loadLeaderboard(region, page) {
  const wrap = document.getElementById('lbWrap');
  if (wrap) wrap.innerHTML = `<div style="padding:40px;text-align:center;color:var(--txt3)">Carregando leaderboard...</div>`;

  try {
    const { players } = await fetchLeaderboard(region, page);
    lbData = players;
    renderLb();
  } catch (err) {
    if (wrap) wrap.innerHTML = `<div class="empty"><p>Erro ao carregar: ${err.message}</p></div>`;
  }
}

function renderLb() {
  const q   = (document.getElementById('lbQ')?.value || '').toLowerCase();
  const rnk = document.getElementById('lbRnk')?.value || '';

  let data = lbData.filter(p =>
    (!q   || p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)) &&
    (!rnk || p.tierName === rnk)
  );

  // Sort
  data = [...data].sort((a, b) => {
    if (lbSort === 'rank')   return (a.rank - b.rank) * lbDir;
    if (lbSort === 'mmr')    return (a.rankedRating - b.rankedRating) * lbDir;
    if (lbSort === 'wins')   return (a.wins - b.wins) * lbDir;
    if (lbSort === 'name')   return a.name.localeCompare(b.name) * lbDir;
    return 0;
  });

  const COLS = [
    { k: 'rank', l: '#' }, { k: 'name', l: 'Jogador' },
    { k: 'mmr',  l: 'RR', r: true }, { k: 'tier', l: 'Rank' },
    { k: 'wins', l: 'Vitórias', r: true },
  ];

  const { name: myName, tag: myTag } = getSession();
  const wrap = document.getElementById('lbWrap');
  if (!wrap) return;

  const currentSession = getSession();

  wrap.innerHTML = `
    <div class="lb-head" style="grid-template-columns:52px 2fr 90px 120px 90px">
      ${COLS.map(c => `
        <div class="lb-th ${lbSort === c.k ? 'active' : ''} ${c.r ? 'r' : ''}" data-sort="${c.k}">
          ${c.l}
          ${lbSort === c.k ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${lbDir === 1 ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>` : ''}
        </div>`).join('')}
    </div>
    <div class="lb-body">
      ${data.length
        ? data.slice(0, 50).map(p => `
          <div class="lb-row" style="grid-template-columns:52px 2fr 90px 120px 90px" >
            <div class="lb-rank ${p.rank === 1 ? 'g' : p.rank === 2 ? 's' : p.rank === 3 ? 'b' : ''}">#${p.rank}</div>
            <div class="lb-player">
              <div class="lb-av" style="background:hsl(${(p.name.charCodeAt(0)*47)%360},55%,50%)">${p.name[0]}</div>
              <div>
                <div class="lb-pname">${p.name}</div>
                <div class="lb-ptag">#${p.tag}</div>
              </div>
            </div>
            <div class="lb-cell r raj fw7">${p.rankedRating}</div>
            <div class="lb-cell">
              <span class="rk-badge ${rkBadgeClass(p.tierName)}">${p.tierName}</span>
            </div>
            <div class="lb-cell r">${p.wins} wins</div>
          </div>`).join('')
        : `<div class="empty" style="padding:36px"><p>Nenhum jogador encontrado.</p></div>`}
    </div>
    ${data.length > 50 ? `<div class="lb-more"><button class="btn-more" id="lbMore">Mostrar mais (${data.length - 50} restantes)</button></div>` : ''}
  `;

  // Sort handlers
  wrap.querySelectorAll('.lb-th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (lbSort === k) lbDir *= -1;
      else { lbSort = k; lbDir = 1; }
      renderLb();
    });
  });
}

// rkBadgeClass já definida em shared.js
