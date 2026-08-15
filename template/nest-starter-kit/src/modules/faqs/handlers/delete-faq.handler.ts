import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';
import { DeleteFaqCommand } from '#/modules/faqs/commands/delete-faq.command';

@Injectable()
@CommandHandler(DeleteFaqCommand)
export class DeleteFaqHandler implements ICommandHandler<DeleteFaqCommand, void> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteFaqCommand): Promise<void> {
    const faq = await this.identify(command.id);
    await this.process(faq);
  }

  private async identify(id: string): Promise<Faq> {
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
