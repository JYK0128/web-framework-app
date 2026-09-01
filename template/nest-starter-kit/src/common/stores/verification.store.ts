import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { decrypt, encrypt } from '@pkg/shared/server';

import { Verification } from '#/entities/auth/verification.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

export type VerificationRecord = {
  value: string
  expiresAt: number
};

@Injectable()
export class VerificationStore {
  private readonly logger = new Logger(VerificationStore.name);

  constructor(private readonly em: AppEntityManager) {}

  async save(
    identifier: string,
    record: VerificationRecord,
  ): Promise<void> {
    await this.em.upsert(Verification, {
      identifier: this.hashIdentifier(identifier),
      value: encrypt(record.value, env.APP_SECRET),
      expiresAt: new Date(record.expiresAt),
      updatedAt: new Date(),
    }, {
      onConflictFields: ['identifier'],
      onConflictAction: 'merge',
      onConflictMergeFields: ['value', 'expiresAt', 'updatedAt'],
    });
  }

  async get(identifier: string): Promise<VerificationRecord | null> {
    const verification = await this.em.findOne(Verification, {
      identifier: this.hashIdentifier(identifier),
    });
    if (!verification) return null;
    try {
      return this.toRecord(verification);
    }
    catch {
      await this.em.nativeDelete(Verification, { id: verification.id });
      this.logger.warn(`Discarded unreadable verification record: ${verification.id}`);
      return null;
    }
  }

  async consume(identifier: string): Promise<VerificationRecord | null> {
    const verification = await this.em.findOne(Verification, {
      identifier: this.hashIdentifier(identifier),
    });
    if (!verification) return null;

    const deleted = await this.em.nativeDelete(Verification, { id: verification.id });
    if (deleted !== 1) return null;
    try {
      return this.toRecord(verification);
    }
    catch {
      this.logger.warn(`Consumed unreadable verification record: ${verification.id}`);
      return null;
    }
  }

  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }

  private toRecord(verification: Verification): VerificationRecord {
    return {
      value: decrypt(verification.value, env.APP_SECRET),
      expiresAt: verification.expiresAt.getTime(),
    };
  }
}
