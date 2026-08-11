import { MikroORM } from '@mikro-orm/sqlite';
import { Injectable, type OnModuleInit } from '@nestjs/common';

import { env } from '#/env';

@Injectable()
export class DatabaseInitializer implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'production') return;

    await this.orm.schema.update({ safe: true });
  }
}
