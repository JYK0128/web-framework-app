import { type Constructor, EntityManager as DriverEntityManager } from '@mikro-orm/postgresql';

import { Permission } from './core/database/entities/auth.extensions/permission.entity';
import { Role } from './core/database/entities/auth.extensions/role.entity';
import { TwoFactor } from './core/database/entities/auth.extensions/two-factor.entity';
import { Account, AccountMetadata } from './core/database/entities/auth/account.entity';
import { Profile } from './core/database/entities/auth/profile.entity';
import { RefreshToken } from './core/database/entities/auth/refresh-token.entity';
import { Session } from './core/database/entities/auth/session.entity';
import { User, UserMetadata } from './core/database/entities/auth/user.entity';
import { BaseEntity } from './core/database/entities/common/base.entity';
import { LogEntry } from './core/database/entities/logs/log-entry.entity';
import { SystemConfig } from './core/database/entities/system-configs/system-config.entity';
import { Term } from './core/database/entities/terms/term.entity';
import { TermGroup } from './core/database/entities/terms/term-group.entity';
import { UserTermAgreement } from './core/database/entities/terms/user-term-agreement.entity';

export const entities = [
  SystemConfig,
  Account,
  AccountMetadata,
  BaseEntity,
  LogEntry,
  Profile,
  Permission,
  RefreshToken,
  Role,
  Session,
  Term,
  TermGroup,
  TwoFactor,
  User,
  UserMetadata,
  UserTermAgreement,
] as const;

export type Database = typeof entities;

export type EntityManager = DriverEntityManager & { '~entities': Database };
export const EntityManager = DriverEntityManager as Constructor<EntityManager>;
