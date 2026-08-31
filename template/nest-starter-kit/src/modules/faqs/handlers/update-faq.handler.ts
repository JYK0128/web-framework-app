import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateFaqCommand } from '#/modules/faqs/commands/update-faq.command';
import { UpdateFaqRequestDto, UpdateFaqResponseDto } from '#/modules/faqs/dto';

@Injectable()
@CommandHandler(UpdateFaqCommand)
export class UpdateFaqHandler implements ICommandHandler<UpdateFaqCommand, UpdateFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateFaqCommand): Promise<UpdateFaqResponseDto> {
    const faq = await this.identifyFaq(command.input.id);
    return this.process(faq, command.input.input);
  }

  private async identifyFaq(id: string): Promise<Faq> {
    const faq = await this.em.findOne(Faq, { id });
    if (!faq) {
      throw new ApplicationError({ code: 'FAQ_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return faq;
  }

  private async process(faq: Faq, input: UpdateFaqRequestDto): Promise<UpdateFaqResponseDto> {
    if (input.category !== undefined) faq.category = input.category.trim();
    if (input.question !== undefined) faq.question = input.question.trim();
    if (input.answer !== undefined) faq.answer = input.answer.trim();
    if (input.order !== undefined) faq.order = input.order;
    if (input.isPublished !== undefined) faq.isPublished = input.isPublished;

    return new UpdateFaqResponseDto(faq);
  }
}
