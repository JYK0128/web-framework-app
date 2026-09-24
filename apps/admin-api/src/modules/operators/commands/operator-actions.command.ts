import { Command } from '@nestjs/cqrs';

import type { BanOperatorRequestDto, CreateOperatorRequestDto, CreateOperatorResponseDto, OperatorActionResponseDto, UpdateOperatorRoleRequestDto } from '#/modules/operators/interfaces';

export class CreateOperatorCommand extends Command<CreateOperatorResponseDto> {
  constructor(public readonly data: CreateOperatorRequestDto) { super(); }
}

export class BanOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string, data: BanOperatorRequestDto }) { super(); }
}
export class UnbanOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly operatorId: string) { super(); }
}
export class DeleteOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly operatorId: string) { super(); }
}
export class RestoreOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly operatorId: string) { super(); }
}
export class UpdateOperatorRoleCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string, data: UpdateOperatorRoleRequestDto }) { super(); }
}
export class ResetOperatorTwoFactorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly operatorId: string) { super(); }
}
