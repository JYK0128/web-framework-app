import { ApiSchema } from '@nestjs/swagger';

import { AdminTermGroupItemDto } from './admin-term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends AdminTermGroupItemDto {}
