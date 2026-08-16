import 'reflect-metadata';

import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import { AppEntityManager } from '#/database/entity-manager';
import { entities } from '#/entities.generated';
import { env } from '#/env';

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
