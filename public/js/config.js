/* ============================================
   Configuration Panel Logic
   ============================================ */

let config = {};
const API_BASE = '';

// --- Load & Save ---

async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    config = await res.json();
    populateForm();
  } catch (err) {
    console.error('Failed to load config:', err);
    showToast('Erro ao carregar configurações', true);
  }
}

async function saveConfig() {
  collectForm();
  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Configurações salvas!');
    }
  } catch (err) {
    console.error('Failed to save config:', err);
    showToast('Erro ao salvar', true);
  }
}

async function resetConfig() {
  if (!confirm('Restaurar configurações padrão? Todas as alterações serão perdidas.')) return;
  try {
    const res = await fetch(`${API_BASE}/api/config/reset`, { method: 'POST' });
    const result = await res.json();
    if (result.success) {
      config = result.config;
      populateForm();
      showToast('Configurações restauradas!');
    }
  } catch (err) {
    showToast('Erro ao restaurar', true);
  }
}

// --- Populate Form ---

function populateForm() {
  // General
  setVal('cfg-streamer-name', config.streamer?.name);
  setVal('cfg-stream-title', config.streamer?.title);
  setVal('cfg-social-twitter', config.streamer?.socialMedia?.twitter);
  setVal('cfg-social-instagram', config.streamer?.socialMedia?.instagram);
  setVal('cfg-social-discord', config.streamer?.socialMedia?.discord);
  setVal('cfg-social-tiktok', config.streamer?.socialMedia?.tiktok);

  // Theme
  selectTheme(config.theme || 'gaming', false);

  // Colors
  setColor('cfg-color-primary', config.colors?.primary);
  setColor('cfg-color-secondary', config.colors?.secondary);
  setColor('cfg-color-accent', config.colors?.accent);
  setColor('cfg-color-text', config.colors?.text);

  // Overlay
  setCheck('cfg-webcam-frame', config.overlay?.showWebcamFrame);
  setCheck('cfg-top-bar', config.overlay?.showTopBar);
  setCheck('cfg-bottom-bar', config.overlay?.showBottomBar);
  setCheck('cfg-social-bar', config.overlay?.showSocialBar);
  setVal('cfg-webcam-position', config.overlay?.webcamPosition);
  setVal('cfg-webcam-width', config.overlay?.webcamSize?.width);
  setVal('cfg-webcam-height', config.overlay?.webcamSize?.height);

  // Alerts
  setCheck('cfg-alerts-enabled', config.alerts?.enabled);
  setVal('cfg-alert-duration', config.alerts?.duration);
  setVal('cfg-alert-volume', config.alerts?.volume);
  setCheck('cfg-alert-follower-enabled', config.alerts?.follower?.enabled);
  setVal('cfg-alert-follower-message', config.alerts?.follower?.message);
  setVal('cfg-alert-follower-template', config.alerts?.follower?.template);
  setCheck('cfg-alert-sub-enabled', config.alerts?.subscription?.enabled);
  setVal('cfg-alert-sub-message', config.alerts?.subscription?.message);
  setVal('cfg-alert-sub-template', config.alerts?.subscription?.template);
  setCheck('cfg-alert-donation-enabled', config.alerts?.donation?.enabled);
  setVal('cfg-alert-donation-message', config.alerts?.donation?.message);
  setVal('cfg-alert-donation-template', config.alerts?.donation?.template);
  setCheck('cfg-alert-raid-enabled', config.alerts?.raid?.enabled);
  setVal('cfg-alert-raid-message', config.alerts?.raid?.message);
  setVal('cfg-alert-raid-template', config.alerts?.raid?.template);

  // Widgets
  setCheck('cfg-widget-viewers', config.widgets?.viewerCount?.enabled);
  setCheck('cfg-widget-follower', config.widgets?.latestFollower?.enabled);
  setCheck('cfg-widget-sub', config.widgets?.latestSub?.enabled);
  setCheck('cfg-widget-donation', config.widgets?.latestDonation?.enabled);
  setCheck('cfg-widget-top-donor', config.widgets?.topDonor?.enabled);
  setCheck('cfg-widget-goal', config.widgets?.goalBar?.enabled);
  setVal('cfg-goal-title', config.widgets?.goalBar?.title);
  setVal('cfg-goal-type', config.widgets?.goalBar?.type);
  setVal('cfg-goal-target', config.widgets?.goalBar?.target);

  // Chat
  setVal('cfg-chat-max', config.chat?.maxMessages);
  setVal('cfg-chat-font-size', config.chat?.fontSize);
  setCheck('cfg-chat-timestamp', config.chat?.showTimestamp);
  setCheck('cfg-chat-badges', config.chat?.showBadges);
  setCheck('cfg-chat-platform-icon', config.chat?.showPlatformIcon);
  setCheck('cfg-chat-fade', config.chat?.fadeMessages);
  setVal('cfg-chat-fade-delay', config.chat?.fadeDelay);
  setCheck('cfg-chat-filter-twitch', config.chat?.filters?.twitch);
  setCheck('cfg-chat-filter-youtube', config.chat?.filters?.youtube);
  setCheck('cfg-chat-filter-kick', config.chat?.filters?.kick);

  // Platforms
  setCheck('cfg-twitch-enabled', config.platforms?.twitch?.enabled);
  setVal('cfg-twitch-channel', config.platforms?.twitch?.channel);
  setVal('cfg-twitch-token', config.platforms?.twitch?.oauthToken);
  setVal('cfg-twitch-client-id', config.platforms?.twitch?.clientId);
  setCheck('cfg-twitch-autoconnect', config.platforms?.twitch?.autoConnect);

  setCheck('cfg-youtube-enabled', config.platforms?.youtube?.enabled);
  setVal('cfg-youtube-apikey', config.platforms?.youtube?.apiKey);
  setVal('cfg-youtube-channel-id', config.platforms?.youtube?.channelId);
  setVal('cfg-youtube-video-id', config.platforms?.youtube?.videoId);
  setCheck('cfg-youtube-autoconnect', config.platforms?.youtube?.autoConnect);

  setCheck('cfg-kick-enabled', config.platforms?.kick?.enabled);
  setVal('cfg-kick-channel', config.platforms?.kick?.channel);
  setCheck('cfg-kick-autoconnect', config.platforms?.kick?.autoConnect);

  // OBS URLs
  populateOBSUrls();
}

// --- Collect Form ---

function collectForm() {
  config.streamer = {
    name: getVal('cfg-streamer-name'),
    title: getVal('cfg-stream-title'),
    socialMedia: {
      twitter: getVal('cfg-social-twitter'),
      instagram: getVal('cfg-social-instagram'),
      discord: getVal('cfg-social-discord'),
      tiktok: getVal('cfg-social-tiktok')
    }
  };

  config.colors = {
    primary: getVal('cfg-color-primary'),
    secondary: getVal('cfg-color-secondary'),
    accent: getVal('cfg-color-accent'),
    text: getVal('cfg-color-text'),
    background: config.colors?.background || '#0e0e10',
    chatBg: config.colors?.chatBg || 'rgba(14, 14, 16, 0.85)',
    alertBg: config.colors?.alertBg || 'rgba(100, 65, 165, 0.9)'
  };

  config.overlay = {
    showWebcamFrame: getCheck('cfg-webcam-frame'),
    showTopBar: getCheck('cfg-top-bar'),
    showBottomBar: getCheck('cfg-bottom-bar'),
    showSocialBar: getCheck('cfg-social-bar'),
    webcamPosition: getVal('cfg-webcam-position'),
    webcamSize: {
      width: parseInt(getVal('cfg-webcam-width')) || 420,
      height: parseInt(getVal('cfg-webcam-height')) || 236
    }
  };

  config.alerts = {
    enabled: getCheck('cfg-alerts-enabled'),
    duration: parseInt(getVal('cfg-alert-duration')) || 5000,
    volume: parseFloat(getVal('cfg-alert-volume')) || 0.5,
    follower: {
      enabled: getCheck('cfg-alert-follower-enabled'),
      message: getVal('cfg-alert-follower-message'),
      template: getVal('cfg-alert-follower-template')
    },
    subscription: {
      enabled: getCheck('cfg-alert-sub-enabled'),
      message: getVal('cfg-alert-sub-message'),
      template: getVal('cfg-alert-sub-template')
    },
    donation: {
      enabled: getCheck('cfg-alert-donation-enabled'),
      message: getVal('cfg-alert-donation-message'),
      template: getVal('cfg-alert-donation-template')
    },
    raid: {
      enabled: getCheck('cfg-alert-raid-enabled'),
      message: getVal('cfg-alert-raid-message'),
      template: getVal('cfg-alert-raid-template')
    }
  };

  config.widgets = {
    viewerCount: { enabled: getCheck('cfg-widget-viewers'), position: 'top-right' },
    goalBar: {
      enabled: getCheck('cfg-widget-goal'),
      title: getVal('cfg-goal-title'),
      type: getVal('cfg-goal-type'),
      target: parseInt(getVal('cfg-goal-target')) || 100,
      current: config.widgets?.goalBar?.current || 0
    },
    latestFollower: { enabled: getCheck('cfg-widget-follower') },
    latestSub: { enabled: getCheck('cfg-widget-sub') },
    latestDonation: { enabled: getCheck('cfg-widget-donation') },
    topDonor: { enabled: getCheck('cfg-widget-top-donor') }
  };

  config.chat = {
    maxMessages: parseInt(getVal('cfg-chat-max')) || 50,
    fontSize: parseInt(getVal('cfg-chat-font-size')) || 14,
    showTimestamp: getCheck('cfg-chat-timestamp'),
    showBadges: getCheck('cfg-chat-badges'),
    showPlatformIcon: getCheck('cfg-chat-platform-icon'),
    fadeMessages: getCheck('cfg-chat-fade'),
    fadeDelay: parseInt(getVal('cfg-chat-fade-delay')) || 60,
    filters: {
      twitch: getCheck('cfg-chat-filter-twitch'),
      youtube: getCheck('cfg-chat-filter-youtube'),
      kick: getCheck('cfg-chat-filter-kick')
    },
    blockedWords: config.chat?.blockedWords || [],
    blockedUsers: config.chat?.blockedUsers || []
  };

  config.platforms = {
    twitch: {
      enabled: getCheck('cfg-twitch-enabled'),
      autoConnect: getCheck('cfg-twitch-autoconnect'),
      channel: getVal('cfg-twitch-channel'),
      oauthToken: getVal('cfg-twitch-token'),
      clientId: getVal('cfg-twitch-client-id'),
      botUsername: config.platforms?.twitch?.botUsername || ''
    },
    youtube: {
      enabled: getCheck('cfg-youtube-enabled'),
      autoConnect: getCheck('cfg-youtube-autoconnect'),
      apiKey: getVal('cfg-youtube-apikey'),
      channelId: getVal('cfg-youtube-channel-id'),
      videoId: getVal('cfg-youtube-video-id'),
      pollRate: config.platforms?.youtube?.pollRate || 5000
    },
    kick: {
      enabled: getCheck('cfg-kick-enabled'),
      autoConnect: getCheck('cfg-kick-autoconnect'),
      channel: getVal('cfg-kick-channel')
    }
  };
}

// --- Theme Selection ---

function selectTheme(themeName, save) {
  config.theme = themeName;

  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === themeName);
  });

  if (save !== false) {
    saveConfig();
  }
}

// --- Platform Connection ---

async function connectPlatform(platform) {
  try {
    await saveConfig();
    const res = await fetch(`${API_BASE}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    });
    const result = await res.json();
    showToast(result.message || `Conectando a ${platform}...`);
  } catch (err) {
    showToast(`Erro ao conectar a ${platform}`, true);
  }
}

async function disconnectPlatform(platform) {
  try {
    const res = await fetch(`${API_BASE}/api/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    });
    const result = await res.json();
    showToast(result.message || `Desconectado de ${platform}`);
    updateConnectionStatus(platform, 'disconnected');
  } catch (err) {
    showToast(`Erro ao desconectar de ${platform}`, true);
  }
}

function updateConnectionStatus(platform, status) {
  const statusEl = document.getElementById(`status-${platform}`);
  if (!statusEl) return;

  statusEl.className = `connection-status status-${status}`;

  const textEl = statusEl.querySelector('.status-text');
  if (textEl) {
    const labels = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connecting: 'Conectando...',
      error: 'Erro'
    };
    textEl.textContent = labels[status] || status;
  }
}

// --- Test Alerts ---

async function testAlert(type) {
  try {
    await fetch(`${API_BASE}/api/test-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertType: type })
    });
    showToast(`Alerta de teste enviado: ${type}`);
  } catch (err) {
    showToast('Erro ao enviar alerta de teste', true);
  }
}

// --- OBS URLs ---

function populateOBSUrls() {
  const baseUrl = window.location.origin;
  const urls = [
    { name: 'Overlay Principal', url: `${baseUrl}/overlay.html`, width: 1920, height: 1080 },
    { name: 'Alertas', url: `${baseUrl}/alerts.html`, width: 1920, height: 1080 },
    { name: 'Chat Unificado', url: `${baseUrl}/chat.html`, width: 400, height: 600 },
    { name: 'Widgets', url: `${baseUrl}/widgets.html`, width: 1920, height: 1080 }
  ];

  const container = document.getElementById('url-list');
  if (!container) return;

  container.innerHTML = '';

  for (const item of urls) {
    const el = document.createElement('div');
    el.className = 'url-item';
    el.innerHTML = `
      <span class="url-name">${item.name}</span>
      <span class="url-value">${item.url}</span>
      <span style="font-size:12px;color:var(--cfg-text-muted)">${item.width}x${item.height}</span>
      <button class="btn btn-sm btn-outline btn-copy" onclick="copyUrl('${item.url}')">📋 Copiar</button>
    `;
    container.appendChild(el);
  }
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('URL copiada!');
  }).catch(() => {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('URL copiada!');
  });
}

// --- Navigation ---

function setupNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  for (const link of navLinks) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.config-section').forEach(s => s.classList.remove('active'));
      const targetSection = document.getElementById(`section-${section}`);
      if (targetSection) targetSection.classList.add('active');
    });
  }
}

// --- Color Sync ---

function setupColorSync() {
  const colorPairs = ['primary', 'secondary', 'accent', 'text'];
  for (const name of colorPairs) {
    const picker = document.getElementById(`cfg-color-${name}`);
    const text = document.getElementById(`cfg-color-${name}-text`);

    if (picker && text) {
      picker.addEventListener('input', () => { text.value = picker.value; });
      text.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(text.value)) {
          picker.value = text.value;
        }
      });
    }
  }
}

// --- WebSocket for live status updates ---

function setupWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'connection_status') {
        for (const [platform, status] of Object.entries(msg.data)) {
          updateConnectionStatus(platform, status);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  ws.onclose = () => {
    setTimeout(setupWebSocket, 3000);
  };
}

// --- Toast ---

function showToast(message, isError) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

// --- Helpers ---

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.value = value;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setCheck(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = !!value;
}

function getCheck(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function setColor(id, value) {
  if (!value) return;
  const picker = document.getElementById(id);
  const text = document.getElementById(id + '-text');
  if (picker) picker.value = value;
  if (text) text.value = value;
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupColorSync();
  loadConfig();
  setupWebSocket();
});
