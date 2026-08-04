import { EntityManager } from '@mikro-orm/core';
import { type CallHandler, type ExecutionContext, Inject, Injectable, type NestInterceptor } from '@nestjs/common';
import { mergeMap, type Observable } from 'rxjs';

@Injectable()
export class UnitOfWorkInterceptor<T> implements NestInterceptor<T, T> {
  constructor(@Inject(EntityManager) private readonly entityManager: EntityManager) {}

  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    return next.handle().pipe(
      mergeMap(async (data) => {
        await this.entityManager.flush();
        return data;
      }),
    );
  }
}
