# Simple WhatsApp API - Copilot Instructions

## Project Overview
A lightweight REST API that provides a simple interface to send and receive WhatsApp messages using the Baileys library. The API is built with Node.js and Express, enabling applications to integrate WhatsApp messaging capabilities via HTTP endpoints.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **WhatsApp Client**: @whiskeysockets/baileys
- **Language**: TypeScript (preferred) or JavaScript
- **Modules**: CommonJS (needed for Baileys 6.7.x, after updating to 7.x.x, we can switch to ESM)

## Core Functionality
1. **Send Messages**: POST endpoint to send text messages to WhatsApp numbers
2. **Receive Messages**: Webhook system to forward incoming messages to registered URLs
3. **Session Management**: Handle WhatsApp connection state and QR code authentication
4. **Connection Status**: Monitor and report WhatsApp connection status

## Architecture Guidelines

### Project Structure
```
src/
├── routes/          # API route definitions
├── controllers/     # Request handlers and business logic
├── services/        # WhatsApp/Baileys integration layer
├── middleware/      # Express middleware (auth, validation, error handling)
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
└── config/         # Configuration management
```

### Key Components
- **WhatsApp Service**: Encapsulate all Baileys operations (connection, sending, receiving)
- **Webhook Manager**: Handle webhook registration and message forwarding
- **Session Manager**: Manage QR code generation and authentication state

## Coding Standards

### API Design
- Use RESTful conventions
- Return consistent JSON responses with proper HTTP status codes
- Include error handling middleware for graceful error responses
- Structure response format:
  ```json
  {
    "success": true/false,
    "data": {},
    "error": "error message if applicable"
  }
  ```

### Baileys Integration
- Keep Baileys-specific code isolated in service layer
- Handle connection lifecycle properly (connect, disconnect, reconnect)
- Store authentication state persistently
- Implement proper event listeners for messages and connection updates

### Security Considerations
- Validate all incoming requests
- Sanitize phone numbers and message content
- Implement rate limiting for message endpoints
- Consider API key authentication for endpoints
- Don't expose internal Baileys errors to API consumers

### Error Handling
- Wrap Baileys operations in try-catch blocks
- Provide meaningful error messages
- Log errors appropriately for debugging
- Distinguish between client errors (4xx) and server errors (5xx)

## Dependencies

### Core
- `express`: Web framework
- `@whiskeysockets/baileys`: WhatsApp client library
- `pino`: Logging (required by Baileys)

### Recommended
- `dotenv`: Environment configuration
- `axios` or `node-fetch`: For webhook HTTP calls
- `express-validator`: Request validation
- `express-rate-limit`: Rate limiting

## Development Practices
- Use async/await for asynchronous operations
- Implement proper logging for debugging WhatsApp connection issues
- Handle QR code display/storage for authentication
- Gracefully handle WhatsApp disconnections and implement reconnection logic
- Store session data to avoid repeated QR scanning

## API Endpoints (Planned)

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages/status/:messageId` - Check message delivery status

### Webhooks
- `POST /api/webhooks/register` - Register a webhook URL
- `DELETE /api/webhooks/:id` - Unregister a webhook
- `GET /api/webhooks` - List registered webhooks

### Connection
- `GET /api/connection/status` - Get WhatsApp connection status
- `GET /api/connection/qr` - Get QR code for authentication
- `POST /api/connection/logout` - Disconnect from WhatsApp

## Notes
- Baileys maintains an active connection to WhatsApp Web
- Session state should persist across server restarts
- Handle multi-device support appropriately
- Consider implementing message queuing for reliability
- Rate limits should align with WhatsApp's unofficial limits to avoid bans
