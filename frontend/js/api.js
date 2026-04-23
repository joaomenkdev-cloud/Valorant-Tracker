/* ============================================================
   VCI ANALYTICS — API.JS
   Serviço de comunicação com o backend Node.js
   
   CONFIGURAÇÃO: mude BASE_URL para o endereço do seu servidor
   Em desenvolvimento: http://localhost:3001
   Em produção:        https://seuservidor.com
============================================================ */

const API_CONFIG = {
  BASE_URL:    'http://localhost:3001/api',
  DEFAULT_REGION: 'br',
};

/* ── Estado da sessão (jogador logado) ── */
let SESSION = {
  name:   null,
  tag:    null,
  region: 'br',
  puuid:  null,
};

/* ============================================================
   HELPERS
============================================================ */
async function apiFetch(endpoint) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const res  = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Erro ${res.status}`);
  }
  return json;
}

function setSession(name, tag, region = 'br') {
  SESSION = { name, tag, region: region.toLowerCase(), puuid: null };
  // Persiste na sessão do browser
  sessionStorage.setItem('vci_player', JSON.stringify({ name, tag, region }));
}

function getSession() {
  const stored = sessionStorage.getItem('vci_player');
  if (stored) {
    const p = JSON.parse(stored);
    SESSION.name   = p.name;
    SESSION.tag    = p.tag;
    SESSION.region = p.region || 'br';
  }
  return SESSION;
}

function hasSession() {
  const s = getSession();
  return !!(s.name && s.tag);
}

function clearSession() {
  SESSION = { name: null, tag: null, region: 'br', puuid: null };
  sessionStorage.removeItem('vci_player');
}

/* ============================================================
   ENDPOINTS
============================================================ */

/**
 * Busca conta de um jogador por nome#tag
 */
async function fetchAccount(name, tag) {
  return apiFetch(`/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

/**
 * Busca rank/MMR atual do jogador
 */
async function fetchMMR(region, name, tag) {
  return apiFetch(`/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

/**
 * Busca histórico de MMR para o gráfico
 */
async function fetchMMRHistory(region, name, tag) {
  return apiFetch(`/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

/**
 * Busca histórico de partidas
 * @param {string} mode - competitive | unrated | deathmatch | etc
 * @param {number} size - 1-10
 */
async function fetchMatches(region, name, tag, mode = 'competitive', size = 10) {
  return apiFetch(`/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=${mode}&size=${size}`);
}

/**
 * Busca detalhes de uma partida específica
 */
async function fetchMatch(matchId) {
  return apiFetch(`/match/${matchId}`);
}

/**
 * Busca o leaderboard de uma região
 */
async function fetchLeaderboard(region = 'br', page = 1) {
  return apiFetch(`/leaderboard/${region}?page=${page}`);
}

/**
 * Busca assets dos agentes (imagens, roles)
 */
async function fetchAgentAssets() {
  return apiFetch('/assets/agents');
}

/**
 * Busca assets dos mapas (imagens)
 */
async function fetchMapAssets() {
  return apiFetch('/assets/maps');
}

/* ============================================================
   UTILITÁRIOS DE DADOS
============================================================ */

/**
 * Dado um array de partidas, calcula stats agregadas por agente
 */
function calcAgentStats(matches) {
  const map = {};
  for (const m of matches) {
    if (!map[m.agent]) {
      map[m.agent] = { name: m.agent, matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, acs: 0, hs: 0 };
    }
    const ag = map[m.agent];
    ag.matches++;
    if (m.result === 'win') ag.wins++;
    ag.kills   += m.kills;
    ag.deaths  += m.deaths;
    ag.assists += m.assists;
    ag.acs     += m.acs;
    ag.hs      += m.hs;
  }

  return Object.values(map).map(ag => ({
    ...ag,
    wr:  ag.matches > 0 ? Math.round((ag.wins / ag.matches) * 100) : 0,
    kd:  ag.deaths > 0  ? (ag.kills / ag.deaths).toFixed(2) : ag.kills.toFixed(2),
    acs: ag.matches > 0 ? Math.round(ag.acs / ag.matches) : 0,
    hs:  ag.matches > 0 ? Math.round(ag.hs  / ag.matches) : 0,
  })).sort((a, b) => b.matches - a.matches);
}

/**
 * Dado um array de partidas, calcula stats agregadas por mapa
 */
function calcMapStats(matches) {
  const map = {};
  for (const m of matches) {
    if (!map[m.map]) {
      map[m.map] = { name: m.map, matches: 0, wins: 0, kills: 0, deaths: 0, acs: 0 };
    }
    const mp = map[m.map];
    mp.matches++;
    if (m.result === 'win') mp.wins++;
    mp.kills  += m.kills;
    mp.deaths += m.deaths;
    mp.acs    += m.acs;
  }

  return Object.values(map).map(mp => ({
    ...mp,
    wr:  mp.matches > 0 ? Math.round((mp.wins / mp.matches) * 100) : 0,
    kd:  mp.deaths > 0  ? (mp.kills / mp.deaths).toFixed(2) : mp.kills.toFixed(2),
    acs: mp.matches > 0 ? Math.round(mp.acs / mp.matches) : 0,
  })).sort((a, b) => b.matches - a.matches);
}

/**
 * Dado histórico de MMR, calcula a variação de WR nos últimos N jogos
 */
function calcOverallStats(matches) {
  if (!matches.length) return null;
  const total = matches.length;
  const wins  = matches.filter(m => m.result === 'win').length;
  const kills   = matches.reduce((s, m) => s + m.kills, 0);
  const deaths  = matches.reduce((s, m) => s + m.deaths, 0);
  const assists = matches.reduce((s, m) => s + m.assists, 0);
  const acs     = matches.reduce((s, m) => s + m.acs, 0);
  const hs      = matches.reduce((s, m) => s + m.hs, 0);

  return {
    matches:  total,
    wins,
    losses:   total - wins,
    wr:       Math.round((wins / total) * 100),
    kd:       deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2),
    kda:      deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2),
    avgKills:   (kills   / total).toFixed(1),
    avgDeaths:  (deaths  / total).toFixed(1),
    avgAssists: (assists / total).toFixed(1),
    avgAcs:   Math.round(acs / total),
    avgHs:    Math.round(hs  / total),
  };
}

/* ============================================================
   CACHE DE ASSETS (agentes/mapas com imagens reais)
============================================================ */
let _agentAssets = null;
let _mapAssets   = null;

async function getAgentAssets() {
  if (_agentAssets) return _agentAssets;
  try {
    const { agents } = await fetchAgentAssets();
    _agentAssets = {};
    for (const a of agents) {
      _agentAssets[a.name.toLowerCase()] = a;
    }
  } catch {
    _agentAssets = {};
  }
  return _agentAssets;
}

async function getMapAssets() {
  if (_mapAssets) return _mapAssets;
  try {
    const { maps } = await fetchMapAssets();
    _mapAssets = {};
    for (const m of maps) {
      _mapAssets[m.name.toLowerCase()] = m;
    }
  } catch {
    _mapAssets = {};
  }
  return _mapAssets;
}

/**
 * Retorna cor baseada no nome do agente (fallback para quando não há imagem)
 */
function agentColor(name = '') {
  const colors = {
    jett: '#4a90d9', reyna: '#c062db', raze: '#e06b2e', phoenix: '#f5a623',
    yoru: '#3b5adb', neon: '#4ad9f0', iso: '#5a6e9e', clove: '#b06ed4',
    omen: '#7b5ea7', brimstone: '#c05621', viper: '#2f9e44', astra: '#9b59b6',
    harbor: '#1971c2', deadlock: '#4a90d9', sage: '#0ca678', cypher: '#868e96',
    chamber: '#c9a227', killjoy: '#f5c518', skye: '#2f9e44', sova: '#1971c2',
    'kayo': '#4a90d9', breach: '#e06b2e', fade: '#7b5ea7', gekko: '#2f9e44',
    'kay/o': '#4a90d9',
  };
  return colors[name.toLowerCase()] || '#636e72';
}

/**
 * Formata tempo relativo ("2 horas atrás", "ontem", etc.)
 */
function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const date  = new Date(dateStr);
  const now   = new Date();
  const diff  = Math.floor((now - date) / 1000); // seconds

  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff/86400)}d ago`;
  return `${Math.floor(diff/604800)}w ago`;
}
