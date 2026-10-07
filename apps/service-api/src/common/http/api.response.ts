import type { Request, Response } from 'express';

import { ApiBaseResponseDto, type ApiResponseDto, ApiSuccessResponseDto } from '#/common/interfaces/response/api.response.dto';

export class ApiResponse {
  static from<T>(value: T, req: Request, res?: Response): ApiResponseDto<T> {
    const result = value instanceof ApiBaseResponseDto
      ? value
      : ApiSuccessResponseDto.fromPlain<ApiSuccessResponseDto<T>>({
        data: value,
        message: 'success.COMPLETED',
      });

    if (result.message) result.message = this.translate(req, result.message);
    return this.applyMetadata(result as ApiResponseDto<T>, req, res);
  }

  private static applyMetadata<T extends ApiBaseResponseDto<unknown>>(
    dto: T,
    req: Request,
    res?: Response,
  ): T {
    if (res?.statusCode) {
      dto.statusCode ??= res.statusCode;
    }
    dto.path = req.originalUrl;
    dto.requestId = (req.header('x-request-id')) ?? (req as unknown as { requestId?: string }).requestId ?? '-';
    dto.timestamp = new Date().toISOString();

    return dto;
  }

  private static translate(req: Request, key: string, params?: Record<string, unknown>): string {
    const translated = req.t(key, params);
    return translated === key ? key : translated;
  }
}
