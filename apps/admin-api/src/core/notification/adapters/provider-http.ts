import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';

export interface ProviderHttpResponse {
  ok: boolean
  status: number
  body: unknown
}

export type ProviderHttpResult = { response: ProviderHttpResponse };

export async function postProviderJson(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<ProviderHttpResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TimeUtil.ms.second(SECURITY_CONFIG.integrations.deliveryProviderRequestTimeoutSeconds)),
    });

    return {
      response: {
        ok: response.ok,
        status: response.status,
        body: await response.json(),
      },
    };
  }
  catch (error) {
    throw ApplicationError.from(error, { code: 'NOTIFICATION_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
  }
}
