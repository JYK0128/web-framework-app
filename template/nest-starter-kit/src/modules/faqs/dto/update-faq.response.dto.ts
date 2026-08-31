import { ApiSchema } from '@nestjs/swagger';

import { FaqItemDto } from './faq-item.dto';

@ApiSchema({ name: 'UpdateFaqResponse' })
export class UpdateFaqResponseDto extends FaqItemDto {}
