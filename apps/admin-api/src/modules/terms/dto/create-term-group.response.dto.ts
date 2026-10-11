import { ApiSchema } from '@nestjs/swagger';

import { OperatorTermGroupItemDto } from '#/modules/terms/dto/operator-term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends OperatorTermGroupItemDto {}
