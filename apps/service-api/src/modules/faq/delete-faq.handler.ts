import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '~/core/database/entity-manager';
import { DeleteFaqCommand } from '~/modules/faq/delete-faq.command';
import { DeleteFaqResponseDto } from '~/modules/faq/delete-faq.response.dto';
import { findFaq } from '~/modules/faq/internal-faq-actions.helpers';

@Injectable()
@CommandHandler(DeleteFaqCommand)
export class DeleteFaqHandler implements ICommandHandler<DeleteFaqCommand, DeleteFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: DeleteFaqCommand): Promise<DeleteFaqResponseDto> {
    const faq = await findFaq(this.em, input.faqId);
    faq.deletedAt = new Date();
    return DeleteFaqResponseDto.ok();
  }
}
