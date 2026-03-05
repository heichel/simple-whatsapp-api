import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessageKey
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import { EventEmitter } from 'events';

const logger = P({ level: 'info' });

class WhatsAppService extends EventEmitter {
  private sock: WASocket | null = null;
  private authPath = './auth_info_baileys';
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger,
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
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          logger.info('Connection closed', { shouldReconnect });
          this.connectionStatus = 'disconnected';
          this.emit('disconnected');

          if (shouldReconnect) {
            logger.info('Reconnecting...');
            this.initialize();
          }
        } else if (connection === 'open') {
          logger.info('✅ WhatsApp connection opened');
          this.connectionStatus = 'connected';
          this.qrCode = null;
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
      throw error;
    }
  }

  /**
   * Send a text message to a WhatsApp number
   * @param to - Phone number in format: countrycode+number@s.whatsapp.net (e.g., 491234567890@s.whatsapp.net)
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
      // Format phone number if needed (ensure it has @s.whatsapp.net suffix)
      const formattedNumber = this.formatPhoneNumber(to);

      // Send the message
      const sentMessage = await this.sock.sendMessage(formattedNumber, {
        text: message
      });

      const messageId = sentMessage?.key?.id || `msg_${Date.now()}`;

      logger.info('Message sent successfully', { to: formattedNumber, messageId });

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
   * Format phone number to WhatsApp JID format
   * Accepts: +491234567890, 491234567890, or 491234567890@s.whatsapp.net
   * Returns: 491234567890@s.whatsapp.net
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove @ and everything after it if present
    let cleaned = phoneNumber.split('@')[0];
    
    // Remove + and any non-digit characters
    cleaned = cleaned.replace(/\D/g, '');

    // Add @s.whatsapp.net suffix
    return `${cleaned}@s.whatsapp.net`;
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
      logger.info('Logged out from WhatsApp');
    }
  }
}

// Export singleton instance
export default new WhatsAppService();
