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

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
}

export interface ConnectionStatus {
  connected: boolean;
  qrCode?: string;
  sessionExists: boolean;
}
