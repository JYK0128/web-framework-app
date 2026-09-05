import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateInquiryTabRequestDto, UpdateInquiryTabResponseDto } from '#/modules/system-config/dto';

export class UpdateInquiryTabCommand extends Command<UpdateInquiryTabResponseDto> {
  constructor(
    public readonly input: UpdateInquiryTabRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
