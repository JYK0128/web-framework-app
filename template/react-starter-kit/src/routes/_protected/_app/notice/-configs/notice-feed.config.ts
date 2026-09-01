import type { SortingState } from '@tanstack/react-table';

export const PAGE_SIZE = 20;
export const DEFAULT_SORTING: SortingState = [
  { id: 'priority', desc: true },
  { id: 'publishedAt', desc: true },
  { id: 'id', desc: false },
];
