import { Client, GatewayIntentBits, Partials, Events, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import pool from '../lib/db';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const POLL_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const BASE_BACKOFF = 1000; // 1 second

// Rate limit tracking
const rateLimitState: Record<string, { resetAt: number; retryAfter: number }> = {};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Exponential backoff with jitter
function getBackoffTime(attempt: number): number {
  const backoff = BASE_BACKOFF * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(backoff + jitter, 30000); // Cap at 30 seconds
}

async function fetchWithRateLimitHandling(
  rest: REST,
  route: `/${string}`,
  channelId: string,
  attempt = 0
): Promise<any[]> {
  // Check if we're still rate limited
  const rateLimit = rateLimitState[channelId];
  if (rateLimit && Date.now() < rateLimit.resetAt) {
    const waitTime = rateLimit.resetAt - Date.now();
    console.log(`Rate limited for channel ${channelId}, waiting ${waitTime}ms`);
    await sleep(waitTime);
  }

  try {
    const messages = await rest.get(route, {
      query: new URLSearchParams({ limit: '50' }),
    });
    return messages as any[];
  } catch (error: any) {
    // Handle rate limiting (429)
    if (error.status === 429) {
      const retryAfter = error.retry_after || error.retryAfter || 5;
      console.warn(`Rate limited on channel ${channelId}. Retry after ${retryAfter}s`);
      
      rateLimitState[channelId] = {
        resetAt: Date.now() + retryAfter * 1000,
        retryAfter: retryAfter * 1000,
      };

      if (attempt < MAX_RETRIES) {
        await sleep(retryAfter * 1000);
        return fetchWithRateLimitHandling(rest, route, channelId, attempt + 1);
      }
      
      console.error(`Max retries exceeded for channel ${channelId}`);
      return [];
    }

    // Handle other errors with exponential backoff
    if (attempt < MAX_RETRIES && (error.status >= 500 || error.code === 'ECONNRESET')) {
      const backoff = getBackoffTime(attempt);
      console.warn(`Error fetching channel ${channelId}, retrying in ${backoff}ms:`, error.message);
      await sleep(backoff);
      return fetchWithRateLimitHandling(rest, route, channelId, attempt + 1);
    }

    throw error;
  }
}

async function upsertMessage(linkId: number, message: any) {
  try {
    const content = message.content || '';
    const platformTimestamp = new Date(message.timestamp || message.createdTimestamp);

    await pool.query(
      `INSERT INTO announcements 
       (link_id, platform_message_id, author_id, author_username, content, platform_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (link_id, platform_message_id) 
       DO UPDATE SET 
         content = EXCLUDED.content, 
         author_username = EXCLUDED.author_username,
         platform_timestamp = EXCLUDED.platform_timestamp`,
      [
        linkId,
        message.id,
        message.author?.id || message.author_id || 'unknown',
        message.author?.username || message.author_username || 'Unknown User',
        content,
        platformTimestamp,
      ]
    );
  } catch (err) {
    console.error(`Failed to upsert message ${message.id}:`, err);
  }
}

async function pollChannels() {
  console.log(`[${new Date().toISOString()}] Polling channels...`);
  
  try {
    const res = await pool.query(
      'SELECT id, guild_id, announcements_channel_id FROM communication_links WHERE is_active = true AND announcements_channel_id IS NOT NULL'
    );
    const links = res.rows;

    if (links.length === 0) {
      console.log('No active communication links found');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

    for (const link of links) {
      if (!link.announcements_channel_id) continue;

      try {
        console.log(`Fetching messages for channel ${link.announcements_channel_id} (guild: ${link.guild_id})`);
        
        const messages = await fetchWithRateLimitHandling(
          rest,
          Routes.channelMessages(link.announcements_channel_id) as `/${string}`,
          link.announcements_channel_id
        );

        let upsertCount = 0;
        for (const msg of messages) {
          await upsertMessage(link.id, msg);
          upsertCount++;
        }
        
        console.log(`Processed ${upsertCount} messages for link ${link.id}`);
      } catch (err: any) {
        if (err.status === 403) {
          console.error(`Bot lacks permission to read channel ${link.announcements_channel_id}`);
        } else if (err.status === 404) {
          console.error(`Channel ${link.announcements_channel_id} not found - may have been deleted`);
        } else {
          console.error(`Error polling channel ${link.announcements_channel_id}:`, err.message || err);
        }
      }
    }
  } catch (err) {
    console.error('Error in poll loop:', err);
  }
}

// Gateway Listener (Real-time)
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  try {
    const res = await pool.query(
      'SELECT id FROM communication_links WHERE announcements_channel_id = $1',
      [message.channelId]
    );

    if (res.rows.length > 0) {
      const linkId = res.rows[0].id;
      console.log(`[Gateway] Real-time message received in channel ${message.channelId}`);
      await upsertMessage(linkId, {
        id: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
        },
        timestamp: message.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.error('Error processing real-time message:', err);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

client.once(Events.ClientReady, (c) => {
  console.log(`✓ Bot ready! Logged in as ${c.user.tag}`);
  console.log(`✓ Serving ${c.guilds.cache.size} guild(s)`);

  // Start polling loop
  pollChannels();
  setInterval(pollChannels, POLL_INTERVAL);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  client.destroy();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  client.destroy();
  await pool.end();
  process.exit(0);
});

if (process.env.DISCORD_BOT_TOKEN) {
  console.log('Starting Discord worker...');
  client.login(process.env.DISCORD_BOT_TOKEN);
} else {
  console.error('❌ DISCORD_BOT_TOKEN is not set');
  process.exit(1);
}
