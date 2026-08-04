import 'reflect-metadata';

import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { defineConfig } from '@mikro-orm/sqlite';

import { AuditSubscriber } from '#/database/subscribers/audit.subscriber';
import { entities } from '#/entities.generated';
import { env } from '#/env';

export default defineConfig({
  dbName: env.DATABASE_PATH,
  entities,
  extensions: [Migrator, SeedManager],
  subscribers: [AuditSubscriber],
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
  },
  seeder: {
    path: './dist/database/seeders',
    pathTs: './src/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
  },
});
