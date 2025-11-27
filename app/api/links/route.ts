import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';


// GET /api/links?guildId=... - Get link by guild ID
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const guildId = searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `SELECT id, owner_user_id, guild_id, category_id, announcements_channel_id, channels, metadata, is_active, created_at
       FROM communication_links 
       WHERE guild_id = $1 AND is_active = true`,
      [guildId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ link: null });
    }

    const link = res.rows[0];
    return NextResponse.json({
      link: {
        id: link.id,
        ownerUserId: link.owner_user_id,
        guildId: link.guild_id,
        categoryId: link.category_id,
        announcementsChannelId: link.announcements_channel_id,
        channels: link.channels,
        metadata: link.metadata,
        isActive: link.is_active,
        createdAt: link.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json({ error: 'Failed to fetch link' }, { status: 500 });
  }
}

