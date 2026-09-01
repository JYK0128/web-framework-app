import { ApiSchema } from '@nestjs/swagger';

import { TermGroupItemDto } from './term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends TermGroupItemDto {}
