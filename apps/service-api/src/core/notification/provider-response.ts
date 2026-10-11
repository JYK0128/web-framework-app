import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { z } from 'zod';

export interface ProviderHttpResponse {
  ok: boolean
  status: number
  body: unknown
}

export type DeliveryProvider = 'NHN' | 'SOLAPI' | 'FCM' | 'LINE' | 'WHATSAPP' | 'TELEGRAM' | 'WECHAT';

const recordSchema = z.record(z.string(), z.unknown());

export function parseDeliveryResult(provider: DeliveryProvider, response: ProviderHttpResponse): string | undefined {
  const parsed = recordSchema.safeParse(response.body);
  if (!parsed.success) throw new ApplicationError({ code: 'NOTIFICATION_DELIVERY_FAILED', message: `${provider}: Invalid provider response`, status: HttpStatus.BAD_GATEWAY });
  const data = parsed.data;
  const header = recordSchema.safeParse(data.header).data;
  const body = recordSchema.safeParse(data.body).data;
  const result = recordSchema.safeParse(data.result).data;
  const recipients = recordSchema.safeParse(body?.data).data;
  const sendResults = recipients?.sendResultList;
  const nhnRecipientsOk = sendResults === undefined || (Array.isArray(sendResults) && sendResults.length > 0 && sendResults.every((item: unknown) => recordSchema.safeParse(item).data?.resultCode === 0));
  let accepted: boolean;
  switch (provider) {
    case 'NHN': accepted = header?.isSuccessful === true && recipients?.statusCode !== '3' && nhnRecipientsOk;
      break;
    case 'SOLAPI': accepted = typeof data.messageId === 'string' && !data.errorCode && !(typeof data.errorCount === 'number' && data.errorCount > 0);
      break;
    case 'FCM': accepted = typeof data.name === 'string' && !data.error;
      break;
    case 'LINE': accepted = !data.error && !data.message;
      break;
    case 'WHATSAPP': accepted = Array.isArray(data.messages) && data.messages.length > 0 && !data.error;
      break;
    case 'TELEGRAM': accepted = data.ok === true;
      break;
    case 'WECHAT': accepted = data.errcode === 0;
      break;
  }
  const rawId = data.messageId ?? data.name ?? recipients?.requestId ?? body?.requestId ?? result?.message_id;
  const messageId = typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : undefined;
  const recipientResults = z.array(recordSchema).safeParse(sendResults).data;
  const failedRecipient = recipientResults?.find((item) => item.resultCode !== 0);
  const rawError = failedRecipient?.resultMessage ?? (header?.isSuccessful === false ? header.resultMessage : undefined) ?? data.errorMessage ?? data.message ?? data.description ?? data.errmsg;
  const errorMessage = typeof rawError === 'string' ? rawError : `Provider rejected request (HTTP ${response.status})`;
  if (!response.ok || !accepted) throw ApplicationError.from(new Error(errorMessage), { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  return messageId;
}
