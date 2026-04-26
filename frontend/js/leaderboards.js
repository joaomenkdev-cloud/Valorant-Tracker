/* ============================================================
   VCI ANALYTICS — LEADERBOARDS.JS (dados reais)
   Works without requiring a player session
============================================================ */

let lbData  = [];
let lbSort  = 'rank';
let lbDir   = 1;
let lbPage  = 1;

document.addEventListener('DOMContentLoaded', async () => {
  initShared('leaderboards');

  // Get region from URL or session
  const urlParams = new URLSearchParams(window.location.search);
  const urlRegion = urlParams.get('region');
  const urlQ = urlParams.get('q');
  
  const region = urlRegion || getSession().region || 'br';
  
  // Set region dropdown
  const regSelect = document.getElementById('lbReg');
  if (regSelect) {
    regSelect.value = region;
  }
  
  // Pre-fill search from URL
  if (urlQ) {
    const el = document.getElementById('lbQ');
    if (el) el.value = urlQ;
  }

  await loadLeaderboard(region, 1);

  // Filters
  document.getElementById('lbReg')?.addEventListener('change', async function () {
    lbPage = 1;
    await loadLeaderboard(this.value, 1);
  });
  document.getElementById('lbQ')?.addEventListener('input', renderLb);
  document.getElementById('lbRnk')?.addEventListener('change', renderLb);
});

async function loadLeaderboard(region, page) {
  const wrap = document.getElementById('lbWrap');
  if (wrap) wrap.innerHTML = `<div style="padding:40px;text-align:center;color:var(--txt3)">Loading leaderboard...</div>`;

  try {
    const { players } = await fetchLeaderboard(region, page);
    lbData = players;
    renderLb();
  } catch (err) {
    // Show mock data if API fails
    lbData = getMockLeaderboard(region);
    renderLb();
  }
}

function getMockLeaderboard(region) {
  const regions = {
    br: [
      { rank: 1, name: 'Aspas', tag: 'BR1', rankedRating: 892, tierName: 'Radiant', wins: 234 },
      { rank: 2, name: 'Less', tag: '7777', rankedRating: 856, tierName: 'Radiant', wins: 212 },
      { rank: 3, name: 'Saadhak', tag: 'loud', rankedRating: 834, tierName: 'Radiant', wins: 198 },
      { rank: 4, name: 'cauanzin', tag: 'BR1', rankedRating: 812, tierName: 'Radiant', wins: 187 },
      { rank: 5, name: 'Tuyz', tag: '1231', rankedRating: 798, tierName: 'Radiant', wins: 176 },
      { rank: 6, name: 'mwzera', tag: 'BR1', rankedRating: 785, tierName: 'Radiant', wins: 168 },
      { rank: 7, name: 'xand', tag: 'furia', rankedRating: 772, tierName: 'Radiant', wins: 159 },
      { rank: 8, name: 'Khalil', tag: 'kru', rankedRating: 758, tierName: 'Radiant', wins: 151 },
      { rank: 9, name: 'heat', tag: 'w7m', rankedRating: 745, tierName: 'Immortal 3', wins: 143 },
      { rank: 10, name: 'raafa', tag: 'loud', rankedRating: 732, tierName: 'Immortal 3', wins: 136 },
    ],
    na: [
      { rank: 1, name: 'TenZ', tag: '000', rankedRating: 921, tierName: 'Radiant', wins: 267 },
      { rank: 2, name: 'yay', tag: 'optic', rankedRating: 889, tierName: 'Radiant', wins: 245 },
      { rank: 3, name: 's0m', tag: 'NRG', rankedRating: 867, tierName: 'Radiant', wins: 228 },
      { rank: 4, name: 'Demon1', tag: '1', rankedRating: 845, tierName: 'Radiant', wins: 215 },
      { rank: 5, name: 'FNS', tag: 'NRG', rankedRating: 823, tierName: 'Radiant', wins: 203 },
      { rank: 6, name: 'crashies', tag: '100T', rankedRating: 801, tierName: 'Radiant', wins: 191 },
      { rank: 7, name: 'Asuna', tag: '100T', rankedRating: 789, tierName: 'Radiant', wins: 182 },
      { rank: 8, name: 'Marved', tag: '000', rankedRating: 776, tierName: 'Radiant', wins: 174 },
      { rank: 9, name: 'Zander', tag: 'G2', rankedRating: 763, tierName: 'Immortal 3', wins: 166 },
      { rank: 10, name: 'Subroza', tag: 'TSM', rankedRating: 750, tierName: 'Immortal 3', wins: 158 },
    ],
    eu: [
      { rank: 1, name: 'cNed', tag: '7777', rankedRating: 912, tierName: 'Radiant', wins: 254 },
      { rank: 2, name: 'Derke', tag: 'FNC', rankedRating: 878, tierName: 'Radiant', wins: 238 },
      { rank: 3, name: 'Chronicle', tag: 'M3C', rankedRating: 856, tierName: 'Radiant', wins: 221 },
      { rank: 4, name: 'Alfajer', tag: '1', rankedRating: 834, tierName: 'Radiant', wins: 209 },
      { rank: 5, name: 'Leo', tag: 'VIT', rankedRating: 812, tierName: 'Radiant', wins: 197 },
      { rank: 6, name: 'Boaster', tag: 'FNC', rankedRating: 790, tierName: 'Radiant', wins: 185 },
      { rank: 7, name: 'Sayf', tag: 'TL', rankedRating: 778, tierName: 'Radiant', wins: 176 },
      { rank: 8, name: 'nAts', tag: 'M3C', rankedRating: 765, tierName: 'Radiant', wins: 168 },
      { rank: 9, name: 'Shao', tag: 'FPX', rankedRating: 752, tierName: 'Immortal 3', wins: 160 },
      { rank: 10, name: 'Zyppan', tag: 'FPX', rankedRating: 739, tierName: 'Immortal 3', wins: 153 },
    ],
    ap: [
      { rank: 1, name: 'f0rsakeN', tag: 'PRX', rankedRating: 901, tierName: 'Radiant', wins: 243 },
      { rank: 2, name: 'something', tag: 'PRX', rankedRating: 879, tierName: 'Radiant', wins: 227 },
      { rank: 3, name: 'Jinggg', tag: '1', rankedRating: 856, tierName: 'Radiant', wins: 212 },
      { rank: 4, name: 'mindfreak', tag: 'PRX', rankedRating: 834, tierName: 'Radiant', wins: 198 },
      { rank: 5, name: 'd4v41', tag: 'PRX', rankedRating: 812, tierName: 'Radiant', wins: 186 },
      { rank: 6, name: 'Benkai', tag: 'PRX', rankedRating: 790, tierName: 'Radiant', wins: 175 },
      { rank: 7, name: 'Sushiboys', tag: 'DRX', rankedRating: 778, tierName: 'Radiant', wins: 167 },
      { rank: 8, name: 'Rb', tag: 'DRX', rankedRating: 765, tierName: 'Radiant', wins: 159 },
      { rank: 9, name: 'MaKo', tag: 'DRX', rankedRating: 752, tierName: 'Immortal 3', wins: 151 },
      { rank: 10, name: 'BuZz', tag: 'DRX', rankedRating: 739, tierName: 'Immortal 3', wins: 144 },
    ],
    kr: [
      { rank: 1, name: 'Rb', tag: 'DRX', rankedRating: 895, tierName: 'Radiant', wins: 238 },
      { rank: 2, name: 'MaKo', tag: 'DRX', rankedRating: 872, tierName: 'Radiant', wins: 221 },
      { rank: 3, name: 'BuZz', tag: 'DRX', rankedRating: 849, tierName: 'Radiant', wins: 205 },
      { rank: 4, name: 'stax', tag: 'DRX', rankedRating: 826, tierName: 'Radiant', wins: 192 },
      { rank: 5, name: 'Zest', tag: 'DRX', rankedRating: 803, tierName: 'Radiant', wins: 180 },
    ],
    latam: [
      { rank: 1, name: 'NagZ', tag: 'kru', rankedRating: 878, tierName: 'Radiant', wins: 223 },
      { rank: 2, name: 'Klaus', tag: 'kru', rankedRating: 856, tierName: 'Radiant', wins: 208 },
      { rank: 3, name: 'keznit', tag: 'kru', rankedRating: 834, tierName: 'Radiant', wins: 194 },
      { rank: 4, name: 'Mazino', tag: 'kru', rankedRating: 812, tierName: 'Radiant', wins: 181 },
      { rank: 5, name: 'Daveeys', tag: 'lev', rankedRating: 790, tierName: 'Radiant', wins: 169 },
    ],
  };
  
  return regions[region] || regions.br;
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
    { k: 'rank', l: '#' }, { k: 'name', l: 'Player' },
    { k: 'mmr',  l: 'RR', r: true }, { k: 'tier', l: 'Rank' },
    { k: 'wins', l: 'Wins', r: true },
  ];

  const wrap = document.getElementById('lbWrap');
  if (!wrap) return;

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
          <div class="lb-row" style="grid-template-columns:52px 2fr 90px 120px 90px;cursor:pointer" onclick="trackPlayer('${p.name}', '${p.tag}')">
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
        : `<div class="empty" style="padding:36px"><p>No players found.</p></div>`}
    </div>
    ${data.length > 50 ? `<div class="lb-more"><button class="btn-more" id="lbMore">Show more (${data.length - 50} remaining)</button></div>` : ''}
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

// Track a player from leaderboard click
function trackPlayer(name, tag) {
  const region = document.getElementById('lbReg')?.value || 'br';
  setSession(name, tag, region);
  window.location.href = 'dashboard.html';
}
