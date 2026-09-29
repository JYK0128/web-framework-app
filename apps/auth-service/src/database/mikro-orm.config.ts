import { defineConfig } from '@mikro-orm/postgresql';

import { authEntities } from './entities.js';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/auth',
  entities: authEntities,
  migrations: { path: './dist/database/migrations', pathTs: './src/database/migrations' },
  debug: process.env.NODE_ENV !== 'production',
});
