import { createHmac, randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, encrypt, hash, verify } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ChangePasswordCommand, DisableTwoFactorCommand, EnableTwoFactorCommand, GenerateTwoFactorCommand, UnregisterCommand } from '#/modules/auth/commands';
import type { ChangePasswordResponseDto, DisableTwoFactorResponseDto, EnableTwoFactorResponseDto, GenerateTwoFactorResponseDto, UnregisterResponseDto } from '#/modules/auth/interfaces/profile-security.dto';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    const user = this.principal.ensureUser();
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    if (command.input.newPassword !== command.input.confirmPassword) throw new ApplicationError({ code: 'PASSWORD_CONFIRMATION_MISMATCH', status: HttpStatus.BAD_REQUEST });
    if (!await verify(command.input.currentPassword, account.password)) throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    account.password = await hash(command.input.newPassword);
    account.updateMetadata({ passwordUpdatedAt: new Date() });
    return { ok: true };
  }
}

@Injectable()
@CommandHandler(GenerateTwoFactorCommand)
export class GenerateTwoFactorHandler implements ICommandHandler<GenerateTwoFactorCommand, GenerateTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<GenerateTwoFactorResponseDto> {
    const user = await identifyUser(this.em, this.principal);
    if (user.twoFactorEnabled) throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    const secret = toBase32(randomBytes(20));
    const existing = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (existing) {
      existing.secret = encrypt(secret, env.APP_SECRET);
      existing.verified = false;
    }
    else {
      this.em.persist(this.em.create(TwoFactor, { user: this.em.getReference(User, user.id), secret: encrypt(secret, env.APP_SECRET), verified: false }));
    }
    return { secret };
  }
}

@Injectable()
@CommandHandler(EnableTwoFactorCommand)
export class EnableTwoFactorHandler implements ICommandHandler<EnableTwoFactorCommand, EnableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: EnableTwoFactorCommand): Promise<EnableTwoFactorResponseDto> {
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (!twoFactor) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.BAD_REQUEST });
    if (!verifyTotp(decrypt(twoFactor.secret, env.APP_SECRET), command.input.code)) throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    twoFactor.verified = true;
    user.twoFactorEnabled = true;
    return { enabled: true };
  }
}

@Injectable()
@CommandHandler(DisableTwoFactorCommand)
export class DisableTwoFactorHandler implements ICommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<DisableTwoFactorResponseDto> {
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    return { enabled: false };
  }
}

@Injectable()
@CommandHandler(UnregisterCommand)
export class UnregisterHandler implements ICommandHandler<UnregisterCommand, UnregisterResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<UnregisterResponseDto> {
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    user.deletedAt = new Date();
    return { ok: true };
  }
}

async function identifyUser(em: AppEntityManager, principal: PrincipalContext): Promise<User> {
  const user = await em.findOne(User, { id: principal.ensureUser().id }, { filters: false });
  if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return user;
}

function verifyTotp(secret: string, code: string): boolean {
  const normalized = secret.toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) return false;
    bits += index.toString(2).padStart(5, '0');
  }
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < key.length; index += 1) key[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  const counter = Math.floor(Date.now() / 30_000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const value = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return value % 1_000_000 === Number.parseInt(code, 10);
}

function toBase32(value: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of value) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let index = 0; index < bits.length; index += 5) {
    result += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
  }
  return result;
}
