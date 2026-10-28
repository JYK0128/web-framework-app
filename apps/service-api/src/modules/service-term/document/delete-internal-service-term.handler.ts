import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { DeleteInternalServiceTermCommand } from '~/modules/service-term/document/delete-internal-service-term.command';
import { DeleteInternalServiceTermResponseDto } from '~/modules/service-term/document/delete-internal-service-term.response.dto';
import { assertEditable, findServiceTerm } from '~/modules/service-term/document/internal-service-term-actions.helpers';

@Injectable()
@CommandHandler(DeleteInternalServiceTermCommand)
export class DeleteInternalServiceTermHandler implements ICommandHandler<DeleteInternalServiceTermCommand, DeleteInternalServiceTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: DeleteInternalServiceTermCommand): Promise<DeleteInternalServiceTermResponseDto> {
    const term = await findServiceTerm(this.em, input.termId);
    assertEditable(term);
    term.deletedAt = new Date();
    return DeleteInternalServiceTermResponseDto.ok();
  }
}
