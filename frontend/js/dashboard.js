/* ============================================================
   VCI ANALYTICS — DASHBOARD.JS (dados reais da API)
============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initShared('dashboard');

  if (!hasSession()) { window.location.href = 'index.html'; return; }

  const { name, tag, region } = getSession();
  updateSidebarPlayer(name, tag);

  document.getElementById('mmrTabs')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.ft');
    if (!btn) return;
    document.querySelectorAll('#mmrTabs .ft').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    try {
      const hist = await fetchMMRHistory(region, name, tag);
      buildMmrChartReal(hist.history, parseInt(btn.dataset.r));
    } catch { buildMmrChart(parseInt(btn.dataset.r)); }
  });

  window.addEventListener('resize', () => { mmrChartInst?.resize(); radarChartInst?.resize(); });

  const [accountRes, mmrRes, matchRes, histRes] = await Promise.allSettled([
    fetchAccount(name, tag),
    fetchMMR(region, name, tag),
    fetchMatches(region, name, tag, 'competitive', 10),
    fetchMMRHistory(region, name, tag),
  ]);

  const account = accountRes.status === 'fulfilled' ? accountRes.value : null;
  const mmr     = mmrRes.status     === 'fulfilled' ? mmrRes.value     : null;
  const matches = matchRes.status   === 'fulfilled' ? matchRes.value.matches : [];
  const hist    = histRes.status    === 'fulfilled' ? histRes.value.history  : [];

  renderHero(account, mmr, name, tag);

  if (matches.length) {
    const stats = calcOverallStats(matches);
    if (stats) renderStatCards(stats);
    renderInsights(stats, matches);
    renderAgentsWidget(matches);
    buildRadarChartReal(matches);
  } else {
    document.getElementById('insightBox').innerHTML =
      '<div class="empty"><p>Nenhuma partida competitiva encontrada.</p></div>';
    buildRadarChart();
  }

  setTimeout(() => buildMmrChartReal(hist, 30), 60);
});

function updateSidebarPlayer(name, tag) {
  const nameEl = document.querySelector('.sb-uname');
  const rnkEl  = document.querySelector('.sb-urank');
  if (nameEl) nameEl.textContent = `${name}#${tag}`;
  if (rnkEl)  rnkEl.textContent  = 'Carregando...';
}

function renderHero(account, mmr, name, tag) {
  setText('heroName',    account?.name   || name);
  setText('heroTag',     '#' + (account?.tag || tag));
  setText('heroRegion',  regionLabel(account?.region || getSession().region));
  setText('heroPeak',    mmr?.highestTier || '—');
  setText('heroRank',    mmr?.currentTierName || '—');
  setText('heroRR',      mmr ? mmr.rankingInTier + ' RR' : '—');
  setText('heroMatches', '—');
  setText('heroLevel',   account ? 'Nível ' + account.accountLevel : '—');
  const sbRnk = document.querySelector('.sb-urank');
  if (sbRnk && mmr) sbRnk.textContent = mmr.currentTierName + ' · ' + mmr.rankingInTier + ' RR';
}

function renderStatCards(stats) {
  const cards = {
    'stat-wr':  { val: stats.wr + '%',   sub: stats.wins + 'V ' + stats.losses + 'D — ' + stats.matches + ' partidas' },
    'stat-kd':  { val: stats.kd,          sub: 'KDA ' + stats.kda + ' · Kills médias ' + stats.avgKills },
    'stat-acs': { val: stats.avgAcs,      sub: 'Kills ' + stats.avgKills + ' / Deaths ' + stats.avgDeaths },
    'stat-hs':  { val: stats.avgHs + '%', sub: 'Últimas ' + stats.matches + ' partidas competitivas' },
  };
  for (const [id, d] of Object.entries(cards)) {
    const card = document.getElementById(id);
    if (!card) continue;
    const v = card.querySelector('.sc-val');
    const s = card.querySelector('.sc-sub');
    if (v) v.textContent = d.val;
    if (s) { s.textContent = d.sub; s.className = 'sc-sub'; }
  }
}

async function renderAgentsWidget(matches) {
  const tbl = document.getElementById('dashAgents');
  if (!tbl) return;
  const agStats = calcAgentStats(matches).slice(0, 5);
  const assets  = await getAgentAssets();

  tbl.innerHTML = '<thead><tr>' +
    '<th>Agente</th><th>Role</th><th class="r">Games</th><th class="r">K/D</th><th class="r">ACS</th><th>Win%</th>' +
    '</tr></thead><tbody>' +
    agStats.map(a => {
      const asset = assets[a.name.toLowerCase()];
      const clr   = agentColor(a.name);
      const role  = asset?.role || '—';
      return '<tr><td><div class="ag-cell">' +
        (asset?.displayIcon
          ? '<img src="' + asset.displayIcon + '" width="32" height="32" style="border-radius:5px;object-fit:cover">'
          : '<div class="ag-icon" style="background:' + clr + '22;color:' + clr + '">' + a.name[0] + '</div>') +
        '<span class="ag-name">' + a.name + '</span></div></td>' +
        '<td><span class="rb ' + roleClass(role) + '">' + role + '</span></td>' +
        '<td class="r">' + a.matches + '</td>' +
        '<td class="r raj fw7" style="color:' + kdColor(a.kd) + '">' + a.kd + '</td>' +
        '<td class="r raj fw7">' + a.acs + '</td>' +
        '<td><div class="wr-bar"><div class="wr-bg"><div class="wr-fill" style="width:' + a.wr + '%;background:' + (a.wr>=55?'var(--green)':'var(--red)') + '"></div></div>' +
        '<span style="font-size:11px;font-weight:700;color:' + (a.wr>=55?'var(--green)':'var(--red)') + ';min-width:30px">' + a.wr + '%</span></div></td></tr>';
    }).join('') + '</tbody>';
}

function renderInsights(stats, matches) {
  const box = document.getElementById('insightBox');
  if (!box || !stats) return;
  const ins = [];
  if (stats.wr >= 55) ins.push({ t:'positive', title:'Win Rate Positiva',         msg: stats.wr + '% de vitórias. Performance acima da média do rank.',               badge:'Força' });
  else if (stats.wr <= 45) ins.push({ t:'critical', title:'Win Rate Abaixo da Média', msg: stats.wr + '% de vitórias. Foque em agentes com maior impacto nos rounds.',    badge:'Crítico' });
  else                 ins.push({ t:'warning',  title:'Win Rate Equilibrada',      msg: stats.wr + '% — próxima de 50%. Melhorar first blood rate faz diferença.',   badge:'Atenção' });
  if (parseFloat(stats.kd) >= 1.4)     ins.push({ t:'positive', title:'KD Excelente', msg:'K/D ' + stats.kd + ' — entre os melhores do rank.', badge:'Força' });
  else if (parseFloat(stats.kd) < 1.0) ins.push({ t:'critical', title:'KD Negativo',  msg:'K/D ' + stats.kd + ' — você morre mais do que mata. Foque em sobrevivência.', badge:'Crítico' });
  if (stats.avgHs >= 25) ins.push({ t:'positive', title:'HS% Destaque', msg: stats.avgHs + '% de headshots — mira afiada.', badge:'Força' });
  const agStats = calcAgentStats(matches);
  const topPct  = agStats.length ? Math.round((agStats[0].matches / stats.matches) * 100) : 0;
  if (topPct >= 70) ins.push({ t:'warning', title:'Pool de Agentes Limitado', msg: topPct + '% das partidas com ' + agStats[0].name + '. Adversários podem contra-pickar.', badge:'Atenção' });
  const mapSt = calcMapStats(matches).sort((a,b) => a.wr - b.wr)[0];
  if (mapSt && mapSt.wr <= 40 && mapSt.matches >= 3) ins.push({ t:'warning', title:'Fraqueza em ' + mapSt.name, msg: mapSt.wr + '% de vitórias em ' + mapSt.name + '. Estude rotações e callouts.', badge:'Melhorar' });

  box.innerHTML = '<div class="ins-list">' +
    ins.slice(0,4).map(i =>
      '<div class="ins-item ' + i.t + '"><div class="ins-head">' +
      '<span class="ins-title">' + i.title + '</span>' +
      '<span class="ins-badge ' + (i.t==='positive'?'bp':i.t==='warning'?'bw':'bc') + '">' + i.badge + '</span>' +
      '</div><p class="ins-msg">' + i.msg + '</p></div>'
    ).join('') + '</div>';
}

function buildMmrChartReal(history, days) {
  const ctx = document.getElementById('mmrChart');
  if (!ctx) return;
  if (mmrChartInst) mmrChartInst.destroy();
  const slice = (history || []).slice(-days);
  if (!slice.length) { buildMmrChart(days); return; }
  const labels = slice.map(h => { const d = new Date(h.date); return (d.getDate()) + '/' + (d.getMonth()+1); });
  const vals   = slice.map(h => (h.tier * 100) + (h.elo || 0));
  const mn = Math.min(...vals) - 50;
  const mx = Math.max(...vals) + 50;
  mmrChartInst = new Chart(ctx, {
    type:'line', data:{ labels, datasets:[{ data:vals, borderColor:'#ff4655',
      backgroundColor: c => { const g=c.chart.ctx.createLinearGradient(0,0,0,250); g.addColorStop(0,'rgba(255,70,85,0.2)'); g.addColorStop(1,'rgba(255,70,85,0)'); return g; },
      borderWidth:2, pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#ff4655', tension:0.4, fill:true }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1c2333', titleColor:'#ece8e1', bodyColor:'#9ba4b2',
        borderColor:'rgba(255,255,255,0.07)', borderWidth:1, padding:9, displayColors:false,
        callbacks:{ label: c => { const h=slice[c.dataIndex]; return ['RR: '+h.elo, h.tierName, (h.mmrChange>0?'+':'')+h.mmrChange]; } }
      }},
      scales:{
        x:{ grid:{color:'rgba(255,255,255,0.04)'}, border:{display:false}, ticks:{color:'#5c6575',font:{size:9.5},maxTicksLimit:10} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, border:{display:false}, ticks:{color:'#5c6575',font:{size:9.5}}, min:mn, max:mx }
      }, interaction:{intersect:false,mode:'index'} }
  });
}

function buildRadarChartReal(matches) {
  if (!matches.length) { buildRadarChart(); return; }
  const s   = calcOverallStats(matches);
  const aim = Math.min(100, Math.round((matches.reduce((a,m)=>a+m.hs,0)/matches.length)*2.5));
  const fr  = Math.min(100, Math.round(parseFloat(s.kd)*50));
  const co  = Math.min(100, Math.round(s.wr*1.2));
  const im  = Math.min(100, Math.round((s.avgAcs/300)*100));
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;
  if (radarChartInst) radarChartInst.destroy();
  radarChartInst = new Chart(ctx, {
    type:'radar',
    data:{ labels:['Aim','Fragging','Win Rate','Impact','Consistency','Economy'],
      datasets:[
        { label:'Você',     data:[aim,fr,co,im,Math.min(100,co-5),Math.min(100,im-10)], borderColor:'#ff4655', backgroundColor:'rgba(255,70,85,0.13)', borderWidth:2, pointBackgroundColor:'#ff4655', pointRadius:3 },
        { label:'Rank Avg', data:[60,60,60,60,60,60], borderColor:'#3ddcb0', backgroundColor:'rgba(61,220,176,0.07)', borderWidth:1.5, pointBackgroundColor:'#3ddcb0', pointRadius:2 }
      ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'bottom',labels:{color:'#9ba4b2',padding:12,font:{size:10}}}},
      scales:{r:{grid:{color:'rgba(255,255,255,0.06)'},angleLines:{color:'rgba(255,255,255,0.06)'},pointLabels:{color:'#9ba4b2',font:{size:10}},ticks:{display:false},min:0,max:100}}
    }
  });
}

function setText(id, v) { const el=document.getElementById(id); if(el) el.textContent=v; }
function regionLabel(r) { return {br:'Brazil',na:'North America',eu:'Europe',ap:'Asia Pacific',kr:'Korea',latam:'LATAM'}[r?.toLowerCase()]||r||'—'; }
