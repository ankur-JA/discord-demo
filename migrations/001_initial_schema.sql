
CREATE TABLE IF NOT EXISTS communication_links (
  id SERIAL PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  platform_type TEXT NOT NULL DEFAULT 'discord',
  guild_id TEXT NOT NULL,
  category_id TEXT,
  announcements_channel_id TEXT,
  channels JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_links_guild ON communication_links(guild_id);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES communication_links(id) ON DELETE CASCADE,
  platform_message_id TEXT NOT NULL,
  author_id TEXT,
  author_username TEXT,
  content TEXT,
  platform_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (link_id, platform_message_id)
);

CREATE INDEX IF NOT EXISTS announcements_time_idx ON announcements(platform_timestamp DESC);

