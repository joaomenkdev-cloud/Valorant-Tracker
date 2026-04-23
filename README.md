# 🎮 VCI Analytics — Guia de Implementação com a API do Valorant

## Como funciona a integração

```
Browser (frontend)  →  Node.js Server (backend)  →  HenrikDev API  →  Riot Games
```

A **HenrikDev API** é uma API não-oficial (mas amplamente usada e estável) que faz o intermediário com a Riot, permitindo buscar dados de jogadores sem precisar de aprovação especial da Riot.

---

## 📋 Pré-requisitos

- **Node.js 18+** — https://nodejs.org
- **Chave de API da HenrikDev** — gratuita, explicado abaixo

---

## 🔑 Passo 1 — Conseguir a API Key (GRÁTIS)

1. Entre no Discord da HenrikDev: **https://discord.gg/henrikdev**
2. Vá no canal `#get-api-key`
3. Use o comando `/apikey` para criar sua chave
4. Copie a chave gerada (começa com `HDEV-...`)

> **Limites do plano gratuito:**
> - 30 requisições por minuto
> - Dados de partidas, rank, MMR, leaderboard — tudo disponível
> - O backend já tem cache automático para evitar atingir o limite

---

## 🚀 Passo 2 — Configurar o Backend

```bash
# 1. Entrar na pasta do servidor
cd server/

# 2. Instalar dependências
npm install

# 3. Criar o arquivo de configuração
cp .env.example .env
```

Abra o arquivo `.env` e preencha:
```env
HENRIK_API_KEY=HDEV-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=*
```

```bash
# 4. Iniciar o servidor
npm start
# ou, para desenvolvimento com auto-reload:
npm run dev
```

Você deve ver:
```
🎮 VCI Analytics Backend rodando na porta 3001
   Health check: http://localhost:3001/api/health
   API Key: ✅ configurada
```

---

## 🌐 Passo 3 — Abrir o Frontend

Com o backend rodando, abra o frontend de qualquer forma:

**Opção A — Live Server (VSCode):**
1. Instale a extensão "Live Server"
2. Clique com botão direito em `frontend/index.html`
3. Selecione "Open with Live Server"

**Opção B — Direto no navegador:**
- Abra `frontend/index.html` diretamente no navegador
- ⚠️ Alguns navegadores bloqueiam requisições `fetch()` para `localhost` de `file://`
- Use o Live Server para evitar isso

---

## 📁 Estrutura do Projeto

```
vci-analytics/
│
├── server/                    ← Backend Node.js
│   ├── server.js              ← Servidor principal (Express)
│   ├── package.json
│   ├── .env.example           ← Modelo de configuração
│   └── .env                   ← ⚠️ Sua chave (não subir pro Git!)
│
└── frontend/                  ← Frontend HTML/CSS/JS
    ├── index.html             ← Página de busca (landing)
    ├── dashboard.html
    ├── matches.html
    ├── agents.html
    ├── maps.html
    ├── leaderboards.html
    ├── settings.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js             ← Serviço de comunicação com o backend
        ├── shared.js          ← Sidebar, topbar, toast, helpers
        ├── charts.js          ← Builders de gráficos (Chart.js)
        ├── dashboard.js       ← Lógica do dashboard
        ├── matches.js         ← Histórico de partidas
        ├── agents.js          ← Estatísticas por agente
        ├── maps.js            ← Estatísticas por mapa
        ├── leaderboards.js    ← Leaderboard global
        ├── settings.js        ← Configurações
        └── search.js          ← Busca de jogador
```

---

## 🔌 Endpoints do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Status do servidor |
| `GET` | `/api/account/:name/:tag` | Dados da conta |
| `GET` | `/api/mmr/:region/:name/:tag` | Rank e MMR atual |
| `GET` | `/api/mmr-history/:region/:name/:tag` | Histórico de rank (para o gráfico) |
| `GET` | `/api/matches/:region/:name/:tag` | Histórico de partidas (`?mode=competitive&size=10`) |
| `GET` | `/api/match/:matchId` | Detalhes de uma partida |
| `GET` | `/api/leaderboard/:region` | Top players da região |
| `GET` | `/api/assets/agents` | Imagens e dados dos agentes |
| `GET` | `/api/assets/maps` | Imagens e dados dos mapas |

**Regiões válidas:** `br` `na` `eu` `ap` `kr` `latam`

---

## 🧪 Testando os Endpoints

Com o servidor rodando, teste no navegador ou no Postman:

```
http://localhost:3001/api/health
http://localhost:3001/api/account/TenZ/000
http://localhost:3001/api/mmr/na/TenZ/000
http://localhost:3001/api/matches/na/TenZ/000?mode=competitive&size=5
http://localhost:3001/api/leaderboard/br
```

---

## ⚙️ Configuração Avançada

### Aumentar número de partidas

A HenrikDev limita a **10 partidas por chamada** no plano gratuito. Para buscar mais, você pode fazer múltiplas chamadas com paginação. Edite em `server.js`:

```javascript
// Buscar 20 partidas (2 chamadas de 10)
const [batch1, batch2] = await Promise.all([
  henrikFetch(`/valorant/v3/matches/${region}/${name}/${tag}?mode=competitive&size=10`),
  henrikFetch(`/valorant/v3/matches/${region}/${name}/${tag}?mode=competitive&size=10&start=10`),
]);
const allMatches = [...batch1.data.data, ...batch2.data.data];
```

### Mudar URL do backend no frontend

Se hospedar o backend em outro servidor, edite no início de `frontend/js/api.js`:

```javascript
const API_CONFIG = {
  BASE_URL: 'https://seuservidor.com/api',  // ← altere aqui
};
```

### Deploy (colocar online)

**Backend:** Railway, Render, Heroku, VPS
- Suba a pasta `server/`
- Configure a variável de ambiente `HENRIK_API_KEY` no painel do serviço

**Frontend:** Vercel, Netlify, GitHub Pages, ou qualquer hosting estático
- Suba a pasta `frontend/`
- Atualize `API_CONFIG.BASE_URL` com a URL do seu backend

---

## ❓ Problemas Comuns

| Problema | Solução |
|----------|---------|
| `Jogador não encontrado` | Verifique nome e tag. A tag muda por região (BR1, NA1, etc) |
| `Rate limit atingido` | O cache evita isso. Se persistir, aguarde 1 minuto |
| `CORS error no browser` | Use Live Server ou configure `ALLOWED_ORIGIN` no `.env` |
| `API Key inválida` | Confirme que copiou corretamente do Discord HenrikDev |
| `Cannot fetch localhost` | Use Live Server (VSCode) ao invés de abrir o HTML direto |

---

## 📖 Documentação de Referência

- **HenrikDev API:** https://docs.henrikdev.xyz/valorant/api-reference
- **Assets de Agentes/Mapas:** https://valorant-api.com
- **Discord da HenrikDev:** https://discord.gg/henrikdev (para pegar a key)
