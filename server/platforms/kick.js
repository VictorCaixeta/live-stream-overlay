const WebSocket = require('ws');
const fetch = require('node-fetch');

class KickPlatform {
  constructor(config, eventHandler, statusHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
    this.statusHandler = statusHandler;
    this.status = 'disconnected';
    this.ws = null;
    this.chatroomId = null;
    this.channelId = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    const channel = this.config.channel;
    if (!channel) {
      console.log('Kick: No channel configured');
      return;
    }

    this.setStatus('connecting');

    try {
      await this.fetchChannelInfo(channel);
      this.connectWebSocket();
    } catch (err) {
      console.error('Kick connection error:', err.message);
      this.setStatus('error');
    }
  }

  async fetchChannelInfo(channel) {
    try {
      const url = `https://kick.com/api/v2/channels/${channel}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LiveStreamOverlay/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.chatroomId = data.chatroom && data.chatroom.id;
        this.channelId = data.id;
        console.log(`Kick: Found channel ${channel}, chatroom ID: ${this.chatroomId}`);
      } else {
        this.chatroomId = channel;
        console.log(`Kick: Using channel name as chatroom ID: ${channel}`);
      }
    } catch (err) {
      this.chatroomId = channel;
      console.log(`Kick: Could not fetch channel info, using channel name: ${channel}`);
    }
  }

  connectWebSocket() {
    const wsUrl = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false';

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Kick: WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleMessage(msg);
      } catch (err) {
        console.error('Kick parse error:', err.message);
      }
    });

    this.ws.on('close', () => {
      console.log('Kick: WebSocket disconnected');
      this.setStatus('disconnected');
      this.attemptReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('Kick WebSocket error:', err.message);
      this.setStatus('error');
    });
  }

  handleMessage(msg) {
    if (msg.event === 'pusher:connection_established') {
      this.subscribeToChatroom();
      this.setStatus('connected');
      return;
    }

    if (msg.event === 'pusher_internal:subscription_succeeded') {
      console.log(`Kick: Subscribed to chatroom ${this.chatroomId}`);
      return;
    }

    if (msg.event === 'App\\Events\\ChatMessageEvent') {
      this.handleChatMessage(msg);
      return;
    }

    if (msg.event === 'App\\Events\\FollowersUpdated') {
      this.handleFollowerEvent(msg);
      return;
    }

    if (msg.event === 'App\\Events\\SubscriptionEvent') {
      this.handleSubscriptionEvent(msg);
      return;
    }

    if (msg.event === 'App\\Events\\GiftedSubscriptionsEvent') {
      this.handleGiftSubEvent(msg);
      return;
    }

    if (msg.event === 'App\\Events\\StreamHostEvent') {
      this.handleRaidEvent(msg);
      return;
    }
  }

  subscribeToChatroom() {
    if (!this.chatroomId || !this.ws) return;

    const subscribeMsg = JSON.stringify({
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: `chatrooms.${this.chatroomId}.v2`
      }
    });

    this.ws.send(subscribeMsg);

    const channelSubscribeMsg = JSON.stringify({
      event: 'pusher:subscribe',
      data: {
        auth: '',
        channel: `channel.${this.channelId || this.chatroomId}`
      }
    });

    this.ws.send(channelSubscribeMsg);
  }

  handleChatMessage(msg) {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;

      this.eventHandler({
        type: 'chat_message',
        platform: 'kick',
        data: {
          id: (data.id || Date.now()).toString(),
          username: data.sender && data.sender.slug,
          displayName: data.sender && data.sender.username,
          message: data.content || '',
          color: '#53fc18',
          badges: this.extractBadges(data.sender),
          isMod: data.sender && data.sender.identity && data.sender.identity.badges
            ? data.sender.identity.badges.some(b => b.type === 'moderator')
            : false,
          isSub: data.sender && data.sender.identity && data.sender.identity.badges
            ? data.sender.identity.badges.some(b => b.type === 'subscriber')
            : false,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error('Kick: Error parsing chat message:', err.message);
    }
  }

  extractBadges(sender) {
    if (!sender || !sender.identity || !sender.identity.badges) return {};
    const badges = {};
    for (const badge of sender.identity.badges) {
      badges[badge.type] = badge.text || '1';
    }
    return badges;
  }

  handleFollowerEvent(msg) {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      if (data.followed) {
        this.eventHandler({
          type: 'new_follower',
          platform: 'kick',
          data: {
            username: data.username || 'Unknown',
            displayName: data.username || 'Unknown'
          }
        });
      }
    } catch (err) {
      console.error('Kick: Error parsing follower event:', err.message);
    }
  }

  handleSubscriptionEvent(msg) {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      this.eventHandler({
        type: 'subscription',
        platform: 'kick',
        data: {
          username: data.username || 'Unknown',
          displayName: data.username || 'Unknown',
          tier: '1',
          months: data.months || 1,
          message: ''
        }
      });
    } catch (err) {
      console.error('Kick: Error parsing subscription event:', err.message);
    }
  }

  handleGiftSubEvent(msg) {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      this.eventHandler({
        type: 'subscription',
        platform: 'kick',
        data: {
          username: data.gifter_username || 'Unknown',
          displayName: data.gifter_username || 'Unknown',
          tier: '1',
          months: 1,
          message: `Gifted ${data.gifted_usernames ? data.gifted_usernames.length : 1} sub(s)`,
          isGift: true
        }
      });
    } catch (err) {
      console.error('Kick: Error parsing gift sub event:', err.message);
    }
  }

  handleRaidEvent(msg) {
    try {
      const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      this.eventHandler({
        type: 'raid',
        platform: 'kick',
        data: {
          username: data.host_username || 'Unknown',
          displayName: data.host_username || 'Unknown',
          viewers: data.number_viewers || 0
        }
      });
    } catch (err) {
      console.error('Kick: Error parsing raid event:', err.message);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Kick: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Kick: Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
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

module.exports = { KickPlatform };
