import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return NextResponse.json({ url });
}

