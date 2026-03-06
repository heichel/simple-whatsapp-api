# Simple WhatsApp API

A lightweight REST API for sending and receiving WhatsApp messages using the Baileys library.

## Runtime Notes

- This project uses **ESM** (`"type": "module"`) and TypeScript `NodeNext` module resolution.
- Built for **Baileys v7**.
- The API accepts recipient input as either phone numbers or WhatsApp JIDs.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Docker

This repository includes a production-ready [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml).

### Run with Docker Compose (internal network)

```bash
docker compose up -d --build
```

- The API listens on port `3000` **inside** Docker.
- It is attached to the `whatsapp_api_internal` Docker network.
- No host port is published, so the service is intended for other containers on that network.

From another container on the same Docker network, call:

```text
http://simple-whatsapp-api:3000
```

### Persisted data

Compose mounts these folders so WhatsApp auth/session and webhook config survive container restarts:

- `./auth_info_baileys` → `/app/auth_info_baileys`
- `./config_baileys` → `/app/config_baileys`

## API Endpoints

### Health Check
- `GET /health` - Check API health status

### Messages
- `POST /api/messages/send` - Send a WhatsApp message
- `GET /api/messages/status/:messageId` - Check message delivery status

### Webhooks
- `POST /api/webhooks/register` - Register a webhook URL
- `GET /api/webhooks` - List all registered webhooks
- `DELETE /api/webhooks/:id` - Unregister a webhook

### Connection
- `GET /api/connection/status` - Get WhatsApp connection status
- `GET /api/connection/qr` - Get QR code for authentication
- `POST /api/connection/logout` - Disconnect from WhatsApp

## Example Requests

### Send a Message
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+14155551234",
    "message": "Hello from WhatsApp API!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "3EB0123456789ABCDEF",
    "status": "sent"
  }
}
```

**Note:** Phone numbers should include country code. Accepted formats:
- `+14155551234` (with + prefix)
- `14155551234` (without + prefix)
- `14155551234@s.whatsapp.net` (PN JID format)
- `<id>@lid` (LID JID format)

For detailed documentation, see [docs/SEND_MESSAGE.md](docs/SEND_MESSAGE.md)

### Register a Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": ["message"]
  }'
```

Currently supported webhook events: `message`

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "data": {},
  "error": "error message if applicable"
}
```

## Development

- `npm run dev` - Run with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

## License

ISC
