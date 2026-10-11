import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermGroupItemDto } from '#/modules/terms/dto/operator-term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends OperatorTermGroupItemDto {}
