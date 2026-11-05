import 'reflect-metadata';

import { DefaultLogger, EntityCaseNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { createLogger } from '@pkg/shared/common';

import { entities } from '~/entities.generated';
import { env } from '~/env';

const databaseLogger = createLogger('service-api.database');

export default defineConfig({
  clientUrl: env.DATABASE_URL,
  driver: PostgreSqlDriver,
  entities,
  entityManager: AppEntityManager,
  namingStrategy: EntityCaseNamingStrategy,
  persistOnCreate: false,
  ignoreUndefinedInQuery: true,
  debug: env.NODE_ENV !== 'production',
  slowQueryThreshold: 1_000,
  slowQueryLoggerFactory: (options) => new DefaultLogger({
    ...options,
    writer: (message) => databaseLogger.warn(message, {
      event: 'database.slow_query',
      service: 'service-api',
    }),
  }),
  extensions: [Migrator, SeedManager],
  migrations: {
    path: './dist/core/database/migrations',
    pathTs: './src/core/database/migrations',
  },
  seeder: {
    path: './dist/core/database/seeders',
    pathTs: './src/core/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
  },
});
