# API Examples

This document provides curl and Postman-compatible examples for all API endpoints.

## Postman Collection

Import these requests into Postman by creating a new collection and adding the following requests.

---

## 1. Get OAuth URL

Get the Discord authorization URL to initiate OAuth flow.

### curl

```bash
curl -X GET http://localhost:3000/api/discord/oauth-url
```

### Expected Response

```json
{
  "url": "https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code&scope=identify+guilds"
}
```

---

## 2. OAuth Callback

Exchange the authorization code for user's guilds. This is called automatically after OAuth redirect.

### curl

```bash
curl -X GET "http://localhost:3000/api/discord/oauth-callback?code=YOUR_AUTH_CODE"
```

### Expected Response

```json
{
  "guilds": [
    {
      "id": "123456789012345678",
      "name": "My Hackathon Server",
      "icon": "a_1234567890abcdef",
      "permissions": "2147483647",
      "owner": true
    },
    {
      "id": "987654321098765432",
      "name": "Another Server",
      "icon": null,
      "permissions": "8",
      "owner": false
    }
  ]
}
```

---

## 3. Get Bot Invite Link

Generate a bot invite URL for a specific guild.

### curl

```bash
curl -X POST http://localhost:3000/api/discord/invite-link \
  -H "Content-Type: application/json" \
  -d '{
    "guildId": "123456789012345678"
  }'
```

### Expected Response

```json
{
  "inviteUrl": "https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68625&scope=bot&guild_id=123456789012345678&disable_guild_select=true"
}
```

---

## 4. Setup Hackathon Channels

Create the hackathon category and all channels in a guild.

### curl

```bash
curl -X POST http://localhost:3000/api/discord/setup \
  -H "Content-Type: application/json" \
  -d '{
    "guildId": "123456789012345678",
    "ownerUserId": "user-123",
    "hackathonName": "devhacks-2025"
  }'
```

### Success Response (200 OK)

```json
{
  "success": true,
  "metadata": {
    "guild_id": "123456789012345678",
    "category_id": "111222333444555666",
    "channels": [
      { "name": "announcements", "id": "222333444555666777", "type": 0 },
      { "name": "general", "id": "333444555666777888", "type": 0 },
      { "name": "find-a-team", "id": "444555666777888999", "type": 0 },
      { "name": "ask-a-mentor", "id": "555666777888999000", "type": 0 },
      { "name": "technical-support", "id": "666777888999000111", "type": 0 },
      { "name": "judging-questions", "id": "777888999000111222", "type": 0 },
      { "name": "submission-help", "id": "888999000111222333", "type": 0 }
    ],
    "link_id": 1
  }
}
```

### Bot Missing Response (409 Conflict)

```json
{
  "error": "BOT_MISSING",
  "inviteUrl": "https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=68625&scope=bot&guild_id=123456789012345678&disable_guild_select=true"
}
```

### Validation Error Response (400 Bad Request)

```json
{
  "error": "Missing required fields"
}
```

---

## 5. Get Announcements

Fetch the latest announcements for a communication link.

### curl

```bash
# Get 10 latest announcements (default)
curl -X GET "http://localhost:3000/api/announcements?linkId=1"

# Get 5 latest announcements
curl -X GET "http://localhost:3000/api/announcements?linkId=1&limit=5"

# Get single latest announcement
curl -X GET "http://localhost:3000/api/announcements?linkId=1&limit=1"
```

### Expected Response

```json
{
  "announcements": [
    {
      "id": 1,
      "content": "🎉 Welcome to DevHacks 2025! We're excited to have you here.\n\nPlease read the rules in #general and introduce yourself!",
      "author_username": "HackathonBot",
      "author_id": "123456789012345678",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "messageUrl": "https://discord.com/channels/123456789012345678/222333444555666777/999888777666555444"
    },
    {
      "id": 2,
      "content": "📢 Reminder: Submissions are due by 5 PM EST tomorrow!",
      "author_username": "Organizer",
      "author_id": "111222333444555666",
      "createdAt": "2025-01-15T14:00:00.000Z",
      "timestamp": "2025-01-15T14:00:00.000Z",
      "messageUrl": "https://discord.com/channels/123456789012345678/222333444555666777/888777666555444333"
    }
  ]
}
```

### Empty Response

```json
{
  "announcements": []
}
```

---

## 6. Get Communication Link by Guild

Look up the communication link for a specific guild.

### curl

```bash
curl -X GET "http://localhost:3000/api/links?guildId=123456789012345678"
```

### Expected Response

```json
{
  "link": {
    "id": 1,
    "ownerUserId": "user-123",
    "guildId": "123456789012345678",
    "categoryId": "111222333444555666",
    "announcementsChannelId": "222333444555666777",
    "channels": [
      { "name": "announcements", "id": "222333444555666777", "type": 0 },
      { "name": "general", "id": "333444555666777888", "type": 0 }
    ],
    "metadata": {
      "hackathonName": "devhacks-2025"
    },
    "isActive": true,
    "createdAt": "2025-01-15T09:00:00.000Z"
  }
}
```

### Not Found Response

```json
{
  "link": null
}
```

---

## Postman Environment Variables

Set up these environment variables in Postman:

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:3000` |
| `guild_id` | `123456789012345678` |
| `link_id` | `1` |

Then use `{{base_url}}` in your requests, e.g., `{{base_url}}/api/discord/oauth-url`

---

## Testing Sequence

For end-to-end testing, execute requests in this order:

1. **GET** `/api/discord/oauth-url` - Get auth URL
2. Complete OAuth in browser → Get code from callback
3. **GET** `/api/discord/oauth-callback?code=...` - Exchange code
4. **POST** `/api/discord/invite-link` - Get bot invite (if needed)
5. Invite bot to server (browser)
6. **POST** `/api/discord/setup` - Create channels
7. Post a message in #announcements (Discord)
8. **GET** `/api/announcements?linkId=1` - Verify sync

