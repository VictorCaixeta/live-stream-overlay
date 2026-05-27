/* ============================================
   Unified Chat Logic
   ============================================ */

(function () {
  const ws = new WSClient();
  let chatConfig = {};
  let filters = { twitch: true, youtube: true, kick: true };
  let autoScroll = true;
  let messageCount = 0;
  let fadeTimers = [];

  function init() {
    ws.on('config_update', onConfigUpdate);
    ws.on('chat_message', onChatMessage);
    ws.connect();

    setupFilters();
    setupScrollDetection();
  }

  function onConfigUpdate(msg) {
    chatConfig = msg.data.chat || {};
    filters = chatConfig.filters || { twitch: true, youtube: true, kick: true };
    updateFilterButtons();
    applyFontSize();
  }

  function onChatMessage(msg) {
    const data = msg.data;
    const platform = msg.platform;

    if (!filters[platform]) return;

    if (isBlocked(data)) return;

    addMessage(platform, data);
  }

  function isBlocked(data) {
    if (!chatConfig.blockedUsers || !chatConfig.blockedWords) return false;

    if (chatConfig.blockedUsers.includes(data.username)) return true;

    const message = (data.message || '').toLowerCase();
    for (const word of chatConfig.blockedWords) {
      if (message.includes(word.toLowerCase())) return true;
    }

    return false;
  }

  function addMessage(platform, data) {
    const container = document.getElementById('chat-messages');
    const emptyState = document.getElementById('chat-empty');

    if (emptyState) emptyState.style.display = 'none';

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    if (data.isSuperChat) msgEl.classList.add('super-chat');

    // Platform icon
    if (chatConfig.showPlatformIcon !== false) {
      const platformDiv = document.createElement('div');
      platformDiv.className = 'msg-platform';
      platformDiv.appendChild(createPlatformIcon(platform));
      msgEl.appendChild(platformDiv);
    }

    // Timestamp
    if (chatConfig.showTimestamp) {
      const timeEl = document.createElement('span');
      timeEl.className = 'msg-timestamp';
      timeEl.textContent = formatTime(data.timestamp || Date.now());
      msgEl.appendChild(timeEl);
    }

    // Badges
    if (chatConfig.showBadges !== false) {
      const badgesEl = createBadges(data, platform);
      if (badgesEl) msgEl.appendChild(badgesEl);
    }

    // Username
    const nameEl = document.createElement('span');
    nameEl.className = `msg-username ${platform}`;
    nameEl.style.color = data.color || '';
    nameEl.textContent = data.displayName || data.username;
    msgEl.appendChild(nameEl);

    // Separator
    const sep = document.createElement('span');
    sep.className = 'msg-separator';
    sep.textContent = ':';
    msgEl.appendChild(sep);

    // Message text
    const textEl = document.createElement('span');
    textEl.className = 'msg-text';
    textEl.textContent = ' ' + (data.message || '');
    msgEl.appendChild(textEl);

    container.appendChild(msgEl);
    messageCount++;

    // Limit messages
    const maxMessages = chatConfig.maxMessages || 50;
    while (container.children.length > maxMessages) {
      container.removeChild(container.firstChild);
    }

    // Auto-scroll
    if (autoScroll) {
      container.scrollTop = container.scrollHeight;
    }

    // Fade timer
    if (chatConfig.fadeMessages && chatConfig.fadeDelay > 0) {
      const timer = setTimeout(() => {
        msgEl.classList.add('fading');
        setTimeout(() => {
          if (msgEl.parentNode) {
            msgEl.parentNode.removeChild(msgEl);
          }
        }, 1000);
      }, (chatConfig.fadeDelay || 60) * 1000);
      fadeTimers.push(timer);
    }
  }

  function createBadges(data, platform) {
    const badges = [];

    if (data.isOwner) badges.push({ class: 'owner', text: '👑' });
    if (data.isMod) badges.push({ class: 'mod', text: 'M' });
    if (data.isVip) badges.push({ class: 'vip', text: 'V' });
    if (data.isSub || data.isSponsor) badges.push({ class: 'sub', text: 'S' });

    if (badges.length === 0) return null;

    const container = document.createElement('span');
    container.className = 'msg-badges';

    for (const badge of badges) {
      const el = document.createElement('span');
      el.className = `msg-badge ${badge.class}`;
      el.textContent = badge.text;
      container.appendChild(el);
    }

    return container;
  }

  function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    for (const btn of filterBtns) {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        filters[platform] = !filters[platform];
        btn.classList.toggle('active', filters[platform]);
      });
    }
  }

  function updateFilterButtons() {
    for (const [platform, enabled] of Object.entries(filters)) {
      const btn = document.querySelector(`.filter-btn.${platform}`);
      if (btn) btn.classList.toggle('active', enabled);
    }
  }

  function setupScrollDetection() {
    const container = document.getElementById('chat-messages');
    container.addEventListener('scroll', () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
      autoScroll = isAtBottom;
    });

    container.addEventListener('mouseenter', () => {
      autoScroll = false;
    });

    container.addEventListener('mouseleave', () => {
      autoScroll = true;
      container.scrollTop = container.scrollHeight;
    });
  }

  function applyFontSize() {
    const container = document.getElementById('chat-messages');
    if (container && chatConfig.fontSize) {
      container.style.fontSize = chatConfig.fontSize + 'px';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
