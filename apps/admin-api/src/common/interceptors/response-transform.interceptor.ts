import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import type { Request, Response } from 'express';
import { map, type Observable, tap } from 'rxjs';

import { ApiResponse } from '#/common/http';
import { type ApiResponseDto } from '#/common/interfaces/response/api.response.dto';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponseDto<T> | T> {
    if (Reflect.getMetadata(SSE_METADATA, context.getHandler())) return next.handle();

    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => ApiResponse.from<T>(data, request, response)),
      tap((result) => response.status(result.statusCode)),
    );
  }
}
