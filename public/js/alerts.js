/* ============================================
   Alert System Logic
   ============================================ */

(function () {
  const ws = new WSClient();
  const alertQueue = [];
  let isShowingAlert = false;
  let alertConfig = {};

  const alertIcons = {
    new_follower: '❤️',
    subscription: '⭐',
    donation: '💰',
    raid: '⚔️'
  };

  function init() {
    ws.on('config_update', onConfigUpdate);
    ws.on('new_follower', onAlert);
    ws.on('subscription', onAlert);
    ws.on('donation', onAlert);
    ws.on('raid', onAlert);
    ws.connect();
  }

  function onConfigUpdate(msg) {
    alertConfig = msg.data.alerts || {};
  }

  function onAlert(msg) {
    if (!alertConfig.enabled) return;

    const typeMap = {
      new_follower: 'follower',
      subscription: 'subscription',
      donation: 'donation',
      raid: 'raid'
    };

    const configKey = typeMap[msg.type];
    if (configKey && alertConfig[configKey] && !alertConfig[configKey].enabled) return;

    alertQueue.push(msg);
    processQueue();
  }

  function processQueue() {
    if (isShowingAlert || alertQueue.length === 0) return;

    isShowingAlert = true;
    const alert = alertQueue.shift();
    showAlert(alert);
  }

  function showAlert(alert) {
    const box = document.getElementById('alert-box');
    const iconEl = document.getElementById('alert-icon');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const subEl = document.getElementById('alert-submessage');
    const platformEl = document.getElementById('alert-platform');
    const particlesEl = document.getElementById('particles');

    // Set type class
    box.className = 'alert-box alert-' + getAlertClass(alert.type);

    // Icon
    iconEl.textContent = alertIcons[alert.type] || '🔔';

    // Title
    titleEl.textContent = getAlertTitle(alert);

    // Message
    messageEl.innerHTML = getAlertMessage(alert);

    // Sub-message
    const subMsg = getAlertSubMessage(alert);
    subEl.textContent = subMsg;
    subEl.style.display = subMsg ? 'block' : 'none';

    // Platform badge
    platformEl.textContent = alert.platform;
    platformEl.className = 'alert-platform ' + alert.platform;

    // Show with animation
    box.classList.remove('hidden');
    box.classList.add('alert-enter');
    box.classList.remove('alert-exit');

    // Particles
    createParticles(particlesEl, alert.type);

    // Play sound
    playAlertSound(alert.type);

    // Auto-hide
    const duration = alertConfig.duration || 5000;
    setTimeout(() => {
      hideAlert(box);
    }, duration);
  }

  function hideAlert(box) {
    box.classList.remove('alert-enter');
    box.classList.add('alert-exit');

    setTimeout(() => {
      box.classList.add('hidden');
      isShowingAlert = false;
      processQueue();
    }, 500);
  }

  function getAlertClass(type) {
    const map = {
      new_follower: 'follower',
      subscription: 'subscription',
      donation: 'donation',
      raid: 'raid'
    };
    return map[type] || 'follower';
  }

  function getAlertTitle(alert) {
    const typeMap = {
      new_follower: 'follower',
      subscription: 'subscription',
      donation: 'donation',
      raid: 'raid'
    };
    const configKey = typeMap[alert.type];
    if (configKey && alertConfig[configKey] && alertConfig[configKey].message) {
      return alertConfig[configKey].message;
    }

    const defaults = {
      new_follower: 'Novo Seguidor!',
      subscription: 'Nova Inscrição!',
      donation: 'Doação Recebida!',
      raid: 'RAID!'
    };
    return defaults[alert.type] || 'Alerta!';
  }

  function getAlertMessage(alert) {
    const data = alert.data;
    const username = `<span class="username">${escapeHtml(data.displayName || data.username)}</span>`;

    const typeMap = {
      new_follower: 'follower',
      subscription: 'subscription',
      donation: 'donation',
      raid: 'raid'
    };
    const configKey = typeMap[alert.type];

    if (configKey && alertConfig[configKey] && alertConfig[configKey].template) {
      let template = alertConfig[configKey].template;
      template = template.replace('{username}', data.displayName || data.username);
      template = template.replace('{months}', data.months || '1');
      template = template.replace('{amount}', data.amount || '0');
      template = template.replace('{currency}', data.currency || 'USD');
      template = template.replace('{viewers}', data.viewers || '0');
      template = template.replace('{tier}', data.tier || '1');
      return template;
    }

    switch (alert.type) {
      case 'new_follower':
        return `${username} acabou de seguir!`;
      case 'subscription':
        return `${username} se inscreveu!`;
      case 'donation':
        return `${username} doou ${escapeHtml(data.currency || 'USD')} ${escapeHtml(data.amount || '0')}!`;
      case 'raid':
        return `${username} raid com ${data.viewers || 0} viewers!`;
      default:
        return username;
    }
  }

  function getAlertSubMessage(alert) {
    const data = alert.data;
    switch (alert.type) {
      case 'subscription':
        if (data.months > 1) {
          return `${data.months} meses consecutivos!`;
        }
        if (data.message) return data.message;
        return '';
      case 'donation':
        return data.message || '';
      case 'raid':
        return `${data.viewers} viewers chegando!`;
      default:
        return '';
    }
  }

  function createParticles(container, type) {
    container.innerHTML = '';

    const colors = {
      new_follower: ['#00d4aa', '#00ff88', '#66ffc2'],
      subscription: ['#6441a5', '#9147ff', '#bf94ff'],
      donation: ['#ffca28', '#ffd54f', '#ffe082'],
      raid: ['#ff6b6b', '#ff8a80', '#ffab91']
    };

    const particleColors = colors[type] || colors.new_follower;
    const count = 20;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = Math.random() * 8 + 4;
      const tx = (Math.random() - 0.5) * 600;
      const ty = (Math.random() - 0.5) * 400;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      const delay = Math.random() * 0.5;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: 50%;
        top: 50%;
        --tx: ${tx}px;
        --ty: ${ty}px;
        animation-delay: ${delay}s;
      `;

      container.appendChild(particle);
    }
  }

  function playAlertSound(type) {
    const volume = alertConfig.volume || 0.5;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const sounds = {
        new_follower: { freq: 800, type: 'sine', duration: 0.3 },
        subscription: { freq: 600, type: 'triangle', duration: 0.5 },
        donation: { freq: 1000, type: 'sine', duration: 0.4 },
        raid: { freq: 400, type: 'square', duration: 0.6 }
      };

      const sound = sounds[type] || sounds.new_follower;

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.freq, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(sound.freq * 1.5, audioCtx.currentTime + sound.duration / 2);
      oscillator.frequency.exponentialRampToValueAtTime(sound.freq, audioCtx.currentTime + sound.duration);

      gainNode.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + sound.duration);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + sound.duration);
    } catch (err) {
      // Audio not available in this context
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
