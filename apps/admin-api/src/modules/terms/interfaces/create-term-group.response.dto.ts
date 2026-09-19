import { ApiSchema } from '@nestjs/swagger';

import { AdminTermGroupItemDto } from './admin-term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends AdminTermGroupItemDto {}
