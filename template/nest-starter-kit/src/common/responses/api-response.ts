import type { Request, Response } from 'express';

import { ApiBaseResponseDto, ApiSuccessResponseDto } from '#/common/dto/api-response.dto';

export class ApiResponse {
  static from<T>(value: T, req: Request, res?: Response): ApiBaseResponseDto<T> {
    const result = value instanceof ApiBaseResponseDto
      ? value
      : ApiSuccessResponseDto.fromPlain<ApiSuccessResponseDto<T>>({ data: value });

    return this.applyMetadata(result, req, res);
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
    dto.requestId = req.requestId ?? '-';
    dto.timestamp = new Date().toISOString();

    return dto;
  }
}
