-- Better Auth core schema for auth-service.
-- Apply this file to the auth-service database, not to Control/Data databases.
-- The BFF session is intentionally stored in Redis and is not this session table.

create schema if not exists auth;

create table if not exists auth."user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists auth."session" (
  "id" text primary key,
  "userId" text not null references auth."user"("id") on delete cascade,
  "token" text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "session_userId_idx" on auth."session" ("userId");
create index if not exists "session_expiresAt_idx" on auth."session" ("expiresAt");

create table if not exists auth."account" (
  "id" text primary key,
  "userId" text not null references auth."user"("id") on delete cascade,
  "accountId" text not null,
  "providerId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "idToken" text,
  "password" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "account_provider_account_unique" unique ("providerId", "accountId")
);

create index if not exists "account_userId_idx" on auth."account" ("userId");

create table if not exists auth."verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "verification_identifier_idx" on auth."verification" ("identifier");
create index if not exists "verification_expiresAt_idx" on auth."verification" ("expiresAt");
