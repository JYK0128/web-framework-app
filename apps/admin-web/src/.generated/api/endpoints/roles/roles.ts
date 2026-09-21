import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import type { CreateRoleRequestDto, RolesControllerCreateRoleV1201, RolesControllerDeleteRoleV1200, RolesControllerGetRolesV1200, RolesControllerUpdateRoleV1200, UpdateRoleRequestDto } from '../../model';
import { axios } from '../../../../lib/axios';

type RequestOptions = { request?: Record<string, unknown> };
export const rolesControllerGetRoles = (options?: RequestOptions, signal?: AbortSignal) => axios<RolesControllerGetRolesV1200>({ url: '/api/v1/roles', method: 'GET', signal }, options?.request);
export const getRolesControllerGetRolesQueryKey = () => ['/api/v1/roles'] as const;
export function useRolesControllerGetRoles(options?: { query?: Partial<UseQueryOptions<RolesControllerGetRolesV1200>> }) { return useQuery({ queryKey: getRolesControllerGetRolesQueryKey(), queryFn: ({ signal }) => rolesControllerGetRoles(undefined, signal), ...options?.query }); }

export const rolesControllerCreateRole = (data: CreateRoleRequestDto, options?: RequestOptions) => axios<RolesControllerCreateRoleV1201>({ url: '/api/v1/roles', method: 'POST', data }, options?.request);
export function useRolesControllerCreateRole(options?: { mutation?: UseMutationOptions<RolesControllerCreateRoleV1201, unknown, { data: CreateRoleRequestDto }> }) { return useMutation({ mutationFn: ({ data }) => rolesControllerCreateRole(data), ...options?.mutation }); }

export const rolesControllerUpdateRole = (id: string, data: UpdateRoleRequestDto, options?: RequestOptions) => axios<RolesControllerUpdateRoleV1200>({ url: `/api/v1/roles/${id}`, method: 'PATCH', data }, options?.request);
export function useRolesControllerUpdateRole(options?: { mutation?: UseMutationOptions<RolesControllerUpdateRoleV1200, unknown, { id: string; data: UpdateRoleRequestDto }> }) { return useMutation({ mutationFn: ({ id, data }) => rolesControllerUpdateRole(id, data), ...options?.mutation }); }

export const rolesControllerDeleteRole = (id: string, options?: RequestOptions) => axios<RolesControllerDeleteRoleV1200>({ url: `/api/v1/roles/${id}`, method: 'DELETE' }, options?.request);
export function useRolesControllerDeleteRole(options?: { mutation?: UseMutationOptions<RolesControllerDeleteRoleV1200, unknown, { id: string }> }) { return useMutation({ mutationFn: ({ id }) => rolesControllerDeleteRole(id), ...options?.mutation }); }
