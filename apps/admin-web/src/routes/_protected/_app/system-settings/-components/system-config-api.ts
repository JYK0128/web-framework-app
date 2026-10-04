import { useQuery } from '@tanstack/react-query';

import type { SystemConfigControllerGetConfigsV1200, SystemSettingsResponseDto } from '#/.generated/api/model';
import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/lib/axios';

const SYSTEM_CONFIG_URL = `${API_PREFIX}/system-config`;
type SystemSettingsData = Pick<SystemSettingsResponseDto, 'delivery' | 'oauth' | 'webhook' | 'adminEmail'>;
type SystemSettingsResponse = Omit<SystemConfigControllerGetConfigsV1200, 'data'> & { data: SystemSettingsData };

export const getSystemSettingsQueryKey = () => [SYSTEM_CONFIG_URL] as const;

export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: getSystemSettingsQueryKey(),
    queryFn: () => axios<SystemSettingsResponse>({ url: SYSTEM_CONFIG_URL, method: 'GET' }),
  });
}
