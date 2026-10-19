import { PartialType } from '@nestjs/swagger';

import { CreateFaqRequestDto } from './create-faq.request.dto';

export class UpdateFaqRequestDto extends PartialType(CreateFaqRequestDto) {}
