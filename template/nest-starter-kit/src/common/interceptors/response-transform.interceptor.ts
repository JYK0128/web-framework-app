import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { map, type Observable, tap } from 'rxjs';

import { ApiBaseResponseDto } from '#/common/dto/api-response.dto';
import { ApiResponse } from '#/common/responses';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiBaseResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiBaseResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => ApiResponse.from<T>(data, request, response)),
      tap((result) => response.status(result.statusCode)),
    );
  }
}
