import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { mergeMap, type Observable } from 'rxjs';

import { AppEntityManager } from '#/database/entity-manager';

@Injectable()
export class UnitOfWorkInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private readonly entityManager: AppEntityManager) {}

  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    return next.handle().pipe(
      mergeMap(async (data) => {
        await this.entityManager.flush();
        return data;
      }),
    );
  }
}
