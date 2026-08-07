import type { Account } from '#/entities/auth/account.entity';

/**
 * Revokes an OAuth token with the provider (e.g. Google) on account unlink or user deletion.
 * Operates as best-effort so network failures during revocation do not block local account cleanup.
 */
export async function revokeOAuthAccount(account: Account): Promise<void> {
  const token = account.refreshToken || account.accessToken;
  if (!token) return;

  if (account.providerId === 'google') {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }
    catch {
      // Best effort revoke - allow local account cleanup even if provider revoke request fails
    }
  }
}
