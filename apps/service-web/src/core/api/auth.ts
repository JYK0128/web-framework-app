import { queryOptions } from '@tanstack/react-query';

import { apiRequest, resetCsrfToken } from '#/core/api/client';

export type CurrentUser = {
  userId: string
  plane: string
  requestId: string | null
};

type LoginResponse = {
  user: { id: string }
  expiresIn: number
};

export const currentUserQueryOptions = () => queryOptions({
  queryKey: ['current-user'],
  queryFn: () => apiRequest<CurrentUser>({ url: '/api/v1/me' }),
  retry: false,
});

export async function login(userId: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>({
    url: '/api/v1/auth/login',
    method: 'POST',
    data: { userId },
  });
  resetCsrfToken();
  return response;
}
