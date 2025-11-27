import { Routes, ChannelType, RESTPostAPIGuildChannelJSONBody, PermissionFlagsBits, OverwriteType } from 'discord.js';
import { discordRest, BOT_PERMISSIONS_INT } from './discord';
import pool from './db';

// Channel configuration for hackathon
const REQUIRED_CHANNELS = [
  { name: 'announcements', type: ChannelType.GuildText, topic: 'Official hackathon announcements' },
  { name: 'general', type: ChannelType.GuildText, topic: 'General chat for participants' },
  { name: 'find-a-team', type: ChannelType.GuildText, topic: 'Look for teammates here' },
  { name: 'ask-a-mentor', type: ChannelType.GuildText, topic: 'Get help from mentors' },
  { name: 'technical-support', type: ChannelType.GuildText, topic: 'Technical issues and support' },
  { name: 'judging-questions', type: ChannelType.GuildText, topic: 'Questions about judging criteria' },
  { name: 'submission-help', type: ChannelType.GuildText, topic: 'Help with project submission' },
];

export async function setupGuild(guildId: string, ownerUserId: string, hackathonName: string) {
  // 1. Check if bot is in guild
  try {
    await discordRest.get(Routes.guild(guildId));
  } catch (error: any) {
    if (error.status === 404 || error.status === 403) {
      throw new Error('BOT_MISSING');
    }
    throw error;
  }

  // 2. Get existing channels for idempotency check
  const channels = (await discordRest.get(Routes.guildChannels(guildId))) as any[];
  
  const categoryName = `hackathon-${hackathonName}`;
  let categoryId: string;

  // 3. Create or find category
  const existingCategory = channels.find(
    (c: any) => c.name === categoryName && c.type === ChannelType.GuildCategory
  );

  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    const category = (await discordRest.post(Routes.guildChannels(guildId), {
      body: {
        name: categoryName,
        type: ChannelType.GuildCategory,
      },
    })) as any;
    categoryId = category.id;
  }

  // 4. Create channels (idempotent - check if exists first)
  const createdChannels = [];
  let announcementsChannelId = '';

  for (const reqChannel of REQUIRED_CHANNELS) {
    // Check if channel exists in this category
    const existing = channels.find(
      (c: any) => c.name === reqChannel.name && c.parent_id === categoryId
    );

    let channelId: string;

    if (existing) {
      channelId = existing.id;
    } else {
      const body: RESTPostAPIGuildChannelJSONBody = {
        name: reqChannel.name,
        type: reqChannel.type,
        parent_id: categoryId,
        topic: reqChannel.topic,
      };

      // Special permissions for announcements - read-only for @everyone
      if (reqChannel.name === 'announcements') {
        body.permission_overwrites = [
          {
            id: guildId, // @everyone role ID equals guild ID
            type: OverwriteType.Role,
            deny: BigInt(PermissionFlagsBits.SendMessages).toString(),
            allow: (BigInt(PermissionFlagsBits.ViewChannel) | BigInt(PermissionFlagsBits.ReadMessageHistory)).toString(),
          },
        ];
      }

      const channel = (await discordRest.post(Routes.guildChannels(guildId), {
        body,
      })) as any;
      channelId = channel.id;
    }

    if (reqChannel.name === 'announcements') {
      announcementsChannelId = channelId;
    }

    createdChannels.push({
      name: reqChannel.name,
      id: channelId,
      type: reqChannel.type,
    });
  }

  // 5. Persist or update mapping in DB (idempotent)
  const client = await pool.connect();
  try {
    // Check if a link exists for this guild
    const existingLink = await client.query(
      'SELECT id FROM communication_links WHERE guild_id = $1',
      [guildId]
    );

    let linkId: number;

    if (existingLink.rows.length > 0) {
      // Update existing link
      linkId = existingLink.rows[0].id;
      await client.query(
        `UPDATE communication_links SET 
         category_id = $1, 
         announcements_channel_id = $2, 
         channels = $3, 
         metadata = $4,
         is_active = true
         WHERE id = $5`,
        [
          categoryId,
          announcementsChannelId,
          JSON.stringify(createdChannels),
          JSON.stringify({ hackathonName }),
          linkId,
        ]
      );
    } else {
      // Insert new link
      const insert = await client.query(
        `INSERT INTO communication_links 
         (owner_user_id, guild_id, category_id, announcements_channel_id, channels, metadata)
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          ownerUserId,
          guildId,
          categoryId,
          announcementsChannelId,
          JSON.stringify(createdChannels),
          JSON.stringify({ hackathonName }),
        ]
      );
      linkId = insert.rows[0].id;
    }

    return {
      success: true,
      metadata: {
        guild_id: guildId,
        category_id: categoryId,
        channels: createdChannels,
        link_id: linkId,
      },
    };
  } finally {
    client.release();
  }
}

// Helper to generate invite URL
export function generateBotInviteUrl(guildId?: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) throw new Error('DISCORD_CLIENT_ID not configured');

  let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${BOT_PERMISSIONS_INT}&scope=bot`;

  if (guildId) {
    url += `&guild_id=${guildId}&disable_guild_select=true`;
  }

  return url;
}
