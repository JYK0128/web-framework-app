import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable, type OnModuleInit } from '@nestjs/common';

import { DatabaseSeeder } from '#/database/seeders/database.seeder';
import { env } from '#/env';

@Injectable()
export class DatabaseInitializer implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'production') return;

    await this.orm.schema.update({ safe: true });
    const seeder = new DatabaseSeeder();
    await seeder.run(this.orm.em.fork());
  }
}
