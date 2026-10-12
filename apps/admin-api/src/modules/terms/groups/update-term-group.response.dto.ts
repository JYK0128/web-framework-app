import { ApiSchema } from '@nestjs/swagger';

import { TermGroupItemDto } from '#/modules/terms/groups/term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends TermGroupItemDto {}
