import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';
import { MarkHelpfulFaqCommand } from '#/modules/faqs/commands/mark-helpful-faq.command';
import { FaqItemDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(MarkHelpfulFaqCommand)
export class MarkHelpfulFaqHandler implements ICommandHandler<MarkHelpfulFaqCommand, FaqItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkHelpfulFaqCommand): Promise<FaqItemDto> {
    const faq = await this.identifyFaq(command.input.id);
    return this.process(faq);
  }

  private async identifyFaq(id: string): Promise<Faq> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return faq;
  }

  private async process(faq: Faq): Promise<FaqItemDto> {
    faq.helpfulCount += 1;
    return new FaqItemDto(faq);
  }
}
