import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { FindIdCommand } from '#/modules/auth/commands/find-id.command';
import { FindIdResponseDto } from '#/modules/auth/dto/find-id.response.dto';

@Injectable()
@CommandHandler(FindIdCommand)
export class FindIdHandler implements ICommandHandler<FindIdCommand, FindIdResponseDto> {
  constructor(private readonly recovery: AccountRecoveryService) {}
  async execute({ input }: FindIdCommand): Promise<FindIdResponseDto> {
    return FindIdResponseDto.fromPlain(await this.recovery.findIds(input.name, input.phoneNumber));
  }
}
