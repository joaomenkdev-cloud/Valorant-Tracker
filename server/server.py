"""
VCI Analytics — Backend Server (Python/Flask)
===============================================
Proxy seguro para a HenrikDev Valorant API (https://api.henrikdev.xyz)

ENDPOINTS:
  GET /api/health
  GET /api/account/:name/:tag
  GET /api/mmr/:region/:name/:tag
  GET /api/mmr-history/:region/:name/:tag
  GET /api/matches/:region/:name/:tag?mode=competitive&size=10
  GET /api/match/:matchId
  GET /api/leaderboard/:region?page=1
  GET /api/assets/agents
  GET /api/assets/maps

COMO RODAR:
  1. pip install flask flask-cors requests python-dotenv
  2. Crie um arquivo .env com HENRIK_API_KEY=HDEV-...
  3. python server.py
"""

import os
import time
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from urllib.parse import quote

load_dotenv()

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────
# CORS — permite requisições do frontend
# ─────────────────────────────────────────────────────────────
allowed_origin = os.getenv("ALLOWED_ORIGIN", "*")
CORS(app, origins=allowed_origin, methods=["GET"])

# ─────────────────────────────────────────────────────────────
# CONFIGURAÇÕES
# ─────────────────────────────────────────────────────────────
PORT          = int(os.getenv("PORT", 3001))
HENRIK_BASE   = "https://api.henrikdev.xyz"
API_KEY       = os.getenv("HENRIK_API_KEY", "")

if not API_KEY or API_KEY == "sua_chave_aqui":
    print("\n⚠️  HENRIK_API_KEY não configurada! Configure o arquivo .env\n")

# Cache TTLs por tipo de dado (em segundos)
TTL = {
    "account":    120,
    "mmr":         60,
    "mmrHistory": 120,
    "matches":     60,
    "match":      600,
    "leaderboard": 180,
    "assets":     3600,
}

# ─────────────────────────────────────────────────────────────
# CACHE simples em memória: { key: (dados, timestamp) }
# ─────────────────────────────────────────────────────────────
_cache: dict = {}

def cache_get(key: str):
    """Retorna os dados do cache se ainda válidos, ou None."""
    if key in _cache:
        data, expires_at = _cache[key]
        if time.time() < expires_at:
            return data
        del _cache[key]
    return None

def cache_set(key: str, data, ttl: int):
    _cache[key] = (data, time.time() + ttl)

def cache_stats():
    now = time.time()
    valid = sum(1 for _, (_, exp) in _cache.items() if now < exp)
    return {"total": len(_cache), "valid": valid}

# ─────────────────────────────────────────────────────────────
# HELPER: faz fetch na Henrik API com cache
# ─────────────────────────────────────────────────────────────
def henrik_fetch(path: str, ttl: int = 60):
    cached = cache_get(path)
    if cached is not None:
        return cached, True

    url = f"{HENRIK_BASE}{path}"
    headers = {
        "Authorization": API_KEY,
        "Accept": "application/json",
    }

    resp = requests.get(url, headers=headers, timeout=15)

    if resp.status_code == 429:
        raise {"status": 429, "message": "Rate limit atingido. Tente novamente em alguns segundos."}
    if resp.status_code == 404:
        raise {"status": 404, "message": "Jogador ou recurso não encontrado."}
    if not resp.ok:
        try:
            err_msg = resp.json().get("errors", [{}])[0].get("message", "Erro na API Henrik.")
        except Exception:
            err_msg = "Erro na API Henrik."
        raise {"status": resp.status_code, "message": err_msg}

    json_data = resp.json()
    cache_set(path, json_data, ttl)
    return json_data, False


class APIError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message

def henrik_fetch_safe(path: str, ttl: int = 60):
    """Versão que lança APIError em vez de dict."""
    cached = cache_get(path)
    if cached is not None:
        return cached

    url = f"{HENRIK_BASE}{path}"
    headers = {"Authorization": API_KEY, "Accept": "application/json"}

    try:
        resp = requests.get(url, headers=headers, timeout=15)
    except requests.exceptions.RequestException as e:
        raise APIError(503, f"Erro de conexão: {str(e)}")

    if resp.status_code == 429:
        raise APIError(429, "Rate limit atingido. Tente novamente em alguns segundos.")
    if resp.status_code == 404:
        raise APIError(404, "Jogador ou recurso não encontrado.")
    if not resp.ok:
        try:
            err_msg = resp.json().get("errors", [{}])[0].get("message", "Erro na API Henrik.")
        except Exception:
            err_msg = f"Erro HTTP {resp.status_code} na API Henrik."
        raise APIError(resp.status_code, err_msg)

    json_data = resp.json()
    cache_set(path, json_data, ttl)
    return json_data

# ─────────────────────────────────────────────────────────────
# ROTAS
# ─────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "apiKey": "✅ configurada" if API_KEY and API_KEY != "sua_chave_aqui" else "❌ ausente",
        "cacheStats": cache_stats(),
    })


@app.route("/api/account/<name>/<tag>")
def account(n, tag):
    try:
        data = henrik_fetch_safe(
            f"/valorant/v1/account/{quote(n)}/{quote(tag)}",
            TTL["account"]
        )
        acc = data.get("data", {})
        return jsonify({
            "puuid":         acc.get("puuid"),
            "name":          acc.get("name"),
            "tag":           acc.get("tag"),
            "region":        acc.get("region"),
            "accountLevel":  acc.get("account_level"),
            "card":          acc.get("card"),
            "lastUpdate":    acc.get("last_update"),
        })
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/mmr/<region>/<name>/<tag>")
def mmr(region, n, tag):
    try:
        data = henrik_fetch_safe(
            f"/valorant/v2/mmr/{region}/{quote(n)}/{quote(tag)}",
            TTL["mmr"]
        )
        mmr_data = data.get("data", {})
        curr = mmr_data.get("current_data") or {}
        highest = mmr_data.get("highest_rank") or {}
        return jsonify({
            "currentTier":     curr.get("currenttier", 0),
            "currentTierName": curr.get("currenttierpatched", "Unranked"),
            "rankingInTier":   curr.get("ranking_in_tier", 0),
            "mmrChange":       curr.get("mmr_change_to_last_game", 0),
            "elo":             curr.get("elo", 0),
            "highestTier":     highest.get("patched_tier", "Unranked"),
            "highestTierIcon": highest.get("tier", 0),
            "images":          curr.get("images"),
        })
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/mmr-history/<region>/<name>/<tag>")
def mmr_history(region, n, tag):
    try:
        data = henrik_fetch_safe(
            f"/valorant/v1/mmr-history/{region}/{quote(n)}/{quote(tag)}",
            TTL["mmrHistory"]
        )
        raw = data.get("data") or []
        history = [
            {
                "matchId":   entry.get("match_id"),
                "tier":      entry.get("currenttier"),
                "tierName":  entry.get("currenttierpatched"),
                "elo":       entry.get("ranking_in_tier"),
                "mmrChange": entry.get("mmr_change_to_last_game"),
                "date":      entry.get("date"),
                "map":       (entry.get("map") or {}).get("name", ""),
            }
            for entry in reversed(raw)  # mais antigo primeiro (para gráfico)
        ]
        return jsonify({"history": history})
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/matches/<region>/<name>/<tag>")
def matches(region, n, tag):
    try:
        mode = request.args.get("mode", "competitive")
        size = min(int(request.args.get("size", 10)), 10)

        data = henrik_fetch_safe(
            f"/valorant/v3/matches/{region}/{quote(n)}/{quote(tag)}?mode={mode}&size={size}",
            TTL["matches"]
        )

        player_name = n.lower()
        player_tag  = tag.lower()
        result = []

        for m in (data.get("data") or []):
            all_players = (m.get("players") or {}).get("all_players") or []
            player = next(
                (p for p in all_players
                 if p.get("name", "").lower() == player_name and p.get("tag", "").lower() == player_tag),
                None
            )
            team    = (player or {}).get("team", "red").lower()
            teams   = m.get("teams") or {}
            blue_won = (teams.get("blue") or {}).get("has_won", False)
            player_won = (team == "blue" and blue_won) or (team == "red" and not blue_won)

            my_team  = teams.get("blue") if team == "blue" else teams.get("red")
            opp_team = teams.get("red")  if team == "blue" else teams.get("blue")
            my_team  = my_team  or {}
            opp_team = opp_team or {}

            meta   = m.get("metadata") or {}
            stats  = (player or {}).get("stats") or {}
            assets = (player or {}).get("assets") or {}
            agent  = assets.get("agent") or {}

            kills   = stats.get("kills", 0)
            deaths  = stats.get("deaths", 0)
            hs      = stats.get("headshots", 0)
            bs      = stats.get("bodyshots", 0)
            ls      = stats.get("legshots", 0)
            rounds  = meta.get("rounds_played", 1) or 1

            result.append({
                "matchId":   meta.get("matchid"),
                "map":       meta.get("map"),
                "mode":      meta.get("mode"),
                "duration":  meta.get("game_length"),
                "startedAt": meta.get("game_start_patched"),
                "cluster":   meta.get("cluster"),

                "result": "win" if player_won else "loss",
                "score":  f"{my_team.get('rounds_won',0)}-{opp_team.get('rounds_won',0)}",

                "agent":    (player or {}).get("character", "Unknown"),
                "agentId":  agent.get("small"),

                "kills":   kills,
                "deaths":  deaths,
                "assists": stats.get("assists", 0),
                "kd":      f"{kills/deaths:.2f}" if deaths > 0 else f"{float(kills):.2f}",
                "acs":     round(stats.get("score", 0) / rounds) if stats.get("score") else 0,
                "hs":      round(hs / (hs + bs + ls) * 100) if (hs + bs + ls) > 0 else 0,

                "currentTier": (player or {}).get("currenttier_patched", "Unranked"),
                "mmrChange":   0,
            })

        return jsonify({"matches": result, "total": len(result)})
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/match/<match_id>")
def match_detail(match_id):
    try:
        data = henrik_fetch_safe(
            f"/valorant/v2/match/{match_id}",
            TTL["match"]
        )
        m    = data.get("data") or {}
        meta = m.get("metadata") or {}
        teams = m.get("teams") or {}

        def map_player(p):
            stats  = p.get("stats") or {}
            assets = p.get("assets") or {}
            agent  = assets.get("agent") or {}
            hs = stats.get("headshots", 0)
            bs = stats.get("bodyshots", 0)
            ls = stats.get("legshots", 0)
            rounds = meta.get("rounds_played", 1) or 1
            return {
                "name":     p.get("name"),
                "tag":      p.get("tag"),
                "puuid":    p.get("puuid"),
                "team":     p.get("team"),
                "agent":    p.get("character"),
                "agentImg": agent.get("small"),
                "tier":     p.get("currenttier_patched"),
                "kills":    stats.get("kills", 0),
                "deaths":   stats.get("deaths", 0),
                "assists":  stats.get("assists", 0),
                "acs":      round(stats.get("score", 0) / rounds) if stats.get("score") else 0,
                "hs":       round(hs / (hs + bs + ls) * 100) if (hs + bs + ls) > 0 else 0,
                "firstBloods": (p.get("ability_casts") or {}).get("ability1", 0),
            }

        all_players = list(map(map_player, (m.get("players") or {}).get("all_players") or []))
        blue_players = sorted([p for p in all_players if p["team"] == "Blue"], key=lambda x: -x["acs"])
        red_players  = sorted([p for p in all_players if p["team"] == "Red"],  key=lambda x: -x["acs"])

        def team_info(color):
            t = teams.get(color) or {}
            players = blue_players if color == "blue" else red_players
            return {
                "hasWon":     t.get("has_won"),
                "roundsWon":  t.get("rounds_won"),
                "roundsLost": t.get("rounds_lost"),
                "players":    players,
            }

        rounds_info = [
            {
                "roundNum":    r.get("winning_team"),
                "winningTeam": r.get("winning_team"),
                "endType":     r.get("end_type"),
                "bombPlanted": r.get("bomb_planted"),
                "bombDefused": r.get("bomb_defused"),
            }
            for r in (m.get("rounds") or [])
        ]

        return jsonify({
            "matchId":   meta.get("matchid"),
            "map":       meta.get("map"),
            "mode":      meta.get("mode"),
            "duration":  meta.get("game_length"),
            "startedAt": meta.get("game_start_patched"),
            "blueTeam":  team_info("blue"),
            "redTeam":   team_info("red"),
            "rounds":    rounds_info,
        })
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/leaderboard/<region>")
def leaderboard(region):
    try:
        page = int(request.args.get("page", 1))
        data = henrik_fetch_safe(
            f"/valorant/v1/leaderboard/{region}?page={page}",
            TTL["leaderboard"]
        )
        players = [
            {
                "rank":         p.get("leaderboardRank", (page - 1) * 200 + i + 1),
                "name":         p.get("gameName", "Unknown"),
                "tag":          p.get("tagLine", "VALE"),
                "rankedRating": p.get("rankedRating", 0),
                "wins":         p.get("numberOfWins", 0),
                "tier":         p.get("competitiveTier", 0),
                "tierName":     p.get("competitiveTierName", "Radiant"),
                "puuid":        p.get("puuid", ""),
            }
            for i, p in enumerate(data.get("data") or [])
        ]
        return jsonify({"players": players, "page": page, "region": region})
    except APIError as e:
        return jsonify({"error": True, "status": e.status, "message": e.message}), e.status
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/assets/agents")
def assets_agents():
    try:
        cached = cache_get("assets:agents")
        if cached:
            return jsonify(cached)

        resp = requests.get(
            "https://valorant-api.com/v1/agents?isPlayableCharacter=true",
            timeout=15
        )
        j = resp.json()
        agents = [
            {
                "uuid":           a.get("uuid"),
                "name":           a.get("displayName"),
                "role":           (a.get("role") or {}).get("displayName", "Unknown"),
                "portrait":       a.get("fullPortrait"),
                "displayIcon":    a.get("displayIcon"),
                "background":     a.get("background"),
                "gradientColors": a.get("backgroundGradientColors") or [],
            }
            for a in (j.get("data") or [])
        ]
        result = {"agents": agents}
        cache_set("assets:agents", result, TTL["assets"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


@app.route("/api/assets/maps")
def assets_maps():
    try:
        cached = cache_get("assets:maps")
        if cached:
            return jsonify(cached)

        resp = requests.get("https://valorant-api.com/v1/maps", timeout=15)
        j = resp.json()
        maps = [
            {
                "uuid":         m.get("uuid"),
                "name":         m.get("displayName"),
                "splash":       m.get("splash"),
                "minimap":      m.get("displayIcon"),
                "listViewIcon": m.get("listViewIcon"),
                "coordinates":  m.get("coordinates", ""),
            }
            for m in (j.get("data") or [])
            if m.get("mapUrl") and "Poveglia" not in (m.get("mapUrl") or "")
        ]
        result = {"maps": maps}
        cache_set("assets:maps", result, TTL["assets"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": True, "status": 500, "message": str(e)}), 500


# 404 catch-all
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": True, "message": f"Rota {request.path} não encontrada."}), 404


# ─────────────────────────────────────────────────────────────
# INICIAR SERVIDOR
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n🎮 VCI Analytics Backend (Python/Flask) rodando na porta {PORT}")
    print(f"   Health check: http://localhost:{PORT}/api/health")
    print(f"   API Key: {'✅ configurada' if API_KEY and API_KEY != 'sua_chave_aqui' else '❌ AUSENTE (configure o .env!)'}\n")
    app.run(host="0.0.0.0", port=PORT, debug=os.getenv("NODE_ENV") == "development")
