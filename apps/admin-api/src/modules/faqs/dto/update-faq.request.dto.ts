import { PartialType } from '@nestjs/swagger';

import { CreateFaqRequestDto } from '#/modules/faqs/dto/create-faq.request.dto';

export class UpdateFaqRequestDto extends PartialType(CreateFaqRequestDto) {}
