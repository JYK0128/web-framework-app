import 'reflect-metadata';

import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import { entities } from '#/entities.generated';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

export default defineConfig({
  clientUrl: env.DATABASE_URL,
  driver: PostgreSqlDriver,
  entities,
  entityManager: AppEntityManager,
  namingStrategy: EntityCaseNamingStrategy,
  persistOnCreate: false,
  highlighter: new SqlHighlighter(),
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
