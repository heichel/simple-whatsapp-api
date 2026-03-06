import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import { pino } from 'pino';
import { EventEmitter } from 'events';
import { rmSync } from 'fs';

const logger = pino({ level: 'info' });

class WhatsAppService extends EventEmitter {
  private sock: WASocket | null = null;
  private authPath = './auth_info_baileys';
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitializing = false;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
      const { version, isLatest } = await fetchLatestBaileysVersion();

      logger.info({ version, isLatest }, 'Using WhatsApp Web version');

      this.sock = makeWASocket({
        auth: state,
        logger,
        version,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
        markOnlineOnConnect: true, /* prevents push notifications to phone */
        syncFullHistory: false,
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.emit('qr', qr);
          logger.info('QR code generated');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(
            {
              statusCode,
              shouldReconnect,
            },
            'Connection closed'
          );

          this.connectionStatus = 'disconnected';
          this.emit('disconnected');

          if (shouldReconnect) {
            this.scheduleReconnect();
          } else {
            logger.warn('Logged out from WhatsApp. Discarding session and creating new session.');
            // Clean up current socket to prevent memory leaks
            if (this.sock) {
              this.sock.ev.removeAllListeners('connection.update');
              this.sock.ev.removeAllListeners('creds.update');
              this.sock.ev.removeAllListeners('messages.upsert');
              this.sock = null;
            }
            this.qrCode = null;
            this.reconnectAttempts = 0;
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            // Delete session files to prevent reusing invalidated credentials
            try {
              rmSync(this.authPath, { recursive: true, force: true });
              logger.info('Session files deleted');
            } catch (error) {
              logger.error('Failed to delete session files:', error);
            }
            // Schedule reinitialization outside this callback to avoid recursion issues
            setTimeout(() => this.initialize(), 1000);
          }
        } else if (connection === 'open') {
          logger.info('✅ WhatsApp connection opened');
          this.connectionStatus = 'connected';
          this.qrCode = null;
          this.reconnectAttempts = 0;
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          this.emit('connected');
        } else if (connection === 'connecting') {
          this.connectionStatus = 'connecting';
          logger.info('Connecting to WhatsApp...');
        }
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const message of messages) {
            if (!message.key.fromMe) {
              this.emit('message', message);
              logger.info('Received message', { from: message.key.remoteJid });
            }
          }
        }
      });

    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      this.connectionStatus = 'disconnected';
      this.scheduleReconnect();
    } finally {
      this.isInitializing = false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts += 1;
    const baseDelay = Math.min(1000 * 2 ** Math.min(this.reconnectAttempts, 6), 60_000);
    const jitter = Math.floor(Math.random() * 1000);
    const delay = baseDelay + jitter;

    logger.info({ attempt: this.reconnectAttempts, delay }, 'Scheduling reconnect');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initialize();
    }, delay);
  }

  /**
    * Send a text message to a WhatsApp recipient
    * @param to - Phone number (e.g. +491234567890) or full WhatsApp JID (PN or LID)
   * @param message - Text message to send
   * @returns Message info with message ID
   */
  async sendMessage(to: string, message: string): Promise<{ messageId: string; status: string }> {
    if (!this.sock) {
      throw new Error('WhatsApp socket not initialized');
    }

    if (this.connectionStatus !== 'connected') {
      throw new Error(`Cannot send message: WhatsApp is ${this.connectionStatus}`);
    }

    try {
      // Format destination to supported WhatsApp JID format.
      // For Baileys v7, this supports both classic PN JIDs and LID JIDs.
      const destinationJid = this.formatDestinationJid(to);

      // Send the message
      const sentMessage = await this.sock.sendMessage(destinationJid, {
        text: message
      });

      const messageId = sentMessage?.key?.id || `msg_${Date.now()}`;

      logger.info('Message sent successfully', { to: destinationJid, messageId });

      return {
        messageId,
        status: 'sent'
      };
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
    * Format recipient destination into a WhatsApp JID.
    * Accepts phone numbers or JIDs (including LID JIDs in Baileys v7).
   */
  private formatDestinationJid(value: string): string {
    const input = value.trim();

    // If this already looks like a JID (including new LID-based IDs), use as-is.
    if (this.isLikelyJid(input)) {
      return input;
    }

    // Otherwise, treat this as a phone number and convert to PN JID.
    const cleaned = input.replace(/\D/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }

  private isLikelyJid(value: string): boolean {
    return /^[^@\s]+@[^@\s]+$/.test(value);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): { connected: boolean; qrCode: string | null; sessionExists: boolean } {
    return {
      connected: this.connectionStatus === 'connected',
      qrCode: this.qrCode,
      sessionExists: this.sock !== null
    };
  }

  /**
   * Get current QR code
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Logout and disconnect
   */
  async logout(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.connectionStatus = 'disconnected';
      this.qrCode = null;
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      logger.info('Logged out from WhatsApp');
    }
  }
}

// Export singleton instance
export default new WhatsAppService();
