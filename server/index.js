const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { TwitchPlatform } = require('./platforms/twitch');
const { YouTubePlatform } = require('./platforms/youtube');
const { KickPlatform } = require('./platforms/kick');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config.default.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Configuration Management ---

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading config:', err.message);
  }
  return JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

let config = loadConfig();

// --- API Routes ---

app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  saveConfig(config);
  broadcast({ type: 'config_update', data: config });
  res.json({ success: true, config });
});

app.post('/api/config/reset', (req, res) => {
  config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
  saveConfig(config);
  broadcast({ type: 'config_update', data: config });
  res.json({ success: true, config });
});

app.post('/api/test-alert', (req, res) => {
  const { alertType } = req.body;
  const testAlerts = {
    follower: {
      type: 'new_follower',
      platform: 'twitch',
      data: { username: 'TestUser', displayName: 'Test User' }
    },
    subscription: {
      type: 'subscription',
      platform: 'twitch',
      data: { username: 'TestSub', displayName: 'Test Sub', tier: '1', months: 3, message: 'Love this stream!' }
    },
    donation: {
      type: 'donation',
      platform: 'youtube',
      data: { username: 'TestDonor', displayName: 'Test Donor', amount: '10.00', currency: 'USD', message: 'Great content!' }
    },
    raid: {
      type: 'raid',
      platform: 'twitch',
      data: { username: 'RaidLeader', displayName: 'Raid Leader', viewers: 150 }
    }
  };

  const alert = testAlerts[alertType];
  if (alert) {
    broadcast(alert);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid alert type' });
  }
});

app.post('/api/connect', (req, res) => {
  const { platform } = req.body;
  connectPlatform(platform);
  res.json({ success: true, message: `Connecting to ${platform}...` });
});

app.post('/api/disconnect', (req, res) => {
  const { platform } = req.body;
  disconnectPlatform(platform);
  res.json({ success: true, message: `Disconnected from ${platform}` });
});

// --- WebSocket Hub ---

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'config_update', data: config }));
  ws.send(JSON.stringify({ type: 'connection_status', data: getConnectionStatus() }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      handleClientMessage(ws, msg);
    } catch (err) {
      console.error('Invalid message:', err.message);
    }
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'get_config':
      ws.send(JSON.stringify({ type: 'config_update', data: config }));
      break;
    case 'chat_message_send':
      break;
    default:
      break;
  }
}

// --- Platform Connections ---

const platforms = {
  twitch: null,
  youtube: null,
  kick: null
};

function connectPlatform(name) {
  disconnectPlatform(name);

  const platformConfig = config.platforms && config.platforms[name];
  if (!platformConfig || !platformConfig.enabled) {
    console.log(`${name} is not configured or not enabled`);
    return;
  }

  const eventHandler = (event) => {
    broadcast(event);
    updateWidgetData(event);
  };

  const statusHandler = (status) => {
    broadcast({
      type: 'connection_status',
      data: { [name]: status }
    });
  };

  switch (name) {
    case 'twitch':
      platforms.twitch = new TwitchPlatform(platformConfig, eventHandler, statusHandler);
      platforms.twitch.connect();
      break;
    case 'youtube':
      platforms.youtube = new YouTubePlatform(platformConfig, eventHandler, statusHandler);
      platforms.youtube.connect();
      break;
    case 'kick':
      platforms.kick = new KickPlatform(platformConfig, eventHandler, statusHandler);
      platforms.kick.connect();
      break;
  }
}

function disconnectPlatform(name) {
  if (platforms[name]) {
    platforms[name].disconnect();
    platforms[name] = null;
  }
}

function getConnectionStatus() {
  const status = {};
  for (const [name, platform] of Object.entries(platforms)) {
    status[name] = platform ? platform.getStatus() : 'disconnected';
  }
  return status;
}

// --- Widget Data ---

const widgetData = {
  viewerCount: { twitch: 0, youtube: 0, kick: 0, total: 0 },
  latestFollower: null,
  latestSubscriber: null,
  latestDonation: null,
  topDonor: null,
  sessionFollowers: 0,
  sessionSubscribers: 0,
  sessionDonations: 0,
  goalCurrent: 0,
  goalTarget: 100,
  donations: []
};

function updateWidgetData(event) {
  switch (event.type) {
    case 'new_follower':
      widgetData.latestFollower = event.data;
      widgetData.sessionFollowers++;
      break;
    case 'subscription':
      widgetData.latestSubscriber = event.data;
      widgetData.sessionSubscribers++;
      break;
    case 'donation':
      widgetData.latestDonation = event.data;
      widgetData.sessionDonations += parseFloat(event.data.amount) || 0;
      widgetData.donations.push(event.data);
      updateTopDonor();
      break;
    case 'viewer_count':
      widgetData.viewerCount[event.platform] = event.data.count || 0;
      widgetData.viewerCount.total = Object.entries(widgetData.viewerCount)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, val]) => sum + val, 0);
      break;
    case 'raid':
      break;
  }

  broadcast({ type: 'widget_update', data: widgetData });
}

function updateTopDonor() {
  const donorTotals = {};
  for (const donation of widgetData.donations) {
    const key = donation.username;
    donorTotals[key] = (donorTotals[key] || 0) + (parseFloat(donation.amount) || 0);
  }
  let topDonor = null;
  let topAmount = 0;
  for (const [username, amount] of Object.entries(donorTotals)) {
    if (amount > topAmount) {
      topAmount = amount;
      topDonor = { username, amount: topAmount };
    }
  }
  widgetData.topDonor = topDonor;
}

// --- Auto-connect enabled platforms ---

function autoConnect() {
  if (config.platforms) {
    for (const name of Object.keys(config.platforms)) {
      if (config.platforms[name].enabled && config.platforms[name].autoConnect) {
        console.log(`Auto-connecting to ${name}...`);
        connectPlatform(name);
      }
    }
  }
}

// --- Start Server ---

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Live Stream Overlay Server running on http://localhost:${PORT}`);
  console.log(`\n📺 Overlay URLs (use as OBS Browser Sources):`);
  console.log(`   Main Overlay:  http://localhost:${PORT}/overlay.html`);
  console.log(`   Alerts:        http://localhost:${PORT}/alerts.html`);
  console.log(`   Chat:          http://localhost:${PORT}/chat.html`);
  console.log(`   Widgets:       http://localhost:${PORT}/widgets.html`);
  console.log(`\n⚙️  Config Panel:  http://localhost:${PORT}/config.html`);
  console.log('');
  autoConnect();
});
