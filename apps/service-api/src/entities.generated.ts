import { type Constructor, EntityManager as DriverEntityManager } from '@mikro-orm/postgresql';

import { Role } from './entities/auth.extensions/role.entity';
import { TwoFactor } from './entities/auth.extensions/two-factor.entity';
import { Account, AccountMetadata } from './entities/auth/account.entity';
import { Profile } from './entities/auth/profile.entity';
import { RefreshToken } from './entities/auth/refresh-token.entity';
import { Session } from './entities/auth/session.entity';
import { User, UserMetadata } from './entities/auth/user.entity';
import { BaseEntity } from './entities/common/base.entity';
import { Term } from './entities/terms/term.entity';
import { TermGroup } from './entities/terms/term-group.entity';
import { UserTermAgreement } from './entities/terms/user-term-agreement.entity';
import { Upload } from './entities/uploads/upload.entity';

export const entities = [
  Account,
  AccountMetadata,
  BaseEntity,
  Profile,
  RefreshToken,
  Role,
  Session,
  Term,
  TermGroup,
  TwoFactor,
  Upload,
  User,
  UserMetadata,
  UserTermAgreement,
] as const;

export type Database = typeof entities;

export type EntityManager = DriverEntityManager & { '~entities': Database };
export const EntityManager = DriverEntityManager as Constructor<EntityManager>;
