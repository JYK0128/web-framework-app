import 'reflect-metadata';

import { resolve } from 'node:path';

import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/sqlite';

import { AppEntityManager } from '#/database/entity-manager';
import { entities } from '#/entities.generated';
import { env } from '#/env';

export const SERVICE_DATABASE_CONTEXT = 'service-db';
const serviceDatabaseUrl = env.SERVICE_DATABASE_URL.startsWith('sqlite:')
  ? `sqlite:///${resolve(process.cwd(), env.SERVICE_DATABASE_URL.replace(/^sqlite:\/{3}/, ''))}`
  : env.SERVICE_DATABASE_URL;

export default defineConfig({
  contextName: SERVICE_DATABASE_CONTEXT,
  clientUrl: serviceDatabaseUrl,
  entities,
  entityManager: AppEntityManager,
  namingStrategy: EntityCaseNamingStrategy,
  persistOnCreate: false,
  ignoreUndefinedInQuery: true,
  debug: process.env.NODE_ENV !== 'production',
});
