import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { map, type Observable } from 'rxjs';

import { ApiResponse, type ApiSuccessResponseDto } from '#/common/dto/api-response.dto';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponseDto<T>> {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(map((data) => ApiResponse.success(
      data,
      response.statusCode,
      request.originalUrl,
      this.cls.get('requestId'),
    )));
  }
}
