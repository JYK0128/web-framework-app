import { ApiSchema } from '@nestjs/swagger';

import { FaqItemDto } from './faq-item.dto';

@ApiSchema({ name: 'FaqDetailResponse' })
export class FaqDetailResponseDto extends FaqItemDto {}
