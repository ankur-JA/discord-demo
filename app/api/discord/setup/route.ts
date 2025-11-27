import { NextRequest, NextResponse } from 'next/server';
import { setupGuild } from '../../../../lib/discord-setup';
import { BOT_PERMISSIONS_INT } from '../../../../lib/discord';

export async function POST(req: NextRequest) {
  try {
    const { guildId, ownerUserId, hackathonName } = await req.json();

    if (!guildId || !ownerUserId || !hackathonName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const result = await setupGuild(guildId, ownerUserId, hackathonName);
      return NextResponse.json(result);
    } catch (error: any) {
      if (error.message === 'BOT_MISSING') {
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=${BOT_PERMISSIONS_INT}&scope=bot&guild_id=${guildId}&disable_guild_select=true`;
        return NextResponse.json({ 
          error: 'BOT_MISSING', 
          inviteUrl 
        }, { status: 409 });
      }
      
      console.error('Setup error:', error);
      return NextResponse.json({ error: 'Setup failed', details: error.message }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

