import { ApiSchema } from '@nestjs/swagger';

import { UserTermGroupItemDto } from './user-term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends UserTermGroupItemDto {}
