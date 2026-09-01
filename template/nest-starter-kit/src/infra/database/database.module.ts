import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';

import { AppEntityManager } from './entity-manager';
import mikroOrmConfig from './mikro-orm.config';
import { AuditSubscriber } from './subscribers/audit.subscriber';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
  ],
  providers: [
    AuditSubscriber,
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
