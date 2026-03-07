export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SendMessageRequest {
  to: string;
  message: string;
}

export interface SendMessageResponse {
  messageId: string;
  status: string;
}

export interface MessageStatusResponse {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

export interface RegisterWebhookRequest {
  url: string;
  events?: string[];
}

export type WebhookEventType = 'message';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  createdAt: string;
}

export interface IncomingMessageWebhookData {
  messageId: string | null;
  from: string | null;
  to: string | null;
  fromMe: boolean;
  pushName: string | null;
  timestamp: string;
  type: string;
  text: string | null;
  audioBase64: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  qrCode?: string;
  sessionExists: boolean;
}
