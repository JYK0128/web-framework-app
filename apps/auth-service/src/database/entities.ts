import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';

const authSchema = 'auth';

@Entity({ tableName: 'user', schema: authSchema })
export class AuthUser {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ fieldName: 'emailVerified', default: false })
  emailVerified = false;

  @Property({ nullable: true })
  image?: string;

  @Property({ fieldName: 'createdAt', defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({ fieldName: 'updatedAt', defaultRaw: 'now()' })
  updatedAt = new Date();
}

@Entity({ tableName: 'session', schema: authSchema })
@Index({ properties: ['userId'] })
@Index({ properties: ['expiresAt'] })
export class AuthSession {
  @PrimaryKey()
  id!: string;

  @Property({ fieldName: 'userId' })
  userId!: string;

  @Property({ unique: true })
  token!: string;

  @Property({ fieldName: 'expiresAt' })
  expiresAt!: Date;

  @Property({ fieldName: 'ipAddress', nullable: true })
  ipAddress?: string;

  @Property({ fieldName: 'userAgent', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'createdAt', defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({ fieldName: 'updatedAt', defaultRaw: 'now()' })
  updatedAt = new Date();
}

@Entity({ tableName: 'account', schema: authSchema })
@Index({ properties: ['userId'] })
@Unique({ properties: ['providerId', 'accountId'] })
export class AuthAccount {
  @PrimaryKey()
  id!: string;

  @Property({ fieldName: 'userId' })
  userId!: string;

  @Property({ fieldName: 'accountId' })
  accountId!: string;

  @Property({ fieldName: 'providerId' })
  providerId!: string;

  @Property({ fieldName: 'accessToken', nullable: true })
  accessToken?: string;

  @Property({ fieldName: 'refreshToken', nullable: true })
  refreshToken?: string;

  @Property({ fieldName: 'accessTokenExpiresAt', nullable: true })
  accessTokenExpiresAt?: Date;

  @Property({ fieldName: 'refreshTokenExpiresAt', nullable: true })
  refreshTokenExpiresAt?: Date;

  @Property({ nullable: true })
  scope?: string;

  @Property({ fieldName: 'idToken', nullable: true })
  idToken?: string;

  @Property({ nullable: true })
  password?: string;

  @Property({ fieldName: 'createdAt', defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({ fieldName: 'updatedAt', defaultRaw: 'now()' })
  updatedAt = new Date();
}

@Entity({ tableName: 'verification', schema: authSchema })
@Index({ properties: ['identifier'] })
@Index({ properties: ['expiresAt'] })
export class AuthVerification {
  @PrimaryKey()
  id!: string;

  @Property()
  identifier!: string;

  @Property()
  value!: string;

  @Property({ fieldName: 'expiresAt' })
  expiresAt!: Date;

  @Property({ fieldName: 'createdAt', defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({ fieldName: 'updatedAt', defaultRaw: 'now()' })
  updatedAt = new Date();
}

export const authEntities = [AuthUser, AuthSession, AuthAccount, AuthVerification];
