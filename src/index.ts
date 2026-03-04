import express, { Application } from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes';
import webhookRoutes from './routes/webhookRoutes';
import connectionRoutes from './routes/connectionRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Simple WhatsApp API ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;
