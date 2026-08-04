import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { map, type Observable } from 'rxjs';

import type { ApiResponse } from '#/types/api-response.type';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly cls: ClsService) {}

  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(map((data) => ({
      data,
      requestId: this.cls.get('requestId'),
    })));
  }
}
