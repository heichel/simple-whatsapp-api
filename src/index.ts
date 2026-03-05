import express, { Application } from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import whatsappService from './services/whatsappService.js';
import webhookService from './services/webhookService.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/messages', messageRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/connection', connectionRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize WhatsApp connection
whatsappService.on('connected', () => {
  console.log('✅ WhatsApp connected successfully');
});

whatsappService.on('qr', (qr) => {
  console.log('📱 QR Code received - scan with WhatsApp app');
  console.log('Access QR code at: http://localhost:' + PORT + '/api/connection/qr');
});

whatsappService.on('disconnected', () => {
  console.log('❌ WhatsApp disconnected');
});

whatsappService.on('message', async (message) => {
  await webhookService.handleIncomingMessage(message);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Simple WhatsApp API ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Send message: POST http://localhost:${PORT}/api/messages/send`);
});

export default app;
