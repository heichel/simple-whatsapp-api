import axios from 'axios';
import fs from 'fs';
import path from 'path';
import P from 'pino';
import { Webhook, WebhookEventType, IncomingMessageWebhookData } from '../types/index.js';

const logger = P({ level: 'info' });

class WebhookService {
  private webhooks = new Map<string, Webhook>();
  private supportedEvents: WebhookEventType[] = ['message'];
  private webhookStorePath = path.join(process.cwd(), 'config_baileys', 'webhooks.json');

  constructor() {
    this.loadWebhooksFromDisk();
  }

  registerWebhook(url: string, events: string[] = ['message']): Webhook {
    const normalizedEvents = this.normalizeEvents(events);

    if (normalizedEvents.length === 0) {
      throw new Error(`At least one supported event is required: ${this.supportedEvents.join(', ')}`);
    }

    const webhook: Webhook = {
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      url,
      events: normalizedEvents,
      createdAt: new Date().toISOString()
    };

    this.webhooks.set(webhook.id, webhook);
    this.persistWebhooksToDisk();
    logger.info({ webhookId: webhook.id, url: webhook.url, events: webhook.events }, 'Webhook registered');

    return webhook;
  }

  unregisterWebhook(id: string): boolean {
    const existed = this.webhooks.delete(id);

    if (existed) {
      this.persistWebhooksToDisk();
      logger.info({ webhookId: id }, 'Webhook unregistered');
    }

    return existed;
  }

  listWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  async handleIncomingMessage(message: any): Promise<void> {
    const payload = this.mapIncomingMessage(message);
    await this.dispatchEvent('message', payload);
  }

  private loadWebhooksFromDisk(): void {
    try {
      if (!fs.existsSync(this.webhookStorePath)) {
        this.ensureStoreDirectory();
        fs.writeFileSync(this.webhookStorePath, JSON.stringify({ webhooks: [] }, null, 2), 'utf-8');
      }

      const rawContent = fs.readFileSync(this.webhookStorePath, 'utf-8').trim();
      if (!rawContent) {
        return;
      }

      const parsed = JSON.parse(rawContent) as { webhooks?: Webhook[] } | Webhook[];
      const loadedWebhooks = Array.isArray(parsed) ? parsed : parsed.webhooks ?? [];

      for (const webhook of loadedWebhooks) {
        const normalizedEvents = this.normalizeEvents(webhook.events as string[]);
        if (!webhook.id || !webhook.url || normalizedEvents.length === 0) {
          continue;
        }

        this.webhooks.set(webhook.id, {
          id: webhook.id,
          url: webhook.url,
          events: normalizedEvents,
          createdAt: webhook.createdAt || new Date().toISOString()
        });
      }

      logger.info({ count: this.webhooks.size, file: this.webhookStorePath }, 'Loaded webhooks from disk');
    } catch (error) {
      logger.error({ file: this.webhookStorePath, error }, 'Failed to load webhooks from disk');
    }
  }

  private persistWebhooksToDisk(): void {
    try {
      this.ensureStoreDirectory();
      fs.writeFileSync(
        this.webhookStorePath,
        JSON.stringify({ webhooks: this.listWebhooks() }, null, 2),
        'utf-8'
      );
    } catch (error) {
      logger.error({ file: this.webhookStorePath, error }, 'Failed to persist webhooks to disk');
    }
  }

  private ensureStoreDirectory(): void {
    fs.mkdirSync(path.dirname(this.webhookStorePath), { recursive: true });
  }

  private normalizeEvents(events: string[]): WebhookEventType[] {
    const deduplicated = new Set(events.map((event) => event.trim().toLowerCase()));
    return Array.from(deduplicated).filter((event): event is WebhookEventType => {
      return this.supportedEvents.includes(event as WebhookEventType);
    });
  }

  private async dispatchEvent(event: WebhookEventType, payload: IncomingMessageWebhookData): Promise<void> {
    const webhooks = this.listWebhooks().filter((webhook) => webhook.events.includes(event));

    if (webhooks.length === 0) {
      return;
    }

    await Promise.all(webhooks.map((webhook) => this.deliverWebhook(webhook, event, payload)));
  }

  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEventType,
    payload: IncomingMessageWebhookData
  ): Promise<void> {
    try {
      await axios.post(
        webhook.url,
        {
          event,
          timestamp: new Date().toISOString(),
          data: payload
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info({ webhookId: webhook.id, event }, 'Webhook delivered');
    } catch (error) {
      logger.error({ webhookId: webhook.id, event, error }, 'Webhook delivery failed');
    }
  }

  private mapIncomingMessage(message: any): IncomingMessageWebhookData {
    const messageType = this.detectMessageType(message);

    return {
      messageId: message?.key?.id ?? null,
      from: message?.key?.remoteJid ?? null,
      to: message?.key?.participant ?? null,
      fromMe: Boolean(message?.key?.fromMe),
      pushName: message?.pushName ?? null,
      timestamp: this.normalizeTimestamp(message?.messageTimestamp),
      type: messageType,
      text: this.extractMessageText(message)
    };
  }

  private detectMessageType(message: any): string {
    const keys = Object.keys(message?.message ?? {});
    return keys.length > 0 ? keys[0] : 'unknown';
  }

  private normalizeTimestamp(rawTimestamp: number | string | undefined): string {
    if (typeof rawTimestamp === 'number') {
      return new Date(rawTimestamp * 1000).toISOString();
    }

    if (typeof rawTimestamp === 'string' && rawTimestamp.trim().length > 0) {
      const asNumber = Number(rawTimestamp);
      if (!Number.isNaN(asNumber)) {
        return new Date(asNumber * 1000).toISOString();
      }
    }

    return new Date().toISOString();
  }

  private extractMessageText(message: any): string | null {
    const content = message?.message;

    if (!content) {
      return null;
    }

    return (
      content.conversation ??
      content.extendedTextMessage?.text ??
      content.imageMessage?.caption ??
      content.videoMessage?.caption ??
      content.documentMessage?.caption ??
      content.buttonsResponseMessage?.selectedDisplayText ??
      content.listResponseMessage?.title ??
      null
    );
  }
}

export default new WebhookService();
