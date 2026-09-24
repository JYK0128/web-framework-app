import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermGroupItemDto } from './operator-term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends OperatorTermGroupItemDto {}
