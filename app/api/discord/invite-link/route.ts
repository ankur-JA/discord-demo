import { NextRequest, NextResponse } from 'next/server';
import { BOT_PERMISSIONS_INT } from '../../../../lib/discord';

export async function POST(req: NextRequest) {
  try {
    const { guildId } = await req.json();
    
    // Although the prompt says { guildId } -> { inviteUrl }, usually an invite URL is generic or specific to a guild if generated via API.
    // However, standard bot invite links just have client_id and permissions. 
    // If we want to pre-select a guild, we can add `&guild_id=...` and `&disable_guild_select=true`.
    
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 500 });
    }

    let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${BOT_PERMISSIONS_INT}&scope=bot`;
    
    if (guildId) {
        url += `&guild_id=${guildId}&disable_guild_select=true`;
    }

    return NextResponse.json({ inviteUrl: url });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

