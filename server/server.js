/**
 * VCI Analytics — Backend Server
 * ================================
 * Proxy seguro para a HenrikDev Valorant API (https://api.henrikdev.xyz)
 *
 * ENDPOINTS EXPOSTOS AO FRONTEND:
 *   GET /api/account/:name/:tag
 *   GET /api/mmr/:region/:name/:tag
 *   GET /api/mmr-history/:region/:name/:tag
 *   GET /api/matches/:region/:name/:tag?mode=competitive&size=20
 *   GET /api/match/:matchId
 *   GET /api/leaderboard/:region?page=1
 *   GET /api/health
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const fetch      = require('node-fetch');
const NodeCache  = require('node-cache');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────
// CACHE — evita bater no rate limit (30 req/min no Basic Key)
// ─────────────────────────────────────────────────────────────
const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

// Cache TTLs por tipo de dado
const TTL = {
  account:    120,   // 2 min  — dados estáticos
  mmr:         60,   // 1 min  — rank muda raramente
  mmrHistory: 120,   // 2 min
  matches:     60,   // 1 min
  match:      600,   // 10 min — match já finalizado, imutável
  leaderboard: 180,  // 3 min
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARES
// ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET'],
}));
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const HENRIK_BASE = 'https://api.henrikdev.xyz';
const API_KEY     = process.env.HENRIK_API_KEY;

if (!API_KEY || API_KEY === 'sua_chave_aqui') {
  console.warn('\n⚠️  HENRIK_API_KEY não configurada! Configure o arquivo .env\n');
}

// ─────────────────────────────────────────────────────────────
// HELPER: fetch com cache + headers
// ─────────────────────────────────────────────────────────────
async function henrikFetch(path, ttl = 60) {
  const cacheKey = path;
  const cached   = cache.get(cacheKey);
  if (cached) return { data: cached, fromCache: true };

  const res = await fetch(`${HENRIK_BASE}${path}`, {
    headers: {
      'Authorization': API_KEY || '',
      'Accept': 'application/json',
    },
  });

  const json = await res.json();

  if (res.status === 429) {
    throw { status: 429, message: 'Rate limit atingido. Tente novamente em alguns segundos.' };
  }
  if (res.status === 404) {
    throw { status: 404, message: 'Jogador ou recurso não encontrado.' };
  }
  if (!res.ok) {
    throw { status: res.status, message: json?.errors?.[0]?.message || 'Erro na API Henrik.' };
  }

  cache.set(cacheKey, json, ttl);
  return { data: json, fromCache: false };
}

// ─────────────────────────────────────────────────────────────
// HELPER: tratamento de erros
// ─────────────────────────────────────────────────────────────
function handleError(res, err) {
  console.error('[VCI API Error]', err);
  const status  = err.status  || 500;
  const message = err.message || 'Erro interno do servidor.';
  res.status(status).json({ error: true, status, message });
}

// ─────────────────────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Verifica se o servidor está online
 */
app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    version:  '1.0.0',
    apiKey:   API_KEY ? '✅ configurada' : '❌ ausente',
    cacheStats: cache.getStats(),
  });
});

/**
 * GET /api/account/:name/:tag
 * Retorna informações da conta do jogador
 * Ex: /api/account/ShadowStrike/BR1
 */
app.get('/api/account/:name/:tag', async (req, res) => {
  try {
    const { name, tag } = req.params;
    const { data } = await henrikFetch(
      `/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      TTL.account
    );

    // Normaliza resposta
    const account = data.data;
    res.json({
      puuid:      account.puuid,
      name:       account.name,
      tag:        account.tag,
      region:     account.region,
      accountLevel: account.account_level,
      card:       account.card,
      lastUpdate: account.last_update,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/mmr/:region/:name/:tag
 * Retorna MMR e rank atual do jogador
 * Ex: /api/mmr/br/ShadowStrike/BR1
 */
app.get('/api/mmr/:region/:name/:tag', async (req, res) => {
  try {
    const { region, name, tag } = req.params;
    const { data } = await henrikFetch(
      `/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      TTL.mmr
    );

    const mmr = data.data;
    res.json({
      currentTier:     mmr.current_data?.currenttier       || 0,
      currentTierName: mmr.current_data?.currenttierpatched || 'Unranked',
      rankingInTier:   mmr.current_data?.ranking_in_tier   || 0,
      mmrChange:       mmr.current_data?.mmr_change_to_last_game || 0,
      elo:             mmr.current_data?.elo               || 0,
      highestTier:     mmr.highest_rank?.patched_tier       || 'Unranked',
      highestTierIcon: mmr.highest_rank?.tier || 0,
      images:          mmr.current_data?.images            || null,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/mmr-history/:region/:name/:tag
 * Histórico de MMR para o gráfico de progressão — usa v2 da Henrik API
 * Ex: /api/mmr-history/br/ShadowStrike/BR1
 */
app.get('/api/mmr-history/:region/:name/:tag', async (req, res) => {
  try {
    const { region, name, tag } = req.params;

    // v2: /valorant/v2/mmr-history/{region}/pc/{name}/{tag}
    // Fallback para v1 se v2 falhar (compatibilidade)
    let data;
    let isV2 = true;
    try {
      const result = await henrikFetch(
        `/valorant/v2/mmr-history/${region}/pc/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        TTL.mmrHistory
      );
      data = result.data;
    } catch {
      isV2 = false;
      const result = await henrikFetch(
        `/valorant/v1/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        TTL.mmrHistory
      );
      data = result.data;
    }

    // Normaliza para array [{date, elo, tier, tierName}]
    // v2 usa campos: tier.id, tier.name, rr, last_change, elo, date, map.name
    // v1 usa campos: currenttier, currenttierpatched, ranking_in_tier, mmr_change_to_last_game
    const history = (data.data || []).map(entry => ({
      matchId:   entry.match_id,
      tier:      isV2 ? entry.tier?.id        : entry.currenttier,
      tierName:  isV2 ? entry.tier?.name      : entry.currenttierpatched,
      elo:       isV2 ? entry.rr              : entry.ranking_in_tier,
      mmrChange: isV2 ? entry.last_change     : entry.mmr_change_to_last_game,
      date:      entry.date,
      map:       entry.map?.name || '',
    })).reverse(); // Mais antigo primeiro (para o gráfico)

    res.json({ history });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/matches/:region/:name/:tag
 * Histórico de partidas
 * Query params:
 *   mode  - competitive | unrated | deathmatch | etc (default: competitive)
 *   size  - 1-10 (default: 10, max Henrik: 10 por chamada)
 *   page  - paginação manual (default: 1)
 * Ex: /api/matches/br/ShadowStrike/BR1?mode=competitive&size=10
 */
app.get('/api/matches/:region/:name/:tag', async (req, res) => {
  try {
    const { region, name, tag } = req.params;
    const mode = req.query.mode || 'competitive';
    const size = Math.min(parseInt(req.query.size) || 10, 10);

    const path = `/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=${mode}&size=${size}`;
    const { data } = await henrikFetch(path, TTL.matches);

    // Normaliza cada partida
    const matches = (data.data || []).map(m => {
      // Encontra o jogador buscado dentro da partida
      const playerName = name.toLowerCase();
      const playerTag  = tag.toLowerCase();
      const player = (m.players?.all_players || []).find(p =>
        p.name.toLowerCase() === playerName && p.tag.toLowerCase() === playerTag
      );

      const team      = player?.team?.toLowerCase() || 'red';
      const blueWon   = m.teams?.blue?.has_won;
      const playerWon = (team === 'blue' && blueWon) || (team === 'red' && !blueWon);

      const myTeam  = team === 'blue' ? m.teams?.blue  : m.teams?.red;
      const oppTeam = team === 'blue' ? m.teams?.red   : m.teams?.blue;

      return {
        matchId:      m.metadata?.matchid,
        map:          m.metadata?.map,
        mode:         m.metadata?.mode,
        duration:     m.metadata?.game_length,
        startedAt:    m.metadata?.game_start_patched,
        cluster:      m.metadata?.cluster,

        result:       playerWon ? 'win' : 'loss',
        score:        playerWon
                        ? `${myTeam?.rounds_won || 0}-${oppTeam?.rounds_won || 0}`
                        : `${myTeam?.rounds_won || 0}-${oppTeam?.rounds_won || 0}`,

        agent:        player?.character      || 'Unknown',
        agentId:      player?.assets?.agent?.small || null,

        kills:        player?.stats?.kills   || 0,
        deaths:       player?.stats?.deaths  || 0,
        assists:      player?.stats?.assists || 0,
        kd:           player?.stats?.deaths > 0
                        ? (player.stats.kills / player.stats.deaths).toFixed(2)
                        : player?.stats?.kills?.toFixed(2) || '0.00',
        acs:          player?.stats?.score && m.metadata?.rounds_played
                        ? Math.round(player.stats.score / m.metadata.rounds_played)
                        : 0,
        hs:           player?.stats?.headshots && (player.stats.headshots + player.stats.bodyshots + player.stats.legshots) > 0
                        ? Math.round((player.stats.headshots / (player.stats.headshots + player.stats.bodyshots + player.stats.legshots)) * 100)
                        : 0,

        currentTier:     player?.currenttier_patched || 'Unranked',
        mmrChange:       0, // não disponível no v3 match
      };
    });

    res.json({ matches, total: matches.length });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/match/:matchId
 * Detalhes completos de uma partida específica
 * Ex: /api/match/a1b2c3d4-xxxx
 */
app.get('/api/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { data } = await henrikFetch(
      `/valorant/v2/match/${matchId}`,
      TTL.match
    );

    const m = data.data;

    // Todos os jogadores com stats
    const allPlayers = (m.players?.all_players || []).map(p => ({
      name:     p.name,
      tag:      p.tag,
      puuid:    p.puuid,
      team:     p.team,
      agent:    p.character,
      agentImg: p.assets?.agent?.small || null,
      tier:     p.currenttier_patched,
      kills:    p.stats?.kills   || 0,
      deaths:   p.stats?.deaths  || 0,
      assists:  p.stats?.assists || 0,
      acs:      p.stats?.score && m.metadata?.rounds_played
                  ? Math.round(p.stats.score / m.metadata.rounds_played)
                  : 0,
      hs:       p.stats?.headshots && (p.stats.headshots + p.stats.bodyshots + p.stats.legshots) > 0
                  ? Math.round((p.stats.headshots / (p.stats.headshots + p.stats.bodyshots + p.stats.legshots)) * 100)
                  : 0,
      firstBloods: p.ability_casts?.ability1 || 0,
    }));

    // Ordenar por ACS dentro de cada time
    const bluePlayers = allPlayers.filter(p => p.team === 'Blue').sort((a,b) => b.acs - a.acs);
    const redPlayers  = allPlayers.filter(p => p.team === 'Red').sort((a,b) => b.acs - a.acs);

    res.json({
      matchId:      m.metadata?.matchid,
      map:          m.metadata?.map,
      mode:         m.metadata?.mode,
      duration:     m.metadata?.game_length,
      startedAt:    m.metadata?.game_start_patched,

      blueTeam: {
        hasWon:     m.teams?.blue?.has_won,
        roundsWon:  m.teams?.blue?.rounds_won,
        roundsLost: m.teams?.blue?.rounds_lost,
        players:    bluePlayers,
      },
      redTeam: {
        hasWon:     m.teams?.red?.has_won,
        roundsWon:  m.teams?.red?.rounds_won,
        roundsLost: m.teams?.red?.rounds_lost,
        players:    redPlayers,
      },

      rounds: (m.rounds || []).map(r => ({
        roundNum:     r.winning_team,
        winningTeam:  r.winning_team,
        endType:      r.end_type,
        bombPlanted:  r.bomb_planted,
        bombDefused:  r.bomb_defused,
      })),
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/leaderboard/:region
 * Leaderboard da região (top ranked players) — usa v3 da Henrik API
 * Query params:
 *   page     - página (default 1)
 *   platform - pc | console (default pc)
 * Ex: /api/leaderboard/br?page=1
 */
app.get('/api/leaderboard/:region', async (req, res) => {
  try {
    const { region }    = req.params;
    const page          = parseInt(req.query.page) || 1;
    const platform      = req.query.platform || 'pc';

    // v3: /valorant/v3/leaderboard/{region}/{platform}?page={page}
    const { data } = await henrikFetch(
      `/valorant/v3/leaderboard/${region}/${platform}?page=${page}`,
      TTL.leaderboard
    );

    // Estrutura v3: data.data.players (diferente do v1 que era data.data diretamente)
    const rawPlayers = data?.data?.players || [];

    const players = rawPlayers.map((p, i) => ({
      rank:        p.leaderboard_rank   || ((page - 1) * 200) + i + 1,
      name:        p.is_anonymized ? 'Anonymous' : (p.name || 'Unknown'),
      tag:         p.is_anonymized ? '----'      : (p.tag  || 'VALE'),
      rankedRating:p.rr                || 0,
      wins:        p.wins              || 0,
      tier:        p.tier              || 27,
      tierName:    p.tier === 27 ? 'Radiant' : (p.tier >= 24 ? 'Immortal' : 'Unknown'),
      puuid:       p.puuid             || '',
    }));

    res.json({ players, page, region });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/valorant-api/agents
 * Busca imagens e info dos agentes da valorant-api.com
 */
app.get('/api/assets/agents', async (req, res) => {
  try {
    const cacheKey = 'assets:agents';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    const j = await r.json();

    const agents = (j.data || []).map(a => ({
      uuid:          a.uuid,
      name:          a.displayName,
      role:          a.role?.displayName || 'Unknown',
      portrait:      a.fullPortrait,
      displayIcon:   a.displayIcon,
      background:    a.background,
      gradientColors: a.backgroundGradientColors || [],
    }));

    cache.set(cacheKey, { agents }, 3600); // cache por 1h
    res.json({ agents });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/assets/maps
 * Busca imagens e info dos mapas da valorant-api.com
 */
app.get('/api/assets/maps', async (req, res) => {
  try {
    const cacheKey = 'assets:maps';
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetch('https://valorant-api.com/v1/maps');
    const j = await r.json();

    const maps = (j.data || [])
      .filter(m => m.mapUrl && !m.mapUrl.includes('Poveglia')) // remove mapas de menu
      .map(m => ({
        uuid:      m.uuid,
        name:      m.displayName,
        splash:    m.splash,
        minimap:   m.displayIcon,
        listViewIcon: m.listViewIcon,
        coordinates: m.coordinates || '',
      }));

    cache.set(cacheKey, { maps }, 3600);
    res.json({ maps });
  } catch (err) {
    handleError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────
// 404 para rotas não encontradas
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: true, message: `Rota ${req.path} não encontrada.` });
});

// ─────────────────────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮 VCI Analytics Backend rodando na porta ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   API Key: ${API_KEY ? '✅ configurada' : '❌ AUSENTE (configure o .env!)'}\n`);
});

module.exports = app;