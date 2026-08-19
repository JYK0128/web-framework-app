import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

import type {
  AlertFeedResponseDto,
  AlertsControllerGetMyAlertsParams,
} from '../../model';

import { axios } from '../../../../core/config/axios';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const alertsControllerGetMyAlerts = (
  params?: AlertsControllerGetMyAlertsParams,
  options?: SecondParameter<typeof axios>,
  signal?: AbortSignal,
) => {
  return axios<AlertFeedResponseDto>(
    { url: '/alerts', method: 'GET', params, signal },
    options,
  );
};

export const getAlertsControllerGetMyAlertsQueryKey = (params?: AlertsControllerGetMyAlertsParams) => {
  return ['/alerts', ...(params ? [params] : [])] as const;
};

export const getAlertsControllerGetMyAlertsQueryOptions = <
  TData = Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>,
  TError = unknown,
>(
  params?: AlertsControllerGetMyAlertsParams,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>, TError, TData>>,
    request?: SecondParameter<typeof axios>,
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getAlertsControllerGetMyAlertsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>> = ({ signal }) =>
    alertsControllerGetMyAlerts(params, requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useAlertsControllerGetMyAlerts<
  TData = Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>,
  TError = unknown,
>(
  params?: AlertsControllerGetMyAlertsParams,
  options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof alertsControllerGetMyAlerts>>, TError, TData>>,
    request?: SecondParameter<typeof axios>,
  },
): UseQueryResult<TData, TError> {
  const queryOptions = getAlertsControllerGetMyAlertsQueryOptions(params, options);
  return useQuery(queryOptions);
}

export const alertsControllerMarkAlertRead = (
  id: string,
  options?: SecondParameter<typeof axios>,
) => {
  return axios<void>(
    { url: `/alerts/${id}/read`, method: 'PATCH' },
    options,
  );
};

export const useAlertsControllerMarkAlertRead = <TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof alertsControllerMarkAlertRead>>, TError, { id: string }, TContext>,
    request?: SecondParameter<typeof axios>,
  },
): UseMutationResult<Awaited<ReturnType<typeof alertsControllerMarkAlertRead>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof alertsControllerMarkAlertRead>>, { id: string }> = (props) => {
    const { id } = props;
    return alertsControllerMarkAlertRead(id, requestOptions);
  };
  return useMutation({ mutationFn, ...mutationOptions });
};

export const alertsControllerMarkAllAlertsRead = (
  options?: SecondParameter<typeof axios>,
) => {
  return axios<void>(
    { url: '/alerts/read-all', method: 'PATCH' },
    options,
  );
};

export const useAlertsControllerMarkAllAlertsRead = <TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof alertsControllerMarkAllAlertsRead>>, TError, void, TContext>,
    request?: SecondParameter<typeof axios>,
  },
): UseMutationResult<Awaited<ReturnType<typeof alertsControllerMarkAllAlertsRead>>, TError, void, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof alertsControllerMarkAllAlertsRead>>, void> = () => {
    return alertsControllerMarkAllAlertsRead(requestOptions);
  };
  return useMutation({ mutationFn, ...mutationOptions });
};

export const alertsControllerDeleteAlert = (
  id: string,
  options?: SecondParameter<typeof axios>,
) => {
  return axios<void>(
    { url: `/alerts/${id}`, method: 'DELETE' },
    options,
  );
};

export const useAlertsControllerDeleteAlert = <TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof alertsControllerDeleteAlert>>, TError, { id: string }, TContext>,
    request?: SecondParameter<typeof axios>,
  },
): UseMutationResult<Awaited<ReturnType<typeof alertsControllerDeleteAlert>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof alertsControllerDeleteAlert>>, { id: string }> = (props) => {
    const { id } = props;
    return alertsControllerDeleteAlert(id, requestOptions);
  };
  return useMutation({ mutationFn, ...mutationOptions });
};
