# Discord Hackathon Manager

A full-stack application that allows hackathon organizers to connect their Discord server, automatically create organized hackathon channels, and sync announcements to a web dashboard in real-time.

![Architecture Diagram](./docs/architecture.svg)

## Features

- **OAuth Integration**: Connect Discord account to list manageable servers
- **Bot Detection**: Automatically detect if bot is installed, provide invite link if not
- **Channel Creation**: Create structured hackathon category with 7 essential channels
- **Announcement Sync**: Real-time and polling-based announcement synchronization
- **Idempotent Setup**: Safe to run multiple times without creating duplicates

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- A Discord Application with Bot

### 1. Clone and Install

```bash
git clone [<repository-url>](https://github.com/ankur-JA/discord-demo.git)
cd discord-demo
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set Up Database

```bash
# Create database
createdb discord_hackathon

# Run migrations
npm run migrate
```

### 4. Start the Application

```bash
# Terminal 1: Start the web app
npm run dev

# Terminal 2: Start the worker (for announcement sync)
npm run worker
```

Visit `http://localhost:3000` to access the application.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | Discord OAuth2 Client ID | `1234567890123456789` |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 Client Secret | `your-secret-here` |
| `DISCORD_BOT_TOKEN` | Discord Bot Token | `MTIz...` |
| `DISCORD_OAUTH_REDIRECT` | OAuth callback URL | `http://localhost:3000/callback` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port (optional) | `3000` |

---

## Discord Application Setup

### 1. Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it (e.g., "Hackathon Manager")
3. Go to **OAuth2** → Copy `Client ID` and `Client Secret`

### 2. Configure OAuth2

1. Go to **OAuth2** → **General**
2. Add Redirect URL: `http://localhost:3000/callback`
3. Scopes needed: `identify`, `guilds`

### 3. Create Bot

1. Go to **Bot** → Click "Add Bot"
2. Copy the **Token** (this is `DISCORD_BOT_TOKEN`)
3. Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent (optional)

### 4. Bot Permissions

The bot requires these permissions (permission integer: `68625`):
- Manage Channels
- View Channels
- Read Message History
- Send Messages
- Create Instant Invite

---

## API Reference

### OAuth Flow

#### GET `/api/discord/oauth-url`

Get the Discord OAuth authorization URL.

**Response:**
```json
{
  "url": "https://discord.com/api/oauth2/authorize?client_id=...&scope=identify+guilds&..."
}
```

**curl:**
```bash
curl http://localhost:3000/api/discord/oauth-url
```

---

#### GET `/api/discord/oauth-callback?code=...`

Exchange OAuth code for user's guilds.

**Response:**
```json
{
  "guilds": [
    {
      "id": "123456789",
      "name": "My Server",
      "icon": "abc123",
      "permissions": "2147483647",
      "owner": true
    }
  ]
}
```

---

### Bot & Channel Setup

#### POST `/api/discord/invite-link`

Get the bot invite URL for a specific guild.

**Request:**
```json
{
  "guildId": "123456789"
}
```

**Response:**
```json
{
  "inviteUrl": "https://discord.com/api/oauth2/authorize?client_id=...&permissions=68625&scope=bot&guild_id=123456789"
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/discord/invite-link \
  -H "Content-Type: application/json" \
  -d '{"guildId": "123456789"}'
```

---

#### POST `/api/discord/setup`

Create hackathon category and channels in a guild.

**Request:**
```json
{
  "guildId": "123456789",
  "ownerUserId": "user-id-here",
  "hackathonName": "devhacks-2025"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "metadata": {
    "guild_id": "123456789",
    "category_id": "987654321",
    "channels": [
      { "name": "announcements", "id": "111", "type": 0 },
      { "name": "general", "id": "222", "type": 0 },
      { "name": "find-a-team", "id": "333", "type": 0 },
      { "name": "ask-a-mentor", "id": "444", "type": 0 },
      { "name": "technical-support", "id": "555", "type": 0 },
      { "name": "judging-questions", "id": "666", "type": 0 },
      { "name": "submission-help", "id": "777", "type": 0 }
    ],
    "link_id": 1
  }
}
```

**Bot Missing Response (409):**
```json
{
  "error": "BOT_MISSING",
  "inviteUrl": "https://discord.com/api/oauth2/authorize?..."
}
```

**curl:**
```bash
curl -X POST http://localhost:3000/api/discord/setup \
  -H "Content-Type: application/json" \
  -d '{
    "guildId": "123456789",
    "ownerUserId": "demo-user",
    "hackathonName": "devhacks-2025"
  }'
```

---

### Announcements

#### GET `/api/announcements?linkId=&limit=`

Fetch latest announcements for a communication link.

**Query Parameters:**
- `linkId` (required): The communication link ID
- `limit` (optional): Number of announcements (default: 10)

**Response:**
```json
{
  "announcements": [
    {
      "id": 1,
      "content": "Welcome to DevHacks 2025!",
      "author_username": "Organizer",
      "author_id": "123456",
      "createdAt": "2025-01-01T12:00:00Z",
      "timestamp": "2025-01-01T12:00:00Z",
      "messageUrl": "https://discord.com/channels/guild/channel/message"
    }
  ]
}
```

**curl:**
```bash
curl "http://localhost:3000/api/announcements?linkId=1&limit=5"
```

---

#### GET `/api/links?guildId=...`

Get communication link by guild ID.

**Response:**
```json
{
  "link": {
    "id": 1,
    "ownerUserId": "user-123",
    "guildId": "123456789",
    "categoryId": "987654321",
    "announcementsChannelId": "111222333",
    "channels": [...],
    "metadata": { "hackathonName": "devhacks-2025" },
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**curl:**
```bash
curl "http://localhost:3000/api/links?guildId=123456789"
```

---

## Database Schema

### communication_links

```sql
CREATE TABLE communication_links (
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

CREATE INDEX idx_comm_links_guild ON communication_links(guild_id);
```

### announcements

```sql
CREATE TABLE announcements (
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

CREATE INDEX announcements_time_idx ON announcements(platform_timestamp DESC);
```

---

## Demo Checklist

### End-to-End Flow

1. **Start Application**
   ```bash
   npm run dev      # Terminal 1
   npm run worker   # Terminal 2
   ```

2. **Connect Discord**
   - Navigate to `http://localhost:3000`
   - Click "Connect with Discord"
   - Authorize the application
   - You'll be redirected back with your manageable servers listed

3. **Select Server & Setup**
   - Select a server you own/admin
   - Enter a hackathon name (e.g., "devhacks-2025")
   - If bot isn't installed, click "Invite Bot to Server"
   - After bot is added, click "Create Channels & Setup"

4. **Verify Channel Creation**
   - Check Discord: category `hackathon-devhacks-2025` should exist
   - Channels: `#announcements`, `#general`, `#find-a-team`, etc.
   - `#announcements` should be read-only for @everyone

5. **Test Announcement Sync**
   - Post a message in `#announcements` channel
   - Wait 30 seconds (polling interval) or check immediately (gateway)
   - The message should appear in "Live Announcements" section

6. **Verify Idempotency**
   - Click "Create Channels & Setup" again
   - No duplicate channels should be created
   - API returns existing IDs

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- **Setup Endpoint**: Bot detection, idempotency, DB persistence
- **Worker**: Upsert logic, rate limiting, polling
- **Announcements**: Query formatting, content sanitization

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Next.js API    │────▶│   PostgreSQL    │
│   (React)       │     │   Routes         │     │   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               │ discord.js
                               ▼
                        ┌──────────────────┐
                        │   Discord API    │
                        │   + Gateway      │
                        └──────────────────┘
                               ▲
                               │
                        ┌──────────────────┐
                        │   Worker         │
                        │   (Polling +     │
                        │   Gateway)       │
                        └──────────────────┘
```

### Sync Modes

1. **Polling (Default)**: Every 30s, fetches last 50 messages per channel
2. **Gateway (Real-time)**: discord.js client listens for `messageCreate` events

---

## Troubleshooting

### Bot not creating channels?
- Verify bot has `Manage Channels` permission
- Check bot is in the correct server
- Ensure `DISCORD_BOT_TOKEN` is set correctly

### OAuth failing?
- Verify redirect URI matches exactly in Discord Developer Portal
- Check `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`

### Announcements not syncing?
- Ensure worker is running: `npm run worker`
- Check PostgreSQL is accessible
- Verify bot has `Read Message History` permission

### Rate limited?
- Worker implements exponential backoff
- Default polling is every 30s to stay within limits

---

## Security Considerations

- OAuth tokens are never stored client-side (only guild list)
- Bot token only used server-side
- Content is sanitized before rendering (XSS prevention)
- Rate limiting with exponential backoff
- No secrets in logs or client code

---

## License

MIT
