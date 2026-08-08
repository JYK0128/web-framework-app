import type { Account } from '#/entities/auth/account.entity';
import { GOOGLE_OAUTH_CONFIG } from '#/modules/auth/constants/google-oauth.constants';

/**
 * Revokes an OAuth token with the provider (e.g. Google) on account unlink or user deletion.
 * Operates as best-effort so network failures during revocation do not block local account cleanup.
 */
export async function revokeOAuthAccount(account: Account): Promise<void> {
  const token = account.refreshToken || account.accessToken;
  if (!token) return;

  if (account.providerId === GOOGLE_OAUTH_CONFIG.provider) {
    try {
      await fetch(`${GOOGLE_OAUTH_CONFIG.revokeUrl}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }
    catch {
      // Best effort revoke - allow local account cleanup even if provider revoke request fails
    }
  }
}
