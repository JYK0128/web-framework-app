import 'reflect-metadata';

import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

import { entities } from '#/entities.generated';
import { Event } from '#/entities/events/event.entity';
import { Notice } from '#/entities/notices/notice.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

export default defineConfig({
  clientUrl: env.DATABASE_URL,
  driver: PostgreSqlDriver,
  entities: [...entities, Notice, Event],
  entityManager: AppEntityManager,
  namingStrategy: EntityCaseNamingStrategy,
  persistOnCreate: false,
  ignoreUndefinedInQuery: true,
  debug: process.env.NODE_ENV !== 'production',
  extensions: [Migrator, SeedManager],
  migrations: {
    path: './dist/infra/database/migrations',
    pathTs: './src/infra/database/migrations',
  },
  seeder: {
    path: './dist/infra/database/seeders',
    pathTs: './src/infra/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
  },
});
