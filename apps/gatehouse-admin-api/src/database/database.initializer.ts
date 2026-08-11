import { InjectMikroORM } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/sqlite';
import { Injectable, type OnModuleInit } from '@nestjs/common';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { env } from '#/env';

@Injectable()
export class DatabaseInitializer implements OnModuleInit {
  constructor(
    private readonly orm: MikroORM,
    @InjectMikroORM(SERVICE_DATABASE_CONTEXT) private readonly serviceOrm: MikroORM,
  ) {}

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'production') return;

    await this.orm.schema.update({ safe: true });
    await this.serviceOrm.schema.update({ safe: true });
  }
}
