import { ApiSchema } from '@nestjs/swagger';

import { TermGroupItemDto } from '~/modules/term/group/term-group-item.dto';

@ApiSchema({ name: 'CreateTermGroupResponse' })
export class CreateTermGroupResponseDto extends TermGroupItemDto {}
