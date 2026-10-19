export type DeliveryResult = {
  success: boolean
  messageId?: string
  error?: string
};

export type EmailMessage = {
  from: string
  to: string
  subject: string
  text: string
};

export type WebhookMessage = {
  url: string
  type: string
  payload: Record<string, unknown>
};

export type SmsMessage = { to: string, body: string, from?: string };
export type PushMessage = { token: string, title: string, body: string };
export type MessengerMessage = { recipient: string, body: string };

export interface EmailAdapter {
  send(message: EmailMessage, providerConfig: unknown): Promise<DeliveryResult>
}

export interface WebhookAdapter {
  send(message: WebhookMessage): Promise<DeliveryResult>
}
