import type { QueryClient, QueryKey } from '@tanstack/react-query';

type EntityListResponse<TEntity extends { id: string }> = {
  data: {
    items: TEntity[]
  }
};

export function createEntityQueryCache<TEntity extends { id: string }, TResponse extends EntityListResponse<TEntity>>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return {
    patch(id: string, patch: Partial<TEntity>) {
      queryClient.setQueriesData<TResponse>({ queryKey }, (response) => {
        if (!response) return response;

        return {
          ...response,
          data: {
            ...response.data,
            items: response.data.items.map((item) => item.id === id ? { ...item, ...patch } : item),
          },
        };
      });
    },
  };
}
