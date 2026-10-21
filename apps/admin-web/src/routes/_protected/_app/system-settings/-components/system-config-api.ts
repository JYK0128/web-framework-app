import { useQuery } from '@tanstack/react-query';

import type { GetSystemConfigResponseDto, SystemConfigControllerGetConfigsV1200 } from '~/.generated/api/model';
import { axios } from '~/lib/axios';

const SYSTEM_CONFIG_URL = '/api/v1/system-config';
type SystemSettingsData = Pick<GetSystemConfigResponseDto, 'notification' | 'oauth' | 'webhook' | 'adminEmail'>;
type SystemSettingsResponse = Omit<SystemConfigControllerGetConfigsV1200, 'data'> & { data: SystemSettingsData };

export const getSystemSettingsQueryKey = () => [SYSTEM_CONFIG_URL] as const;

export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: getSystemSettingsQueryKey(),
    refetchOnReconnect: false,
    queryFn: () => axios<SystemSettingsResponse>({ url: SYSTEM_CONFIG_URL, method: 'GET' }),
  });
}
