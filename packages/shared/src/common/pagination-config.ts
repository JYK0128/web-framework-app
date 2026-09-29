export const PAGINATION_MAX_LIMIT = 100;
export const PAGINATION_DEFAULT_LIMIT = Math.min(20, PAGINATION_MAX_LIMIT);
export const PAGINATION_DEFAULT_PAGE = 1;

const BASE_PAGE_SIZE_OPTIONS = [10, 20, 50];

export const PAGINATION_PAGE_SIZE_OPTIONS = [...new Set([
  ...BASE_PAGE_SIZE_OPTIONS.filter((size) => size <= PAGINATION_MAX_LIMIT),
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
])].sort((left, right) => left - right);
