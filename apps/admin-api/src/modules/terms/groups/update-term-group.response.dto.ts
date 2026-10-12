import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermGroupItemDto } from '#/modules/terms/groups/operator-term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends OperatorTermGroupItemDto {}
