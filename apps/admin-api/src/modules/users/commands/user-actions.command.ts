import { Command } from '@nestjs/cqrs';

import type { BanUserRequestDto, CreateUserRequestDto, CreateUserResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto } from '#/modules/users/interfaces';

export class CreateUserCommand extends Command<CreateUserResponseDto> {
  constructor(public readonly data: CreateUserRequestDto) { super(); }
}

export class BanUserCommand extends Command<UserActionResponseDto> {
  constructor(public readonly input: { userId: string, data: BanUserRequestDto }) { super(); }
}
export class UnbanUserCommand extends Command<UserActionResponseDto> {
  constructor(public readonly userId: string) { super(); }
}
export class DeleteUserCommand extends Command<UserActionResponseDto> {
  constructor(public readonly userId: string) { super(); }
}
export class RestoreUserCommand extends Command<UserActionResponseDto> {
  constructor(public readonly userId: string) { super(); }
}
export class UpdateUserRoleCommand extends Command<UserActionResponseDto> {
  constructor(public readonly input: { userId: string, data: UpdateUserRoleRequestDto }) { super(); }
}
export class ResetUserTwoFactorCommand extends Command<UserActionResponseDto> {
  constructor(public readonly userId: string) { super(); }
}
