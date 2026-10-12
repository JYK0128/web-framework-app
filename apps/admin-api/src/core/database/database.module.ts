import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppEntityManager } from './entity-manager';
import mikroOrmConfig from './mikro-orm.config';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { UnitOfWorkInterceptor } from './http/unit-of-work.interceptor';

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
