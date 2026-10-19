import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuditSubscriber } from '#/core/database/audit.subscriber';
import { AppEntityManager } from '#/core/database/entity-manager';

import { UnitOfWorkInterceptor } from './http/unit-of-work.interceptor';
import mikroOrmConfig from './mikro-orm.config';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
  ],
  providers: [
    AuditSubscriber,
    { provide: APP_INTERCEPTOR, useClass: UnitOfWorkInterceptor },
    {
      provide: AppEntityManager,
      useExisting: EntityManager,
    },
  ],
  exports: [
    AppEntityManager,
  ],
})
export class DatabaseModule {}
