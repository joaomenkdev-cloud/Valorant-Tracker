/* ============================================================
   VCI ANALYTICS — SETTINGS.JS
============================================================ */

const PANELS = {
  account: `
    <div class="ss">
      <div class="ss-title">Profile</div>
      <div class="sr">
        <div class="sr-info"><h4>Display Name</h4><p>Your public username</p></div>
        <input class="s-input" value="ShadowStrike" id="settingDisplayName">
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Riot ID</h4><p>Connected Riot account</p></div>
        <input class="s-input" value="ShadowStrike#BR1" id="settingRiotId">
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Region</h4><p>Primary server region</p></div>
        <select class="s-sel" id="settingRegion">
          <option selected>Brazil</option>
          <option>North America</option>
          <option>Europe</option>
          <option>Asia Pacific</option>
          <option>Korea</option>
        </select>
      </div>
    </div>
    <div class="ss">
      <div class="ss-title">Security</div>
      <div class="sr">
        <div class="sr-info"><h4>Two-Factor Authentication</h4><p>Protect your account with 2FA</p></div>
        <div class="toggle" data-k="twoFa"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Login Notifications</h4><p>Alert on new logins</p></div>
        <div class="toggle" data-k="loginNotif"></div>
      </div>
    </div>
    <button class="btn-save" id="btnSaveAccount">Save Changes</button>
  `,

  notifs: `
    <div class="ss">
      <div class="ss-title">Performance</div>
      <div class="sr">
        <div class="sr-info"><h4>Rank Change Alerts</h4><p>Notify on significant MMR changes</p></div>
        <div class="toggle" data-k="perfAlerts"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>AI Weekly Digest</h4><p>Receive personalized weekly reports</p></div>
        <div class="toggle" data-k="aiIns"></div>
      </div>
    </div>
    <div class="ss">
      <div class="ss-title">Social</div>
      <div class="sr">
        <div class="sr-info"><h4>Friend Requests</h4><p>Allow players to send requests</p></div>
        <div class="toggle" data-k="friendReqs"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Leaderboard Mentions</h4><p>Notify when others view your profile</p></div>
        <div class="toggle" data-k="lbMentions"></div>
      </div>
    </div>
  `,

  appearance: `
    <div class="ss">
      <div class="ss-title">Display</div>
      <div class="sr">
        <div class="sr-info"><h4>Theme</h4><p>Color scheme</p></div>
        <select class="s-sel">
          <option selected>Dark</option>
          <option>Darker</option>
          <option>AMOLED Black</option>
        </select>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Language</h4><p>Interface language</p></div>
        <select class="s-sel">
          <option>Português</option>
          <option selected>English</option>
          <option>Español</option>
        </select>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Compact Mode</h4><p>Reduce spacing for denser layout</p></div>
        <div class="toggle" data-k="compact"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Animations</h4><p>Enable smooth transitions</p></div>
        <div class="toggle" data-k="animations"></div>
      </div>
    </div>
  `,

  integrations: `
    <div class="ss">
      <div class="ss-title">API & Sync</div>
      <div class="sr">
        <div class="sr-info"><h4>Auto-sync Matches</h4><p>Fetch matches automatically every 10 min</p></div>
        <div class="toggle" data-k="autoSync"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Tracker.gg Sync</h4><p>Pull additional stats from Tracker.gg</p></div>
        <div class="toggle" data-k="trackerGg"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Discord Rich Presence</h4><p>Show rank in Discord status</p></div>
        <div class="toggle" data-k="discordRpc"></div>
      </div>
    </div>
    <div class="ss">
      <div class="ss-title">API Key</div>
      <div class="sr">
        <div class="sr-info"><h4>Riot API Key</h4><p>Used to fetch live data</p></div>
        <input class="s-input" type="password" value="RGAPI-••••••••••••••" id="settingApiKey">
      </div>
    </div>
  `,

  privacy: `
    <div class="ss">
      <div class="ss-title">Visibility</div>
      <div class="sr">
        <div class="sr-info"><h4>Public Profile</h4><p>Allow others to view your profile</p></div>
        <div class="toggle" data-k="profileVis"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Match History Public</h4><p>Show match history to others</p></div>
        <div class="toggle" data-k="matchPub"></div>
      </div>
      <div class="sr">
        <div class="sr-info"><h4>Anonymous Mode</h4><p>Hide name in public leaderboards</p></div>
        <div class="toggle" data-k="anon"></div>
      </div>
    </div>
    <div class="ss">
      <div class="ss-title">Data</div>
      <div class="sr">
        <div class="sr-info"><h4>Analytics Sharing</h4><p>Share anonymous usage data to improve VCI</p></div>
        <div class="toggle" data-k="analytics"></div>
      </div>
    </div>
  `,
};

document.addEventListener('DOMContentLoaded', () => {
  initShared('settings');

  // Render all panels
  const container = document.getElementById('stgPanels');
  if (!container) return;

  // Get active tab from URL hash or default
  const hash = window.location.hash.replace('#', '') || 'account';
  const firstTab = PANELS[hash] ? hash : 'account';

  container.innerHTML = Object.keys(PANELS).map(k => `
    <div class="sp ${k === firstTab ? 'active' : ''}" id="sp-${k}">
      ${PANELS[k]}
    </div>
  `).join('');

  // Mark active sidebar tab
  document.querySelectorAll('.stab[data-stab]').forEach(tab => {
    if (tab.dataset.stab === firstTab) tab.classList.add('active');
  });

  // Sync toggles with SETTINGS state
  container.querySelectorAll('.toggle[data-k]').forEach(t => {
    const k = t.dataset.k;
    if (k && SETTINGS[k]) t.classList.add('on');
    t.addEventListener('click', function () {
      this.classList.toggle('on');
      const key = this.dataset.k;
      if (key) SETTINGS[key] = this.classList.contains('on');
      showToast('Setting updated');
    });
  });

  // Save buttons
  container.querySelectorAll('.btn-save').forEach(b => {
    b.addEventListener('click', () => showToast('Changes saved!'));
  });

  // Tab switching
  document.querySelectorAll('.stab[data-stab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.sp').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`sp-${tab.dataset.stab}`);
      if (panel) {
        panel.classList.add('active');
        // Re-sync toggles for newly shown panel
        panel.querySelectorAll('.toggle[data-k]').forEach(t => {
          const k = t.dataset.k;
          if (k) t.classList.toggle('on', !!SETTINGS[k]);
        });
      }

      // Update URL hash
      window.location.hash = tab.dataset.stab;
    });
  });
});
