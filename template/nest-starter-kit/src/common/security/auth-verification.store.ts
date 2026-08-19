import { Injectable } from '@nestjs/common';

import { RedisService } from '#/common/redis/redis.service';

export type AuthVerificationRecord = {
  value: string
  expiresAt: number
};

@Injectable()
export class AuthVerificationStore {
  constructor(private readonly redis: RedisService) {}

  async save(
    identifier: string,
    record: AuthVerificationRecord,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.setOrThrow(
      this.key(identifier),
      JSON.stringify(record),
      Math.max(1, ttlSeconds),
    );
  }

  async get(identifier: string): Promise<AuthVerificationRecord | null> {
    return this.redis.get<AuthVerificationRecord>(this.key(identifier));
  }

  async consume(identifier: string): Promise<AuthVerificationRecord | null> {
    return this.redis.getAndDelete<AuthVerificationRecord>(this.key(identifier));
  }

  private key(identifier: string): string {
    return `auth:verification:${identifier}`;
  }
}
