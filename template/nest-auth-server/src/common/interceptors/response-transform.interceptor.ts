import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { requestContext } from '#/common/context/request-context';
import type { ApiResponse } from '#/common/types/api-response.type';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(map((data) => ({
      data,
      requestId: requestContext.getRequestId() ?? '-',
    })));
  }
}
