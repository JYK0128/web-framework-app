import { httpClient } from '#/core/http/http-client';
import { env } from '#/env';

export async function getPortOneVerification(identityVerificationId: string) {
  return httpClient.get<unknown>(`https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`, {
    headers: { Authorization: `PortOne ${env.PORTONE_API_SECRET}` },
  });
}
