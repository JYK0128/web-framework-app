import { ApiSchema } from '@nestjs/swagger';

import { UserTermItemDto } from './user-term-item.dto';

@ApiSchema({ name: 'CreateTermResponse' })
export class CreateTermResponseDto extends UserTermItemDto {}
