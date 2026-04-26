/* ============================================================
   VCI ANALYTICS — SEARCH.JS
   Search functionality for landing page (legacy support)
============================================================ */

// This file is kept for backward compatibility
// Main search logic is now in landing.js

document.addEventListener('DOMContentLoaded', () => {
  // Don't auto-redirect anymore - users can browse freely
  // Only redirect if explicitly on a player-specific page without session

  const form = document.getElementById('searchForm');
  const inputName = document.getElementById('playerName');
  const inputTag = document.getElementById('playerTag');
  const regionSel = document.getElementById('regionSelect');
  const statusMsg = document.getElementById('statusMsg');
  const btnSearch = document.getElementById('btnSearch');

  // Skip if elements don't exist (handled by landing.js)
  if (!form || !inputTag) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await searchPlayer();
  });

  async function searchPlayer() {
    const name = (inputName?.value || '').trim();
    const tag = (inputTag?.value || '').trim();

    if (!name) return showStatus('Digite o nome do jogador', 'warn');
    if (!tag) return showStatus('Digite a tag do jogador', 'warn');

    const region = regionSel?.value || 'br';

    setLoading(true);
    showStatus('Buscando jogador...', 'info');

    try {
      const account = await fetchAccount(name, tag);
      setSession(account.name, account.tag, account.region || region);
      showStatus(`Found: ${account.name}#${account.tag}`, 'ok');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (err) {
      if (
        err.message.includes('404') ||
        err.message.toLowerCase().includes('not found') ||
        err.message.toLowerCase().includes('não encontrado')
      ) {
        showStatus('Player not found. Check the name and tag.', 'err');
      } else {
        showStatus(`Error: ${err.message}`, 'err');
      }
      setLoading(false);
    }
  }

  function showStatus(msg, type = 'info') {
    if (!statusMsg) return;
    statusMsg.textContent = msg;
    statusMsg.className = `status-msg status-${type}`;
    statusMsg.style.display = 'block';
  }

  function setLoading(loading) {
    if (btnSearch) {
      btnSearch.disabled = loading;
      btnSearch.textContent = loading ? 'Searching...' : 'Search Player';
    }
  }
});
