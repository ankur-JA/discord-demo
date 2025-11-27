import { REST } from 'discord.js';

if (!process.env.DISCORD_BOT_TOKEN) {
  // This might run during build time where env vars aren't set, so we don't throw yet.
  console.warn('DISCORD_BOT_TOKEN is not set');
}

export const discordRest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN || '');

export const OAUTH_SCOPES = ['identify', 'guilds'];
export const BOT_PERMISSIONS = ['ManageChannels', 'ViewChannel', 'ReadMessageHistory', 'SendMessages', 'CreateInstantInvite'];
// Permissions integer: 
// ManageChannels (0x10) + ViewChannel (0x400) + ReadMessageHistory (0x10000) + SendMessages (0x800) + CreateInstantInvite (0x1)
// = 16 + 1024 + 65536 + 2048 + 1 = 68625
// Actually let's use a calculator or the library to generate this if needed, but the prompt asks for specific permissions.
// MANAGE_CHANNELS (0x10)
// VIEW_CHANNEL (0x400) - "Read Messages/View Channels"
// READ_MESSAGE_HISTORY (0x10000)
// SEND_MESSAGES (0x800)
// CREATE_INSTANT_INVITE (0x1)
export const BOT_PERMISSIONS_INT = 68625; 

