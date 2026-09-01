import { ApiSchema } from '@nestjs/swagger';

import { TermGroupItemDto } from './term-group-item.dto';

@ApiSchema({ name: 'UpdateTermGroupResponse' })
export class UpdateTermGroupResponseDto extends TermGroupItemDto {}
