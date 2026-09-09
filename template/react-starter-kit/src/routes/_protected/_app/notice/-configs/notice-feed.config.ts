import type { SortingState } from '@tanstack/react-table';

import { NOTICE_PAGE_SIZE } from '#/configs/list.config';

export const PAGE_SIZE = NOTICE_PAGE_SIZE;
export const DEFAULT_SORTING: SortingState = [
  { id: 'priority', desc: true },
  { id: 'publishedAt', desc: true },
  { id: 'id', desc: false },
];
