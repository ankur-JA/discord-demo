import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';

// Sanitize content to prevent XSS
function sanitizeContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const linkId = searchParams.get('linkId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : 10;

  if (!linkId) {
    return NextResponse.json({ announcements: [] });
  }

  try {
    const result = await pool.query(
      `SELECT a.id, a.content, a.author_username, a.author_id, a.created_at, 
              a.platform_timestamp, a.platform_message_id,
              l.guild_id, l.announcements_channel_id 
       FROM announcements a
       JOIN communication_links l ON a.link_id = l.id
       WHERE a.link_id = $1
       ORDER BY a.platform_timestamp DESC
       LIMIT $2`,
      [linkId, limit]
    );

    const announcements = result.rows.map((row) => ({
      id: row.id,
      content: sanitizeContent(row.content),
      author_username: row.author_username,
      author_id: row.author_id,
      createdAt: row.created_at,
      timestamp: row.platform_timestamp,
      messageUrl: `https://discord.com/channels/${row.guild_id}/${row.announcements_channel_id}/${row.platform_message_id}`,
    }));

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
