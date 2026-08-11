import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { map, type Observable } from 'rxjs';

import { type ApiErrorResponseDto, ApiErrorResult, ApiResponse, type ApiSuccessResponseDto, ApiSuccessResult } from '#/common/dto/api-response.dto';

type ApiResponseResult<T> = ApiSuccessResponseDto<T> | ApiErrorResponseDto;

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponseResult<T>> {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponseResult<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(map((data) => {
      const result = data instanceof ApiSuccessResult || data instanceof ApiErrorResult
        ? data
        : ApiResponse.success({ data });
      const statusCode = result.statusCode ?? response.statusCode;

      if (result.statusCode !== undefined) {
        response.status(result.statusCode);
      }

      return {
        ...result,
        statusCode,
        path: request.originalUrl,
        requestId: this.cls.get('requestId'),
        timestamp: new Date().toISOString(),
      };
    }));
  }
}
