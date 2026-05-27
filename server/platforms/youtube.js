const fetch = require('node-fetch');

class YouTubePlatform {
  constructor(config, eventHandler, statusHandler) {
    this.config = config;
    this.eventHandler = eventHandler;
    this.statusHandler = statusHandler;
    this.status = 'disconnected';
    this.pollInterval = null;
    this.nextPageToken = null;
    this.liveChatId = null;
  }

  async connect() {
    if (!this.config.apiKey) {
      console.log('YouTube: No API key configured');
      return;
    }

    this.setStatus('connecting');

    try {
      await this.findLiveChat();
      if (this.liveChatId) {
        this.startPolling();
        this.setStatus('connected');
      } else {
        console.log('YouTube: No active live chat found');
        this.setStatus('error');
      }
    } catch (err) {
      console.error('YouTube connection error:', err.message);
      this.setStatus('error');
    }
  }

  async findLiveChat() {
    const channelId = this.config.channelId;
    const videoId = this.config.videoId;

    if (videoId) {
      await this.getChatIdFromVideo(videoId);
      return;
    }

    if (channelId) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${this.config.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const liveVideoId = data.items[0].id.videoId;
        await this.getChatIdFromVideo(liveVideoId);
      }
    }
  }

  async getChatIdFromVideo(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${this.config.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const details = data.items[0].liveStreamingDetails;
      if (details && details.activeLiveChatId) {
        this.liveChatId = details.activeLiveChatId;
        console.log('YouTube: Found live chat:', this.liveChatId);
      }
    }
  }

  startPolling() {
    const pollRate = this.config.pollRate || 5000;

    this.pollInterval = setInterval(async () => {
      try {
        await this.pollMessages();
      } catch (err) {
        console.error('YouTube poll error:', err.message);
      }
    }, pollRate);

    this.pollMessages();
  }

  async pollMessages() {
    let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${this.liveChatId}&part=snippet,authorDetails&key=${this.config.apiKey}`;

    if (this.nextPageToken) {
      url += `&pageToken=${this.nextPageToken}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API error:', data.error.message);
      return;
    }

    this.nextPageToken = data.nextPageToken;

    if (!data.items) return;

    for (const item of data.items) {
      const snippet = item.snippet;
      const author = item.authorDetails;

      if (snippet.type === 'textMessageEvent') {
        this.eventHandler({
          type: 'chat_message',
          platform: 'youtube',
          data: {
            id: item.id,
            username: author.channelId,
            displayName: author.displayName,
            message: snippet.textMessageDetails.messageText,
            color: '#ff0000',
            profileImage: author.profileImageUrl,
            isMod: author.isChatModerator,
            isOwner: author.isChatOwner,
            isSponsor: author.isChatSponsor,
            timestamp: new Date(snippet.publishedAt).getTime()
          }
        });
      } else if (snippet.type === 'superChatEvent') {
        const superChat = snippet.superChatDetails;
        this.eventHandler({
          type: 'donation',
          platform: 'youtube',
          data: {
            username: author.channelId,
            displayName: author.displayName,
            amount: (superChat.amountMicros / 1000000).toFixed(2),
            currency: superChat.currency,
            message: superChat.userComment || '',
            tier: superChat.tier
          }
        });

        this.eventHandler({
          type: 'chat_message',
          platform: 'youtube',
          data: {
            id: item.id,
            username: author.channelId,
            displayName: author.displayName,
            message: `💰 Super Chat: ${superChat.currency} ${(superChat.amountMicros / 1000000).toFixed(2)} - ${superChat.userComment || ''}`,
            color: '#ffca28',
            isSuperChat: true,
            timestamp: new Date(snippet.publishedAt).getTime()
          }
        });
      } else if (snippet.type === 'superStickerEvent') {
        const sticker = snippet.superStickerDetails;
        this.eventHandler({
          type: 'donation',
          platform: 'youtube',
          data: {
            username: author.channelId,
            displayName: author.displayName,
            amount: (sticker.amountMicros / 1000000).toFixed(2),
            currency: sticker.currency,
            message: 'Super Sticker',
            isSticker: true
          }
        });
      } else if (snippet.type === 'newSponsorEvent') {
        this.eventHandler({
          type: 'subscription',
          platform: 'youtube',
          data: {
            username: author.channelId,
            displayName: author.displayName,
            tier: '1',
            months: 1,
            message: 'New Member!'
          }
        });
      }
    }

    if (data.pollingIntervalMillis) {
      this.updatePollRate(data.pollingIntervalMillis);
    }
  }

  updatePollRate(newRate) {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = setInterval(async () => {
        try {
          await this.pollMessages();
        } catch (err) {
          console.error('YouTube poll error:', err.message);
        }
      }, Math.max(newRate, 3000));
    }
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.liveChatId = null;
    this.nextPageToken = null;
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

module.exports = { YouTubePlatform };
