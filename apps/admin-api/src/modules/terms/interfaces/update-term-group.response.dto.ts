import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermGroupItemDto } from './operator-term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends OperatorTermGroupItemDto {}
