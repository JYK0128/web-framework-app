import { useMutation, useQuery } from '@tanstack/react-query';

import type { ServiceConfigControllerGetConfigsV1200, ServiceConfigControllerUpdateConfigsV1200, ServiceConfigResponseDto, UpdateServiceConfigRequestDto } from '#/.generated/api/model';
import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/lib/axios';

const SERVICE_CONFIG_URL = `${API_PREFIX}/service-config`;
type ServiceConfigData = Pick<ServiceConfigResponseDto, 'operation' | 'maintenance' | 'inquiry'>;
type ServiceConfigResponse = Omit<ServiceConfigControllerGetConfigsV1200, 'data'> & { data: ServiceConfigData };

export const getServiceConfigQueryKey = () => [SERVICE_CONFIG_URL] as const;

export function useServiceConfigQuery() {
  return useQuery({
    queryKey: getServiceConfigQueryKey(),
    queryFn: () => axios<ServiceConfigResponse>({ url: SERVICE_CONFIG_URL, method: 'GET' }),
  });
}

export function useUpdateServiceConfigMutation() {
  return useMutation({
    mutationFn: ({ data }: { data: UpdateServiceConfigRequestDto }) => axios<ServiceConfigControllerUpdateConfigsV1200>({
      url: SERVICE_CONFIG_URL,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data,
    }),
  });
}
