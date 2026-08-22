import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteFaqCommand } from '#/modules/faqs/commands/delete-faq.command';
import { DeleteFaqResponseDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(DeleteFaqCommand)
export class DeleteFaqHandler implements ICommandHandler<DeleteFaqCommand, DeleteFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteFaqCommand): Promise<DeleteFaqResponseDto> {
    const faq = await this.identifyFaq(command.input.id);
    await this.process(faq);
    return { ok: true };
  }

  private async identifyFaq(id: string): Promise<Faq> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return faq;
  }

  private async process(faq: Faq): Promise<void> {
    this.em.remove(faq);
  }
}
