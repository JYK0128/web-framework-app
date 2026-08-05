export type ApiBaseResponse = {
  success: boolean
  statusCode: number
  path: string
  requestId: string
  timestamp: string
};

export type ApiSuccessResponse<T> = ApiBaseResponse & {
  success: true
  data: T
  meta?: Record<string, unknown>
};

export type ApiErrorResponse = ApiBaseResponse & {
  success: false
  code: string
  message: string
  details?: unknown
};

export class ApiResponse {
  static success<T>(
    data: T,
    statusCode: number,
    path: string,
    requestId: string,
    meta?: Record<string, unknown>,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      statusCode,
      path,
      requestId,
      timestamp: new Date().toISOString(),
      data,
      ...(meta && { meta }),
    };
  }

  static error(
    code: string,
    message: string,
    statusCode: number,
    path: string,
    requestId: string,
    details?: unknown,
  ): ApiErrorResponse {
    return {
      success: false,
      statusCode,
      path,
      requestId,
      timestamp: new Date().toISOString(),
      code,
      message,
      ...(details !== undefined && { details }),
    };
  }
}
