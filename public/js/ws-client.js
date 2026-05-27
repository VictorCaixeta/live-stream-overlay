/* ============================================
   WebSocket Client - Shared connection manager
   ============================================ */

class WSClient {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.reconnectAttempts = 0;
    this.config = {};
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.emit('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  handleMessage(msg) {
    if (msg.type === 'config_update') {
      this.config = msg.data;
      this.applyTheme(msg.data.theme);
      this.applyColors(msg.data.colors);
    }
    this.emit(msg.type, msg);
  }

  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  off(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    }
  }

  emit(event, data) {
    if (this.handlers[event]) {
      for (const handler of this.handlers[event]) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[WS] Handler error for ${event}:`, err);
        }
      }
    }
  }

  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, this.maxReconnectDelay);
    console.log(`[WS] Reconnecting in ${delay / 1000}s...`);
    setTimeout(() => this.connect(), delay);
  }

  applyTheme(themeName) {
    if (!themeName) return;

    const existingTheme = document.getElementById('theme-stylesheet');
    if (existingTheme) {
      existingTheme.remove();
    }

    const link = document.createElement('link');
    link.id = 'theme-stylesheet';
    link.rel = 'stylesheet';
    link.href = `/css/themes/${themeName}.css`;
    document.head.appendChild(link);
  }

  applyColors(colors) {
    if (!colors) return;

    const root = document.documentElement;
    if (colors.primary) root.style.setProperty('--color-primary', colors.primary);
    if (colors.secondary) root.style.setProperty('--color-secondary', colors.secondary);
    if (colors.accent) root.style.setProperty('--color-accent', colors.accent);
    if (colors.background) root.style.setProperty('--color-bg', colors.background);
    if (colors.text) root.style.setProperty('--color-text', colors.text);
    if (colors.chatBg) root.style.setProperty('--color-chat-bg', colors.chatBg);
    if (colors.alertBg) root.style.setProperty('--color-alert-bg', colors.alertBg);
  }

  getConfig() {
    return this.config;
  }
}

// Platform icon helper
function createPlatformIcon(platform) {
  const icon = document.createElement('span');
  icon.className = `platform-icon ${platform}`;
  const labels = { twitch: 'TW', youtube: 'YT', kick: 'KK' };
  icon.textContent = labels[platform] || '?';
  return icon;
}

// Time formatting helper
function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Escape HTML helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
