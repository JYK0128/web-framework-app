import type { Configuration, Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { SqliteConnection, SqliteDriver } from '@mikro-orm/sqlite';

type SqliteDatabaseClient = {
  function: (name: string, opts: { deterministic: boolean }, fn: (pattern: unknown, text: unknown) => number) => void
};

const REGEX_CACHE = new Map<string, RegExp>();

function getCompiledRegex(pattern: string): RegExp {
  let regex = REGEX_CACHE.get(pattern);
  if (!regex) {
    regex = new RegExp(pattern);
    if (REGEX_CACHE.size >= 100) {
      REGEX_CACHE.clear();
    }
    REGEX_CACHE.set(pattern, regex);
  }
  return regex;
}

export class AppSqliteConnection extends SqliteConnection {
  override createKyselyDialect(options: Parameters<SqliteConnection['createKyselyDialect']>[0]) {
    const dialect = super.createKyselyDialect(options);
    const db = (this as unknown as { database?: SqliteDatabaseClient }).database;

    // SQLite 정규식(REGEXP) UDF 등록 (초성 정규식 $re 캐싱 지원)
    db?.function('regexp', { deterministic: true }, (pattern: unknown, text: unknown) => {
      if (typeof text !== 'string' || typeof pattern !== 'string') {
        return 0;
      }
      try {
        return getCompiledRegex(pattern).test(text) ? 1 : 0;
      }
      catch {
        return 0;
      }
    });

    return dialect;
  }
}

export class AppSqliteDriver extends SqliteDriver {
  constructor(config: Configuration<IDatabaseDriver<Connection>, EntityManager<IDatabaseDriver<Connection>>>) {
    super(config);
    (this as unknown as { connection: AppSqliteConnection }).connection = new AppSqliteConnection(this.config);
  }
}
