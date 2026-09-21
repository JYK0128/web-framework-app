import { ApiSchema } from '@nestjs/swagger';

import { UserTermItemDto } from './user-term-item.dto';

@ApiSchema({ name: 'PublishTermResponse' })
export class PublishTermResponseDto extends UserTermItemDto {}
