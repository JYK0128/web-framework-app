import { type Constructor, EntityManager as DriverEntityManager } from '@mikro-orm/postgresql';

import { Permission } from './entities/auth.extensions/permission.entity';
import { Role } from './entities/auth.extensions/role.entity';
import { TwoFactor } from './entities/auth.extensions/two-factor.entity';
import { Account, AccountMetadata } from './entities/auth/account.entity';
import { Profile } from './entities/auth/profile.entity';
import { RefreshToken } from './entities/auth/refresh-token.entity';
import { Session } from './entities/auth/session.entity';
import { User, UserMetadata } from './entities/auth/user.entity';
import { BaseEntity } from './entities/common/base.entity';
import { LogEntry } from './entities/logs/log-entry.entity';
import { SystemConfig } from './entities/system-configs/system-config.entity';
import { Term } from './entities/terms/term.entity';
import { TermGroup } from './entities/terms/term-group.entity';
import { UserTermAgreement } from './entities/terms/user-term-agreement.entity';

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
