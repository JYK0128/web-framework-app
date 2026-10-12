import { ApiSchema } from '@nestjs/swagger';

import { TermGroupItemDto } from '#/modules/terms/groups/term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends TermGroupItemDto {}
