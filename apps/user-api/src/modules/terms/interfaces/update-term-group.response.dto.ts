import { ApiSchema } from '@nestjs/swagger';

import { UserTermGroupItemDto } from './user-term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends UserTermGroupItemDto {}
