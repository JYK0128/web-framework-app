# Auth Service database

`better-auth.schema.sql` follows Better Auth's core schema: `user`, `session`, `account`, and `verification`.

The tables are placed in the `auth` PostgreSQL schema so the authentication data has its own database boundary. Configure the Auth Service connection with `search_path=auth` (or qualify the adapter schema) before wiring Better Auth to this database.

Auth Service now registers these tables as MikroORM entities in `database.module.ts` and connects through `DATABASE_URL` (default: `postgresql://postgres:postgres@127.0.0.1:5432/auth`). The login, refresh, and logout handlers persist and remove refresh sessions through MikroORM; the in-memory refresh-token set is not used.

Apply `better-auth.schema.sql` before starting the service. The SQL file is the authoritative schema migration for this initial skeleton; later changes should be represented as MikroORM migrations rather than schema synchronization in production.

The `session` table is Better Auth's persisted authentication session. It is different from the `admin_session` and `service_session` cookies managed by the Web/BFF applications. BFF session records and short-lived token state belong in Redis with separate key prefixes.

The `account.password` value must contain a password hash, never a plaintext password. OAuth provider tokens should be encrypted before persistence.
