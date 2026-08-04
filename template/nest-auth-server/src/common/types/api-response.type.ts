export type ApiResponse<T> = {
  data: T
  requestId: string
};

export type ApiErrorResponse = {
  statusCode: number
  code: string
  message: string
  details?: unknown
  path: string
  requestId: string
  timestamp: string
};
