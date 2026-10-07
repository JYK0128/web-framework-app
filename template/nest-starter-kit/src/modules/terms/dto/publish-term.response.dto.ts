import { ApiSchema } from '@nestjs/swagger';

import { AdminTermItemDto } from './admin-term-item.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends AdminTermItemDto {}
