# Send Message API - Usage Guide

## Send a Message

Send a WhatsApp message to a phone number.

### Endpoint
```
POST /api/messages/send
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient as phone number or full WhatsApp JID |
| `message` | string | Yes | Text message to send (max 4096 characters) |

### Recipient Format

The API accepts recipients in multiple formats:
- `+491234567890` (international with +)
- `491234567890` (without +)
- `491234567890@s.whatsapp.net` (PN JID)
- `<id>@lid` (LID JID)

Phone numbers are normalized to PN JIDs internally. Full JIDs are used as provided.

### Example Request

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+491234567890",
    "message": "Hello from WhatsApp API!"
  }'
```

```javascript
// Using axios
const response = await axios.post('http://localhost:3000/api/messages/send', {
  to: '+491234567890',
  message: 'Hello from WhatsApp API!'
});
```

```javascript
// Using fetch
const response = await fetch('http://localhost:3000/api/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+491234567890',
    message: 'Hello from WhatsApp API!'
  })
});

const data = await response.json();
```

### Success Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "messageId": "3EB0123456789ABCDEF",
    "status": "sent"
  }
}
```

### Error Responses

**Status Code:** `400 Bad Request` - Validation Error

```json
{
  "success": false,
  "error": "Field \"to\" is required"
}
```

```json
{
  "success": false,
  "error": "Field \"message\" must not exceed 4096 characters"
}
```

**Status Code:** `500 Internal Server Error` - WhatsApp Not Connected

```json
{
  "success": false,
  "error": "Cannot send message: WhatsApp is disconnected"
}
```

```json
{
  "success": false,
  "error": "Failed to send WhatsApp message"
}
```

## Validation Rules

### Recipient (`to`)
- ✅ Required field
- ✅ Must be a string
- ✅ Can be an international phone number (10-15 digits, optional `+`)
- ✅ Can be a WhatsApp JID (`<id>@<server>`, including PN or LID)

### Message (`message`)
- ✅ Required field
- ✅ Must be a string
- ✅ Cannot be empty or only whitespace
- ✅ Maximum length: 4096 characters

## Connection Requirements

Before sending messages, ensure:

1. **WhatsApp is connected**: Check connection status at `GET /api/connection/status`
2. **QR code is scanned**: If not authenticated, scan QR code from `GET /api/connection/qr`

## Common Use Cases

### Send a simple text message
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+14155551234",
    "message": "Your order #12345 has been shipped!"
  }'
```

### Send a notification
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999887766",
    "message": "🔔 Reminder: Your appointment is tomorrow at 3 PM"
  }'
```

### Send with emojis
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+447700900123",
    "message": "Hello! 👋 Welcome to our service 🎉"
  }'
```

## Rate Limiting

**Important:** WhatsApp has unofficial rate limits to prevent spam. To avoid being banned:

- Don't send more than 20-30 messages per minute
- Don't send identical messages to multiple recipients rapidly
- Add delays between messages (recommended: 2-3 seconds)
- Avoid sending messages to users who haven't interacted with your number

## Error Handling Best Practices

```javascript
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await fetch('http://localhost:3000/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    console.log('Message sent:', data.data.messageId);
    return data.data;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    
    // Handle specific errors
    if (error.message.includes('disconnected')) {
      console.error('WhatsApp is not connected. Please authenticate first.');
    } else if (error.message.includes('required')) {
      console.error('Missing required fields in request.');
    }
    
    throw error;
  }
}

// Usage
await sendWhatsAppMessage('+14155551234', 'Hello from WhatsApp!');
```

## Testing

Use the provided test script to test the API:

```bash
./test-api.sh
```

Or test manually with curl:

```bash
# 1. Check connection status
curl http://localhost:3000/api/connection/status

# 2. Send a message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"Test message"}'
```

## Troubleshooting

### "WhatsApp is disconnected" Error
1. Check connection status: `GET /api/connection/status`
2. Get QR code: `GET /api/connection/qr`
3. Scan QR code with WhatsApp mobile app
4. Wait for connection to establish
5. Retry sending message

### "Invalid recipient" Error
- If using phone number format, include country code
- Remove spaces, dashes, or parentheses
- Example: `+14155551234` not `+1 (415) 555-1234`
- If using JID format, ensure it contains `@` (example: `14155551234@s.whatsapp.net`)

### Message Not Delivered
- Verify the recipient's number is registered on WhatsApp
- Check if the recipient has blocked your number
- Ensure WhatsApp connection is stable
- Check for rate limiting issues
