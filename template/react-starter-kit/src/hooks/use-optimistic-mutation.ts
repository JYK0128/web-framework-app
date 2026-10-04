import { type MutationKey, type QueryKey, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';

type CommonOptions = {
  queryKey: QueryKey
  mutationKey: MutationKey
};

type ItemOptions<TVariables, TItem> = CommonOptions & {
  getQueryId: (item: TItem) => string
  getMutationId: (variables: TVariables) => string
  updateItem: (item: TItem, variables: TVariables) => TItem
  updateCache?: never
};

type CacheOptions<TVariables, TCache> = CommonOptions & {
  updateCache: (cache: TCache | undefined, variables: TVariables) => TCache | undefined
  getQueryId?: never
  getMutationId?: never
  updateItem?: never
};

/** generated mutation options에 optimistic 처리 옵션을 추가합니다. */
export function useOptimisticMutation<
  TData,
  TError = unknown,
  TVariables = unknown,
  TItem = unknown,
  TCache = unknown,
>(
  options: ItemOptions<TVariables, TItem> | CacheOptions<TVariables, TCache>,
): UseMutationOptions<TData, TError, TVariables> {
  const queryClient = useQueryClient();
  const { queryKey, mutationKey } = options;

  return {
    mutationKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TCache>(queryKey);

      if (options.updateCache) {
        queryClient.setQueryData<TCache>(queryKey, (current) =>
          options.updateCache(current, variables),
        );
      }
      else {
        const targetId = options.getMutationId(variables);
        queryClient.setQueryData<TItem[]>(queryKey, (current) =>
          current?.map((item) =>
            options.getQueryId(item) === targetId
              ? options.updateItem(item, variables)
              : item,
          ),
        );
      }

      return { previous };
    },
    onError: (error, variables, context) => {
      const previous = (context as { previous?: TCache | TItem[] } | undefined)?.previous;

      if (previous !== undefined) {
        queryClient.setQueryData(queryKey, previous);
      }
    },
    onSettled: (_data, _error, _variables, _context) => {
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}
