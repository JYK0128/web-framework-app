import { ApiSchema } from '@nestjs/swagger';

import { FaqItemDto } from './faq-item.dto';

@ApiSchema({ name: 'CreateFaqResponse' })
export class CreateFaqResponseDto extends FaqItemDto {}
