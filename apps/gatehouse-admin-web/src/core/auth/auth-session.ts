import type { QueryClient } from '@tanstack/react-query';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import type { UserProfileResponse } from '#/.generated/api/model';

export type AuthUser = UserProfileResponse & {
  role?: string
};

export type AuthSession = {
  user: AuthUser
  expiresAt: string | null
};

export const authProfileQueryOptions = getAuthControllerUserProfileQueryOptions({
  query: { staleTime: 30_000 },
});

export async function fetchAuthSession(queryClient: QueryClient): Promise<AuthSession | null> {
  const response = await queryClient.ensureQueryData(authProfileQueryOptions).catch(() => null);
  if (!response?.data?.user) return null;
  return response.data;
}
