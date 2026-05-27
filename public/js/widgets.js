/* ============================================
   Widgets Logic
   ============================================ */

(function () {
  const ws = new WSClient();
  let widgetConfig = {};

  function init() {
    ws.on('config_update', onConfigUpdate);
    ws.on('widget_update', onWidgetUpdate);
    ws.connect();
  }

  function onConfigUpdate(msg) {
    widgetConfig = msg.data.widgets || {};
    updateGoalConfig(msg.data.widgets);
    updateVisibility();
  }

  function onWidgetUpdate(msg) {
    const data = msg.data;
    updateViewerCount(data.viewerCount);
    updateLatestFollower(data.latestFollower);
    updateLatestSubscriber(data.latestSubscriber);
    updateLatestDonation(data.latestDonation);
    updateTopDonor(data.topDonor);
    updateGoal(data);
    updateSessionStats(data);
  }

  function updateVisibility() {
    toggleWidget('widget-viewers', widgetConfig.viewerCount);
    toggleWidget('widget-goal', widgetConfig.goalBar);
    toggleWidget('widget-follower', widgetConfig.latestFollower);
    toggleWidget('widget-sub', widgetConfig.latestSub);
    toggleWidget('widget-donation', widgetConfig.latestDonation);
    toggleWidget('widget-top-donor', widgetConfig.topDonor);
  }

  function toggleWidget(id, config) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (config && config.enabled) ? 'block' : 'none';
    }
  }

  // --- Viewer Count ---
  function updateViewerCount(viewerCount) {
    if (!viewerCount) return;

    const totalEl = document.getElementById('viewer-total');
    if (totalEl) {
      animateNumber(totalEl, viewerCount.total || 0);
    }

    const twitchEl = document.getElementById('viewer-twitch');
    if (twitchEl) twitchEl.textContent = viewerCount.twitch || 0;

    const ytEl = document.getElementById('viewer-youtube');
    if (ytEl) ytEl.textContent = viewerCount.youtube || 0;

    const kickEl = document.getElementById('viewer-kick');
    if (kickEl) kickEl.textContent = viewerCount.kick || 0;

    pulseWidget('widget-viewers');
  }

  // --- Latest Follower ---
  function updateLatestFollower(follower) {
    if (!follower) return;
    const nameEl = document.getElementById('follower-name');
    if (nameEl) {
      nameEl.textContent = follower.displayName || follower.username;
      pulseWidget('widget-follower');
    }
  }

  // --- Latest Subscriber ---
  function updateLatestSubscriber(subscriber) {
    if (!subscriber) return;
    const nameEl = document.getElementById('sub-name');
    if (nameEl) {
      nameEl.textContent = subscriber.displayName || subscriber.username;
    }
    const extraEl = document.getElementById('sub-extra');
    if (extraEl && subscriber.months > 1) {
      extraEl.textContent = `${subscriber.months} meses`;
    }
    pulseWidget('widget-sub');
  }

  // --- Latest Donation ---
  function updateLatestDonation(donation) {
    if (!donation) return;
    const nameEl = document.getElementById('donation-name');
    if (nameEl) {
      nameEl.textContent = donation.displayName || donation.username;
    }
    const extraEl = document.getElementById('donation-extra');
    if (extraEl) {
      extraEl.textContent = `${donation.currency || 'USD'} ${donation.amount}`;
    }
    pulseWidget('widget-donation');
  }

  // --- Top Donor ---
  function updateTopDonor(topDonor) {
    if (!topDonor) return;
    const nameEl = document.getElementById('top-donor-name');
    if (nameEl) {
      nameEl.textContent = topDonor.username;
    }
    const extraEl = document.getElementById('top-donor-extra');
    if (extraEl) {
      extraEl.textContent = `USD ${topDonor.amount.toFixed(2)}`;
    }
    pulseWidget('widget-top-donor');
  }

  // --- Goal Bar ---
  function updateGoalConfig(config) {
    if (!config || !config.goalBar) return;
    const titleEl = document.getElementById('goal-title');
    if (titleEl) titleEl.textContent = config.goalBar.title || 'Meta';

    const targetEl = document.getElementById('goal-target');
    if (targetEl) targetEl.textContent = config.goalBar.target || 100;
  }

  function updateGoal(data) {
    if (!widgetConfig.goalBar) return;

    const goalType = widgetConfig.goalBar.type || 'followers';
    let current = 0;

    switch (goalType) {
      case 'followers':
        current = data.sessionFollowers || 0;
        break;
      case 'subscribers':
        current = data.sessionSubscribers || 0;
        break;
      case 'donations':
        current = data.sessionDonations || 0;
        break;
      default:
        current = widgetConfig.goalBar.current || 0;
    }

    const target = widgetConfig.goalBar.target || 100;
    const percentage = Math.min((current / target) * 100, 100);

    const currentEl = document.getElementById('goal-current');
    if (currentEl) currentEl.textContent = Math.floor(current);

    const fillEl = document.getElementById('goal-fill');
    if (fillEl) fillEl.style.width = percentage + '%';

    const percentEl = document.getElementById('goal-percentage');
    if (percentEl) percentEl.textContent = Math.floor(percentage) + '%';
  }

  // --- Session Stats ---
  function updateSessionStats(data) {
    const followersEl = document.getElementById('stat-followers');
    if (followersEl) followersEl.textContent = data.sessionFollowers || 0;

    const subsEl = document.getElementById('stat-subs');
    if (subsEl) subsEl.textContent = data.sessionSubscribers || 0;

    const donationsEl = document.getElementById('stat-donations');
    if (donationsEl) donationsEl.textContent = '$' + (data.sessionDonations || 0).toFixed(2);
  }

  // --- Helpers ---
  function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const diff = target - current;
    const steps = 20;
    const stepValue = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      el.textContent = Math.round(current + stepValue * step);
      if (step >= steps) {
        el.textContent = target;
        clearInterval(interval);
      }
    }, 30);
  }

  function pulseWidget(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('widget-updated');
      void el.offsetWidth;
      el.classList.add('widget-updated');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
