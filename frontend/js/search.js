/* ============================================================
   VCI ANALYTICS — SEARCH.JS
   Página de busca de jogador (landing page)
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Se já tem sessão ativa, redireciona direto para o dashboard
  if (hasSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form       = document.getElementById('searchForm');
  const input      = document.getElementById('playerInput');
  const regionSel  = document.getElementById('regionSelect');
  const statusMsg  = document.getElementById('statusMsg');
  const btnSearch  = document.getElementById('btnSearch');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await searchPlayer();
  });

  async function searchPlayer() {
    const raw = (input?.value || '').trim();
    if (!raw) return showStatus('Digite o nome do jogador', 'warn');

    // Suporta "Nome#TAG" ou só "Nome" (usa tag padrão)
    let name, tag;
    if (raw.includes('#')) {
      [name, tag] = raw.split('#');
    } else {
      name = raw; tag = '0000'; // fallback
    }

    if (!name || !tag) return showStatus('Formato inválido. Use: Nome#TAG', 'err');

    const region = regionSel?.value || 'br';

    setLoading(true);
    showStatus('Buscando jogador...', 'info');

    try {
      // Verifica se a conta existe
      const account = await fetchAccount(name, tag);

      // Salva a sessão
      setSession(account.name, account.tag, account.region || region);

      showStatus(`✅ Encontrado: ${account.name}#${account.tag}`, 'ok');

      // Redireciona após 800ms
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) {
        showStatus('❌ Jogador não encontrado. Verifique o nome e a tag.', 'err');
      } else {
        showStatus(`❌ Erro: ${err.message}`, 'err');
      }
      setLoading(false);
    }
  }

  function showStatus(msg, type = 'info') {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.className   = `status-msg status-${type}`;
    statusMsg.style.display = 'block';
  }

  function setLoading(loading) {
    if (btnSearch) {
      btnSearch.disabled     = loading;
      btnSearch.textContent  = loading ? 'Buscando...' : 'Buscar Jogador';
    }
  }
});
