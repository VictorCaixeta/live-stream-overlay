const tmi = require('tmi.js');

class TwitchPlatform {
  constructor(config, eventHandler, statusHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
    this.statusHandler = statusHandler;
    this.client = null;
    this.eventSocket = null;
    this.status = 'disconnected';
  }

  connect() {
    this.connectChat();
    this.connectEventSub();
  }

  connectChat() {
    const channel = this.config.channel;
    if (!channel) {
      console.log('Twitch: No channel configured');
      return;
    }

    this.setStatus('connecting');

    const opts = {
      options: { debug: false },
      connection: {
        secure: true,
        reconnect: true
      },
      channels: [channel]
    };

    if (this.config.oauthToken) {
      opts.identity = {
        username: this.config.botUsername || channel,
        password: `oauth:${this.config.oauthToken.replace('oauth:', '')}`
      };
    }

    this.client = new tmi.Client(opts);

    this.client.on('connected', () => {
      console.log(`Twitch: Connected to #${channel}`);
      this.setStatus('connected');
    });

    this.client.on('disconnected', () => {
      console.log('Twitch: Disconnected');
      this.setStatus('disconnected');
    });

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return;

      this.eventHandler({
        type: 'chat_message',
        platform: 'twitch',
        data: {
          id: tags.id || Date.now().toString(),
          username: tags.username,
          displayName: tags['display-name'] || tags.username,
          message: message,
          color: tags.color || '#9147ff',
          badges: tags.badges || {},
          emotes: tags.emotes || {},
          isMod: tags.mod,
          isSub: tags.subscriber,
          isVip: tags.vip,
          timestamp: Date.now()
        }
      });
    });

    this.client.on('subscription', (channel, username, methods, message, tags) => {
      this.eventHandler({
        type: 'subscription',
        platform: 'twitch',
        data: {
          username: username,
          displayName: tags['display-name'] || username,
          tier: methods.plan === '3000' ? '3' : methods.plan === '2000' ? '2' : '1',
          months: 1,
          message: message || ''
        }
      });
    });

    this.client.on('resub', (channel, username, months, message, tags, methods) => {
      this.eventHandler({
        type: 'subscription',
        platform: 'twitch',
        data: {
          username: username,
          displayName: tags['display-name'] || username,
          tier: methods.plan === '3000' ? '3' : methods.plan === '2000' ? '2' : '1',
          months: parseInt(tags['msg-param-cumulative-months']) || months,
          message: message || '',
          isResub: true
        }
      });
    });

    this.client.on('raided', (channel, username, viewers) => {
      this.eventHandler({
        type: 'raid',
        platform: 'twitch',
        data: {
          username: username,
          displayName: username,
          viewers: viewers
        }
      });
    });

    this.client.on('cheer', (channel, tags, message) => {
      const bits = parseInt(tags.bits) || 0;
      this.eventHandler({
        type: 'donation',
        platform: 'twitch',
        data: {
          username: tags.username,
          displayName: tags['display-name'] || tags.username,
          amount: (bits / 100).toFixed(2),
          currency: 'USD',
          message: message,
          bits: bits
        }
      });
    });

    this.client.connect().catch((err) => {
      console.error('Twitch connection error:', err.message);
      this.setStatus('error');
    });
  }

  connectEventSub() {
    if (!this.config.oauthToken || !this.config.clientId) return;

    const wsUrl = 'wss://eventsub.wss.twitch.tv/ws';
    const WebSocket = require('ws');

    this.eventSocket = new WebSocket(wsUrl);

    this.eventSocket.on('open', () => {
      console.log('Twitch EventSub: Connected');
    });

    this.eventSocket.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleEventSubMessage(msg);
      } catch (err) {
        console.error('Twitch EventSub parse error:', err.message);
      }
    });

    this.eventSocket.on('close', () => {
      console.log('Twitch EventSub: Disconnected');
    });

    this.eventSocket.on('error', (err) => {
      console.error('Twitch EventSub error:', err.message);
    });
  }

  handleEventSubMessage(msg) {
    if (msg.metadata && msg.metadata.message_type === 'session_welcome') {
      console.log('Twitch EventSub: Session established');
      return;
    }

    if (msg.metadata && msg.metadata.message_type === 'notification') {
      const eventType = msg.metadata.subscription_type;
      const eventData = msg.payload && msg.payload.event;

      if (!eventData) return;

      switch (eventType) {
        case 'channel.follow':
          this.eventHandler({
            type: 'new_follower',
            platform: 'twitch',
            data: {
              username: eventData.user_login,
              displayName: eventData.user_name
            }
          });
          break;
      }
    }
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    if (this.eventSocket) {
      this.eventSocket.close();
      this.eventSocket = null;
    }
    this.setStatus('disconnected');
  }

  setStatus(status) {
    this.status = status;
    this.statusHandler(status);
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { TwitchPlatform };
