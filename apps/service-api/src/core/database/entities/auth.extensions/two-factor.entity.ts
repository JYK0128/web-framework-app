import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '~/core/database/entities/auth/user.entity';
import { BaseEntity } from '~/core/database/entities/base.entity';

@Entity({ tableName: 'twoFactor' })
export class TwoFactor extends BaseEntity {
  @Property({ type: 'string' })
  secret!: string;

  @Property({ type: 'string', nullable: true })
  backupCodes: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  verified: Opt<boolean> = false;

  @Property({ type: 'integer', default: 0 })
  failedVerificationCount: Opt<number> = 0;

  @Property({ type: 'timestamp', nullable: true })
  lockedUntil: Opt<Date> | null = null;

  @Property({ type: 'boolean', persist: false })
  get isLocked(): Opt<boolean> {
    return this.isLockedAt(new Date());
  }

  @Property({ type: 'boolean', persist: false })
  get isLockExpired(): Opt<boolean> {
    return this.hasExpiredLockAt(new Date());
  }

  isLockedAt(now: Date): boolean {
    return this.lockedUntil !== null && this.lockedUntil > now;
  }

  private hasExpiredLockAt(now: Date): boolean {
    return this.lockedUntil !== null && this.lockedUntil <= now;
  }

  recordVerificationFailure(now: Date, maxAttempts: number, lockDurationMilliseconds: number): void {
    this.failedVerificationCount = this.hasExpiredLockAt(now) ? 1 : this.failedVerificationCount + 1;
    this.lockedUntil = this.failedVerificationCount >= maxAttempts
      ? new Date(now.getTime() + lockDurationMilliseconds)
      : null;
  }

  resetVerificationFailures(): void {
    this.failedVerificationCount = 0;
    this.lockedUntil = null;
  }

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;
}
