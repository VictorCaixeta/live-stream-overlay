/* ============================================
   Main Overlay Logic
   ============================================ */

(function () {
  const ws = new WSClient();

  function init() {
    ws.on('config_update', onConfigUpdate);
    ws.connect();
  }

  function onConfigUpdate(msg) {
    const config = msg.data;
    updateStreamerInfo(config.streamer);
    updateOverlaySettings(config.overlay);
    updateSocialBar(config.streamer.socialMedia);
  }

  function updateStreamerInfo(streamer) {
    if (!streamer) return;

    const nameEl = document.getElementById('streamer-name');
    if (nameEl) nameEl.textContent = streamer.name || 'StreamerName';

    const titleEl = document.getElementById('stream-title');
    if (titleEl) titleEl.textContent = streamer.title || '';

    const webcamNameEl = document.getElementById('webcam-name');
    if (webcamNameEl) webcamNameEl.textContent = streamer.name || 'StreamerName';
  }

  function updateOverlaySettings(overlay) {
    if (!overlay) return;

    const webcamFrame = document.getElementById('webcam-frame');
    if (webcamFrame) {
      webcamFrame.className = 'webcam-frame';
      webcamFrame.classList.add(overlay.webcamPosition || 'bottom-left');

      if (overlay.webcamSize) {
        webcamFrame.style.width = overlay.webcamSize.width + 'px';
        webcamFrame.style.height = overlay.webcamSize.height + 'px';
      }

      webcamFrame.style.display = overlay.showWebcamFrame ? 'block' : 'none';
    }

    const topBar = document.getElementById('top-bar');
    if (topBar) {
      topBar.style.display = overlay.showTopBar ? 'flex' : 'none';
    }

    const bottomBar = document.getElementById('bottom-bar');
    if (bottomBar) {
      bottomBar.style.display = overlay.showBottomBar ? 'flex' : 'none';
    }

    const socialBar = document.getElementById('social-bar');
    if (socialBar) {
      socialBar.style.display = overlay.showSocialBar ? 'flex' : 'none';
    }
  }

  function updateSocialBar(social) {
    const container = document.getElementById('social-items');
    if (!container || !social) return;

    container.innerHTML = '';

    const icons = {
      twitter: '𝕏',
      instagram: '📷',
      discord: '💬',
      tiktok: '🎵',
      facebook: '📘',
      github: '💻'
    };

    for (const [platform, handle] of Object.entries(social)) {
      if (!handle) continue;

      const item = document.createElement('div');
      item.className = 'social-item';

      const icon = document.createElement('span');
      icon.className = 'social-icon';
      icon.textContent = icons[platform] || '🔗';

      const text = document.createElement('span');
      text.textContent = handle;

      item.appendChild(icon);
      item.appendChild(text);
      container.appendChild(item);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
