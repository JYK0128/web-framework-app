import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetPermissionsResponseDto, PermissionsControllerGetPermissionsV1200 } from '../../model';
import { axios } from '../../../../lib/axios';

export const permissionsControllerGetPermissions = (signal?: AbortSignal) => axios<PermissionsControllerGetPermissionsV1200>({ url: '/api/v1/permissions', method: 'GET', signal });
export const getPermissionsControllerGetPermissionsQueryKey = () => ['/api/v1/permissions'] as const;
export function usePermissionsControllerGetPermissions(options?: { query?: Partial<UseQueryOptions<PermissionsControllerGetPermissionsV1200>> }) { return useQuery({ queryKey: getPermissionsControllerGetPermissionsQueryKey(), queryFn: ({ signal }) => permissionsControllerGetPermissions(signal), ...options?.query }); }

export type PermissionsResponse = GetPermissionsResponseDto;
