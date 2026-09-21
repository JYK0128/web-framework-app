import { ApiSchema } from '@nestjs/swagger';

import { UserTermItemDto } from './user-term-item.dto';

@ApiSchema({ name: 'UpdateTermResponse' })
export class UpdateTermResponseDto extends UserTermItemDto {}
