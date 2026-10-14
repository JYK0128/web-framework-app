import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findFaq, normalize } from '#/modules/faqs/internal-faq-actions.helpers';
import { UpdateFaqCommand } from '#/modules/faqs/update-faq.command';
import { UpdateFaqResponseDto } from '#/modules/faqs/update-faq.response.dto';

@Injectable()
@CommandHandler(UpdateFaqCommand)
export class UpdateFaqHandler implements ICommandHandler<UpdateFaqCommand, UpdateFaqResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: UpdateFaqCommand): Promise<UpdateFaqResponseDto> {
    const faq = await findFaq(this.em, input.faqId);
    Object.assign(faq, normalize(input.dto, false));
    return UpdateFaqResponseDto.parseEntity(faq);
  }
}
